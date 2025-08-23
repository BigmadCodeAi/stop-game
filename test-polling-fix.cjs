const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://eyspdovjpwderucttpwc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5c3Bkb3ZqcHdkZXJ1Y3R0cHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzIyNzcsImV4cCI6MjA3MTUwODI3N30.JlVG0mCsu8_l3itfBUqwa0942108QTWvdvmd1VVxiPU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testPollingFix() {
  console.log('🔧 Testing Polling Fix for Lobby Issues...\n');

  let gameId, gameCode;

  try {
    // Create test game
    gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data: gameData, error: gameError } = await supabase
      .from("games")
      .insert({ game_code: gameCode, status: 'lobby' })
      .select()
      .single();

    if (gameError) throw new Error(`Game creation failed: ${gameError.message}`);
    gameId = gameData.id;
    console.log(`✅ Game created: ${gameCode}`);

    // Add host
    const { data: hostData } = await supabase
      .from("players")
      .insert({ game_id: gameId, name: 'Host Player', score: 0 })
      .select()
      .single();

    await supabase
      .from("games")
      .update({ host_player_id: hostData.id })
      .eq("id", gameId);

    console.log('✅ Host added');

    // Simulate polling approach
    console.log('\n🔄 Testing polling approach...');
    
    let playerCount = 0;
    let gameStatus = 'lobby';
    
    // Simulate the polling logic
    const pollGame = async () => {
      const { data: gameStatusData } = await supabase
        .from("games")
        .select("status")
        .eq("id", gameId)
        .single();
      
      const { data: playersData } = await supabase
        .from("players")
        .select("id, name")
        .eq("game_id", gameId);
      
      gameStatus = gameStatusData?.status || 'unknown';
      playerCount = playersData?.length || 0;
      
      console.log(`📊 Poll result: ${playerCount} players, status: ${gameStatus}`);
      
      return { gameStatus, playerCount };
    };

    // Initial poll
    await pollGame();

    // Add guest player
    console.log('\n👤 Adding guest player...');
    await supabase
      .from("players")
      .insert({ game_id: gameId, name: 'Guest Player', score: 0 });

    // Poll again after 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));
    await pollGame();

    // Start game
    console.log('\n🎮 Starting game...');
    const { error: startError } = await supabase.rpc('start_game_and_create_round', {
      game_id_param: gameId
    });

    if (startError) {
      console.log(`❌ Game start failed: ${startError.message}`);
    } else {
      console.log('✅ Game start function completed');
    }

    // Poll again after 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));
    await pollGame();

    // Final verification
    console.log('\n🎯 Final verification:');
    if (playerCount >= 2 && gameStatus === 'in_progress') {
      console.log('✅ Polling fix is working correctly!');
      console.log('✅ Players are being detected');
      console.log('✅ Game status changes are being detected');
    } else {
      console.log('❌ Polling fix has issues');
      console.log(`Expected: 2+ players, in_progress status`);
      console.log(`Actual: ${playerCount} players, ${gameStatus} status`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Clean up
    if (gameId) {
      await supabase.from('games').delete().eq('id', gameId);
      console.log('\n🧹 Test data cleaned up');
    }
  }
}

testPollingFix();
