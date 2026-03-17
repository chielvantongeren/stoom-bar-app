export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.MICE_API_KEY;
  const baseUrl = 'https://app.miceoperations.com/api/v1';

  if (!apiKey) {
    return res.status(500).json({ error: 'MICE_API_KEY not configured' });
  }

  const date = req.query.date || '';

  // Probeer meerdere mogelijke endpoints
  const endpoints = [
    `/events?limit=50${date ? '&date='+encodeURIComponent(date) : ''}`,
    `/reservations?limit=50${date ? '&date='+encodeURIComponent(date) : ''}`,
    `/quotations?limit=50${date ? '&date='+encodeURIComponent(date) : ''}`,
    `/bookings?limit=50${date ? '&date='+encodeURIComponent(date) : ''}`,
  ];

  const results = {};

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      results[endpoint] = {
        status: response.status,
        keys: data ? Object.keys(data) : [],
        count: Array.isArray(data) ? data.length : 
               Array.isArray(data?.data) ? data.data.length : 'n/a',
        sample: JSON.stringify(data).slice(0, 300)
      };
    } catch (err) {
      results[endpoint] = { error: err.message };
    }
  }

  return res.status(200).json({ debug: true, results });
}
