import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminAccount() {
  const adminEmail = 'admin@scrollspace.dev';
  const adminPassword = 'scrollspace2025';
  const adminUsername = 'admin';

  try {
    console.log('Creating admin account...');
    
    // Check if admin account already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const adminExists = existingUser?.users?.find(user => user.email === adminEmail);
    
    if (adminExists) {
      console.log('Admin account already exists:', adminEmail);
      return;
    }

    // Create admin user
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        username: adminUsername,
        display_name: 'Administrator'
      }
    });

    if (error) {
      console.error('Error creating admin account:', error);
      return;
    }

    console.log('Admin account created successfully:', data.user.email);

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: data.user.id,
        username: adminUsername,
        display_name: 'Administrator',
        total_fragments: 0,
        rare_fragments: 0,
        is_online: false
      });

    if (profileError) {
      console.error('Error creating user profile:', profileError);
    } else {
      console.log('User profile created successfully');
    }

  } catch (error) {
    console.error('Failed to create admin account:', error);
  }
}

createAdminAccount();