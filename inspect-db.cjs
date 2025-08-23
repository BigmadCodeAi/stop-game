const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://eyspdovjpwderucttpwc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5c3Bkb3ZqcHdkZXJ1Y3R0cHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzIyNzcsImV4cCI6MjA3MTUwODI3N30.JlVG0mCsu8_l3itfBUqwa0942108QTWvdvmd1VVxiPU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectDatabase() {
  console.log('🔍 Inspecting Supabase Database Structure...\n');

  try {
    // Check if tables exist
    console.log('📋 Checking existing tables...');
    
    // Test each table that the app references
    const tables = ['games', 'players', 'rounds', 'answers', 'votes'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table '${table}': ${error.message}`);
        } else {
          console.log(`✅ Table '${table}': EXISTS`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}': ${err.message}`);
      }
    }

    console.log('\n🔧 Checking existing functions...');
    
    // Test the functions that the app references
    const functions = [
      'start_game_and_create_round',
      'submit_answers_and_end_round', 
      'calculate_scores_and_start_next_round'
    ];
    
    for (const func of functions) {
      try {
        // Try to call the function with dummy parameters
        const { data, error } = await supabase.rpc(func, {
          game_id_param: 'test',
          round_id_param: 'test',
          player_id_param: 'test',
          answers_param: {}
        });
        
        if (error) {
          if (error.message.includes('function') && error.message.includes('does not exist')) {
            console.log(`❌ Function '${func}': NOT FOUND`);
          } else {
            console.log(`⚠️  Function '${func}': EXISTS (but may have parameter issues)`);
          }
        } else {
          console.log(`✅ Function '${func}': EXISTS`);
        }
      } catch (err) {
        if (err.message.includes('function') && err.message.includes('does not exist')) {
          console.log(`❌ Function '${func}': NOT FOUND`);
        } else {
          console.log(`⚠️  Function '${func}': EXISTS (but may have parameter issues)`);
        }
      }
    }

    console.log('\n📊 Checking sample data...');
    
    // Try to get some sample data from existing tables
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('*')
      .limit(3);
    
    if (gamesError) {
      console.log(`❌ Could not fetch games: ${gamesError.message}`);
    } else {
      console.log(`✅ Found ${games?.length || 0} games`);
      if (games && games.length > 0) {
        console.log('Sample game:', JSON.stringify(games[0], null, 2));
      }
    }

    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*')
      .limit(3);
    
    if (playersError) {
      console.log(`❌ Could not fetch players: ${playersError.message}`);
    } else {
      console.log(`✅ Found ${players?.length || 0} players`);
      if (players && players.length > 0) {
        console.log('Sample player:', JSON.stringify(players[0], null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Error inspecting database:', error);
  }
}

inspectDatabase();
