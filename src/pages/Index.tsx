import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/contexts/I18nContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const Index = () => {
  const { t } = useI18n();
  const [createPlayerName, setCreatePlayerName] = useState("");
  const [joinPlayerName, setJoinPlayerName] = useState("");
  const [gameId, setGameId] = useState("");
  const [targetScore, setTargetScore] = useState(50);
  const [maxRounds, setMaxRounds] = useState(5);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreateGame = async () => {
    if (!createPlayerName.trim()) {
      showError(t('enterYourName'));
      return;
    }
    setLoading(true);
    try {
      const gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .insert({ 
          game_code: gameCode, 
          status: 'lobby',
          target_score: targetScore,
          max_rounds: maxRounds
        })
        .select()
        .single();

      if (gameError || !gameData) throw gameError;

      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .insert({ game_id: gameData.id, name: createPlayerName })
        .select()
        .single();

      if (playerError || !playerData) throw playerError;

      const { error: updateError } = await supabase
        .from("games")
        .update({ host_player_id: playerData.id })
        .eq("id", gameData.id);

      if (updateError) throw updateError;

      localStorage.setItem("playerId", playerData.id);
      localStorage.setItem("gameId", gameData.id);

      navigate(`/lobby/${gameCode}`);
    } catch (error: any) {
      console.error("Error creating game:", error);
      showError(error.message || t('failedToCreateGame'));
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async () => {
    if (!joinPlayerName.trim() || !gameId.trim()) {
      showError(t('enterYourName') + " " + t('gameId'));
      return;
    }
    setLoading(true);
    try {
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select("id, status")
        .eq("game_code", gameId.trim().toUpperCase())
        .single();

      if (gameError || !gameData) throw new Error("Game not found.");
      if (gameData.status !== "lobby") throw new Error("Game has already started.");

      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .insert({ game_id: gameData.id, name: joinPlayerName })
        .select()
        .single();

      if (playerError || !playerData) throw playerError;

      localStorage.setItem("playerId", playerData.id);
      localStorage.setItem("gameId", gameData.id);

      navigate(`/lobby/${gameId.trim().toUpperCase()}`);
    } catch (error: any) {
      console.error("Error joining game:", error);
      showError(error.message || t('failedToJoinGame'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold tracking-tighter mb-2">{t('gameTitle')}</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          {t('gameSubtitle')}
        </p>
      </div>

      <Tabs defaultValue="create" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">{t('createGame')}</TabsTrigger>
          <TabsTrigger value="join">{t('joinGame')}</TabsTrigger>
        </TabsList>
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>{t('createGameTitle')}</CardTitle>
              <CardDescription>
                {t('createGameDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">{t('yourName')}</Label>
                <Input
                  id="create-name"
                  placeholder={t('enterYourName')}
                  value={createPlayerName}
                  onChange={(e) => setCreatePlayerName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="target-score">{t('targetScore')}</Label>
                <Input
                  id="target-score"
                  type="number"
                  min="10"
                  max="200"
                  value={targetScore}
                  onChange={(e) => setTargetScore(parseInt(e.target.value) || 50)}
                />
                <p className="text-sm text-gray-500">{t('targetScoreDescription')}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max-rounds">{t('maxRounds')}</Label>
                <Input
                  id="max-rounds"
                  type="number"
                  min="1"
                  max="20"
                  value={maxRounds}
                  onChange={(e) => setMaxRounds(parseInt(e.target.value) || 5)}
                />
                <p className="text-sm text-gray-500">{t('maxRoundsDescription')}</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleCreateGame} disabled={!createPlayerName || loading}>
                {loading ? t('creating') : t('createGameButton')}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="join">
          <Card>
            <CardHeader>
              <CardTitle>{t('joinGameTitle')}</CardTitle>
              <CardDescription>
                {t('joinGameDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="join-name">{t('yourName')}</Label>
                <Input
                  id="join-name"
                  placeholder={t('enterYourName')}
                  value={joinPlayerName}
                  onChange={(e) => setJoinPlayerName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="game-id">{t('gameId')}</Label>
                <Input
                  id="game-id"
                  placeholder={t('enterGameId')}
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value.toUpperCase())}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleJoinGame} disabled={!joinPlayerName || !gameId || loading}>
                {loading ? t('joining') : t('joinGameButton')}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;