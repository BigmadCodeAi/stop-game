import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useParams, useNavigate } from "react-router-dom";
import { Copy } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

type Player = {
  id: string;
  name: string;
};

const Lobby = () => {
  const { gameCode } = useParams();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameDetails, setGameDetails] = useState<any>(null);
  const [isHost, setIsHost] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    const currentPlayerId = sessionStorage.getItem("playerId");
    if (!gameCode || !currentPlayerId) {
      showError("Invalid session. Redirecting home.");
      navigate("/");
      return;
    }

    let channel: RealtimeChannel | null = null;

    const fetchGameAndPlayers = async () => {
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select("id, host_player_id, status")
        .eq("game_code", gameCode)
        .single();

      if (gameError || !gameData) {
        showError("Game not found.");
        navigate("/");
        return null;
      }

      if (gameData.status === "in_progress") {
        navigate(`/game/${gameCode}`);
        return null;
      }

      setGameDetails(gameData);
      setIsHost(currentPlayerId === gameData.host_player_id);

      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select("id, name")
        .eq("game_id", gameData.id);

      if (playersError) {
        showError("Could not fetch players.");
      } else {
        setPlayers(playersData || []);
      }
      
      return gameData;
    };

    const setupSubscription = (gameId: string) => {
      channel = supabase
        .channel(`lobby-${gameId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "players", filter: `game_id=eq.${gameId}` },
          async () => {
            const { data: updatedPlayers } = await supabase
              .from("players")
              .select("id, name")
              .eq("game_id", gameId);
            setPlayers(updatedPlayers || []);
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${gameId}` },
          (payload) => {
            if (payload.new.status === "in_progress") {
              navigate(`/game/${gameCode}`);
            }
          }
        )
        .subscribe();
    };

    fetchGameAndPlayers().then(gameData => {
      if (gameData) {
        setupSubscription(gameData.id);
      }
    });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [gameCode, navigate]);

  const handleStartGame = async () => {
    if (!isHost || !gameDetails || isStarting) return;

    setIsStarting(true);

    const { error } = await supabase.rpc('start_game_and_create_round', {
      game_id_param: gameDetails.id
    });

    if (error) {
      showError("Failed to start the game.");
      console.error(error);
      setIsStarting(false);
    }
  };

  const copyGameId = () => {
    if (gameCode) {
      navigator.clipboard.writeText(gameCode);
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
              {gameCode}
            </span>
            <Button variant="ghost" size="icon" onClick={copyGameId}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <h3 className="text-lg font-semibold mb-4 text-center">Players ({players.length})</h3>
          <div className="space-y-3">
            {players.map((player) => (
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
                {player.id === gameDetails?.host_player_id && (
                  <span className="text-xs font-bold text-primary uppercase">
                    Host
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
        {isHost && (
          <div className="p-6">
            <Button className="w-full" onClick={handleStartGame} disabled={isStarting}>
              {isStarting ? "Starting..." : "Start Game"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Lobby;