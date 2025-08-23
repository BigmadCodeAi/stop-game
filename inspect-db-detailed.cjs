const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://eyspdovjpwderucttpwc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5c3Bkb3ZqcHdkZXJ1Y3R0cHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzIyNzcsImV4cCI6MjA3MTUwODI3N30.JlVG0mCsu8_l3itfBUqwa0942108QTWvdvmd1VVxiPU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectDatabaseDetailed() {
  console.log('🔍 Detailed Supabase Database Inspection...\n');

  try {
    // Test creating a sample game to see the table structure
    console.log('🧪 Testing table structures with sample data...\n');
    
    // Create a test game
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .insert({ 
        game_code: 'TEST123', 
        status: 'lobby',
        host_player_id: null 
      })
      .select()
      .single();
    
    if (gameError) {
      console.log(`❌ Error creating test game: ${gameError.message}`);
    } else {
      console.log('✅ Test game created successfully');
      console.log('Game structure:', JSON.stringify(gameData, null, 2));
      
      // Create a test player
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .insert({ 
          game_id: gameData.id, 
          name: 'Test Player',
          score: 0
        })
        .select()
        .single();
      
      if (playerError) {
        console.log(`❌ Error creating test player: ${playerError.message}`);
      } else {
        console.log('✅ Test player created successfully');
        console.log('Player structure:', JSON.stringify(playerData, null, 2));
        
        // Update game with host player
        await supabase
          .from('games')
          .update({ host_player_id: playerData.id })
          .eq('id', gameData.id);
        
        // Test the start_game_and_create_round function
        console.log('\n🔧 Testing start_game_and_create_round function...');
        const { data: startResult, error: startError } = await supabase.rpc('start_game_and_create_round', {
          game_id_param: gameData.id
        });
        
        if (startError) {
          console.log(`❌ start_game_and_create_round error: ${startError.message}`);
        } else {
          console.log('✅ start_game_and_create_round executed successfully');
          console.log('Result:', JSON.stringify(startResult, null, 2));
          
          // Check if round was created
          const { data: rounds, error: roundsError } = await supabase
            .from('rounds')
            .select('*')
            .eq('game_id', gameData.id);
          
          if (roundsError) {
            console.log(`❌ Error fetching rounds: ${roundsError.message}`);
          } else {
            console.log(`✅ Found ${rounds?.length || 0} rounds`);
            if (rounds && rounds.length > 0) {
              console.log('Round structure:', JSON.stringify(rounds[0], null, 2));
              
              // Test submit_answers_and_end_round function
              console.log('\n🔧 Testing submit_answers_and_end_round function...');
              const { data: submitResult, error: submitError } = await supabase.rpc('submit_answers_and_end_round', {
                round_id_param: rounds[0].id,
                player_id_param: playerData.id,
                answers_param: { 'Name': 'Test', 'Color': 'Blue', 'Country': 'Canada', 'Object': 'Book', 'Actor': 'Tom' }
              });
              
              if (submitError) {
                console.log(`❌ submit_answers_and_end_round error: ${submitError.message}`);
              } else {
                console.log('✅ submit_answers_and_end_round executed successfully');
                console.log('Result:', JSON.stringify(submitResult, null, 2));
                
                // Test calculate_scores_and_start_next_round function
                console.log('\n🔧 Testing calculate_scores_and_start_next_round function...');
                const { data: calcResult, error: calcError } = await supabase.rpc('calculate_scores_and_start_next_round', {
                  game_id_param: gameData.id,
                  round_id_param: rounds[0].id
                });
                
                if (calcError) {
                  console.log(`❌ calculate_scores_and_start_next_round error: ${calcError.message}`);
                } else {
                  console.log('✅ calculate_scores_and_start_next_round executed successfully');
                  console.log('Result:', JSON.stringify(calcResult, null, 2));
                }
              }
            }
          }
        }
      }
      
      // Clean up test data
      console.log('\n🧹 Cleaning up test data...');
      await supabase.from('games').delete().eq('id', gameData.id);
      console.log('✅ Test data cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Error during detailed inspection:', error);
  }
}

inspectDatabaseDetailed();
