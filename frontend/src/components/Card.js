import React from 'react';
import '../styles/Card.css';

const elementEmojis = {
  fire: '🔥',
  water: '💧',
  earth: '🌍',
  air: '💨',
  void: '🌑'
};

const rarityColors = {
  basic: '#9e9e9e',
  common: '#ffffff',
  uncommon: '#1eff00',
  rare: '#0070dd',
  epic: '#a335ee',
  legendary: '#ff8000'
};

function Card({ card, onClick, canUse, selected, small }) {
  const getElementColor = (element) => {
    const colors = {
      fire: '#ff4444',
      water: '#4444ff',
      earth: '#44aa44',
      air: '#ffee44',
      void: '#aa44aa'
    };
    return colors[element] || '#666';
  };

  return (
    <div
      className={`card ${small ? 'card-small' : ''} ${canUse ? 'can-use' : ''} ${
        selected ? 'selected' : ''
      } card-${card.element}`}
      onClick={onClick}
      style={{ borderColor: getElementColor(card.element) }}
    >
      <div
        className="card-header"
        style={{ background: getElementColor(card.element) }}
      >
        <span className="card-cost">⚡{card.energy_cost}</span>
        <span className="card-element">{elementEmojis[card.element]}</span>
      </div>

      <div className="card-body">
        <h4
          className="card-name"
          style={{ color: rarityColors[card.rarity] }}
        >
          {card.name}
        </h4>

        <p className="card-type">
          {card.type.charAt(0).toUpperCase() + card.type.slice(1)}
        </p>

        {card.type === 'creature' && (
          <div className="card-stats">
            <span className="attack">⚔️ {card.currentAttack || card.attack}</span>
            <span className="defense">🛡️ {card.currentDefense || card.defense}</span>
          </div>
        )}

        {!small && card.ability && (
          <div className="card-ability">
            <small>{card.ability.replace(/_/g, ' ')}</small>
          </div>
        )}

        {!small && (
          <p className="card-description">{card.description}</p>
        )}
      </div>

      {card.frozen && (
        <div className="card-status frozen">❄️ FROZEN</div>
      )}

      {!card.canAttack && card.type === 'creature' && (
        <div className="card-status tired">💤</div>
      )}
    </div>
  );
}

export default Card;
