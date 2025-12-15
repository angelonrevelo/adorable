
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Load env vars manually since we're running a standalone script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFunction() {
  console.log('Invoking generate-vibe function...');
  const { data, error } = await supabase.functions.invoke('generate-vibe', {
    body: {
      prompt: 'test prompt',
      history: [],
      type: 'random' // Use 'random' type as it might be simpler/faster
    }
  });

  if (error) {
    console.error('Function invocation failed:', error);
  } else {
    console.log('Function invocation successful!');
    console.log('Response:', data);
  }
}

testFunction();
