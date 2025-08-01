import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const POST: APIRoute = async () => {
  try {
    // Create the user_profiles table (drop and recreate to fix RLS issues)
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop existing table and policies to start fresh
        DROP TABLE IF EXISTS user_profiles CASCADE;
        
        -- Create user profiles table
        CREATE TABLE user_profiles (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
          username TEXT UNIQUE NOT NULL,
          display_name TEXT,
          avatar_url TEXT,
          bio TEXT,
          total_fragments INTEGER DEFAULT 0,
          rare_fragments INTEGER DEFAULT 0,
          joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          is_online BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
        CREATE INDEX IF NOT EXISTS idx_user_profiles_is_online ON user_profiles(is_online);

        -- Disable RLS for simplicity (like our chat table)
        ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
        
        -- Grant permissions to anonymous and authenticated users
        GRANT ALL ON user_profiles TO authenticated, anon;
        
        -- Enable realtime for this table
        ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;
      `
    });

    if (tableError) {
      // Try alternative approach - direct table creation
      const { error: directError } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);

      if (directError && directError.code === '42P01') {
        return new Response(JSON.stringify({
          error: 'Table does not exist and cannot be created automatically',
          details: directError.message,
          instructions: 'Please create the table manually in Supabase SQL editor using the provided SQL script'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'User profiles table setup complete'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Setup failed',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};