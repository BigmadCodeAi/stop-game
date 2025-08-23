const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://eyspdovjpwderucttpwc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5c3Bkb3ZqcHdkZXJ1Y3R0cHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzIyNzcsImV4cCI6MjA3MTUwODI3N30.JlVG0mCsu8_l3itfBUqwa0942108QTWvdvmd1VVxiPU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugLobbyIssues() {
  console.log('🔍 Debugging Lobby Issues...\n');

  let gameId, hostPlayerId, guestPlayerId, gameCode;

  try {
    // Create a test game
    console.log('1️⃣ Creating test game...');
    gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const { data: gameData, error: gameError } = await supabase
      .from("games")
      .insert({ game_code: gameCode, status: 'lobby' })
      .select()
      .single();

    if (gameError) throw new Error(`Game creation failed: ${gameError.message}`);
    gameId = gameData.id;
    console.log(`✅ Game created: ${gameCode} (ID: ${gameId})`);

    // Add host player
    console.log('\n2️⃣ Adding host player...');
    const { data: hostData, error: hostError } = await supabase
      .from("players")
      .insert({ game_id: gameId, name: 'Host Player', score: 0 })
      .select()
      .single();

    if (hostError) throw new Error(`Host creation failed: ${hostError.message}`);
    hostPlayerId = hostData.id;
    console.log(`✅ Host added: ${hostData.name} (ID: ${hostPlayerId})`);

    // Update game with host
    await supabase
      .from("games")
      .update({ host_player_id: hostPlayerId })
      .eq("id", gameId);

    // Add guest player
    console.log('\n3️⃣ Adding guest player...');
    const { data: guestData, error: guestError } = await supabase
      .from("players")
      .insert({ game_id: gameId, name: 'Guest Player', score: 0 })
      .select()
      .single();

    if (guestError) throw new Error(`Guest creation failed: ${guestError.message}`);
    guestPlayerId = guestData.id;
    console.log(`✅ Guest added: ${guestData.name} (ID: ${guestPlayerId})`);

    // Test real-time subscriptions
    console.log('\n4️⃣ Testing real-time subscriptions...');
    
    let playerUpdateReceived = false;
    let gameUpdateReceived = false;

    // Subscribe to player changes
    const playerChannel = supabase
      .channel(`debug-players-${gameId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `game_id=eq.${gameId}` },
        (payload) => {
          console.log('📡 Player change received:', payload);
          playerUpdateReceived = true;
        }
      )
      .subscribe();

    // Subscribe to game changes
    const gameChannel = supabase
      .channel(`debug-game-${gameId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${gameId}` },
        (payload) => {
          console.log('📡 Game change received:', payload);
          gameUpdateReceived = true;
        }
      )
      .subscribe();

    // Wait a moment for subscriptions to establish
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test player update
    console.log('\n5️⃣ Testing player update...');
    const { error: updateError } = await supabase
      .from("players")
      .update({ name: 'Updated Host Player' })
      .eq("id", hostPlayerId);

    if (updateError) {
      console.log(`❌ Player update failed: ${updateError.message}`);
    } else {
      console.log('✅ Player update sent');
    }

    // Wait for real-time update
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (playerUpdateReceived) {
      console.log('✅ Real-time player update received');
    } else {
      console.log('❌ Real-time player update NOT received');
    }

    // Test game start function
    console.log('\n6️⃣ Testing game start function...');
    console.log('Starting game...');
    
    const startTime = Date.now();
    const { data: startResult, error: startError } = await supabase.rpc('start_game_and_create_round', {
      game_id_param: gameId
    });
    const endTime = Date.now();

    console.log(`Game start took ${endTime - startTime}ms`);
    
    if (startError) {
      console.log(`❌ Game start failed: ${startError.message}`);
    } else {
      console.log('✅ Game start successful');
      console.log('Result:', startResult);
    }

    // Wait for game status update
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (gameUpdateReceived) {
      console.log('✅ Real-time game update received');
    } else {
      console.log('❌ Real-time game update NOT received');
    }

    // Check final game status
    const { data: finalGame, error: finalGameError } = await supabase
      .from("games")
      .select("status")
      .eq("id", gameId)
      .single();

    if (finalGameError) {
      console.log(`❌ Final game status check failed: ${finalGameError.message}`);
    } else {
      console.log(`🎮 Final game status: ${finalGame.status}`);
    }

    // Clean up subscriptions
    supabase.removeChannel(playerChannel);
    supabase.removeChannel(gameChannel);

  } catch (error) {
    console.error('\n❌ Debug failed:', error.message);
  } finally {
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    if (gameId) {
      await supabase.from('games').delete().eq('id', gameId);
      console.log('✅ Test data cleaned up');
    }
  }
}

debugLobbyIssues();
