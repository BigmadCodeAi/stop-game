import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Player, Round } from "./Game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface VotingProps {
  round: Round;
  players: Player[];
}

type PlayerAnswer = {
  player_id: string;
  answers: { [key: string]: string };
};

type AnswersByCategory = {
  [category: string]: {
    playerName: string;
    playerAvatar: string;
    answer: string;
  }[];
};

const Voting = ({ round, players }: VotingProps) => {
  const [allAnswers, setAllAnswers] = useState<PlayerAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnswers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("answers")
        .select("player_id, answers")
        .eq("round_id", round.id);

      if (error) {
        console.error("Error fetching answers:", error);
      } else {
        setAllAnswers(data || []);
      }
      setLoading(false);
    };

    fetchAnswers();
  }, [round.id]);

  const answersByCategory = round.categories.reduce((acc, category) => {
    acc[category] = allAnswers.map((playerAnswer) => {
      const player = players.find((p) => p.id === playerAnswer.player_id);
      return {
        playerName: player?.name || "Unknown",
        playerAvatar: `https://api.dicebear.com/8.x/bottts/svg?seed=${player?.name}`,
        answer: playerAnswer.answers?.[category] || "-",
      };
    });
    return acc;
  }, {} as AnswersByCategory);

  if (loading) {
    return <Skeleton className="w-full h-96" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-3xl">Voting Time!</CardTitle>
        <p className="text-center text-gray-500">Review the answers for the letter "{round.letter}"</p>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full" defaultValue={round.categories[0]}>
          {round.categories.map((category) => (
            <AccordionItem value={category} key={category}>
              <AccordionTrigger className="text-xl">{category}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {answersByCategory[category]?.map(({ playerName, playerAvatar, answer }, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={playerAvatar} />
                          <AvatarFallback>{playerName.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{playerName}</span>
                      </div>
                      <span className="text-lg font-semibold">{answer}</span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default Voting;