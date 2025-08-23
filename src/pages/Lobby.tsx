import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useParams, useNavigate } from "react-router-dom";
import { Copy, Target, RotateCcw } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useI18n } from "@/contexts/I18nContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

type Player = {
  id: string;
  name: string;
};

const Lobby = () => {
  const { t } = useI18n();
  const { gameCode } = useParams();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameDetails, setGameDetails] = useState<any>(null);
  const [isHost, setIsHost] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [gameSettings, setGameSettings] = useState<{targetScore: number, maxRounds: number} | null>(null);

  useEffect(() => {
    const currentPlayerId = localStorage.getItem("playerId");
    if (!gameCode || !currentPlayerId) {
      showError(t('invalidSession'));
      navigate("/");
      return;
    }

    let playerChannel: RealtimeChannel | null = null;
    let gameChannel: RealtimeChannel | null = null;

    const fetchGameAndPlayers = async () => {
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select("id, host_player_id, status, target_score, max_rounds")
        .eq("game_code", gameCode)
        .single();

      if (gameError || !gameData) {
        showError(t('gameNotFound'));
        navigate("/");
        return null;
      }

      if (gameData.status === "in_progress") {
        navigate(`/game/${gameCode}`);
        return null;
      }

      setGameDetails(gameData);
      setIsHost(currentPlayerId === gameData.host_player_id);
      setGameSettings({
        targetScore: gameData.target_score,
        maxRounds: gameData.max_rounds
      });

      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select("id, name")
        .eq("game_id", gameData.id);

      if (playersError) {
        showError(t('couldNotFetchPlayers'));
      } else {
        setPlayers(playersData || []);
      }
      
      return gameData;
    };

    const setupSubscriptions = (gameId: string) => {
      console.log('Setting up polling fallback for game:', gameId);
      
      // Since real-time is not working, use polling instead
      const pollInterval = setInterval(async () => {
        try {
          // Check for game status changes
          const { data: gameStatus } = await supabase
            .from("games")
            .select("status")
            .eq("id", gameId)
            .single();
          
          if (gameStatus?.status === "in_progress") {
            console.log('Game started, navigating to game page');
            clearInterval(pollInterval);
            navigate(`/game/${gameCode}`);
            return;
          }
          
          // Refresh player list
          const { data: updatedPlayers } = await supabase
            .from("players")
            .select("id, name")
            .eq("game_id", gameId);
          
          setPlayers(updatedPlayers || []);
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 2000); // Poll every 2 seconds
      
      // Store interval for cleanup
      return () => clearInterval(pollInterval);
    };

    fetchGameAndPlayers().then(gameData => {
      if (gameData) {
        const cleanup = setupSubscriptions(gameData.id);
        return cleanup;
      }
    });

    return () => {
      // Cleanup will be handled by the polling function
    };
  }, [gameCode, navigate]);

  const handleStartGame = async () => {
    if (!isHost || !gameDetails || isStarting) return;

    setIsStarting(true);
    console.log('Starting game with ID:', gameDetails.id);

    const { error } = await supabase.rpc('start_game_and_create_round', {
      game_id_param: gameDetails.id
    });

    if (error) {
      showError(t('failedToStartGame'));
      console.error(error);
      setIsStarting(false);
    } else {
      console.log('Game start function completed successfully');
      
      // Add a fallback mechanism in case real-time doesn't work
      setTimeout(async () => {
        const { data: gameStatus, error: statusError } = await supabase
          .from("games")
          .select("status")
          .eq("id", gameDetails.id)
          .single();
        
        if (!statusError && gameStatus?.status === "in_progress") {
          console.log('Game status confirmed as in_progress, navigating...');
          navigate(`/game/${gameCode}`);
        } else {
          console.log('Game status check failed or still in lobby');
          setIsStarting(false);
        }
      }, 1000);
    }
  };

  const copyGameId = () => {
    if (gameCode) {
      navigator.clipboard.writeText(gameCode);
      showSuccess(t('gameIdCopied'));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">{t('gameLobby')}</CardTitle>
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
          {/* Game Settings */}
          {gameSettings && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-semibold mb-3 text-center">{t('gameSettings')}</h4>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">
                    {t('target')}: <strong>{gameSettings.targetScore}</strong>
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <RotateCcw className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">
                    {t('maxRoundsLabel')}: <strong>{gameSettings.maxRounds}</strong>
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <h3 className="text-lg font-semibold mb-4 text-center">{t('players')} ({players.length})</h3>
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
                    {t('host')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
        {isHost && (
          <div className="p-6">
            <Button className="w-full" onClick={handleStartGame} disabled={isStarting}>
              {isStarting ? t('starting') : t('startGame')}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Lobby;