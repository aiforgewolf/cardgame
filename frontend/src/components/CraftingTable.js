import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from './Card';
import '../styles/CraftingTable.css';

function CraftingTable() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/crafting/recipes');
      const data = await response.json();
      setRecipes(data.recipes || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      setLoading(false);
    }
  };

  const getFilteredRecipes = () => {
    if (filter === 'all') return recipes;
    return recipes.filter((r) => r.rarity === filter);
  };

  const getTierLabel = (recipe) => {
    if (recipe.rarity === 'common') return 'Tier 1: Basic';
    if (recipe.rarity === 'uncommon') return 'Tier 2: Advanced';
    if (recipe.rarity === 'rare') return 'Tier 3: Rare';
    if (recipe.rarity === 'epic') return 'Tier 4: Epic';
    if (recipe.rarity === 'legendary') return 'Tier 5: Legendary';
    return 'Unknown';
  };

  if (loading) {
    return <div className="crafting-table">Loading...</div>;
  }

  return (
    <div className="crafting-table">
      <button className="back-btn" onClick={() => navigate('/menu')}>
        ← Back to Menu
      </button>

      <div className="crafting-header">
        <h1>🔨 Crafting Guide</h1>
        <p>Discover all craftable cards and their recipes</p>
      </div>

      <div className="filter-bar">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All Recipes
        </button>
        <button
          className={filter === 'common' ? 'active' : ''}
          onClick={() => setFilter('common')}
        >
          Tier 1 (Basic)
        </button>
        <button
          className={filter === 'uncommon' ? 'active' : ''}
          onClick={() => setFilter('uncommon')}
        >
          Tier 2 (Advanced)
        </button>
        <button
          className={filter === 'rare' ? 'active' : ''}
          onClick={() => setFilter('rare')}
        >
          Tier 3 (Rare)
        </button>
        <button
          className={filter === 'epic' ? 'active' : ''}
          onClick={() => setFilter('epic')}
        >
          Tier 4 (Epic)
        </button>
        <button
          className={filter === 'legendary' ? 'active' : ''}
          onClick={() => setFilter('legendary')}
        >
          Tier 5 (Legendary)
        </button>
      </div>

      <div className="recipes-grid">
        {getFilteredRecipes().map((recipe) => (
          <div key={recipe.id} className="recipe-card">
            <div className="recipe-tier">{getTierLabel(recipe)}</div>
            <Card card={recipe} />
            <div className="recipe-cost">
              <h4>Recipe:</h4>
              <div className="essence-cost">
                {recipe.fire_essence > 0 && (
                  <span className="essence fire">
                    🔥 {recipe.fire_essence}
                  </span>
                )}
                {recipe.water_essence > 0 && (
                  <span className="essence water">
                    💧 {recipe.water_essence}
                  </span>
                )}
                {recipe.earth_essence > 0 && (
                  <span className="essence earth">
                    🌍 {recipe.earth_essence}
                  </span>
                )}
                {recipe.air_essence > 0 && (
                  <span className="essence air">
                    💨 {recipe.air_essence}
                  </span>
                )}
                {recipe.void_essence > 0 && (
                  <span className="essence void">
                    🌑 {recipe.void_essence}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="crafting-info">
        <h2>📚 How Crafting Works</h2>
        <div className="info-grid">
          <div className="info-card">
            <h3>🧪 Collecting Essences</h3>
            <ul>
              <li>Gain 1 random essence at start of each turn</li>
              <li>Creatures drop essences when destroyed</li>
              <li>Some cards grant bonus essences</li>
            </ul>
          </div>

          <div className="info-card">
            <h3>🔨 Crafting Cards</h3>
            <ul>
              <li>Craft during your Main Phase</li>
              <li>Maximum 3 crafts per turn</li>
              <li>Crafted cards go directly to your hand</li>
              <li>Essences are consumed when crafting</li>
            </ul>
          </div>

          <div className="info-card">
            <h3>⚡ Strategy Tips</h3>
            <ul>
              <li>Build decks around 2-3 elements</li>
              <li>Save essences for powerful late-game crafts</li>
              <li>Sometimes sacrificing creatures for essences is worth it</li>
              <li>Plan your crafts based on game situation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CraftingTable;
