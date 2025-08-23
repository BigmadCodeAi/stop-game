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
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [createPlayerName, setCreatePlayerName] = useState("");
  const [joinPlayerName, setJoinPlayerName] = useState("");
  const [gameId, setGameId] = useState("");
  const navigate = useNavigate();

  const handleCreateGame = () => {
    // Placeholder for Supabase logic
    console.log("Creating game for player:", createPlayerName);
    // For now, we'll generate a random ID and navigate to the lobby
    const newGameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    navigate(`/lobby/${newGameId}`);
  };

  const handleJoinGame = () => {
    // Placeholder for Supabase logic
    console.log(`Player ${joinPlayerName} joining game:`, gameId);
    if (gameId.trim()) {
      navigate(`/lobby/${gameId.trim()}`);
    } else {
      // We can show an error toast here later
      console.error("Game ID is required");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold tracking-tighter mb-2">STOP</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          The multiplayer word game for live streamers.
        </p>
      </div>

      <Tabs defaultValue="create" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create Game</TabsTrigger>
          <TabsTrigger value="join">Join Game</TabsTrigger>
        </TabsList>
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create a New Game</CardTitle>
              <CardDescription>
                Enter your name to host a new game lobby.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Your Name</Label>
                <Input
                  id="create-name"
                  placeholder="Enter your name"
                  value={createPlayerName}
                  onChange={(e) => setCreatePlayerName(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleCreateGame} disabled={!createPlayerName}>
                Create Game
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="join">
          <Card>
            <CardHeader>
              <CardTitle>Join an Existing Game</CardTitle>
              <CardDescription>
                Enter your name and the Game ID to join a lobby.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="join-name">Your Name</Label>
                <Input
                  id="join-name"
                  placeholder="Enter your name"
                  value={joinPlayerName}
                  onChange={(e) => setJoinPlayerName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="game-id">Game ID</Label>
                <Input
                  id="game-id"
                  placeholder="Enter Game ID"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value.toUpperCase())}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleJoinGame} disabled={!joinPlayerName || !gameId}>
                Join Game
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;