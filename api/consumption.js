export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.MICE_API_KEY;
  const baseUrl = 'https://app.miceoperations.com/api/v1';
  if (!apiKey) return res.status(500).json({ error: 'MICE_API_KEY not configured' });

  const { reservation_id, counts, drinks, note } = req.body || {};
  if (!reservation_id) return res.status(400).json({ error: 'reservation_id is verplicht' });

  const headers = {
    'X-Authorization': `Basic ${apiKey}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  // Bouw notitie tekst op
  let notitie = note || '';
  if (!notitie && counts && drinks) {
    const regels = [];
    let totaal = 0;
    let bedrag = 0;
    for (const [key, count] of Object.entries(counts)) {
      if (!count || count <= 0) continue;
      const d = (drinks || {})[key];
      if (!d) continue;
      const sub = count * (d.price || 0);
      regels.push(`${d.label}: ${count}x = €${sub.toFixed(2)}`);
      totaal += count;
      bedrag += sub;
    }
    notitie = `STOOM Bar registratie:\n${regels.join('\n')}\nTotaal: ${totaal} consumpties · €${bedrag.toFixed(2)}`;
  }

  const results = {};

  // Optie 1: PATCH event message veld
  try {
    const r1 = await fetch(`${baseUrl}/events/${reservation_id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ message: notitie })
    });
    const d1 = await r1.json();
    results['PATCH message'] = { status: r1.status, response: JSON.stringify(d1).slice(0,300) };
  } catch(e) { results['PATCH message'] = { error: e.message }; }

  // Optie 2: POST naar event notes
  try {
    const r2 = await fetch(`${baseUrl}/events/${reservation_id}/notes`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content: notitie })
    });
    const d2 = await r2.json();
    results['POST notes'] = { status: r2.status, response: JSON.stringify(d2).slice(0,300) };
  } catch(e) { results['POST notes'] = { error: e.message }; }

  // Optie 3: POST naar event messages
  try {
    const r3 = await fetch(`${baseUrl}/events/${reservation_id}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content: notitie, internal: true })
    });
    const d3 = await r3.json();
    results['POST messages'] = { status: r3.status, response: JSON.stringify(d3).slice(0,300) };
  } catch(e) { results['POST messages'] = { error: e.message }; }

  return res.status(200).json({ success: true, notitie, results });
}
