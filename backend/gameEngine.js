// Game Engine - Handles all game logic for Element Forge
const { v4: uuidv4 } = require('uuid');

class GameEngine {
  constructor(player1, player2, player1Deck, player2Deck) {
    this.id = uuidv4();
    this.players = {
      player1: {
        id: player1.id,
        username: player1.username,
        life: 30,
        maxEnergy: 1,
        currentEnergy: 1,
        deck: this.shuffleDeck([...player1Deck]),
        hand: [],
        battlefield: [],
        artifacts: [],
        discard: [],
        essences: { fire: 0, water: 0, earth: 0, air: 0, void: 0 },
        nexusControl: 0,
        craftedThisTurn: 0
      },
      player2: {
        id: player2.id,
        username: player2.username,
        life: 30,
        maxEnergy: 1,
        currentEnergy: 1,
        deck: this.shuffleDeck([...player2Deck]),
        hand: [],
        battlefield: [],
        artifacts: [],
        discard: [],
        essences: { fire: 0, water: 0, earth: 0, air: 0, void: 0 },
        nexusControl: 0,
        craftedThisTurn: 0
      }
    };

    this.activePlayer = 'player1';
    this.turnNumber = 1;
    this.phase = 'draw'; // draw, energy, main, combat, end
    this.winner = null;
    this.gameLog = [];
    this.createdAt = new Date();

    // Draw starting hands
    this.drawCards('player1', 5);
    this.drawCards('player2', 5);

    this.addLog('Game started!');
  }

  shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  drawCards(player, count) {
    const p = this.players[player];
    for (let i = 0; i < count; i++) {
      if (p.deck.length > 0) {
        const card = p.deck.pop();
        card.instanceId = uuidv4(); // Give each card instance a unique ID
        card.canAttack = false; // Creatures can't attack when first drawn
        p.hand.push(card);
      } else {
        // Fatigue damage
        p.life -= 2;
        this.addLog(`${p.username} takes 2 fatigue damage (no cards to draw)`);
        if (p.life <= 0) {
          this.endGame(player === 'player1' ? 'player2' : 'player1', 'deckout');
        }
      }
    }
  }

  addLog(message) {
    this.gameLog.push({
      timestamp: new Date(),
      turn: this.turnNumber,
      message
    });
  }

  // Phase Management
  startTurn() {
    const player = this.activePlayer;
    const p = this.players[player];

    // Phase 1: Draw
    this.phase = 'draw';
    this.drawCards(player, 2);
    this.addLog(`${p.username}'s turn ${this.turnNumber}`);

    // Phase 2: Energy
    this.phase = 'energy';
    if (p.maxEnergy < 10) {
      p.maxEnergy++;
    }
    p.currentEnergy = p.maxEnergy;
    p.craftedThisTurn = 0;

    // Gain random essence based on hand
    const essenceGained = this.gainRandomEssence(player);
    this.addLog(`${p.username} gained 1 ${essenceGained} essence`);

    // Process start-of-turn effects
    this.processStartOfTurnEffects(player);

    // Enable creatures to attack
    p.battlefield.forEach(creature => {
      if (creature.type === 'creature') {
        creature.canAttack = true;
      }
    });

    // Phase 3: Main phase
    this.phase = 'main';
  }

  gainRandomEssence(player) {
    const p = this.players[player];
    const elements = ['fire', 'water', 'earth', 'air', 'void'];

    // Count elements in hand
    const elementCounts = {};
    p.hand.forEach(card => {
      elementCounts[card.element] = (elementCounts[card.element] || 0) + 1;
    });

    // Weighted random selection
    const weightedElements = [];
    elements.forEach(element => {
      const count = elementCounts[element] || 1;
      for (let i = 0; i < count; i++) {
        weightedElements.push(element);
      }
    });

    const randomElement = weightedElements[Math.floor(Math.random() * weightedElements.length)];
    p.essences[randomElement]++;
    return randomElement;
  }

  processStartOfTurnEffects(player) {
    const p = this.players[player];
    const opponent = player === 'player1' ? 'player2' : 'player1';
    const opp = this.players[opponent];

    // Process artifacts
    p.artifacts.forEach(artifact => {
      if (artifact.ability) {
        if (artifact.ability.includes('generate_essence_per_turn')) {
          const elements = ['fire', 'water', 'earth', 'air', 'void'];
          const randomElement = elements[Math.floor(Math.random() * elements.length)];
          p.essences[randomElement]++;
          this.addLog(`${artifact.name} generated 1 ${randomElement} essence`);
        }
        if (artifact.ability.includes('heal_1_per_turn')) {
          p.life = Math.min(30, p.life + 1);
          this.addLog(`${artifact.name} healed 1 Life`);
        }
      }
    });

    // Process burn effects on opponent
    p.battlefield.forEach(creature => {
      if (creature.ability && creature.ability.includes('burn')) {
        const burnMatch = creature.ability.match(/burn_(\d+)/);
        if (burnMatch) {
          const damage = parseInt(burnMatch[1]);
          opp.life -= damage;
          this.addLog(`${creature.name} burns ${opp.username} for ${damage} damage`);
          if (opp.life <= 0) {
            this.endGame(player, 'destruction');
          }
        }
      }
    });

    // Process fortify effects
    p.battlefield.forEach(creature => {
      if (creature.ability && creature.ability.includes('fortify')) {
        const fortifyMatch = creature.ability.match(/fortify_(\d+)/);
        if (fortifyMatch) {
          const bonus = parseInt(fortifyMatch[1]);
          creature.defense += bonus;
          this.addLog(`${creature.name} gained +${bonus} Defense`);
        }
      }
    });
  }

  // Play a card from hand
  playCard(player, cardInstanceId, target = null) {
    if (this.phase !== 'main') {
      return { success: false, error: 'Can only play cards during main phase' };
    }

    const p = this.players[player];
    const cardIndex = p.hand.findIndex(c => c.instanceId === cardInstanceId);

    if (cardIndex === -1) {
      return { success: false, error: 'Card not in hand' };
    }

    const card = p.hand[cardIndex];

    if (card.energy_cost > p.currentEnergy) {
      return { success: false, error: 'Not enough energy' };
    }

    // Pay energy cost
    p.currentEnergy -= card.energy_cost;
    p.hand.splice(cardIndex, 1);

    // Process card based on type
    if (card.type === 'creature') {
      card.currentAttack = card.attack;
      card.currentDefense = card.defense;
      card.canAttack = card.ability && card.ability.includes('swift');
      p.battlefield.push(card);
      this.addLog(`${p.username} played ${card.name}`);

      // Process on-summon abilities
      this.processOnSummonAbilities(player, card);

    } else if (card.type === 'spell') {
      this.addLog(`${p.username} cast ${card.name}`);
      this.processSpellAbilities(player, card, target);
      p.discard.push(card);

    } else if (card.type === 'artifact') {
      p.artifacts.push(card);
      this.addLog(`${p.username} played artifact ${card.name}`);
    }

    return { success: true };
  }

  processOnSummonAbilities(player, card) {
    const p = this.players[player];
    const opponent = player === 'player1' ? 'player2' : 'player1';
    const opp = this.players[opponent];

    if (!card.ability) return;

    if (card.ability.includes('on_summon_heal')) {
      const healMatch = card.ability.match(/on_summon_heal_(\d+)/);
      if (healMatch) {
        const heal = parseInt(healMatch[1]);
        p.life = Math.min(30, p.life + heal);
        this.addLog(`${card.name} healed ${heal} Life Points`);
      }
    }

    if (card.ability.includes('on_summon_draw')) {
      const drawMatch = card.ability.match(/on_summon_draw_(\d+)/);
      if (drawMatch) {
        const draw = parseInt(drawMatch[1]);
        this.drawCards(player, draw);
        this.addLog(`${card.name} drew ${draw} card(s)`);
      }
    }

    if (card.ability.includes('on_summon_damage_1_all_enemies')) {
      opp.battlefield.forEach(creature => {
        this.dealDamageToCreature(opponent, creature.instanceId, 1);
      });
      this.addLog(`${card.name} dealt 1 damage to all enemy creatures`);
    }

    if (card.ability.includes('on_summon_freeze_1')) {
      if (opp.battlefield.length > 0) {
        const target = opp.battlefield[0];
        target.frozen = true;
        target.canAttack = false;
        this.addLog(`${card.name} froze ${target.name}`);
      }
    }
  }

  processSpellAbilities(player, spell, target) {
    const p = this.players[player];
    const opponent = player === 'player1' ? 'player2' : 'player1';
    const opp = this.players[opponent];
    const ability = spell.ability;

    if (ability.includes('heal')) {
      const healMatch = ability.match(/heal_(\d+)/);
      if (healMatch) {
        const heal = parseInt(healMatch[1]);
        p.life = Math.min(30, p.life + heal);
        this.addLog(`${spell.name} healed ${heal} Life Points`);
      }
    }

    if (ability.includes('damage')) {
      const damageMatch = ability.match(/damage_(\d+)/);
      if (damageMatch) {
        const damage = parseInt(damageMatch[1]);
        if (target && target.type === 'creature') {
          this.dealDamageToCreature(opponent, target.instanceId, damage);
        } else {
          opp.life -= damage;
          this.addLog(`${spell.name} dealt ${damage} damage to ${opp.username}`);
          if (opp.life <= 0) {
            this.endGame(player, 'destruction');
          }
        }
      }
    }

    if (ability.includes('return_creature') && target) {
      const targetPlayer = this.findCreatureOwner(target.instanceId);
      if (targetPlayer) {
        this.returnCreatureToHand(targetPlayer, target.instanceId);
      }
    }

    if (ability.includes('return_all_enemy_creatures')) {
      [...opp.battlefield].forEach(creature => {
        this.returnCreatureToHand(opponent, creature.instanceId);
      });
      this.addLog(`${spell.name} returned all enemy creatures to hand`);
    }

    if (ability.includes('banish') && target) {
      const targetPlayer = this.findCreatureOwner(target.instanceId);
      if (targetPlayer) {
        const tp = this.players[targetPlayer];
        const idx = tp.battlefield.findIndex(c => c.instanceId === target.instanceId);
        if (idx !== -1) {
          tp.battlefield.splice(idx, 1);
          this.addLog(`${target.name} was banished!`);
        }
      }
    }

    if (ability.includes('win_next_turn')) {
      this.addLog(`${spell.name} activated! ${p.username} will win next turn!`);
      p.winNextTurn = true;
    }
  }

  dealDamageToCreature(player, instanceId, damage) {
    const p = this.players[player];
    const creatureIndex = p.battlefield.findIndex(c => c.instanceId === instanceId);

    if (creatureIndex !== -1) {
      const creature = p.battlefield[creatureIndex];
      creature.currentDefense -= damage;

      if (creature.currentDefense <= 0) {
        this.destroyCreature(player, instanceId);
      }
    }
  }

  destroyCreature(player, instanceId) {
    const p = this.players[player];
    const creatureIndex = p.battlefield.findIndex(c => c.instanceId === instanceId);

    if (creatureIndex !== -1) {
      const creature = p.battlefield[creatureIndex];
      p.battlefield.splice(creatureIndex, 1);

      // Drop essence
      if (creature.element) {
        p.essences[creature.element]++;
        this.addLog(`${creature.name} destroyed, dropped ${creature.element} essence`);
      }

      // Check for on-death abilities
      if (creature.ability && creature.ability.includes('resurrect_once') && !creature.hasResurrected) {
        creature.hasResurrected = true;
        creature.currentAttack = 4;
        creature.currentDefense = 3;
        p.battlefield.push(creature);
        this.addLog(`${creature.name} resurrected!`);
      } else {
        p.discard.push(creature);
      }
    }
  }

  returnCreatureToHand(player, instanceId) {
    const p = this.players[player];
    const creatureIndex = p.battlefield.findIndex(c => c.instanceId === instanceId);

    if (creatureIndex !== -1) {
      const creature = p.battlefield[creatureIndex];
      p.battlefield.splice(creatureIndex, 1);
      p.hand.push(creature);
      this.addLog(`${creature.name} returned to hand`);
    }
  }

  findCreatureOwner(instanceId) {
    if (this.players.player1.battlefield.find(c => c.instanceId === instanceId)) {
      return 'player1';
    }
    if (this.players.player2.battlefield.find(c => c.instanceId === instanceId)) {
      return 'player2';
    }
    return null;
  }

  // Craft a card
  craftCard(player, recipe) {
    if (this.phase !== 'main') {
      return { success: false, error: 'Can only craft during main phase' };
    }

    const p = this.players[player];

    if (p.craftedThisTurn >= 3) {
      return { success: false, error: 'Maximum 3 crafts per turn' };
    }

    // Check if player has enough essences
    const required = recipe.craft_recipe;
    for (let element in required) {
      if (p.essences[element] < required[element]) {
        return { success: false, error: `Not enough ${element} essence` };
      }
    }

    // Consume essences
    for (let element in required) {
      p.essences[element] -= required[element];
    }

    // Add card to hand
    const craftedCard = { ...recipe };
    craftedCard.instanceId = uuidv4();
    craftedCard.canAttack = false;
    p.hand.push(craftedCard);
    p.craftedThisTurn++;

    this.addLog(`${p.username} crafted ${craftedCard.name}`);
    return { success: true, card: craftedCard };
  }

  // Combat
  declareAttack(player, attackerInstanceId, target = 'player') {
    if (this.phase !== 'main') {
      return { success: false, error: 'Can only attack during main phase' };
    }

    const p = this.players[player];
    const opponent = player === 'player1' ? 'player2' : 'player1';
    const opp = this.players[opponent];

    const attacker = p.battlefield.find(c => c.instanceId === attackerInstanceId);
    if (!attacker) {
      return { success: false, error: 'Attacker not found' };
    }

    if (!attacker.canAttack) {
      return { success: false, error: 'Creature cannot attack yet' };
    }

    attacker.canAttack = false; // Can only attack once per turn

    if (target === 'player') {
      // Direct attack
      opp.life -= attacker.currentAttack;
      this.addLog(`${attacker.name} attacked ${opp.username} for ${attacker.currentAttack} damage`);

      if (opp.life <= 0) {
        this.endGame(player, 'destruction');
      }
    } else if (target === 'nexus') {
      // Attack nexus
      this.addLog(`${attacker.name} attacked the Nexus`);
    } else {
      // Attack creature (blocking)
      const defender = opp.battlefield.find(c => c.instanceId === target);
      if (defender) {
        this.resolveCombat(player, attacker, opponent, defender);
      }
    }

    return { success: true };
  }

  resolveCombat(attackerPlayer, attacker, defenderPlayer, defender) {
    attacker.currentDefense -= defender.currentAttack;
    defender.currentDefense -= attacker.currentAttack;

    this.addLog(`${attacker.name} (${attacker.currentAttack}/${attacker.currentDefense}) fought ${defender.name} (${defender.currentAttack}/${defender.currentDefense})`);

    if (attacker.currentDefense <= 0) {
      this.destroyCreature(attackerPlayer, attacker.instanceId);
    }

    if (defender.currentDefense <= 0) {
      this.destroyCreature(defenderPlayer, defender.instanceId);
    }
  }

  // End turn
  endTurn() {
    const player = this.activePlayer;
    const p = this.players[player];
    const opponent = player === 'player1' ? 'player2' : 'player1';

    this.phase = 'end';

    // Discard down to 7 cards
    while (p.hand.length > 7) {
      const discarded = p.hand.pop();
      p.discard.push(discarded);
      this.addLog(`${p.username} discarded ${discarded.name}`);
    }

    // Check for Nexus control victory
    const p1Power = this.calculateNexusPower('player1');
    const p2Power = this.calculateNexusPower('player2');

    if (p1Power > p2Power) {
      this.players.player1.nexusControl++;
      this.players.player2.nexusControl = 0;
      if (this.players.player1.nexusControl >= 3) {
        this.endGame('player1', 'nexus');
      }
    } else if (p2Power > p1Power) {
      this.players.player2.nexusControl++;
      this.players.player1.nexusControl = 0;
      if (this.players.player2.nexusControl >= 3) {
        this.endGame('player2', 'nexus');
      }
    } else {
      this.players.player1.nexusControl = 0;
      this.players.player2.nexusControl = 0;
    }

    // Check for win condition from Elemental Convergence
    if (p.winNextTurn) {
      this.endGame(player, 'convergence');
    }

    // Clear frozen status
    this.players[opponent].battlefield.forEach(creature => {
      if (creature.frozen) {
        creature.frozen = false;
        creature.canAttack = true;
      }
    });

    // Switch active player
    this.activePlayer = opponent;
    this.turnNumber++;

    // Start next turn
    this.startTurn();
  }

  calculateNexusPower(player) {
    const p = this.players[player];
    return p.battlefield.reduce((sum, creature) => {
      return sum + (creature.currentAttack || 0);
    }, 0);
  }

  endGame(winner, victoryType) {
    this.winner = winner;
    this.phase = 'ended';
    const winnerPlayer = this.players[winner];
    this.addLog(`${winnerPlayer.username} wins by ${victoryType}!`);
  }

  // Get game state for a specific player (hides opponent's hand)
  getGameStateForPlayer(player) {
    const opponent = player === 'player1' ? 'player2' : 'player1';

    return {
      id: this.id,
      activePlayer: this.activePlayer,
      turnNumber: this.turnNumber,
      phase: this.phase,
      winner: this.winner,
      player: {
        ...this.players[player],
        handCount: this.players[player].hand.length,
        hand: this.players[player].hand
      },
      opponent: {
        ...this.players[opponent],
        hand: [], // Hide opponent's hand
        handCount: this.players[opponent].hand.length
      },
      gameLog: this.gameLog.slice(-10) // Last 10 log entries
    };
  }
}

module.exports = GameEngine;
