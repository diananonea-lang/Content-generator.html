export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { marnee, korea, energy, hasCollab, collab } = req.body;

  const prompt = `You are a content strategist for Diana, a Spanish founder living in Seoul building Marnee (an AI CMO for startups). Her Instagram is @diananonea (7.4k followers). Her best-performing content is curiosity lists about Korea with 137k views.

Her content skeleton:
- VIDEO 1: Korea curiosities list — cafe footage, text overlay, tips list in caption. Reach driver.
- VIDEO 2: Korea curiosities list #2 — same format, different angle.
- VIDEO 3: Emotional storytelling — real moment from her week, voice-over or text overlay.
${hasCollab ? '- BONUS collab: storytelling experience video.' : ''}

Her unique angle: Western founder building an AI startup from Korea. Building in public is always framed as Korea curiosities.

This week:
MARNEE/STARTUP: ${marnee || 'nothing specific'}
KOREA/LIFE: ${korea || 'nothing specific'}
ENERGY/STATE: ${energy || 'not specified'}
${hasCollab ? `COLLAB: ${collab}` : ''}

You MUST respond with ONLY a valid JSON object. No text before or after. No markdown. No backticks. Start your response with { and end with }.

{"video1":{"screen_text":"short text overlay max 8 words all lowercase","tips":["tip 1","tip 2","tip 3","tip 4","tip 5"],"caption":"full instagram caption in english with hashtags"},"video2":{"screen_text":"different angle same format","tips":["tip 1","tip 2","tip 3","tip 4","tip 5"],"caption":"full instagram caption in english"},"video3":{"screen_text":"emotional hook max 10 words","voiceover":"30-60 second script honest raw Diana voice","caption":"personal instagram caption in english"}${hasCollab ? ',"collab":{"screen_text":"experience hook","voiceover":"warm storytelling script","caption":"caption mentioning brand naturally"}' : ''}}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (data.error) return res.status(500).json({ error: 'Anthropic error: ' + data.error.message });
    if (!data.content || !data.content[0]) return res.status(500).json({ error: 'Empty response: ' + JSON.stringify(data) });

    const text = data.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'No JSON found in response: ' + text });
    
    const parsed = JSON.parse(jsonMatch[0]);
    res.status(200).json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
