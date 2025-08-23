-- Add game completion fields to games table
ALTER TABLE games 
ADD COLUMN target_score INTEGER DEFAULT 50,
ADD COLUMN max_rounds INTEGER DEFAULT 5,
ADD COLUMN current_round INTEGER DEFAULT 0;

-- Update existing games to have default values
UPDATE games 
SET target_score = 50, max_rounds = 5, current_round = 0 
WHERE target_score IS NULL;

-- Create function to check if game should end
CREATE OR REPLACE FUNCTION check_game_completion(game_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    game_record RECORD;
    max_player_score INTEGER;
    current_round_count INTEGER;
BEGIN
    -- Get game details
    SELECT g.target_score, g.max_rounds, g.current_round
    INTO game_record
    FROM games g
    WHERE g.id = game_id_param;
    
    -- Get highest player score
    SELECT COALESCE(MAX(p.score), 0)
    INTO max_player_score
    FROM players p
    WHERE p.game_id = game_id_param;
    
    -- Get current round count
    SELECT COALESCE(COUNT(*), 0)
    INTO current_round_count
    FROM rounds r
    WHERE r.game_id = game_id_param;
    
    -- Check if game should end
    RETURN (max_player_score >= game_record.target_score) OR (current_round_count >= game_record.max_rounds);
END;
$$ LANGUAGE plpgsql;

-- Update the calculate_scores_and_start_next_round function to check for game completion
CREATE OR REPLACE FUNCTION calculate_scores_and_start_next_round(game_id_param UUID, round_id_param UUID)
RETURNS VOID AS $$
DECLARE
    should_end_game BOOLEAN;
    game_status TEXT;
BEGIN
    -- Calculate scores (existing logic)
    -- ... (keep existing score calculation logic)
    
    -- Update current round count
    UPDATE games 
    SET current_round = current_round + 1
    WHERE id = game_id_param;
    
    -- Check if game should end
    should_end_game := check_game_completion(game_id_param);
    
    IF should_end_game THEN
        -- End the game
        UPDATE games 
        SET status = 'completed'
        WHERE id = game_id_param;
    ELSE
        -- Start next round
        PERFORM start_game_and_create_round(game_id_param);
    END IF;
END;
$$ LANGUAGE plpgsql;
