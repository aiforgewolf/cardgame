const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const database = require('./database');
const GameEngine = require('./gameEngine');
const { ALL_CARDS, CARDS } = require('./cards');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'element-forge-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory stores
const activeGames = new Map(); // gameId -> GameEngine
const playerSockets = new Map(); // userId -> WebSocket
const matchmakingQueue = []; // Array of {userId, username, socketId}

// ============ CARD INITIALIZATION ============
async function initializeCards() {
  try {
    for (const card of ALL_CARDS) {
      const existing = await database.get('SELECT id FROM cards WHERE name = ?', [card.name]);
      if (!existing) {
        const result = await database.run(
          `INSERT INTO cards (name, type, element, attack, defense, energy_cost, rarity, ability, description, is_craftable, craft_recipe, gold_price)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            card.name,
            card.type,
            card.element,
            card.attack,
            card.defense,
            card.energy_cost,
            card.rarity,
            card.ability,
            card.description,
            card.is_craftable ? 1 : 0,
            card.craft_recipe ? JSON.stringify(card.craft_recipe) : null,
            card.gold_price
          ]
        );

        // If craftable, add recipe
        if (card.is_craftable && card.craft_recipe) {
          await database.run(
            `INSERT INTO crafting_recipes (card_id, fire_essence, water_essence, earth_essence, air_essence, void_essence)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              result.id,
              card.craft_recipe.fire || 0,
              card.craft_recipe.water || 0,
              card.craft_recipe.earth || 0,
              card.craft_recipe.air || 0,
              card.craft_recipe.void || 0
            ]
          );
        }
      }
    }
    console.log('Cards initialized in database');
  } catch (error) {
    console.error('Error initializing cards:', error);
  }
}

// ============ AUTHENTICATION ROUTES ============

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const existingUser = await database.get('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await database.run(
      'INSERT INTO users (username, email, password_hash, is_guest, gold, crystals) VALUES (?, ?, ?, 0, 150, 0)',
      [username, email, passwordHash]
    );

    // Give starter cards
    await giveStarterCards(result.id);

    const token = jwt.sign({ userId: result.id, username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: { id: result.id, username, email, gold: 150, crystals: 0, isGuest: false }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await database.get('SELECT * FROM users WHERE username = ? AND is_guest = 0', [username]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await database.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        gold: user.gold,
        crystals: user.crystals,
        isGuest: false
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Guest login
app.post('/api/auth/guest', async (req, res) => {
  try {
    const guestUsername = `Guest_${uuidv4().substring(0, 8)}`;
    const guestPassword = uuidv4();
    const passwordHash = await bcrypt.hash(guestPassword, 10);

    const result = await database.run(
      'INSERT INTO users (username, password_hash, is_guest, gold, crystals) VALUES (?, ?, 1, 100, 0)',
      [guestUsername, passwordHash]
    );

    // Give starter cards
    await giveStarterCards(result.id);

    const token = jwt.sign({ userId: result.id, username: guestUsername }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      token,
      user: {
        id: result.id,
        username: guestUsername,
        gold: 100,
        crystals: 0,
        isGuest: true
      }
    });
  } catch (error) {
    console.error('Guest login error:', error);
    res.status(500).json({ error: 'Guest login failed' });
  }
});

async function giveStarterCards(userId) {
  // Give 3 of each starter card
  const starterCards = await database.all('SELECT id FROM cards WHERE rarity = ?', ['basic']);

  for (const card of starterCards) {
    await database.run(
      'INSERT INTO user_cards (user_id, card_id, quantity) VALUES (?, ?, 3)',
      [userId, card.id]
    );
  }

  // Create default deck
  const deckResult = await database.run(
    'INSERT INTO decks (user_id, name, is_active) VALUES (?, ?, 1)',
    [userId, 'Starter Deck']
  );

  for (const card of starterCards) {
    await database.run(
      'INSERT INTO deck_cards (deck_id, card_id, quantity) VALUES (?, ?, 3)',
      [deckResult.id, card.id]
    );
  }
}

// Middleware to verify token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// ============ CARD ROUTES ============

// Get all cards
app.get('/api/cards', async (req, res) => {
  try {
    const cards = await database.all('SELECT * FROM cards ORDER BY rarity, element, name');
    res.json({ cards });
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

// Get user's card collection
app.get('/api/cards/collection', authenticateToken, async (req, res) => {
  try {
    const cards = await database.all(
      `SELECT c.*, uc.quantity
       FROM user_cards uc
       JOIN cards c ON uc.card_id = c.id
       WHERE uc.user_id = ?
       ORDER BY c.rarity, c.element, c.name`,
      [req.user.userId]
    );
    res.json({ cards });
  } catch (error) {
    console.error('Error fetching collection:', error);
    res.status(500).json({ error: 'Failed to fetch collection' });
  }
});

// Purchase card pack
app.post('/api/shop/buy-pack', authenticateToken, async (req, res) => {
  try {
    const { packType } = req.body; // 'starter', 'elemental', 'premium'

    const user = await database.get('SELECT gold, crystals FROM users WHERE id = ?', [req.user.userId]);

    let cost = 0;
    let cardCount = 5;
    let guaranteed = null;

    if (packType === 'starter') {
      cost = 50;
    } else if (packType === 'elemental') {
      cost = 100;
    } else if (packType === 'premium') {
      cost = 200;
      guaranteed = 'rare';
    }

    if (user.gold < cost) {
      return res.status(400).json({ error: 'Not enough gold' });
    }

    // Deduct gold
    await database.run('UPDATE users SET gold = gold - ? WHERE id = ?', [cost, req.user.userId]);

    // Generate random cards
    const newCards = [];
    for (let i = 0; i < cardCount; i++) {
      let rarity = guaranteed && i === 0 ? guaranteed : getRandomRarity();
      const availableCards = await database.all(
        'SELECT * FROM cards WHERE rarity = ? AND is_craftable = 0 AND gold_price > 0',
        [rarity]
      );

      if (availableCards.length > 0) {
        const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
        newCards.push(randomCard);

        // Add to user's collection
        const existing = await database.get(
          'SELECT * FROM user_cards WHERE user_id = ? AND card_id = ?',
          [req.user.userId, randomCard.id]
        );

        if (existing) {
          await database.run(
            'UPDATE user_cards SET quantity = quantity + 1 WHERE user_id = ? AND card_id = ?',
            [req.user.userId, randomCard.id]
          );
        } else {
          await database.run(
            'INSERT INTO user_cards (user_id, card_id, quantity) VALUES (?, ?, 1)',
            [req.user.userId, randomCard.id]
          );
        }
      }
    }

    res.json({ success: true, cards: newCards, goldRemaining: user.gold - cost });
  } catch (error) {
    console.error('Error buying pack:', error);
    res.status(500).json({ error: 'Failed to purchase pack' });
  }
});

function getRandomRarity() {
  const rand = Math.random();
  if (rand < 0.5) return 'common';
  if (rand < 0.8) return 'uncommon';
  if (rand < 0.95) return 'rare';
  return 'epic';
}

// ============ DECK ROUTES ============

// Get user's decks
app.get('/api/decks', authenticateToken, async (req, res) => {
  try {
    const decks = await database.all(
      'SELECT * FROM decks WHERE user_id = ? ORDER BY is_active DESC, created_at DESC',
      [req.user.userId]
    );

    for (let deck of decks) {
      const cards = await database.all(
        `SELECT c.*, dc.quantity
         FROM deck_cards dc
         JOIN cards c ON dc.card_id = c.id
         WHERE dc.deck_id = ?`,
        [deck.id]
      );
      deck.cards = cards;
    }

    res.json({ decks });
  } catch (error) {
    console.error('Error fetching decks:', error);
    res.status(500).json({ error: 'Failed to fetch decks' });
  }
});

// Get active deck
app.get('/api/decks/active', authenticateToken, async (req, res) => {
  try {
    const deck = await database.get(
      'SELECT * FROM decks WHERE user_id = ? AND is_active = 1',
      [req.user.userId]
    );

    if (deck) {
      const cards = await database.all(
        `SELECT c.*, dc.quantity
         FROM deck_cards dc
         JOIN cards c ON dc.card_id = c.id
         WHERE dc.deck_id = ?`,
        [deck.id]
      );
      deck.cards = cards;
    }

    res.json({ deck });
  } catch (error) {
    console.error('Error fetching active deck:', error);
    res.status(500).json({ error: 'Failed to fetch deck' });
  }
});

// Get crafting recipes
app.get('/api/crafting/recipes', async (req, res) => {
  try {
    const recipes = await database.all(
      `SELECT c.*, cr.fire_essence, cr.water_essence, cr.earth_essence, cr.air_essence, cr.void_essence
       FROM cards c
       JOIN crafting_recipes cr ON c.id = cr.card_id
       WHERE c.is_craftable = 1
       ORDER BY c.rarity, c.name`
    );
    res.json({ recipes });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

// ============ WEBSOCKET FOR REAL-TIME GAMEPLAY ============

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      await handleWebSocketMessage(ws, data);
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({ type: 'error', error: 'Invalid message' }));
    }
  });

  ws.on('close', () => {
    // Remove from matchmaking queue and player sockets
    const userId = ws.userId;
    if (userId) {
      playerSockets.delete(userId);
      const queueIndex = matchmakingQueue.findIndex(p => p.userId === userId);
      if (queueIndex !== -1) {
        matchmakingQueue.splice(queueIndex, 1);
      }
    }
  });
});

async function handleWebSocketMessage(ws, data) {
  const { type, token, payload } = data;

  // Authenticate
  if (type === 'auth') {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      ws.userId = decoded.userId;
      ws.username = decoded.username;
      playerSockets.set(decoded.userId, ws);
      ws.send(JSON.stringify({ type: 'auth_success', username: decoded.username }));
    } catch (error) {
      ws.send(JSON.stringify({ type: 'auth_error', error: 'Invalid token' }));
    }
    return;
  }

  if (!ws.userId) {
    ws.send(JSON.stringify({ type: 'error', error: 'Not authenticated' }));
    return;
  }

  // Handle different message types
  switch (type) {
    case 'join_matchmaking':
      await handleJoinMatchmaking(ws);
      break;

    case 'leave_matchmaking':
      handleLeaveMatchmaking(ws);
      break;

    case 'game_action':
      await handleGameAction(ws, payload);
      break;

    default:
      ws.send(JSON.stringify({ type: 'error', error: 'Unknown message type' }));
  }
}

async function handleJoinMatchmaking(ws) {
  const userId = ws.userId;
  const username = ws.username;

  // Check if already in queue
  if (matchmakingQueue.find(p => p.userId === userId)) {
    ws.send(JSON.stringify({ type: 'error', error: 'Already in matchmaking queue' }));
    return;
  }

  matchmakingQueue.push({ userId, username, ws });
  ws.send(JSON.stringify({ type: 'matchmaking_joined', queueSize: matchmakingQueue.length }));

  // Try to match players
  if (matchmakingQueue.length >= 2) {
    const player1 = matchmakingQueue.shift();
    const player2 = matchmakingQueue.shift();

    await startGame(player1, player2);
  }
}

function handleLeaveMatchmaking(ws) {
  const userId = ws.userId;
  const index = matchmakingQueue.findIndex(p => p.userId === userId);
  if (index !== -1) {
    matchmakingQueue.splice(index, 1);
    ws.send(JSON.stringify({ type: 'matchmaking_left' }));
  }
}

async function startGame(player1, player2) {
  try {
    // Get active decks
    const deck1 = await getActiveDeck(player1.userId);
    const deck2 = await getActiveDeck(player2.userId);

    if (!deck1 || !deck2) {
      player1.ws.send(JSON.stringify({ type: 'error', error: 'No active deck found' }));
      player2.ws.send(JSON.stringify({ type: 'error', error: 'No active deck found' }));
      return;
    }

    // Create game
    const game = new GameEngine(
      { id: player1.userId, username: player1.username },
      { id: player2.userId, username: player2.username },
      deck1,
      deck2
    );

    activeGames.set(game.id, game);
    player1.ws.gameId = game.id;
    player2.ws.gameId = game.id;

    // Start first turn
    game.startTurn();

    // Notify players
    player1.ws.send(JSON.stringify({
      type: 'game_started',
      gameId: game.id,
      playerSide: 'player1',
      gameState: game.getGameStateForPlayer('player1')
    }));

    player2.ws.send(JSON.stringify({
      type: 'game_started',
      gameId: game.id,
      playerSide: 'player2',
      gameState: game.getGameStateForPlayer('player2')
    }));

    console.log(`Game ${game.id} started between ${player1.username} and ${player2.username}`);
  } catch (error) {
    console.error('Error starting game:', error);
  }
}

async function getActiveDeck(userId) {
  const deck = await database.get(
    'SELECT * FROM decks WHERE user_id = ? AND is_active = 1',
    [userId]
  );

  if (!deck) return null;

  const deckCards = await database.all(
    `SELECT c.*, dc.quantity
     FROM deck_cards dc
     JOIN cards c ON dc.card_id = c.id
     WHERE dc.deck_id = ?`,
    [deck.id]
  );

  // Expand cards based on quantity
  const expandedDeck = [];
  deckCards.forEach(card => {
    for (let i = 0; i < card.quantity; i++) {
      expandedDeck.push({ ...card });
    }
  });

  return expandedDeck;
}

async function handleGameAction(ws, payload) {
  const { action, gameId, data } = payload;
  const game = activeGames.get(gameId || ws.gameId);

  if (!game) {
    ws.send(JSON.stringify({ type: 'error', error: 'Game not found' }));
    return;
  }

  const playerSide = game.players.player1.id === ws.userId ? 'player1' : 'player2';

  let result;
  switch (action) {
    case 'play_card':
      result = game.playCard(playerSide, data.cardInstanceId, data.target);
      break;

    case 'attack':
      result = game.declareAttack(playerSide, data.attackerInstanceId, data.target);
      break;

    case 'craft_card':
      const recipe = ALL_CARDS.find(c => c.name === data.cardName);
      result = game.craftCard(playerSide, recipe);
      break;

    case 'end_turn':
      game.endTurn();
      result = { success: true };
      break;

    default:
      result = { success: false, error: 'Unknown action' };
  }

  // Broadcast updated game state to both players
  broadcastGameState(game);

  // If game ended, save to history
  if (game.winner) {
    await saveGameHistory(game);
  }
}

function broadcastGameState(game) {
  const player1Socket = playerSockets.get(game.players.player1.id);
  const player2Socket = playerSockets.get(game.players.player2.id);

  if (player1Socket) {
    player1Socket.send(JSON.stringify({
      type: 'game_update',
      gameState: game.getGameStateForPlayer('player1')
    }));
  }

  if (player2Socket) {
    player2Socket.send(JSON.stringify({
      type: 'game_update',
      gameState: game.getGameStateForPlayer('player2')
    }));
  }
}

async function saveGameHistory(game) {
  try {
    const winnerId = game.players[game.winner].id;
    await database.run(
      `INSERT INTO game_history (player1_id, player2_id, winner_id, victory_type, turns_played)
       VALUES (?, ?, ?, ?, ?)`,
      [game.players.player1.id, game.players.player2.id, winnerId, 'destruction', game.turnNumber]
    );

    // Award gold
    const winnerGold = 25;
    const loserGold = 10;
    const loserId = game.winner === 'player1' ? game.players.player2.id : game.players.player1.id;

    await database.run('UPDATE users SET gold = gold + ? WHERE id = ?', [winnerGold, winnerId]);
    await database.run('UPDATE users SET gold = gold + ? WHERE id = ?', [loserGold, loserId]);

    console.log(`Game ${game.id} saved to history`);
  } catch (error) {
    console.error('Error saving game history:', error);
  }
}

// ============ SERVE FRONTEND IN PRODUCTION ============

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));

  // Catch-all route to serve React app for any non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// ============ START SERVER ============

async function startServer() {
  await initializeCards();

  server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║       ELEMENT FORGE - Game Server         ║
║                                            ║
║  Server running on port ${PORT}             ║
║  WebSocket ready for connections           ║
║                                            ║
║  Frontend: http://localhost:3000          ║
║  Backend:  http://localhost:${PORT}          ║
╚════════════════════════════════════════════╝
    `);
  });
}

startServer().catch(console.error);

module.exports = { app, server };
