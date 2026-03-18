export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.MICE_API_KEY;
  const baseUrl = 'https://app.miceoperations.com/api/v1';
  if (!apiKey) return res.status(500).json({ error: 'MICE_API_KEY not configured' });

  const { reservation_id, counts, drinks } = req.body || {};
  if (!reservation_id) return res.status(400).json({ error: 'reservation_id is verplicht' });

  const headers = {
    'X-Authorization': `Basic ${apiKey}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  // Test welke endpoints beschikbaar zijn voor dit event
  const tests = {};

  // Test 1: GET event zelf
  try {
    const r = await fetch(`${baseUrl}/events/${reservation_id}`, { headers });
    const d = await r.json();
    tests['GET /events/id'] = { status: r.status, keys: Object.keys(d.data || d) };
  } catch(e) { tests['GET /events/id'] = { error: e.message }; }

  // Test 2: GET products van event
  try {
    const r = await fetch(`${baseUrl}/events/${reservation_id}/products`, { headers });
    const d = await r.json();
    tests['GET /events/id/products'] = { status: r.status, sample: JSON.stringify(d).slice(0,200) };
  } catch(e) { tests['GET /events/id/products'] = { error: e.message }; }

  // Test 3: POST product naar event
  try {
    const r = await fetch(`${baseUrl}/events/${reservation_id}/products`, {
      method: 'POST', headers,
      body: JSON.stringify({ product_id: 1, amount: 1 })
    });
    const d = await r.json();
    tests['POST /events/id/products'] = { status: r.status, sample: JSON.stringify(d).slice(0,300) };
  } catch(e) { tests['POST /events/id/products'] = { error: e.message }; }

  // Test 4: PATCH event zelf
  try {
    const r = await fetch(`${baseUrl}/events/${reservation_id}`, {
      method: 'PATCH', headers,
      body: JSON.stringify({ message: 'test' })
    });
    const d = await r.json();
    tests['PATCH /events/id'] = { status: r.status, sample: JSON.stringify(d).slice(0,200) };
  } catch(e) { tests['PATCH /events/id'] = { error: e.message }; }

  return res.status(200).json({ debug: true, reservation_id, tests });
}
