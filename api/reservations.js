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

  // Haal events op gesorteerd op datum, filter op datum als meegegeven
  let url = `${baseUrl}/events?limit=50&order=datetime_start&direction=asc`;
  if (date) url += `&datetime_start=${encodeURIComponent(date)}`;

  try {
    const response = await fetch(url, {
      headers: {
        'X-Authorization': `Basic ${apiKey}`,
        'Accept': 'application/json'
      }
    });
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
