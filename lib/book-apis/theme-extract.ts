const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function extractThemes(prompt: string): Promise<string> {
  if (!OPENAI_API_KEY) throw new Error('Missing OpenAI API key');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Extract the main themes or topics from the user prompt as a short comma-separated list. Do not include the prompt itself.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 32,
      temperature: 0.2,
    }),
  });
  if (!res.ok) throw new Error('OpenAI theme extraction error');
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
} 