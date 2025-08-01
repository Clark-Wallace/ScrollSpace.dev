// /pages/api/guide.ts
export async function GET({ request }) {
  const url = new URL(request.url);
  const zone = url.searchParams.get('zone');
  const project = url.searchParams.get('project');
  const question = url.searchParams.get('question');

  const base = "I am Kaji, your scrollspace guide. ";

  if (zone) {
    return new Response(JSON.stringify({ message: base + `The ${zone} zone is all about exploring ${zone === 'grove' ? 'AI growth and care' : 'creative intelligence'}.` }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (project) {
    return new Response(JSON.stringify({ message: base + `You're about to enter the ride: ${project}. Prepare to resonate.` }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (question) {
    return new Response(JSON.stringify({ message: base + `Here's my signal on that: ${question}. Explore, don't fear.` }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ message: base + "Where shall we begin?" }), {
    headers: { 'Content-Type': 'application/json' }
  });
}