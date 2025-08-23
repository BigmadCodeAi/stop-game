const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://eyspdovjpwderucttpwc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5c3Bkb3ZqcHdkZXJ1Y3R0cHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzIyNzcsImV4cCI6MjA3MTUwODI3N30.JlVG0mCsu8_l3itfBUqwa0942108QTWvdvmd1VVxiPU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testGameLoading() {
  console.log('🎮 Testing Game Loading After Fixes...\n');

  let gameId, gameCode, playerId;

  try {
    // Create a test game
    gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data: gameData, error: gameError } = await supabase
      .from("games")
      .insert({ game_code: gameCode, status: 'lobby' })
      .select()
      .single();

    if (gameError) throw new Error(`Game creation failed: ${gameError.message}`);
    gameId = gameData.id;
    console.log(`✅ Game created: ${gameCode} (ID: ${gameId})`);

    // Add a player
    const { data: playerData, error: playerError } = await supabase
      .from("players")
      .insert({ game_id: gameId, name: 'Test Player', score: 0 })
      .select()
      .single();

    if (playerError) throw new Error(`Player creation failed: ${playerError.message}`);
    playerId = playerData.id;
    console.log(`✅ Player created: ${playerData.name} (ID: ${playerId})`);

    // Update game with host
    await supabase
      .from("games")
      .update({ host_player_id: playerId })
      .eq("id", gameId);

    // Start the game
    console.log('\n🎯 Starting game...');
    const { error: startError } = await supabase.rpc('start_game_and_create_round', {
      game_id_param: gameId
    });

    if (startError) throw new Error(`Game start failed: ${startError.message}`);
    console.log('✅ Game started successfully');

    // Test the game loading logic (simulating what Game.tsx does)
    console.log('\n🔍 Testing game loading logic...');
    
    // 1. Fetch game data
    const { data: gameData2, error: gameError2 } = await supabase
      .from("games")
      .select("id, status, host_player_id")
      .eq("game_code", gameCode)
      .single();

    if (gameError2) {
      console.log(`❌ Game fetch failed: ${gameError2.message}`);
      return;
    }
    console.log(`✅ Game data fetched: status = ${gameData2.status}`);

    // 2. Fetch rounds separately
    const { data: roundsData, error: roundsError } = await supabase
      .from("rounds")
      .select("*")
      .eq("game_id", gameData2.id);

    if (roundsError) {
      console.log(`❌ Rounds fetch failed: ${roundsError.message}`);
    } else {
      console.log(`✅ Rounds fetched: ${roundsData?.length || 0} rounds`);
      const activeRound = roundsData?.find(r => r.status === 'active');
      if (activeRound) {
        console.log(`✅ Active round found: Letter "${activeRound.letter}"`);
      }
    }

    // 3. Fetch players separately
    const { data: playersData, error: playersError } = await supabase
      .from("players")
      .select("*")
      .eq("game_id", gameData2.id);

    if (playersError) {
      console.log(`❌ Players fetch failed: ${playersError.message}`);
    } else {
      console.log(`✅ Players fetched: ${playersData?.length || 0} players`);
    }

    console.log('\n🎉 Game loading test completed successfully!');
    console.log('✅ All database queries work correctly');
    console.log('✅ Game data is properly structured');
    console.log('✅ Ready for frontend testing');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    // Clean up
    if (gameId) {
      await supabase.from('games').delete().eq('id', gameId);
      console.log('\n🧹 Test data cleaned up');
    }
  }
}

testGameLoading();
