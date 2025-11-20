import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from './Card';
import '../styles/GameBoard.css';

// Use environment variables for URLs, with smart fallbacks
const API_URL = process.env.REACT_APP_API_URL ||
  (window.location.origin.includes('localhost') ? 'http://localhost:3001' : window.location.origin);

const WS_URL = process.env.REACT_APP_WS_URL ||
  (window.location.protocol === 'https:'
    ? `wss://${window.location.host}`
    : 'ws://localhost:3001');

function GameBoard({ user, token }) {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState(null);
  const [playerSide, setPlayerSide] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [matchmaking, setMatchmaking] = useState(false);
  const [showCraftingMenu, setShowCraftingMenu] = useState(false);
  const [craftableCards, setCraftableCards] = useState([]);
  const ws = useRef(null);

  useEffect(() => {
    // Connect to WebSocket
    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      console.log('Connected to game server');
      // Authenticate
      ws.current.send(JSON.stringify({ type: 'auth', token }));
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.current.onclose = () => {
      console.log('Disconnected from game server');
    };

    // Fetch craftable cards
    fetchCraftableCards();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [token]);

  const fetchCraftableCards = async () => {
    try {
      const response = await fetch(`${API_URL}/api/crafting/recipes`);
      const data = await response.json();
      setCraftableCards(data.recipes || []);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    }
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'auth_success':
        console.log('Authenticated:', data.username);
        break;

      case 'matchmaking_joined':
        console.log('Joined matchmaking queue');
        break;

      case 'game_started':
        setPlayerSide(data.playerSide);
        setGameState(data.gameState);
        setMatchmaking(false);
        break;

      case 'game_update':
        setGameState(data.gameState);
        break;

      case 'error':
        alert(data.error);
        break;

      default:
        console.log('Unknown message:', data);
    }
  };

  const joinMatchmaking = () => {
    setMatchmaking(true);
    ws.current.send(JSON.stringify({ type: 'join_matchmaking' }));
  };

  const leaveMatchmaking = () => {
    setMatchmaking(false);
    ws.current.send(JSON.stringify({ type: 'leave_matchmaking' }));
  };

  const playCard = (card) => {
    if (!gameState || gameState.activePlayer !== playerSide || gameState.phase !== 'main') {
      return;
    }

    ws.current.send(
      JSON.stringify({
        type: 'game_action',
        payload: {
          action: 'play_card',
          gameId: gameState.id,
          data: { cardInstanceId: card.instanceId }
        }
      })
    );

    setSelectedCard(null);
  };

  const attackWithCreature = (creature, target = 'player') => {
    if (!gameState || gameState.activePlayer !== playerSide) {
      return;
    }

    ws.current.send(
      JSON.stringify({
        type: 'game_action',
        payload: {
          action: 'attack',
          gameId: gameState.id,
          data: { attackerInstanceId: creature.instanceId, target }
        }
      })
    );
  };

  const craftCard = (recipe) => {
    if (!gameState || gameState.activePlayer !== playerSide || gameState.phase !== 'main') {
      return;
    }

    const essences = {
      fire: recipe.fire_essence || 0,
      water: recipe.water_essence || 0,
      earth: recipe.earth_essence || 0,
      air: recipe.air_essence || 0,
      void: recipe.void_essence || 0
    };

    ws.current.send(
      JSON.stringify({
        type: 'game_action',
        payload: {
          action: 'craft_card',
          gameId: gameState.id,
          data: { cardName: recipe.name, essences }
        }
      })
    );

    setShowCraftingMenu(false);
  };

  const endTurn = () => {
    if (!gameState || gameState.activePlayer !== playerSide) {
      return;
    }

    ws.current.send(
      JSON.stringify({
        type: 'game_action',
        payload: {
          action: 'end_turn',
          gameId: gameState.id,
          data: {}
        }
      })
    );
  };

  const canCraftCard = (recipe) => {
    if (!gameState || !gameState.player) return false;
    const essences = gameState.player.essences;

    return (
      essences.fire >= (recipe.fire_essence || 0) &&
      essences.water >= (recipe.water_essence || 0) &&
      essences.earth >= (recipe.earth_essence || 0) &&
      essences.air >= (recipe.air_essence || 0) &&
      essences.void >= (recipe.void_essence || 0)
    );
  };

  // Waiting for match
  if (matchmaking) {
    return (
      <div className="game-board waiting-screen">
        <div className="waiting-card">
          <h2>⏳ Searching for opponent...</h2>
          <div className="loading-spinner"></div>
          <p>Please wait while we find you a worthy opponent</p>
          <button onClick={leaveMatchmaking}>Cancel</button>
        </div>
      </div>
    );
  }

  // No game started
  if (!gameState) {
    return (
      <div className="game-board no-game">
        <button className="back-btn" onClick={() => navigate('/menu')}>
          ← Back to Menu
        </button>
        <div className="start-game-card">
          <h1>⚡ Ready for Battle? ⚡</h1>
          <p>Test your skills against another player in real-time combat!</p>
          <button className="start-button" onClick={joinMatchmaking}>
            🎮 Find Match
          </button>
        </div>
      </div>
    );
  }

  // Game ended
  if (gameState.winner) {
    const didWin = gameState.winner === playerSide;
    return (
      <div className="game-board game-over">
        <div className="game-over-card">
          <h1>{didWin ? '🎉 VICTORY! 🎉' : '💀 DEFEAT 💀'}</h1>
          <p>
            {didWin
              ? `Congratulations! You defeated ${gameState.opponent.username}!`
              : `${gameState.opponent.username} was victorious this time.`}
          </p>
          <div className="rewards">
            <p>Gold Earned: +{didWin ? 25 : 10}</p>
          </div>
          <button onClick={() => window.location.reload()}>Play Again</button>
          <button onClick={() => navigate('/menu')}>Return to Menu</button>
        </div>
      </div>
    );
  }

  // Active game
  const isMyTurn = gameState.activePlayer === playerSide;
  const player = gameState.player;
  const opponent = gameState.opponent;

  return (
    <div className="game-board">
      <div className="game-header">
        <div className="player-info opponent-info">
          <h3>⚔️ {opponent.username}</h3>
          <div className="stats">
            <span className="life">❤️ {opponent.life}/30</span>
            <span className="hand-count">🃏 {opponent.handCount} cards</span>
            <span className="nexus">👑 Nexus: {opponent.nexusControl}/3</span>
          </div>
        </div>

        <div className="game-status">
          <h2>Turn {gameState.turnNumber}</h2>
          <p className={isMyTurn ? 'your-turn' : 'opponent-turn'}>
            {isMyTurn ? '✨ Your Turn' : "⏳ Opponent's Turn"}
          </p>
          <p className="phase">Phase: {gameState.phase}</p>
        </div>

        <div className="player-info your-info">
          <h3>🛡️ {player.username} (You)</h3>
          <div className="stats">
            <span className="life">❤️ {player.life}/30</span>
            <span className="energy">⚡ {player.currentEnergy}/{player.maxEnergy}</span>
            <span className="nexus">👑 Nexus: {player.nexusControl}/3</span>
          </div>
        </div>
      </div>

      {/* Opponent's Battlefield */}
      <div className="battlefield opponent-battlefield">
        <h4>Opponent's Battlefield</h4>
        <div className="creatures">
          {opponent.battlefield.map((creature) => (
            <Card
              key={creature.instanceId}
              card={creature}
              onClick={() => {}}
              small
            />
          ))}
        </div>
      </div>

      {/* Nexus Zone */}
      <div className="nexus-zone">
        <div className="nexus-card">
          <h3>⭐ THE NEXUS ⭐</h3>
          <p>Control for 3 turns to win!</p>
        </div>
      </div>

      {/* Your Battlefield */}
      <div className="battlefield your-battlefield">
        <h4>Your Battlefield</h4>
        <div className="creatures">
          {player.battlefield.map((creature) => (
            <Card
              key={creature.instanceId}
              card={creature}
              onClick={() => isMyTurn && attackWithCreature(creature)}
              canUse={isMyTurn && creature.canAttack}
              small
            />
          ))}
        </div>
      </div>

      {/* Essences Display */}
      <div className="essences-bar">
        <h4>Essences:</h4>
        <span className="essence fire">🔥 {player.essences.fire}</span>
        <span className="essence water">💧 {player.essences.water}</span>
        <span className="essence earth">🌍 {player.essences.earth}</span>
        <span className="essence air">💨 {player.essences.air}</span>
        <span className="essence void">🌑 {player.essences.void}</span>
        <button
          className="craft-btn"
          onClick={() => setShowCraftingMenu(!showCraftingMenu)}
          disabled={!isMyTurn || gameState.phase !== 'main'}
        >
          🔨 Craft
        </button>
      </div>

      {/* Your Hand */}
      <div className="hand">
        <h4>Your Hand ({player.hand.length}/7)</h4>
        <div className="hand-cards">
          {player.hand.map((card) => (
            <Card
              key={card.instanceId}
              card={card}
              onClick={() => playCard(card)}
              canUse={isMyTurn && gameState.phase === 'main' && card.energy_cost <= player.currentEnergy}
              selected={selectedCard?.instanceId === card.instanceId}
            />
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button
          className="end-turn-btn"
          onClick={endTurn}
          disabled={!isMyTurn}
        >
          End Turn
        </button>
        <button onClick={() => navigate('/menu')}>Forfeit & Leave</button>
      </div>

      {/* Crafting Menu */}
      {showCraftingMenu && (
        <div className="crafting-overlay" onClick={() => setShowCraftingMenu(false)}>
          <div className="crafting-menu" onClick={(e) => e.stopPropagation()}>
            <h3>🔨 Craft a Card</h3>
            <p>Crafts this turn: {player.craftedThisTurn || 0}/3</p>
            <div className="craftable-cards">
              {craftableCards.map((recipe) => (
                <div
                  key={recipe.id}
                  className={`craft-option ${canCraftCard(recipe) ? 'can-craft' : 'cannot-craft'}`}
                  onClick={() => canCraftCard(recipe) && craftCard(recipe)}
                >
                  <Card card={recipe} small />
                  <div className="recipe">
                    {recipe.fire_essence > 0 && <span>🔥 {recipe.fire_essence}</span>}
                    {recipe.water_essence > 0 && <span>💧 {recipe.water_essence}</span>}
                    {recipe.earth_essence > 0 && <span>🌍 {recipe.earth_essence}</span>}
                    {recipe.air_essence > 0 && <span>💨 {recipe.air_essence}</span>}
                    {recipe.void_essence > 0 && <span>🌑 {recipe.void_essence}</span>}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowCraftingMenu(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Game Log */}
      <div className="game-log">
        <h4>Game Log</h4>
        <div className="log-entries">
          {gameState.gameLog?.map((log, i) => (
            <p key={i}>[Turn {log.turn}] {log.message}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GameBoard;
