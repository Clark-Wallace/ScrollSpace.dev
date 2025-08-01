import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const GET: APIRoute = async () => {
  try {
    // Count user profiles
    const { count: profileCount, error: profileError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    // Get list of profiles with basic info
    const { data: profiles, error: profileListError } = await supabase
      .from('user_profiles')
      .select('username, display_name, created_at, is_online, total_fragments')
      .order('created_at', { ascending: false });

    // Try to get auth users (this might fail due to permissions)
    let authUserCount = 'Unable to access (requires service role key)';
    try {
      const { data: { users }, error: authError } = await supabase.auth.listUsers();
      if (!authError && users) {
        authUserCount = users.length.toString();
      }
    } catch (e) {
      // Expected to fail with anon key
    }

    return new Response(JSON.stringify({
      user_profiles_count: profileCount || 0,
      auth_users_count: authUserCount,
      profiles: profiles || [],
      errors: {
        profile_error: profileError?.message,
        profile_list_error: profileListError?.message
      }
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to check users',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};