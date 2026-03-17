export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.MICE_API_KEY;
  const baseUrl = 'https://stoom.miceoperations.com/api/v1';

  if (!apiKey) {
    return res.status(500).json({ error: 'MICE_API_KEY not configured' });
  }

  const date = req.query.date || '';
  const search = req.query.search || '';

  let url = `${baseUrl}/reservations?limit=50`;
  if (date) url += `&date=${encodeURIComponent(date)}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
