export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.MICE_API_KEY;
  const baseUrl = 'https://app.miceoperations.com/api/v1';
  if (!apiKey) return res.status(500).json({ error: 'MICE_API_KEY not configured' });

  const date = req.query.date || '';
  const headers = { 'X-Authorization': `Basic ${apiKey}`, 'Accept': 'application/json' };

  try {
    let allItems = [], page = 1, totalPages = 1;
    while (page <= totalPages && page <= 12) {
      const url = `${baseUrl}/events?limit=100&page=${page}&include_activities=true&include_location=true&include_products=true`;
      const r = await fetch(url, { headers });
      const data = await r.json();
      const items = data.data || [];
      totalPages = data.page?.total_pages || 1;
      allItems = allItems.concat(items.filter(e => e.datetime_start?.slice(0,10) === date && e.status === 'confirmed'));
      if(items.length > 0 && items[items.length-1].datetime_start?.slice(0,10) > date && allItems.length > 0) break;
      page++;
    }
    return res.status(200).json({ data: allItems, total_today: allItems.length });
  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
