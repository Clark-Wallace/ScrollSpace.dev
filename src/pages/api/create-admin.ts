import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const adminEmail = 'admin@scrollspace.dev';
    const adminPassword = 'scrollspace2025';
    const adminUsername = 'admin';

    // First, try to sign up the admin user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        data: {
          username: adminUsername,
          display_name: 'Administrator'
        }
      }
    });

    if (signUpError && !signUpError.message.includes('already registered')) {
      return new Response(JSON.stringify({ 
        error: 'Failed to create admin user', 
        details: signUpError.message 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the user ID (either from sign up or existing user)
    let userId = signUpData?.user?.id;
    
    if (!userId) {
      // If signup failed because user exists, try to get the user
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword
      });
      
      if (signInError) {
        return new Response(JSON.stringify({ 
          error: 'Failed to authenticate admin', 
          details: signInError.message 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      userId = signInData?.user?.id;
    }

    if (!userId) {
      return new Response(JSON.stringify({ 
        error: 'Could not get user ID' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingProfile) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Admin account and profile already exist',
        profile: existingProfile
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        username: adminUsername,
        display_name: 'Administrator',
        total_fragments: 0,
        rare_fragments: 0,
        is_online: false
      })
      .select()
      .single();

    if (profileError) {
      return new Response(JSON.stringify({ 
        error: 'Failed to create user profile', 
        details: profileError.message 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Admin account created successfully',
      user_id: userId,
      profile: profileData
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating admin:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};