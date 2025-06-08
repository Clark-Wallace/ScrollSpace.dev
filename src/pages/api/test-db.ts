import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const GET: APIRoute = async () => {
  const results = {
    read_test: null,
    insert_test: null,
    auth_test: null,
    errors: {}
  };

  try {
    // Test 1: Can we read from user_profiles?
    const { data: readData, error: readError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (readError) {
      results.errors['read'] = readError.message;
    } else {
      results.read_test = 'SUCCESS - Can read from user_profiles';
    }

    // Test 2: Try to insert a test profile
    const testUserId = 'test-' + Date.now();
    const { data: insertData, error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: testUserId,
        username: 'test_user_' + Date.now(),
        display_name: 'Test User',
        total_fragments: 0,
        rare_fragments: 0,
        is_online: false
      })
      .select()
      .single();

    if (insertError) {
      results.errors['insert'] = insertError.message;
      results.insert_test = 'FAILED - Cannot insert';
    } else {
      results.insert_test = 'SUCCESS - Can insert';
      
      // Clean up test data
      await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', testUserId);
    }

    // Test 3: Check auth status
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      results.errors['auth'] = authError.message;
      results.auth_test = 'No authenticated user';
    } else if (user) {
      results.auth_test = `Authenticated as: ${user.email}`;
    } else {
      results.auth_test = 'Not authenticated';
    }

  } catch (error) {
    results.errors['general'] = error.message;
  }

  return new Response(JSON.stringify(results, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};