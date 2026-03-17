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

  try {
    // Haal alle events op gesorteerd op datum
    const url = `${baseUrl}/events?limit=100&order=datetime_start&direction=asc`;
    const response = await fetch(url, {
      headers: {
        'X-Authorization': `Basic ${apiKey}`,
        'Accept': 'application/json'
      }
    });
    const data = await response.json();
    const items = data.data || [];

    // Filter op datum van vandaag in de server
    let gefilterd = items;
    if (date) {
      gefilterd = items.filter(r => {
        const start = (r.datetime_start || '').slice(0, 10);
        return start === date;
      });
    }

    return res.status(200).json({
      data: gefilterd,
      page: data.page,
      total_today: gefilterd.length
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
