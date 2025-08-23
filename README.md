# STOP - Multiplayer Word Game

A real-time multiplayer word game designed for TikTok live streamers and their viewers.

## Features

- 🎮 Real-time multiplayer gameplay
- 📱 Mobile-optimized interface
- 🎯 Voting system for answer validation
- 📊 Live scoreboard updates
- 🔗 Easy game sharing with unique codes

## Environment Setup

### Prerequisites

1. Node.js (v18 or higher)
2. pnpm (recommended) or npm
3. Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd stop-game
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Update `.env` with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development

Start the development server:
```bash
pnpm dev
```

The app will be available at `http://localhost:8080`

### Building for Production

```bash
pnpm build
```

## Supabase Setup

This app requires a Supabase project with the following tables and functions:

- `games` - Game sessions
- `players` - Player information
- `rounds` - Game rounds
- `answers` - Player answers
- `votes` - Voting data

See the database schema documentation for detailed setup instructions.

## Security

⚠️ **Important**: Never commit your `.env` file to version control. The `.env` file is already added to `.gitignore` to prevent accidental commits.
