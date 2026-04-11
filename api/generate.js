export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const { marnee, korea, energy, hasCollab, collab } = await req.json();

  const prompt = `You are a content strategist for Diana, a Spanish founder living in Seoul building Marnee (an AI CMO for startups). Her Instagram is @diananonea (7.4k followers). Her best-performing content is curiosity lists about Korea with 137k views.

Her content skeleton:
- VIDEO 1: Korea curiosities list — café footage, text overlay, tips list in caption. Reach driver.
- VIDEO 2: Korea curiosities list #2 — same format, different angle.
- VIDEO 3: Emotional storytelling — real moment from her week, voice-over or text overlay.
- BONUS if collab: storytelling experience video.

Her unique angle: Western founder building an AI startup from Korea. Building in public is always framed as Korea curiosities.

This week's dump:
MARNEE/STARTUP: ${marnee || 'nothing specific'}
KOREA/LIFE: ${korea || 'nothing specific'}
ENERGY/STATE: ${energy || 'not specified'}
${hasCollab ? `COLLAB: ${collab}` : 'NO COLLAB THIS WEEK'}

Generate exactly this JSON (no markdown, no explanation, pure JSON only):
{
  "video1": {
    "screen_text": "short punchy text overlay (max 8 words, all lowercase, curiosity angle about Korea + founder life)",
    "tips": ["tip 1", "tip 2", "tip 3", "tip 4", "tip 5"],
    "caption": "full Instagram caption in English, conversational, ends with a question, hashtags at bottom"
  },
  "video2": {
    "screen_text": "different angle from video1, same format",
    "tips": ["tip 1", "tip 2", "tip 3", "tip 4", "tip 5"],
    "caption": "full Instagram caption in English"
  },
  "video3": {
    "screen_text": "emotional hook text overlay (max 10 words)",
    "voiceover": "30-60 second voiceover script, honest and raw, Diana voice direct no fluff real emotions ends with something that makes people feel seen",
    "caption": "full Instagram caption in English, more personal tone"
  }
  ${hasCollab ? `,
  "collab": {
    "screen_text": "experience hook text overlay",
    "voiceover": "storytelling voiceover for the collab, personal and warm",
    "caption": "full Instagram caption mentioning the brand naturally"
  }` : ''}
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const text = data.content.map(i => i.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return new Response(JSON.stringify(parsed), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Generation failed. Try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
