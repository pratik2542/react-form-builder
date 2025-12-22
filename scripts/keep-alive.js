const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL and Key are required.');
  console.error('Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function keepAlive() {
  console.log('Starting Supabase keep-alive check...');
  
  try {
    // Perform a lightweight query to keep the project active
    // We use 'head: true' to only fetch the count, not the data
    const { count, error } = await supabase
      .from('forms')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw error;
    }

    console.log(`Successfully pinged Supabase. Form count: ${count}`);
    console.log('Keep-alive check completed successfully.');
  } catch (error) {
    console.error('Error pinging Supabase:', error.message);
    process.exit(1);
  }
}

keepAlive();
