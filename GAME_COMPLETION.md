You are a full-stack game development assistant helping me rapidly build a simple multiplayer word game called "STOP" that can be used by TikTok live streamers. 

### GAME DESCRIPTION
- Multiplayer word game.
- Each round, the system randomly selects a letter and broadcasts it to all players.
- Each player must fill in words for up to 5 categories (e.g., Name, Actor, Color, Country, Object).
- Scoring:
  • 1 point for each valid word.
  • Bonus if a player is the only one with a unique correct word.
- The game continues until a player reaches a target score or the set number of rounds ends.
- Scoreboard updates after each round.

### CORE FEATURES
1. **Game Lobby**
   - Players can create or join a game with a game ID.
   - Host uses credits to start a game.
   - Multiple games can run in parallel.

2. **Gameplay**
   - System selects random letter.
   - Players fill their row with answers.
   - Validation system checks correctness.
   - Scores displayed in real-time.
   - Simple clean UI with columns for categories, rows for players.

3. **Scoreboard & Results**
   - Real-time scoreboard shown between rounds.
   - Players can view their sheet and compare.

4. **TikTok Integration**
   - (Phase 1) Allow streamers to invite viewers with a game ID.
   - (Phase 2) Explore API or webhook integration so TikTok comments, likes, or gifts can:
     • Trigger extra rounds
     • Unlock special categories
     • Award bonus points
     • Pay for credits

5. **Monetization**
   - Credits system: Hosts buy credits to create new games.
   - TikTok gifts can be converted into credits.
   - Premium: Extra categories, themes, or larger lobbies.

### TECH STACK
- **Frontend:** Dyad (Gemini) → React-based UI
- **Backend:** Cursor (TypeScript/Node.js)
- **Database:** Supabase or Firebase (you choose best fit)
- **Hosting:** Vercel or Netlify for frontend, Supabase/Firebase handles backend
- **Real-time:** Supabase Realtime or Firebase Firestore for game state

### FRONTEND REQUIREMENTS
- Simple clean UI optimized for mobile/web.
- Pages: 
  • Landing page (Start/Join Game)
  • Game Lobby (player list, invite link/ID)
  • Gameplay screen (letter, categories, inputs, timer)
  • Scoreboard screen
- State management for multiple players.

### BACKEND REQUIREMENTS
- API endpoints:
  • Create game
  • Join game
  • Start round
  • Submit answers
  • Validate + score answers
  • Update + fetch scoreboard
- Real-time updates for game state (supabase channels or firestore listeners).
- User + credits management.

### TASK
1. Generate the **frontend Dyad components** (React + Tailwind clean UI).
2. Generate the **backend routes and schema** (Cursor with Supabase/Firebase).
3. Show how to connect Dyad frontend with backend (API calls or direct SDK).
4. Suggest the quickest TikTok Live integration path (manual game IDs first, API later).

OUTPUT:
- Clean, production-ready code snippets.
- Explanations where integration decisions are needed.
- Modular structure for fast iteration.
