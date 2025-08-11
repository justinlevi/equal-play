# EqualPlay - Soccer Minutes Tracker

A React TypeScript application for tracking player minutes and statistics during soccer games, ensuring fair playing time for all players.

## Features

- **Real-time Timer**: Track match time and individual player minutes
- **Player Management**: Add/remove players with jersey numbers
- **Field/Bench Tracking**: Visual separation of on-field and benched players
- **Smart Substitutions**: Automatic suggestions for fair playing time
- **Statistics Tracking**: Track goals, assists, saves, and custom stats
- **Game Reports**: Generate and export comprehensive game reports
- **Data Persistence**: All data saved locally in browser storage

## Setup & Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install additional packages (if not already installed):**
   ```bash
   npm install -D gh-pages tailwindcss postcss autoprefixer
   ```

3. **Run locally:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

## Deployment to GitHub Pages

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy to GitHub Pages:**
   ```bash
   npm run deploy
   ```

3. **Access your deployed app at:**
   ```
   https://justinlevi.github.io/equal-play/
   ```

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── Header.tsx       # Main header with timer and controls
│   ├── PlayerCard.tsx   # Individual player display card
│   ├── SubstitutionSuggestions.tsx
│   └── modals/          # Modal components
│       ├── SettingsModal.tsx
│       ├── RosterModal.tsx
│       ├── ReportModal.tsx
│       └── PlayerDetailsModal.tsx
├── hooks/               # Custom React hooks
│   └── useLocalStorage.ts
├── types/               # TypeScript type definitions
│   └── index.ts
├── utils/               # Utility functions
│   ├── time.ts         # Time formatting utilities
│   ├── stats.ts        # Statistics calculations
│   └── report.ts       # Report generation
└── App.tsx             # Main application component
```

## Usage

1. **Add Players**: Click the roster button (👥) to add players with names and jersey numbers
2. **Start Timer**: Press the green START button to begin tracking time
3. **Manage Field**: Click FIELD/BENCH buttons to move players on/off the field
4. **Track Stats**: Use +/- buttons on player cards to track goals, assists, etc.
5. **View Suggestions**: Yellow box shows recommended substitutions for fair play
6. **Generate Report**: Click the report button (📊) to view/export game statistics

## Settings

- **Players on Field**: Set the target number of field players (default: 7)
- **Half Duration**: Set the expected half duration in minutes
- **Custom Stats**: Add/remove custom statistics to track
- **Reset Options**: Reset minutes or stats independently

## Technologies Used

- React 19 with TypeScript
- Vite for fast builds and HMR
- Tailwind CSS for styling
- Local Storage for data persistence
- GitHub Pages for deployment

## Development

To contribute or modify:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run lint` to check code quality
5. Submit a pull request

## License

MIT