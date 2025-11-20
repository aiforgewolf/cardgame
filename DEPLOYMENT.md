# 🚀 Deployment Guide - Element Forge

This guide will walk you through deploying Element Forge to Railway.app for online multiplayer gameplay.

## 📋 Prerequisites

- GitHub account
- Railway.app account (free tier available)
- Your code pushed to a GitHub repository

## 🎯 Quick Deploy to Railway

### Step 1: Prepare Your Repository

The code is already configured for Railway deployment! Here's what was set up:

✅ Environment-aware API URLs (auto-detect production vs development)
✅ WebSocket support for https/wss
✅ Frontend build serving from backend
✅ Railway configuration files
✅ Production build scripts

### Step 2: Deploy to Railway

1. **Go to Railway.app**
   - Visit https://railway.app
   - Sign in with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `cardgame` repository
   - Railway will auto-detect Node.js

3. **Configure Build Settings**

   Railway should auto-detect the configuration from `nixpacks.toml`, but verify:

   - **Root Directory**: `/` (leave default)
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && npm start`

4. **Set Environment Variables**

   In Railway dashboard, go to your project → **Variables** tab:

   ```bash
   NODE_ENV=production
   PORT=3001
   JWT_SECRET=your-super-secret-key-change-this-to-something-random
   ```

   **Important**: Change `JWT_SECRET` to a long random string!

5. **Deploy**
   - Railway will automatically deploy
   - Wait for build to complete (2-5 minutes)
   - You'll get a URL like: `https://your-app.up.railway.app`

### Step 3: Enable Public Networking

1. In Railway dashboard, click on your service
2. Go to **Settings** tab
3. Scroll to **Networking**
4. Click **Generate Domain**
5. Copy your public URL

### Step 4: Test Your Deployment

Visit your Railway URL:
```
https://your-app.up.railway.app
```

You should see the Element Forge login page!

## 🗄️ Database Persistence

### Option A: Use Railway Volumes (Recommended for SQLite)

1. In Railway dashboard → **Add Volume**
2. **Mount Path**: `/app/backend`
3. **Size**: 1 GB (free tier)

This will persist your `elementforge.db` file across deployments and restarts.

### Option B: Use PostgreSQL (Better for Production)

1. In Railway → **Add Database** → **PostgreSQL**
2. Railway provides connection string automatically
3. **You'll need to modify the code** to use PostgreSQL instead of SQLite

For this guide, **Option A (Volumes)** is simplest and works out of the box!

## 🔍 Verify Deployment

Test these features:

- ✅ **Login Page Loads**: Visit your Railway URL
- ✅ **Guest Login Works**: Try playing as guest
- ✅ **Registration Works**: Create an account
- ✅ **WebSocket Connects**: Check browser console for "Connected to game server"
- ✅ **Matchmaking Works**: Try finding a match (you'll need 2 browser windows/tabs)
- ✅ **Game Plays**: Start a game and play some turns

## 🐛 Troubleshooting

### Issue: Frontend doesn't load

**Solution**: Check build logs in Railway dashboard
- Ensure `npm run build` completed successfully
- Check that `NODE_ENV=production` is set

### Issue: WebSocket connection fails

**Solution**:
- Verify your Railway URL uses `https://` (not `http://`)
- WebSocket automatically upgrades to `wss://` in production
- Check browser console for WebSocket errors

### Issue: Database resets on restart

**Solution**:
- Add a Railway Volume mounted at `/app/backend`
- This persists the SQLite database

### Issue: 502 Bad Gateway

**Solution**:
- Check Railway logs for errors
- Ensure backend is starting correctly
- Verify `PORT` environment variable is set to 3001

### Issue: Can't find opponent in matchmaking

**Solution**:
- You need TWO players online simultaneously
- Open your Railway URL in 2 different browser windows
- Or share the link with a friend!

## 📊 Monitor Your Deployment

### Railway Dashboard

- **Logs**: View real-time server logs
- **Metrics**: CPU, memory, network usage
- **Deployments**: See deployment history

### Application Logs

Common log messages:
```
Connected to SQLite database
Cards initialized in database
Server running on port 3001
WebSocket ready for connections
New WebSocket connection
Game [id] started between [player1] and [player2]
```

## 💰 Railway Pricing

**Free Tier** includes:
- $5 credit per month
- 500 hours of execution
- 100 GB bandwidth
- 1 GB storage

Element Forge should run comfortably within free tier limits!

## 🔄 Updating Your Deployment

To deploy updates:

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Update game"
   git push
   ```

2. **Automatic Deploy**:
   - Railway auto-deploys on git push
   - Watch deployment in Railway dashboard

3. **Manual Redeploy**:
   - In Railway → Click "Deploy"
   - Select "Redeploy"

## 🌐 Custom Domain (Optional)

1. In Railway → **Settings** → **Networking**
2. Click **Custom Domain**
3. Add your domain (requires DNS configuration)
4. Update DNS with CNAME record

## 🔐 Security Checklist

Before going live:

- ✅ Change `JWT_SECRET` to a strong random value
- ✅ Enable Railway Volume for database persistence
- ✅ Consider rate limiting for API endpoints
- ✅ Monitor Railway logs for suspicious activity
- ✅ Keep dependencies updated

## 📱 Share Your Game!

Once deployed, share your Railway URL:
```
https://your-app.up.railway.app
```

Anyone can:
- Play as guest (no signup needed)
- Register an account (progress saved)
- Battle against other online players
- Craft cards and build decks

## 🎮 Playing Online

**For 2-Player Matches**:
1. Share your Railway URL with a friend
2. Both visit the site
3. Both click "Play Game" to enter matchmaking
4. You'll be automatically matched!

**Or use 2 browser windows**:
1. Open Railway URL in Chrome
2. Open Railway URL in Firefox (or incognito)
3. Both enter matchmaking
4. Match and play against yourself!

## 📞 Need Help?

Common resources:
- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Project README: Check README.md for game setup

---

**Congratulations!** 🎉 Your card game is now live and playable online!

Players around the world can now forge elements and battle for supremacy!
