import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Player = {
  id: string;
  name: string;
  score: number;
};

type Round = {
  id: string;
  letter: string;
  categories: string[];
  status: string;
};

const Game = () => {
  const { gameCode } = useParams();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentPlayerId = sessionStorage.getItem("playerId");
    if (!gameCode || !currentPlayerId) {
      showError("Invalid session. Redirecting home.");
      navigate("/");
      return;
    }

    const fetchInitialData = async () => {
      setLoading(true);
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select("id, status, rounds(*), players(*)")
        .eq("game_code", gameCode)
        .single();

      if (gameError || !gameData) {
        showError("Game not found.");
        navigate("/");
        return;
      }

      const activeRound = gameData.rounds.find(r => r.status === 'active');
      setCurrentRound(activeRound || null);
      setPlayers(gameData.players || []);
      setLoading(false);

      // Setup subscriptions
      const playerChannel = supabase
        .channel(`game-players-${gameData.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `game_id=eq.${gameData.id}` },
          (payload) => setPlayers(currentPlayers => {
            if (payload.eventType === 'INSERT') return [...currentPlayers, payload.new as Player];
            if (payload.eventType === 'UPDATE') return currentPlayers.map(p => p.id === payload.new.id ? payload.new as Player : p);
            return currentPlayers;
          })
        ).subscribe();

      return () => {
        supabase.removeChannel(playerChannel);
      };
    };

    fetchInitialData();
  }, [gameCode, navigate]);

  const handleAnswerChange = (category: string, value: string) => {
    setAnswers(prev => ({ ...prev, [category]: value }));
  };

  const handleSubmitAnswers = () => {
    console.log("Submitting answers:", answers);
    // Logic to submit answers to Supabase will go here
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Skeleton className="w-full h-96 max-w-4xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
        {/* Player Scoreboard */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Players</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {players.map((player) => (
                <div key={player.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={`https://api.dicebear.com/8.x/bottts/svg?seed=${player.name}`} />
                      <AvatarFallback>{player.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{player.name}</span>
                  </div>
                  <span className="font-bold text-lg">{player.score}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Game Area */}
        <div className="lg:col-span-3">
          {currentRound ? (
            <Card>
              <CardHeader className="text-center">
                <p className="text-xl text-gray-600 dark:text-gray-400">The letter is</p>
                <h1 className="text-8xl font-bold tracking-tighter">{currentRound.letter}</h1>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentRound.categories.map((category) => (
                  <div key={category}>
                    <label className="font-semibold">{category}</label>
                    <Input
                      placeholder={`Enter a ${category.toLowerCase()}...`}
                      onChange={(e) => handleAnswerChange(category, e.target.value)}
                      className="mt-1"
                    />
                  </div>
                ))}
                <Button className="w-full text-xl font-bold py-6 mt-6" onClick={handleSubmitAnswers}>
                  STOP!
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex items-center justify-center h-96">
              <p className="text-xl text-gray-500">Waiting for the next round...</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Game;