export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.MICE_API_KEY;
  const baseUrl = 'https://app.miceoperations.com/api/v1';
  if (!apiKey) return res.status(500).json({ error: 'MICE_API_KEY not configured' });

  // Gebruik datum van client (Nederlandse tijd) als die meegegeven wordt
  const date = req.query.date || '';

  const headers = {
    'X-Authorization': `Basic ${apiKey}`,
    'Accept': 'application/json'
  };

  try {
    let allItems = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages && page <= 12) {
      const url = `${baseUrl}/events?limit=100&page=${page}`;
      const response = await fetch(url, { headers });
      const data = await response.json();
      const items = data.data || [];
      totalPages = data.page?.total_pages || 1;

      // Filter op datum en status confirmed
      const gefilterd = items.filter(r => {
        const start = (r.datetime_start || '').slice(0, 10);
        return start === date && r.status === 'confirmed';
      });

      allItems = allItems.concat(gefilterd);

      // Stop als we voorbij de gevraagde datum zijn
      if (items.length > 0) {
        const laatste = (items[items.length - 1].datetime_start || '').slice(0, 10);
        if (laatste > date && allItems.length > 0) break;
      }

      page++;
    }

    return res.status(200).json({
      data: allItems,
      total_today: allItems.length
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
