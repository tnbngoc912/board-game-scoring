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

## Add Firebase for Cross-Device Sync (Optional)

1. Create a free Firebase project at https://console.firebase.google.com
2. Enable Firestore database
3. Install: `npm install firebase`
4. Add to `src/store/gameStore.js` — sync on `addRound` and `saveGame`

## Tech Stack

- **React 18** — UI
- **Vite** — build tool
- **Zustand** — state management (with localStorage persistence)
- **Framer Motion** — animations
- **vite-plugin-pwa** — PWA / offline support
- **Google Fonts** — Outfit (display) + JetBrains Mono (numbers)
# board-game-scoring
