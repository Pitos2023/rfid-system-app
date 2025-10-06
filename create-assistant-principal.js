// create-assistant-principal.js  (run on server, or Supabase Edge Function / script)
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL=process.env.SUPABASE_URL; // https://ogvjqhikkhnjbzgeewmx.supabase.co
const SUPABASE_SERVICE_ROLE_KEY=process.env.SUPABASE_SERVICE_ROLE_KEY; 

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createAssistantPrincipal() {
  try {
    // 1) Create auth user for assistant principal
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email: 'rfidassistantprincipal@gmail.com',
      password: 'assistant123',
      email_confirm: true,
      user_metadata: { 
        role: 'assistant_principal', 
        full_name: 'RFID Assistant Principal' 
      }
    });

    if (createError) {
      console.error('❌ Error creating auth user:', createError);
      return;
    }

    console.log('✅ Auth user created:', userData.user.email);

    // 2) Upsert record into users table
    const authId = userData.user.id;

    const { error: upsertError } = await supabase
      .from('users')
      .upsert({
        email: 'rfidassistantprincipal@gmail.com',
        full_name: 'RFID Assistant Principal',
        password: 'assistant123',  // optional, for reference
        role: 'assistant_principal'
      }, { onConflict: 'email' });

    if (upsertError) console.error('❌ Error upserting user record:', upsertError);
    else console.log('✅ Assistant Principal added/updated in users table');

  } catch (err) {
    console.error('🚨 Unexpected error:', err);
  }
}

createAssistantPrincipal();
