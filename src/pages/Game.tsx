import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Voting from "./Voting";
import { RealtimeChannel } from "@supabase/supabase-js";

export type Player = {
  id: string;
  name: string;
  score: number;
};

export type Round = {
  id: string;
  game_id: string;
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
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [hostPlayerId, setHostPlayerId] = useState<string | null>(null);

  const handleSubmitAnswers = useCallback(async () => {
    if (!currentRound || hasSubmitted) return;

    const currentPlayerId = sessionStorage.getItem("playerId");
    if (!currentPlayerId) {
      showError("Player session not found.");
      return;
    }

    setHasSubmitted(true);

    const { error } = await supabase.rpc('submit_answers_and_end_round', {
        round_id_param: currentRound.id,
        player_id_param: currentPlayerId,
        answers_param: answers
    });

    if (error) {
        showError("Failed to submit answers.");
        console.error(error);
        setHasSubmitted(false); // Re-enable on error
    }
  }, [answers, currentRound, hasSubmitted]);

  useEffect(() => {
    const isRoundOver = currentRound?.status !== 'active';
    if (isRoundOver && !hasSubmitted) {
      handleSubmitAnswers();
    }
  }, [currentRound?.status, hasSubmitted, handleSubmitAnswers]);

  // Reset state when a new round begins
  useEffect(() => {
    if (currentRound) {
      setAnswers({});
      setHasSubmitted(false);
    }
  }, [currentRound?.id]);

  useEffect(() => {
    const currentPlayerId = sessionStorage.getItem("playerId");
    if (!gameCode || !currentPlayerId) {
      showError("Invalid session. Redirecting home.");
      navigate("/");
      return;
    }

    let playerChannel: RealtimeChannel | null = null;
    let roundChannel: RealtimeChannel | null = null;

    const fetchAndSubscribe = async () => {
      setLoading(true);
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select("id, status, host_player_id, rounds(*), players(*)")
        .eq("game_code", gameCode)
        .single();

      if (gameError || !gameData) {
        showError("Game not found.");
        navigate("/");
        return;
      }

      setHostPlayerId(gameData.host_player_id);
      const activeOrVotingRound = gameData.rounds.find(r => r.status === 'active' || r.status === 'voting');
      setCurrentRound(activeOrVotingRound || null);
      setPlayers(gameData.players || []);

      if (activeOrVotingRound) {
        const { data: existingAnswer } = await supabase
          .from('answers')
          .select('id')
          .eq('round_id', activeOrVotingRound.id)
          .eq('player_id', currentPlayerId)
          .single();
        if (existingAnswer) {
          setHasSubmitted(true);
        }
      }
      
      setLoading(false);

      playerChannel = supabase
        .channel(`game-players-${gameData.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `game_id=eq.${gameData.id}` },
          () => {
            supabase.from('players').select('*').eq('game_id', gameData.id).then(({ data }) => setPlayers(data || []));
          }
        ).subscribe();

      roundChannel = supabase
        .channel(`game-rounds-${gameData.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds', filter: `game_id=eq.${gameData.id}` },
          async () => {
            const { data: roundsData, error } = await supabase.from('rounds').select('*').eq('game_id', gameData.id);
            if (error) {
              console.error("Error refetching rounds", error);
              return;
            }
            const newActiveOrVotingRound = roundsData?.find(r => r.status === 'active' || r.status === 'voting');
            setCurrentRound(newActiveOrVotingRound || null);
          }
        ).subscribe();
    };

    fetchAndSubscribe();

    return () => {
      if (playerChannel) supabase.removeChannel(playerChannel);
      if (roundChannel) supabase.removeChannel(roundChannel);
    };
  }, [gameCode, navigate]);

  const handleAnswerChange = (category: string, value: string) => {
    setAnswers(prev => ({ ...prev, [category]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Skeleton className="w-full h-96 max-w-4xl" />
      </div>
    );
  }

  const isRoundActive = currentRound?.status === 'active';
  const isVotingPhase = currentRound?.status === 'voting';

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
              {players.sort((a, b) => b.score - a.score).map((player) => (
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
          {isVotingPhase && currentRound ? (
            <Voting round={currentRound} players={players} hostPlayerId={hostPlayerId} />
          ) : isRoundActive && currentRound ? (
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
                      disabled={hasSubmitted}
                    />
                  </div>
                ))}
                <Button 
                  className="w-full text-xl font-bold py-6 mt-6" 
                  onClick={handleSubmitAnswers}
                  disabled={hasSubmitted}
                >
                  {hasSubmitted ? "Submitted!" : "STOP!"}
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