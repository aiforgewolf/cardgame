import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import MainMenu from './components/MainMenu';
import GameBoard from './components/GameBoard';
import DeckBuilder from './components/DeckBuilder';
import CardShop from './components/CardShop';
import CraftingTable from './components/CraftingTable';
import './styles/App.css';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Check for saved token
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route
            path="/"
            element={
              !user ? (
                <Login onLogin={handleLogin} />
              ) : (
                <Navigate to="/menu" replace />
              )
            }
          />
          <Route
            path="/menu"
            element={
              user ? (
                <MainMenu user={user} token={token} onLogout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/game"
            element={
              user ? (
                <GameBoard user={user} token={token} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/deck-builder"
            element={
              user ? (
                <DeckBuilder user={user} token={token} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/shop"
            element={
              user ? (
                <CardShop user={user} token={token} setUser={setUser} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/crafting"
            element={
              user ? (
                <CraftingTable user={user} token={token} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
