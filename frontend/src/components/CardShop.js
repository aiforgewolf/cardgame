import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from './Card';
import '../styles/CardShop.css';

// Use environment variable for API URL, fallback to localhost for development
const API_URL = process.env.REACT_APP_API_URL ||
  (window.location.origin.includes('localhost') ? 'http://localhost:3001' : window.location.origin);

function CardShop({ user, token, setUser }) {
  const navigate = useNavigate();
  const [purchasedCards, setPurchasedCards] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const packs = [
    {
      id: 'starter',
      name: 'Starter Pack',
      description: '5 random cards from common pool',
      cost: 50,
      icon: '📦'
    },
    {
      id: 'elemental',
      name: 'Elemental Pack',
      description: '5 cards focused on one element',
      cost: 100,
      icon: '⚡'
    },
    {
      id: 'premium',
      name: 'Premium Pack',
      description: '5 cards with guaranteed Rare or better',
      cost: 200,
      icon: '💎'
    }
  ];

  const buyPack = async (packType) => {
    if (loading) return;

    const pack = packs.find((p) => p.id === packType);
    if (user.gold < pack.cost) {
      alert('Not enough gold!');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/shop/buy-pack`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ packType })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Purchase failed');
      }

      // Update user gold
      const updatedUser = { ...user, gold: data.goldRemaining };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Show purchased cards
      setPurchasedCards(data.cards);
      setShowModal(true);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-shop">
      <button className="back-btn" onClick={() => navigate('/menu')}>
        ← Back to Menu
      </button>

      <div className="shop-header">
        <h1>🏪 Card Shop</h1>
        <div className="currency-display">
          <span className="gold">💰 {user.gold} Gold</span>
          <span className="crystals">💎 {user.crystals} Crystals</span>
        </div>
      </div>

      <div className="shop-content">
        <div className="packs-section">
          <h2>Card Packs</h2>
          <div className="packs-grid">
            {packs.map((pack) => (
              <div key={pack.id} className="pack-card">
                <div className="pack-icon">{pack.icon}</div>
                <h3>{pack.name}</h3>
                <p>{pack.description}</p>
                <div className="pack-cost">
                  <span>💰 {pack.cost} Gold</span>
                </div>
                <button
                  onClick={() => buyPack(pack.id)}
                  disabled={user.gold < pack.cost || loading}
                  className="buy-btn"
                >
                  {loading ? 'Purchasing...' : 'Buy Pack'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="info-section">
          <h2>💡 Tips</h2>
          <ul>
            <li>Earn gold by playing matches (25 for win, 10 for loss)</li>
            <li>Each pack contains 5 random cards</li>
            <li>Premium packs guarantee at least one Rare card</li>
            <li>Build a diverse collection to create powerful decks</li>
            <li>You can have up to 3 copies of each card in your deck</li>
          </ul>

          <h2>🎯 Strategy</h2>
          <ul>
            <li>Focus on 2-3 elements for consistent gameplay</li>
            <li>Balance creatures, spells, and artifacts</li>
            <li>Consider your mana curve (energy costs)</li>
            <li>Experiment with different elemental combinations</li>
          </ul>
        </div>
      </div>

      {/* Pack Opening Modal */}
      {showModal && (
        <div className="pack-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="pack-modal" onClick={(e) => e.stopPropagation()}>
            <h2>🎉 Pack Opened! 🎉</h2>
            <div className="opened-cards">
              {purchasedCards.map((card, index) => (
                <div key={index} className="opened-card">
                  <Card card={card} />
                </div>
              ))}
            </div>
            <button onClick={() => setShowModal(false)}>Awesome!</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CardShop;
