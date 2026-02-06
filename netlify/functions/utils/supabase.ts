// netlify/functions/utils/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import 'dotenv/config'; // Make sure .env variables are loaded

let supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // <<< IMPORTANT: Use SERVICE_KEY here for backend functions!

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and/or SERVICE_KEY are not defined in environment variables.');
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey);
  return supabaseClient;
};

// If you need a Supabase client for frontend in Vue
// This would be in your frontend src folder, e.g., src/plugins/supabase.ts or src/utils/supabase.ts
// const supabaseKeyFrontend = process.env.SUPABASE_KEY; // This is your public/publishable key
// export const getSupabaseClientFrontend = (): SupabaseClient => {
//   // ... similar logic using supabaseKeyFrontend ...
// };
