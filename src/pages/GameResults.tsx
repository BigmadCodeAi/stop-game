import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Users, Target, RotateCcw } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export type Player = {
  id: string;
  name: string;
  score: number;
};

export type GameStats = {
  totalRounds: number;
  targetScore: number;
  maxRounds: number;
  winner: Player | null;
  endReason: 'score' | 'rounds' | 'manual';
};

const GameResults = () => {
  const { t } = useI18n();
  const { gameCode } = useParams();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGameResults = async () => {
      if (!gameCode) {
        showError(t('gameNotFound'));
        navigate("/");
        return;
      }

      try {
        setLoading(true);

        // Fetch game details
        const { data: gameData, error: gameError } = await supabase
          .from("games")
          .select("id, target_score, max_rounds, current_round")
          .eq("game_code", gameCode)
          .single();

        if (gameError || !gameData) {
          showError(t('gameNotFound'));
          navigate("/");
          return;
        }

        // Fetch players
        const { data: playersData, error: playersError } = await supabase
          .from("players")
          .select("id, name, score")
          .eq("game_id", gameData.id)
          .order("score", { ascending: false });

        if (playersError) {
          showError(t('couldNotFetchPlayers'));
          return;
        }

        setPlayers(playersData || []);

        // Fetch rounds count
        const { count: totalRounds } = await supabase
          .from("rounds")
          .select("*", { count: "exact", head: true })
          .eq("game_id", gameData.id);

        // Determine winner and end reason
        const sortedPlayers = playersData?.sort((a, b) => b.score - a.score) || [];
        const winner = sortedPlayers.length > 0 ? sortedPlayers[0] : null;
        
        let endReason: 'score' | 'rounds' | 'manual' = 'manual';
        if (winner && winner.score >= gameData.target_score) {
          endReason = 'score';
        } else if (totalRounds && totalRounds >= gameData.max_rounds) {
          endReason = 'rounds';
        }

        setGameStats({
          totalRounds: totalRounds || 0,
          targetScore: gameData.target_score,
          maxRounds: gameData.max_rounds,
          winner,
          endReason
        });

      } catch (error) {
        console.error("Error fetching game results:", error);
        showError(t('failedToLoadGameResults'));
      } finally {
        setLoading(false);
      }
    };

    fetchGameResults();
  }, [gameCode, navigate]);

  const handlePlayAgain = () => {
    // Clear current session and go to home
    localStorage.removeItem("playerId");
    localStorage.removeItem("gameId");
    navigate("/");
  };

  const getEndReasonText = () => {
    if (!gameStats) return "";
    
    switch (gameStats.endReason) {
      case 'score':
        return t('scoreReached', { player: gameStats.winner?.name || '', score: gameStats.targetScore });
      case 'rounds':
        return t('roundsCompleted', { rounds: gameStats.totalRounds });
      case 'manual':
        return t('manualEnd');
      default:
        return t('gameEnded');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">{t('loadingGameResults')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 lg:p-8">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Trophy className="h-16 w-16 text-yellow-500" />
            </div>
            <CardTitle className="text-3xl mb-2">{t('gameOver')}</CardTitle>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {getEndReasonText()}
            </p>
          </CardHeader>
        </Card>

        {/* Winner Section */}
        {gameStats?.winner && (
          <Card className="mb-8 border-2 border-yellow-500">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-yellow-600">🏆 {t('winner')}</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex items-center justify-center gap-4 mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={`https://api.dicebear.com/8.x/bottts/svg?seed=${gameStats.winner.name}`} />
                  <AvatarFallback className="text-2xl">{gameStats.winner.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-2xl font-bold">{gameStats.winner.name}</h3>
                  <p className="text-xl text-yellow-600">{gameStats.winner.score} {t('points')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Final Leaderboard */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('finalLeaderboard')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    index === 0 ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200' : 'bg-gray-50 dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </span>
                      <Avatar>
                        <AvatarImage src={`https://api.dicebear.com/8.x/bottts/svg?seed=${player.name}`} />
                        <AvatarFallback>{player.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{player.name}</span>
                    </div>
                  </div>
                  <span className="text-xl font-bold">{player.score} {t('points')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Game Statistics */}
        {gameStats && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{t('gameStatistics')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Target className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('targetScoreLabel')}</p>
                  <p className="text-2xl font-bold">{gameStats.targetScore}</p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <RotateCcw className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('roundsPlayed')}</p>
                  <p className="text-2xl font-bold">{gameStats.totalRounds}</p>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('players')}</p>
                  <p className="text-2xl font-bold">{players.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={handlePlayAgain}
            className="flex items-center gap-2"
            size="lg"
          >
            <RotateCcw className="h-4 w-4" />
            {t('playAgain')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GameResults;
