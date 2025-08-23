import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useParams, useNavigate } from "react-router-dom";
import { Copy } from "lucide-react";
import { showSuccess } from "@/utils/toast";

// Placeholder data for players in the lobby
const placeholderPlayers = [
  { id: 1, name: "StreamerHost", isHost: true },
  { id: 2, name: "PlayerOne" },
  { id: 3, name: "Viewer_22" },
  { id: 4, name: "TikTokFan" },
];

const Lobby = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const handleStartGame = () => {
    // Placeholder for Supabase logic to start the game
    console.log("Starting game:", gameId);
    navigate(`/game/${gameId}`);
  };

  const copyGameId = () => {
    if (gameId) {
      navigator.clipboard.writeText(gameId);
      showSuccess("Game ID copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Game Lobby</CardTitle>
          <div className="flex items-center justify-center gap-2 pt-2">
            <span className="text-lg font-mono bg-gray-200 dark:bg-gray-800 px-3 py-1 rounded">
              {gameId}
            </span>
            <Button variant="ghost" size="icon" onClick={copyGameId}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <h3 className="text-lg font-semibold mb-4 text-center">Players</h3>
          <div className="space-y-3">
            {placeholderPlayers.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={`https://api.dicebear.com/8.x/bottts/svg?seed=${player.name}`} />
                    <AvatarFallback>{player.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{player.name}</span>
                </div>
                {player.isHost && (
                  <span className="text-xs font-bold text-primary uppercase">
                    Host
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
        <div className="p-6">
          <Button className="w-full" onClick={handleStartGame}>
            Start Game
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Lobby;