# 🎲 ScoreKeeper

A mobile-first board game score tracker built with React + Vite + Zustand.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server (opens on http://localhost:5173)
npm run dev

# 3. Build for production
npm run build

# 4. Preview production build
npm run preview
```

## Features

- ✅ Add/remove players (up to 8)
- ✅ Enter scores per round with stepper buttons
- ✅ Quick-add presets (+1, +5, +10, +25 to all)
- ✅ Animated live leaderboard with rank changes (Framer Motion)
- ✅ Animated score counter
- ✅ Round history table with undo
- ✅ Add players mid-game
- ✅ Save game history (localStorage, persists across sessions)
- ✅ Dark / Light mode toggle
- ✅ PWA installable (works offline after first load)
- ✅ Mobile-first, touch-friendly (48px+ tap targets)

## Project Structure

```
src/
├── api/
│   └── backendService.js  # REST API client
├── components/
│   ├── PlayerDot.jsx      # Colored avatar circle
│   ├── SetupScreen.jsx    # Player setup UI
│   ├── GameScreen.jsx     # Main game screen
│   ├── Leaderboard.jsx    # Animated rankings
│   ├── ScoreInput.jsx     # Per-player score steppers
│   ├── RoundHistory.jsx   # Collapsible history table
│   ├── HistoryScreen.jsx  # Saved games
│   └── Toast.jsx          # Notification toast
├── store/
│   └── gameStore.js       # Zustand state management
├── hooks/
│   └── useToast.js        # Toast hook
├── App.jsx                # Root component + navigation
├── main.jsx               # Entry point
└── index.css              # Global styles + design tokens
```

## API Backend

The app saves completed matches through the backend API.

Default API base:

```bash
https://boardgame-scorer-backend.onrender.com/api/v1
```

Override it locally with:

```bash
VITE_API_BASE_URL=https://your-api.example.com/api/v1
```

## Tech Stack

- **React 18** — UI
- **Vite** — build tool
- **Zustand** — state management (with localStorage persistence)
- **Framer Motion** — animations
- **vite-plugin-pwa** — PWA / offline support
- **Google Fonts** — Outfit (display) + JetBrains Mono (numbers)
# board-game-scoring
