import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Voting from "./Voting";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Flag } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useCategoryTranslator } from "@/utils/category-translator";
import { CountdownTimer } from "@/components/CountdownTimer";
import { FinishCountdownTimer } from "@/components/FinishCountdownTimer";

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
  const { t } = useI18n();
  const { translateCategory } = useCategoryTranslator();
  const { gameCode } = useParams();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [hostPlayerId, setHostPlayerId] = useState<string | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownShown, setCountdownShown] = useState(false);
  const [showFinishCountdown, setShowFinishCountdown] = useState(false);
  const [finishCountdownShown, setFinishCountdownShown] = useState(false);
  const [firstFinisherName, setFirstFinisherName] = useState<string>('');

  const handleSubmitAnswers = useCallback(async () => {
    if (!currentRound || hasSubmitted) return;

    const currentPlayerId = localStorage.getItem("playerId");
    if (!currentPlayerId) {
      showError(t('invalidSession'));
      return;
    }

    setHasSubmitted(true);

    // Get current player name for the countdown message
    const currentPlayer = players.find(p => p.id === currentPlayerId);
    const playerName = currentPlayer?.name || 'Unknown Player';

    // Check if this is the first player to finish
    const { data: existingAnswers } = await supabase
      .from('answers')
      .select('player_id')
      .eq('round_id', currentRound.id);

    const isFirstFinisher = !existingAnswers || existingAnswers.length === 0;

    const { error } = await supabase.rpc('submit_answers_and_end_round', {
        round_id_param: currentRound.id,
        player_id_param: currentPlayerId,
        answers_param: answers
    });

    if (error) {
        showError(t('failedToSubmitAnswers'));
        console.error(error);
        setHasSubmitted(false); // Re-enable on error
    } else if (isFirstFinisher) {
        // Trigger countdown for other players
        setFirstFinisherName(playerName);
        setShowFinishCountdown(true);
        setFinishCountdownShown(true);
    }
  }, [answers, currentRound, hasSubmitted, players]);

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
      
      // Show countdown only when we first get an active round and haven't shown it yet
      if (currentRound.status === 'active' && !countdownShown) {
        setShowCountdown(true);
        setCountdownShown(true);
        // Reset finish countdown when starting a new active round
        setShowFinishCountdown(false);
        setFinishCountdownShown(false);
      } else if (currentRound.status === 'voting') {
        // Hide all countdowns when entering voting phase
        setShowCountdown(false);
        setCountdownShown(false);
        setShowFinishCountdown(false);
        setFinishCountdownShown(false);
      }
    }
  }, [currentRound?.id, currentRound?.status, countdownShown]);

  useEffect(() => {
    const currentPlayerId = localStorage.getItem("playerId");
    console.log('Game component - gameCode:', gameCode, 'playerId:', currentPlayerId);
    
    if (!gameCode || !currentPlayerId) {
      showError(t('invalidSession'));
      navigate("/");
      return;
    }

    let playerChannel: RealtimeChannel | null = null;
    let roundChannel: RealtimeChannel | null = null;

    const fetchAndSubscribe = async () => {
      setLoading(true);
      
      // Fetch game data first
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select("id, status, host_player_id, target_score, max_rounds")
        .eq("game_code", gameCode)
        .single();

      if (gameError || !gameData) {
        console.error("Game fetch error:", gameError);
        showError(`Game not found: ${gameError?.message || 'Unknown error'}`);
        navigate("/");
        return;
      }

      // Check if game is completed
      if (gameData.status === "completed") {
        navigate(`/results/${gameCode}`);
        return;
      }

      setHostPlayerId(gameData.host_player_id);

      // Fetch rounds separately
      const { data: roundsData, error: roundsError } = await supabase
        .from("rounds")
        .select("*")
        .eq("game_id", gameData.id);

      let activeOrVotingRound = null;
      if (roundsError) {
        console.error("Error fetching rounds:", roundsError);
      } else {
        activeOrVotingRound = roundsData?.find(r => r.status === 'active' || r.status === 'voting');
        setCurrentRound(activeOrVotingRound || null);
      }

      // Fetch players separately
      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select("*")
        .eq("game_id", gameData.id);

      if (playersError) {
        console.error("Error fetching players:", playersError);
      } else {
        setPlayers(playersData || []);
      }

                // Check for existing answers if there's an active round
          if (activeOrVotingRound) {
            try {
              const { data: existingAnswer, error: answerError } = await supabase
                .from('answers')
                .select('id')
                .eq('round_id', activeOrVotingRound.id)
                .eq('player_id', currentPlayerId);
              
              if (!answerError && existingAnswer && existingAnswer.length > 0) {
                setHasSubmitted(true);
              }

              // Check if someone else has finished and we haven't shown the countdown yet
              // Only show during active round, not during voting
              if (activeOrVotingRound.status === 'active' && !hasSubmitted && !finishCountdownShown) {
                const { data: allAnswers } = await supabase
                  .from('answers')
                  .select('player_id')
                  .eq('round_id', activeOrVotingRound.id);
                
                if (allAnswers && allAnswers.length > 0) {
                  // Someone has finished, show countdown for current player
                  const finisher = players.find(p => p.id === allAnswers[0].player_id);
                  setFirstFinisherName(finisher?.name || 'Unknown Player');
                  setShowFinishCountdown(true);
                  setFinishCountdownShown(true);
                }
              }
            } catch (error) {
              console.error('Error checking existing answers:', error);
            }
          }
      
      setLoading(false);

      // Use polling instead of real-time subscriptions
      const pollInterval = setInterval(async () => {
        try {
          // Check game status first
          const { data: gameStatus } = await supabase
            .from('games')
            .select('status')
            .eq('id', gameData.id)
            .single();
          
          if (gameStatus?.status === 'completed') {
            clearInterval(pollInterval);
            navigate(`/results/${gameCode}`);
            return;
          }

          // Refresh players and check for game end conditions
          const { data: refreshedPlayers } = await supabase
            .from('players')
            .select('*')
            .eq('game_id', gameData.id);
          
          if (refreshedPlayers) {
            setPlayers(refreshedPlayers);
            
            // Check if any player has reached the target score
            const maxScore = Math.max(...refreshedPlayers.map(p => p.score));
            if (maxScore >= gameData.target_score) {
              // End the game
              const { error: endGameError } = await supabase
                .from('games')
                .update({ status: 'completed' })
                .eq('id', gameData.id);
              
              if (!endGameError) {
                clearInterval(pollInterval);
                navigate(`/results/${gameCode}`);
                return;
              }
            }
          }



          // Refresh rounds and check for max rounds
          const { data: roundsData, error } = await supabase
            .from('rounds')
            .select('*')
            .eq('game_id', gameData.id);
          
          if (!error && roundsData) {
            const newActiveOrVotingRound = roundsData.find(r => r.status === 'active' || r.status === 'voting');
            setCurrentRound(newActiveOrVotingRound || null);
            
            // Check if max rounds reached
            if (roundsData.length >= gameData.max_rounds) {
              // End the game
              const { error: endGameError } = await supabase
                .from('games')
                .update({ status: 'completed' })
                .eq('id', gameData.id);
              
              if (!endGameError) {
                clearInterval(pollInterval);
                navigate(`/results/${gameCode}`);
                return;
              }
            }
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 2000); // Poll every 2 seconds

      // Store interval for cleanup
      return () => clearInterval(pollInterval);
    };

    fetchAndSubscribe();

    return () => {
      // Cleanup will be handled by the polling function
    };
  }, [gameCode, navigate]);

  const handleAnswerChange = (category: string, value: string) => {
    setAnswers(prev => ({ ...prev, [category]: value }));
  };

  const handleEndGame = async () => {
    if (!hostPlayerId || !gameCode) return;
    
    const currentPlayerId = localStorage.getItem("playerId");
    if (currentPlayerId !== hostPlayerId) {
      showError(t('onlyHostCanEndGame'));
      return;
    }

    const { error } = await supabase
      .from("games")
      .update({ status: "completed" })
      .eq("game_code", gameCode);

    if (error) {
      showError(t('failedToEndGame'));
      console.error(error);
    } else {
      showSuccess(t('success'));
      navigate(`/results/${gameCode}`);
    }
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
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
        {/* Player Scoreboard */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{t('players')}</CardTitle>
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
          
          {/* End Game Button (Host Only) */}
          {hostPlayerId && localStorage.getItem("playerId") === hostPlayerId && (
            <Card className="mt-4">
              <CardContent className="pt-6">
                <Button 
                  onClick={handleEndGame}
                  variant="destructive"
                  className="w-full flex items-center gap-2"
                >
                  <Flag className="h-4 w-4" />
                  {t('endGame')}
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {t('onlyVisibleToHost')}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Game Area */}
        <div className="lg:col-span-3">
          {isVotingPhase && currentRound ? (
            <Voting round={currentRound} players={players} hostPlayerId={hostPlayerId} />
          ) : isRoundActive && currentRound ? (
            showCountdown ? (
              <CountdownTimer 
                seconds={10} 
                onComplete={() => setShowCountdown(false)}
                className="h-96 flex items-center justify-center"
              />
            ) : showFinishCountdown && isRoundActive ? (
              <FinishCountdownTimer 
                seconds={10} 
                onComplete={() => setShowFinishCountdown(false)}
                className="h-96 flex items-center justify-center"
                playerName={firstFinisherName}
              />
            ) : (
              <Card>
                <CardHeader className="text-center">
                  <p className="text-xl text-gray-600 dark:text-gray-400">{t('theLetterIs')}</p>
                  <h1 className="text-8xl font-bold tracking-tighter">{currentRound.letter}</h1>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentRound.categories.map((category) => (
                    <div key={category}>
                      <label className="font-semibold">{translateCategory(category)}</label>
                      <Input
                        placeholder={t('enterAnswer', { category: translateCategory(category).toLowerCase() })}
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
                    {hasSubmitted ? t('submitted') : t('stopButton')}
                  </Button>
                </CardContent>
              </Card>
            )
          ) : (
            <Card className="flex items-center justify-center h-96">
              <p className="text-xl text-gray-500">{t('waitingForNextRound')}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Game;