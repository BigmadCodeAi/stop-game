import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Player, Round } from "./Game";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { showError } from "@/utils/toast";
import { useI18n } from "@/contexts/I18nContext";
import { useCategoryTranslator } from "@/utils/category-translator";

interface VotingProps {
  round: Round;
  players: Player[];
  hostPlayerId: string | null;
}

type PlayerAnswer = {
  player_id: string;
  answers: { [key: string]: string };
};

type Vote = {
  round_id: string;
  category: string;
  subject_player_id: string;
  voter_player_id: string;
  is_valid: boolean;
};

const Voting = ({ round, players, hostPlayerId }: VotingProps) => {
  const { t } = useI18n();
  const { translateCategory } = useCategoryTranslator();
  const [allAnswers, setAllAnswers] = useState<PlayerAnswer[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPlayerId(localStorage.getItem("playerId"));

    const fetchAnswersAndVotes = async () => {
      setLoading(true);
      const answersPromise = supabase.from("answers").select("player_id, answers").eq("round_id", round.id);
      const votesPromise = supabase.from("votes").select("*").eq("round_id", round.id);
      
      const [{ data: answersData, error: answersError }, { data: votesData, error: votesError }] = await Promise.all([answersPromise, votesPromise]);

      if (answersError) console.error("Error fetching answers:", answersError);
      if (votesError) console.error("Error fetching votes:", votesError);
      
      setAllAnswers(answersData || []);
      setVotes(votesData || []);
      setLoading(false);
    };

    fetchAnswersAndVotes();

    const channel = supabase
      .channel(`voting-${round.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `round_id=eq.${round.id}` },
        () => {
          supabase.from("votes").select("*").eq("round_id", round.id).then(({ data }) => setVotes(data || []));
        }
      ).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [round.id]);

  const handleVote = async (category: string, subjectPlayerId: string, isValid: boolean) => {
    if (!currentPlayerId) return;

    const { error } = await supabase.from('votes').upsert({
      round_id: round.id,
      category,
      subject_player_id: subjectPlayerId,
      voter_player_id: currentPlayerId,
      is_valid: isValid,
    });

    if (error) {
      showError(t('failedToSubmitAnswers'));
      console.error(error);
    }
  };

  const handleFinishVoting = async () => {
    if (currentPlayerId !== hostPlayerId) return;
    setIsSubmitting(true);
    const { error } = await supabase.rpc('calculate_scores_and_start_next_round', {
      game_id_param: round.game_id,
      round_id_param: round.id
    });

    if (error) {
      showError(t('failedToCalculateScores'));
      console.error(error);
      setIsSubmitting(false);
    }
    // No need to set submitting to false on success, as the component will unmount.
  };

  const answersByCategory = round.categories.reduce((acc, category) => {
    acc[category] = allAnswers.map((playerAnswer) => {
      const player = players.find((p) => p.id === playerAnswer.player_id);
      return {
        playerId: player?.id || '',
        playerName: player?.name || "Unknown",
        playerAvatar: `https://api.dicebear.com/8.x/bottts/svg?seed=${player?.name}`,
        answer: playerAnswer.answers?.[category] || "-",
      };
    });
    return acc;
  }, {} as { [key: string]: { playerId: string; playerName: string; playerAvatar: string; answer: string }[] });

  if (loading) return <Skeleton className="w-full h-96" />;

  const isHost = currentPlayerId === hostPlayerId;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-3xl">{t('votingTime')}</CardTitle>
        <p className="text-center text-gray-500">{t('reviewAnswers', { letter: round.letter })}</p>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full" defaultValue={round.categories[0]}>
          {round.categories.map((category) => (
            <AccordionItem value={category} key={category}>
              <AccordionTrigger className="text-xl">{translateCategory(category)}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {answersByCategory[category]?.map(({ playerId, playerName, playerAvatar, answer }, index) => {
                    const isOwnAnswer = playerId === currentPlayerId;
                    const myVote = votes.find(v => v.category === category && v.subject_player_id === playerId && v.voter_player_id === currentPlayerId);
                    const upvotes = votes.filter(v => v.category === category && v.subject_player_id === playerId && v.is_valid).length;
                    const downvotes = votes.filter(v => v.category === category && v.subject_player_id === playerId && !v.is_valid).length;

                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <div className="flex items-center gap-3">
                          <Avatar><AvatarImage src={playerAvatar} /><AvatarFallback>{playerName.substring(0, 2)}</AvatarFallback></Avatar>
                          <span className="font-medium">{playerName}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-semibold">{answer}</span>
                          {!isOwnAnswer && (
                            <div className="flex items-center gap-1">
                              <Button size="icon" variant={myVote?.is_valid === true ? 'default' : 'outline'} onClick={() => handleVote(category, playerId, true)} className="h-8 w-8">
                                <ThumbsUp className="h-4 w-4" />
                              </Button>
                              <span className="text-sm w-4 text-center">{upvotes}</span>
                              <Button size="icon" variant={myVote?.is_valid === false ? 'destructive' : 'outline'} onClick={() => handleVote(category, playerId, false)} className="h-8 w-8">
                                <ThumbsDown className="h-4 w-4" />
                              </Button>
                              <span className="text-sm w-4 text-center">{downvotes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
      {isHost && (
        <CardFooter>
            <Button className="w-full" onClick={handleFinishVoting} disabled={isSubmitting}>
              {isSubmitting ? t('calculating') : t('finishVoting')}
            </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default Voting;