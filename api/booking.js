export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.MICE_API_KEY;
  const baseUrl = 'https://app.miceoperations.com/api/v1';
  if (!apiKey) return res.status(500).json({ error: 'MICE_API_KEY not configured' });

  const booking_id = req.query.booking_id;
  if (!booking_id) return res.status(400).json({ error: 'booking_id is verplicht' });

  const headers = { 'X-Authorization': `Basic ${apiKey}`, 'Accept': 'application/json' };

  try {
    const r = await fetch(`${baseUrl}/bookings/${booking_id}?include_products=true&include_packages=true`, { headers });
    const data = await r.json();
    return res.status(200).json(data);
  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
