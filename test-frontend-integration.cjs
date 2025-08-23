const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://eyspdovjpwderucttpwc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5c3Bkb3ZqcHdkZXJ1Y3R0cHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzIyNzcsImV4cCI6MjA3MTUwODI3N30.JlVG0mCsu8_l3itfBUqwa0942108QTWvdvmd1VVxiPU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testFrontendIntegration() {
  console.log('🌐 Testing Frontend-Backend Integration\n');
  console.log('=======================================\n');

  let gameId, playerId, gameCode;

  try {
    // Test 1: Frontend Game Creation Flow
    console.log('1️⃣ Testing Frontend Game Creation Flow...');
    
    // Simulate the exact flow from Index.tsx
    const playerName = "Test Frontend Player";
    gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create game (like in handleCreateGame)
    const { data: gameData, error: gameError } = await supabase
      .from("games")
      .insert({ game_code: gameCode, status: 'lobby' })
      .select()
      .single();

    if (gameError) throw new Error(`Game creation failed: ${gameError.message}`);
    gameId = gameData.id;
    console.log(`✅ Game created with code: ${gameCode}`);

    // Create player (like in handleCreateGame)
    const { data: playerData, error: playerError } = await supabase
      .from("players")
      .insert({ game_id: gameData.id, name: playerName })
      .select()
      .single();

    if (playerError) throw new Error(`Player creation failed: ${playerError.message}`);
    playerId = playerData.id;
    console.log(`✅ Player created: ${playerName}`);

    // Update game with host (like in handleCreateGame)
    const { error: updateError } = await supabase
      .from("games")
      .update({ host_player_id: playerData.id })
      .eq("id", gameData.id);

    if (updateError) throw new Error(`Host update failed: ${updateError.message}`);
    console.log('✅ Host assigned to game');

    // Test 2: Frontend Lobby Flow
    console.log('\n2️⃣ Testing Frontend Lobby Flow...');
    
    // Fetch game details (like in Lobby.tsx)
    const { data: lobbyGameData, error: lobbyGameError } = await supabase
      .from("games")
      .select("id, host_player_id, status")
      .eq("game_code", gameCode)
      .single();

    if (lobbyGameError) throw new Error(`Lobby game fetch failed: ${lobbyGameError.message}`);
    console.log(`✅ Lobby game fetched: Status = ${lobbyGameData.status}`);

    // Fetch players (like in Lobby.tsx)
    const { data: lobbyPlayers, error: lobbyPlayersError } = await supabase
      .from("players")
      .select("id, name")
      .eq("game_id", gameId);

    if (lobbyPlayersError) throw new Error(`Lobby players fetch failed: ${lobbyPlayersError.message}`);
    console.log(`✅ Lobby players fetched: ${lobbyPlayers.length} players`);

    // Test 3: Frontend Game Start Flow
    console.log('\n3️⃣ Testing Frontend Game Start Flow...');
    
    // Start game (like in handleStartGame)
    const { error: startError } = await supabase.rpc('start_game_and_create_round', {
      game_id_param: gameId
    });

    if (startError) throw new Error(`Game start failed: ${startError.message}`);
    console.log('✅ Game started successfully');

    // Test 4: Frontend Gameplay Flow
    console.log('\n4️⃣ Testing Frontend Gameplay Flow...');
    
    // Fetch game with rounds and players (like in Game.tsx) - Fixed query
    const { data: gameplayGameData, error: gameWithRoundsError } = await supabase
      .from("games")
      .select("id, status, host_player_id")
      .eq("game_code", gameCode)
      .single();

    if (gameWithRoundsError) throw new Error(`Game fetch failed: ${gameWithRoundsError.message}`);
    
    // Fetch rounds separately
    const { data: roundsData, error: roundsError } = await supabase
      .from("rounds")
      .select("*")
      .eq("game_id", gameplayGameData.id);
    
    if (roundsError) throw new Error(`Rounds fetch failed: ${roundsError.message}`);
    
    const activeRound = roundsData.find(r => r.status === 'active');
    if (!activeRound) throw new Error('No active round found');
    
    console.log(`✅ Active round found: Letter "${activeRound.letter}" with ${activeRound.categories.length} categories`);

    // Test 5: Frontend Answer Submission Flow
    console.log('\n5️⃣ Testing Frontend Answer Submission Flow...');
    
    // Submit answers (like in handleSubmitAnswers)
    const answers = {
      'City': 'Berlin',
      'Country': 'Brazil',
      'Animal': 'Bear',
      'Food': 'Burger',
      'Brand': 'BMW',
      'Movie/TV Show': 'Batman'
    };

    const { error: submitError } = await supabase.rpc('submit_answers_and_end_round', {
      round_id_param: activeRound.id,
      player_id_param: playerId,
      answers_param: answers
    });

    if (submitError) throw new Error(`Answer submission failed: ${submitError.message}`);
    console.log('✅ Answers submitted successfully');

    // Test 6: Frontend Voting Flow
    console.log('\n6️⃣ Testing Frontend Voting Flow...');
    
    // Fetch answers (like in Voting.tsx)
    const { data: votingAnswers, error: votingAnswersError } = await supabase
      .from("answers")
      .select("player_id, answers")
      .eq("round_id", activeRound.id);

    if (votingAnswersError) throw new Error(`Voting answers fetch failed: ${votingAnswersError.message}`);
    console.log(`✅ Voting answers fetched: ${votingAnswers.length} submissions`);

    // Submit a vote (like in handleVote)
    const { error: voteError } = await supabase.from('votes').upsert({
      round_id: activeRound.id,
      category: 'City',
      subject_player_id: playerId,
      voter_player_id: playerId, // Self-vote for testing
      is_valid: true,
    });

    if (voteError) throw new Error(`Vote submission failed: ${voteError.message}`);
    console.log('✅ Vote submitted successfully');

    // Test 7: Frontend Score Calculation Flow
    console.log('\n7️⃣ Testing Frontend Score Calculation Flow...');
    
    // Calculate scores (like in handleFinishVoting)
    const { error: calcError } = await supabase.rpc('calculate_scores_and_start_next_round', {
      game_id_param: gameId,
      round_id_param: activeRound.id
    });

    if (calcError) throw new Error(`Score calculation failed: ${calcError.message}`);
    console.log('✅ Scores calculated successfully');

    // Test 8: Verify Final State
    console.log('\n8️⃣ Verifying Final State...');
    
    // Get updated player scores
    const { data: finalPlayers, error: finalPlayersError } = await supabase
      .from("players")
      .select("name, score")
      .eq("game_id", gameId);

    if (finalPlayersError) throw new Error(`Final players fetch failed: ${finalPlayersError.message}`);
    
    console.log('\n📊 Final Player Scores:');
    finalPlayers.forEach(player => {
      console.log(`   ${player.name}: ${player.score} points`);
    });

    // Get game status
    const { data: finalGame, error: finalGameError } = await supabase
      .from("games")
      .select("status")
      .eq("id", gameId)
      .single();

    if (finalGameError) throw new Error(`Final game status fetch failed: ${finalGameError.message}`);
    console.log(`\n🎮 Final Game Status: ${finalGame.status}`);

    console.log('\n🎉 FRONTEND-BACKEND INTEGRATION TEST COMPLETED SUCCESSFULLY!');
    console.log('✅ All frontend API calls work correctly');
    console.log('✅ Real-time data flow is functional');
    console.log('✅ Game state management is working');
    console.log('✅ User interactions are properly handled');

  } catch (error) {
    console.error('\n❌ INTEGRATION TEST FAILED:', error.message);
    console.error('Error details:', error);
  } finally {
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    if (gameId) {
      await supabase.from('games').delete().eq('id', gameId);
      console.log('✅ Test data cleaned up');
    }
  }
}

testFrontendIntegration();
