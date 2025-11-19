import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/MainMenu.css';

function MainMenu({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <div className="main-menu">
      <div className="menu-header">
        <h1>⚡ ELEMENT FORGE ⚡</h1>
        <div className="user-info">
          <span className="username">
            {user.isGuest ? '👤 ' : '🎮 '}
            {user.username}
          </span>
          <span className="currency">💰 {user.gold || 0}</span>
          <span className="currency">💎 {user.crystals || 0}</span>
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="menu-content">
        <div className="menu-buttons">
          <button className="menu-btn primary" onClick={() => navigate('/game')}>
            <span className="btn-icon">⚔️</span>
            <span className="btn-text">Play Game</span>
            <span className="btn-subtitle">Find an opponent</span>
          </button>

          <button className="menu-btn" onClick={() => navigate('/deck-builder')}>
            <span className="btn-icon">📚</span>
            <span className="btn-text">Deck Builder</span>
            <span className="btn-subtitle">Build your strategy</span>
          </button>

          <button
            className="menu-btn"
            onClick={() => navigate('/shop')}
            disabled={user.isGuest}
          >
            <span className="btn-icon">🏪</span>
            <span className="btn-text">Card Shop</span>
            <span className="btn-subtitle">
              {user.isGuest ? 'Register to unlock' : 'Buy new cards'}
            </span>
          </button>

          <button className="menu-btn" onClick={() => navigate('/crafting')}>
            <span className="btn-icon">🔨</span>
            <span className="btn-text">Crafting Guide</span>
            <span className="btn-subtitle">View craftable cards</span>
          </button>

          <button
            className="menu-btn"
            onClick={() => window.open('/RULEBOOK.md', '_blank')}
          >
            <span className="btn-icon">📖</span>
            <span className="btn-text">Rulebook</span>
            <span className="btn-subtitle">Learn how to play</span>
          </button>
        </div>

        <div className="menu-sidebar">
          <div className="info-panel">
            <h3>Welcome to Element Forge!</h3>
            <p>
              Master the five elements and craft powerful cards to defeat your
              opponents in strategic battles.
            </p>
            <ul>
              <li>🔥 Fire - High damage</li>
              <li>💧 Water - Healing & defense</li>
              <li>🌍 Earth - Durability</li>
              <li>💨 Air - Speed</li>
              <li>🌑 Void - Disruption</li>
            </ul>
          </div>

          {user.isGuest && (
            <div className="guest-warning">
              <h4>⚠️ Playing as Guest</h4>
              <p>
                Your progress will not be saved. Register an account to save
                your collection and progress!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MainMenu;
