import type { APIRoute } from 'astro';
import { chatAPI } from '../../lib/supabase';

export const GET: APIRoute = async () => {
  try {
    // Try to fetch active fragments to test if tables exist
    const fragments = await chatAPI.getActiveFragments();
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Signal Fragments system operational',
      fragmentCount: fragments.length 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Tables not found or connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};