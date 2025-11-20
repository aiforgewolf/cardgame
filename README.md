# ⚡ Element Forge ⚡

A completely original 2-player online card game where players master the five elements and craft powerful cards to defeat their opponents in strategic battles.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-green)
![React](https://img.shields.io/badge/react-18.2.0-blue)

## 🎮 Game Features

### Core Gameplay
- **2-Player Real-Time Battles**: Face off against opponents in strategic card combat
- **Guest & Registered Play**: Jump right in as a guest, or register to save your progress
- **Unique Crafting System**: Forge new cards during gameplay using elemental essences
- **Five Elements**: Master Fire, Water, Earth, Air, and Void
- **Multiple Victory Conditions**: Win by destruction, Nexus control, or special card effects

### Game Modes
- **Quick Match**: Find an opponent instantly through matchmaking
- **Deck Builder**: Create and customize your deck (20-40 cards)
- **Card Shop**: Purchase card packs with earned gold (registered users only)
- **Crafting Guide**: View all craftable cards and their recipes

### Progression System
- Earn gold by playing matches (25 for wins, 10 for losses)
- Build your card collection
- Save multiple decks
- Craft legendary cards with rare essence combinations

## 📚 Documentation

- **[RULEBOOK.md](./RULEBOOK.md)**: Complete game rules and mechanics
- **[CRAFTING_TABLE.md](./CRAFTING_TABLE.md)**: All craftable cards and recipes

## 🚀 Quick Start

### Prerequisites
- Node.js 14.0.0 or higher
- npm or yarn
- Modern web browser

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd cardgame
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

### Running the Game

You'll need two terminal windows:

**Terminal 1 - Backend Server:**
```bash
cd backend
npm start
```

The backend server will start on `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

The game will open in your browser at `http://localhost:3000`

## 🌐 Deploy to Railway (Play Online!)

Want to play with friends online? Deploy to Railway in minutes!

### Quick Deploy Steps:

1. **Push to GitHub** (if you haven't already)
2. **Go to [Railway.app](https://railway.app)** and sign in
3. **New Project** → **Deploy from GitHub repo**
4. **Select this repository**
5. **Add environment variables**:
   ```
   NODE_ENV=production
   JWT_SECRET=your-random-secret-key-here
   ```
6. **Add a Volume** (optional but recommended):
   - Mount path: `/app/backend`
   - Keeps database persistent
7. **Deploy** and get your public URL!

🎮 **You can now play online with anyone!**

📖 **Detailed guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step instructions

### What Works Automatically:
- ✅ Production URLs auto-configured
- ✅ WebSocket (wss://) support
- ✅ Frontend served from backend
- ✅ Database persistence (with Volume)
- ✅ Guest & registered user support

## 🎯 How to Play

### For First-Time Players

1. **Start the game**: Visit `http://localhost:3000`
2. **Choose login method**:
   - **Play as Guest**: Instant access, no registration (progress not saved)
   - **Register**: Create an account to save your collection and progress
3. **Build your deck**: Start with basic cards, customize as you collect more
4. **Find a match**: Click "Play Game" to enter matchmaking
5. **Battle**: Use strategy to defeat your opponent!

### Basic Strategy Tips

- Balance your deck with creatures, spells, and artifacts
- Build around 2-3 elements for consistent essence generation
- Save essences for powerful late-game crafts
- Control the Nexus for an alternative win condition
- Manage your energy curve (mix low and high-cost cards)

## 🏗️ Architecture

### Backend (Node.js + Express + WebSocket)
```
backend/
├── server.js          # Main server with REST API and WebSocket
├── database.js        # SQLite database management
├── gameEngine.js      # Core game logic and rules
├── cards.js          # All card definitions
└── elementforge.db   # SQLite database (auto-created)
```

### Frontend (React)
```
frontend/
├── src/
│   ├── components/
│   │   ├── Login.js           # Authentication
│   │   ├── MainMenu.js        # Main menu
│   │   ├── GameBoard.js       # Game interface
│   │   ├── Card.js            # Card component
│   │   ├── DeckBuilder.js     # Deck builder
│   │   ├── CardShop.js        # Card shop
│   │   └── CraftingTable.js   # Crafting guide
│   ├── styles/                # CSS stylesheets
│   ├── App.js                 # Main app component
│   └── index.js              # Entry point
└── public/
    └── index.html            # HTML template
```

## 🎴 Card System

### Card Types
- **Creatures**: Summon to battlefield, attack and defend
- **Spells**: Instant effects (damage, healing, etc.)
- **Artifacts**: Permanent effects that remain on battlefield

### Elements
- 🔥 **Fire**: High damage, burn effects
- 💧 **Water**: Healing, defense, control
- 🌍 **Earth**: High defense, durability
- 💨 **Air**: Speed, card draw
- 🌑 **Void**: Disruption, banishment

### Card Rarity
- **Basic**: Starter cards (unlimited copies)
- **Common**: Easy to obtain (3 copies max)
- **Uncommon**: Moderate effects (3 copies max)
- **Rare**: Strong effects (3 copies max)
- **Epic**: Very powerful (3 copies max)
- **Legendary**: Game-changing (3 copies max)

## 🔨 Crafting System

During gameplay, you can craft cards by spending elemental essences:

- **Gain Essences**:
  - Random essence at start of each turn
  - Creatures drop essences when destroyed
  - Special card effects

- **Craft Cards**:
  - During your Main Phase
  - Up to 3 crafts per turn
  - Crafted cards go to your hand

See [CRAFTING_TABLE.md](./CRAFTING_TABLE.md) for all recipes.

## 🎯 Victory Conditions

1. **Destruction Victory**: Reduce opponent's Life Points to 0
2. **Nexus Control**: Control the Nexus for 3 consecutive turns
3. **Deck Out**: Opponent cannot draw cards (fatigue damage)
4. **Special Win**: Cards like "Elemental Convergence"

## 🛠️ Technical Details

### Database Schema
- **users**: Player accounts and currency
- **cards**: Master card definitions
- **user_cards**: Player collections
- **decks**: Saved decks
- **deck_cards**: Cards in each deck
- **game_history**: Match results
- **crafting_recipes**: Crafting costs

### API Endpoints

**Authentication:**
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/guest` - Guest login

**Cards:**
- `GET /api/cards` - Get all cards
- `GET /api/cards/collection` - Get user's collection

**Shop:**
- `POST /api/shop/buy-pack` - Purchase card pack

**Decks:**
- `GET /api/decks` - Get user's decks
- `GET /api/decks/active` - Get active deck

**Crafting:**
- `GET /api/crafting/recipes` - Get all recipes

### WebSocket Events

**Client → Server:**
- `auth` - Authenticate with JWT token
- `join_matchmaking` - Enter matchmaking queue
- `leave_matchmaking` - Leave queue
- `game_action` - Perform game action (play card, attack, etc.)

**Server → Client:**
- `auth_success` - Authentication confirmed
- `matchmaking_joined` - Entered queue
- `game_started` - Match found, game begins
- `game_update` - Game state updated
- `error` - Error message

## 🐛 Troubleshooting

### Backend won't start
- Ensure Node.js is installed: `node --version`
- Check port 3001 is available
- Install dependencies: `cd backend && npm install`

### Frontend won't start
- Ensure port 3000 is available
- Install dependencies: `cd frontend && npm install`
- Clear cache: `npm cache clean --force`

### Can't connect to game
- Ensure backend is running first
- Check WebSocket connection in browser console
- Verify firewall isn't blocking localhost connections

### Database issues
- Delete `backend/elementforge.db` to reset
- Backend will recreate on next start

## 🎨 Customization

### Adding New Cards

1. Edit `backend/cards.js`
2. Add card definition to appropriate array
3. Restart backend server
4. Database auto-updates

### Modifying Game Rules

Edit `backend/gameEngine.js` to change:
- Starting life points
- Energy progression
- Turn phases
- Victory conditions
- Combat mechanics

## 📝 Game Design

Element Forge features:
- **Original Mechanics**: Unique essence collection and mid-game crafting
- **Strategic Depth**: Multiple paths to victory
- **Resource Management**: Energy and essence systems
- **Deck Building**: 2-3 element focus with flexible mixing
- **Real-Time Multiplayer**: WebSocket-based instant gameplay

## 🤝 Contributing

This is a portfolio/educational project. Feel free to fork and customize!

## 📄 License

MIT License - See LICENSE file for details

## 🎮 Credits

**Game Design & Development**: Created as a complete card game system demonstration

**Technologies Used**:
- Backend: Node.js, Express, WebSocket, SQLite, JWT
- Frontend: React, React Router
- Real-time: WebSocket (ws library)
- Database: SQLite3

## 📞 Support

For issues or questions:
1. Check the [RULEBOOK.md](./RULEBOOK.md) for gameplay questions
2. Review this README for technical issues
3. Check browser console for error messages
4. Ensure both backend and frontend are running

---

**Enjoy mastering the elements in Element Forge!** ⚡🔥💧🌍💨🌑
