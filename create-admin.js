// create-admin-user.js  (run on server, or in Supabase Edge Function / script)
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL; // https://ogvjqhikkhnjbzgeewmx.supabase.co
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // service_role key, keep secret

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createAdmin() {
  try {
    // 1) Create auth user with password (service role key required)
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email: 'rfidadmin@gmail.com',
      password: 'test123',
      email_confirm: true,     // optionally mark as confirmed
      user_metadata: { role: 'admin', full_name: 'RFID System Admin' }
    });

    if (createError) {
      console.error('Error creating auth user:', createError);
      return;
    }
    console.log('Auth user created:', userData);

    // 2) Optionally upsert the users table row with auth_id
    const authId = userData.id; // uuid
    const { data: upsert, error: upsertErr } = await supabase
      .from('users')
      .upsert({
        auth_id: authId,
        email: 'rfidadmin@gmail.com',
        full_name: 'RFID System Admin',
        role: 'admin'
      }, { onConflict: 'email' });

    if (upsertErr) console.error('Upsert error:', upsertErr);
    else console.log('Users table upserted:', upsert);

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

createAdmin();
