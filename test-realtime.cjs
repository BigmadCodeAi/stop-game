const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://eyspdovjpwderucttpwc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5c3Bkb3ZqcHdkZXJ1Y3R0cHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzIyNzcsImV4cCI6MjA3MTUwODI3N30.JlVG0mCsu8_l3itfBUqwa0942108QTWvdvmd1VVxiPU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testRealtime() {
  console.log('🔍 Testing Supabase Real-time...\n');

  let gameId;

  try {
    // Create a test game
    const { data: gameData, error: gameError } = await supabase
      .from("games")
      .insert({ game_code: 'REALTIME', status: 'lobby' })
      .select()
      .single();

    if (gameError) throw new Error(`Game creation failed: ${gameError.message}`);
    gameId = gameData.id;
    console.log(`✅ Test game created: ${gameId}`);

    // Test real-time subscription
    let messageReceived = false;
    
    const channel = supabase
      .channel('test-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
        (payload) => {
          console.log('📡 Real-time message received:', payload);
          messageReceived = true;
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });

    // Wait for subscription to establish
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Trigger an update
    console.log('🔄 Triggering update...');
    const { error: updateError } = await supabase
      .from('games')
      .update({ status: 'test' })
      .eq('id', gameId);

    if (updateError) {
      console.log(`❌ Update failed: ${updateError.message}`);
    } else {
      console.log('✅ Update sent');
    }

    // Wait for real-time message
    await new Promise(resolve => setTimeout(resolve, 3000));

    if (messageReceived) {
      console.log('✅ Real-time is working!');
    } else {
      console.log('❌ Real-time is NOT working');
    }

    // Clean up
    supabase.removeChannel(channel);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (gameId) {
      await supabase.from('games').delete().eq('id', gameId);
    }
  }
}

testRealtime();
