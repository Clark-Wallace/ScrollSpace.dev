import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const POST: APIRoute = async () => {
  try {
    // Create the simple_chat_messages table
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create simple chat messages table
        CREATE TABLE IF NOT EXISTS simple_chat_messages (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          username TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT DEFAULT 'message' CHECK (type IN ('message', 'join', 'leave', 'system')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create index for performance
        CREATE INDEX IF NOT EXISTS idx_simple_chat_messages_created_at 
        ON simple_chat_messages(created_at DESC);

        -- Enable RLS (Row Level Security) but allow all operations for simplicity
        ALTER TABLE simple_chat_messages ENABLE ROW LEVEL SECURITY;
      `
    });

    if (tableError) {
      // Try alternative approach - direct table creation
      const { error: directError } = await supabase
        .from('simple_chat_messages')
        .select('id')
        .limit(1);

      if (directError && directError.code === '42P01') {
        // Table doesn't exist, let's try to create it via insert (this will fail but show us the issue)
        const { error: insertError } = await supabase
          .from('simple_chat_messages')
          .insert({
            username: 'System',
            message: 'Test message',
            type: 'system'
          });

        return new Response(JSON.stringify({
          error: 'Table does not exist and cannot be created automatically',
          details: insertError?.message,
          instructions: 'Please create the table manually in Supabase SQL editor using the provided SQL script'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Test insert to verify everything works
    const { data, error: insertError } = await supabase
      .from('simple_chat_messages')
      .insert({
        username: 'System',
        message: 'Simple chat system initialized',
        type: 'system'
      })
      .select()
      .single();

    if (insertError) {
      return new Response(JSON.stringify({
        error: 'Failed to test table functionality',
        details: insertError.message
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Simple chat system setup complete',
      test_message: data
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