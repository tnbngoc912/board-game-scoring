# 🎲 ScoreKeeper

A mobile-first board game score tracker built with Next.js + React + Zustand.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server (opens on http://localhost:3000)
npm run dev

# 3. Build for production
npm run build

# 4. Start production server after building
npm run start
```

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
├── app/
│   ├── layout.jsx         # Next.js root layout
│   ├── manifest.js        # PWA manifest
│   └── page.jsx           # Client SPA entry
├── App.jsx                # Root component + navigation
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
NEXT_PUBLIC_API_BASE_URL=https://your-api.example.com/api/v1
```

## Tech Stack

- **React 18** — UI
- **Next.js** — app framework and build tool
- **Zustand** — state management (with localStorage persistence)
- **Framer Motion** — animations
- **next-pwa** — PWA / offline support
- **Google Fonts** — Outfit (display) + JetBrains Mono (numbers)
# board-game-scoring
