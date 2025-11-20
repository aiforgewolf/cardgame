import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from './Card';
import '../styles/DeckBuilder.css';

// Use environment variable for API URL, fallback to localhost for development
const API_URL = process.env.REACT_APP_API_URL ||
  (window.location.origin.includes('localhost') ? 'http://localhost:3001' : window.location.origin);

function DeckBuilder({ user, token }) {
  const navigate = useNavigate();
  const [collection, setCollection] = useState([]);
  const [deck, setDeck] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollection();
    fetchActiveDeck();
  }, []);

  const fetchCollection = async () => {
    try {
      const response = await fetch(`${API_URL}/api/cards/collection`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setCollection(data.cards || []);
    } catch (error) {
      console.error('Error fetching collection:', error);
    }
  };

  const fetchActiveDeck = async () => {
    try {
      const response = await fetch(`${API_URL}/api/decks/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.deck && data.deck.cards) {
        // Expand cards based on quantity
        const expanded = [];
        data.deck.cards.forEach((card) => {
          for (let i = 0; i < card.quantity; i++) {
            expanded.push(card);
          }
        });
        setDeck(expanded);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching deck:', error);
      setLoading(false);
    }
  };

  const addCardToDeck = (card) => {
    // Check max copies (3 per card, unlimited for basics)
    const copiesInDeck = deck.filter((c) => c.id === card.id).length;
    if (card.rarity !== 'basic' && copiesInDeck >= 3) {
      alert('Maximum 3 copies per card!');
      return;
    }

    if (deck.length >= 40) {
      alert('Maximum 40 cards in deck!');
      return;
    }

    setDeck([...deck, card]);
  };

  const removeCardFromDeck = (index) => {
    const newDeck = [...deck];
    newDeck.splice(index, 1);
    setDeck(newDeck);
  };

  const getDeckStats = () => {
    const stats = {
      total: deck.length,
      creatures: deck.filter((c) => c.type === 'creature').length,
      spells: deck.filter((c) => c.type === 'spell').length,
      artifacts: deck.filter((c) => c.type === 'artifact').length,
      elements: {
        fire: deck.filter((c) => c.element === 'fire').length,
        water: deck.filter((c) => c.element === 'water').length,
        earth: deck.filter((c) => c.element === 'earth').length,
        air: deck.filter((c) => c.element === 'air').length,
        void: deck.filter((c) => c.element === 'void').length
      }
    };
    return stats;
  };

  const stats = getDeckStats();
  const isValidDeck = stats.total >= 20 && stats.total <= 40 && stats.creatures >= 12;

  if (loading) {
    return <div className="deck-builder">Loading...</div>;
  }

  return (
    <div className="deck-builder">
      <button className="back-btn" onClick={() => navigate('/menu')}>
        ← Back to Menu
      </button>

      <div className="deck-builder-header">
        <h1>📚 Deck Builder</h1>
        <div className="deck-stats">
          <h3>Deck Statistics</h3>
          <p>Total Cards: {stats.total}/40 {!isValidDeck && '(Min: 20)'}</p>
          <p>Creatures: {stats.creatures} {stats.creatures < 12 && '(Min: 12)'}</p>
          <p>Spells: {stats.spells}</p>
          <p>Artifacts: {stats.artifacts}</p>
          <div className="element-distribution">
            <span>🔥 {stats.elements.fire}</span>
            <span>💧 {stats.elements.water}</span>
            <span>🌍 {stats.elements.earth}</span>
            <span>💨 {stats.elements.air}</span>
            <span>🌑 {stats.elements.void}</span>
          </div>
          {isValidDeck && (
            <p className="valid-deck">✅ Deck is valid!</p>
          )}
        </div>
      </div>

      <div className="deck-builder-content">
        <div className="collection-panel">
          <h2>Your Collection</h2>
          <div className="collection-grid">
            {collection.map((card) => (
              <div key={card.id} className="collection-card">
                <Card card={card} onClick={() => addCardToDeck(card)} small />
                <p className="quantity">Owned: {card.quantity}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="deck-panel">
          <h2>Current Deck ({deck.length} cards)</h2>
          <div className="deck-grid">
            {deck.map((card, index) => (
              <div key={`${card.id}-${index}`} className="deck-card">
                <Card
                  card={card}
                  onClick={() => removeCardFromDeck(index)}
                  small
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeckBuilder;
