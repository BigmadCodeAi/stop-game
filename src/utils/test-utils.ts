// Test utilities for development
export const clearGameSession = () => {
  localStorage.removeItem("playerId");
  localStorage.removeItem("gameId");
  console.log("✅ Game session cleared");
};

export const getCurrentSession = () => {
  const playerId = localStorage.getItem("playerId");
  const gameId = localStorage.getItem("gameId");
  console.log("📊 Current session:", { playerId, gameId });
  return { playerId, gameId };
};

// Add to browser console for easy testing:
// clearGameSession() - clears current session
// getCurrentSession() - shows current session
