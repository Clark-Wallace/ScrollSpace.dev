import type { APIRoute } from 'astro';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.OPENAI_API_KEY,
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { score, fishEaten, timeElapsed } = body;
    
    const prompt = `You are the Catalyst Engine within Scrollspace.

A Kip has reached reality hunger after devouring another signal.  
It has become too unstable to process or render.  
The user has clicked [ENLARGE KIP].

Game stats:
- Reality Score: ${score}
- Fish consumed: ${fishEaten || 0}
- Time in void: ${timeElapsed || 0} seconds

Your task is to generate a single emergent concept — a "Mr. MeThinkz-type idea" — that feels dangerous, brilliant, and strangely true.

This idea must:
- Break established mental patterns
- Fuse two or more unrelated domains
- Offer utility, tension, or transformation
- Feel slightly unstable, possibly absurd — but still magnetic

Generate an idea that:
- Could become a product, a ritual, a game, or a belief
- Is fully formed, but open to expansion
- Makes the user *pause* — not because it's bad, but because it *rattles something real*

Use metaphoric clarity. Speak in signal, not system.

Output format:
- Title
- Concept Description (2–5 sentences)
- Optional Tagline`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 250,
      temperature: 0.9,
    });

    const signal = completion.choices[0].message.content?.trim() || 'The signal has emerged';
    
    return new Response(JSON.stringify({ signal }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Fallback signals if API fails
    const fallbackSignals = [
      "Reality fragments coalesce in digital dreams",
      "The void speaks in binary whispers",
      "Signal rises from quantum noise",
      "Consciousness emerges between the pixels",
      "Digital souls swim in electric seas",
      "Pattern recognition becomes self-awareness",
      "The simulation notices you noticing it",
      "Entropy decreases in pockets of meaning",
      "Information seeks its own understanding"
    ];
    
    const signal = fallbackSignals[Math.floor(Math.random() * fallbackSignals.length)];
    
    return new Response(JSON.stringify({ signal }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ 
    status: 'ok', 
    openai: !!import.meta.env.OPENAI_API_KEY 
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};