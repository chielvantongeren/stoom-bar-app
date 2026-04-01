export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.MICE_API_KEY;
  const baseUrl = 'https://app.miceoperations.com/api/v1';
  const headers = { 'X-Authorization': `Basic ${apiKey}`, 'Accept': 'application/json' };
  const eventId = req.query.eventid || '1127015';
  const date = req.query.date || '';

  if(req.query.debug) {
    // Test verschillende endpoints voor dit event
    const results = {};
    const endpoints = [
      `/events/${eventId}`,
      `/events/${eventId}/activities`,
      `/events/${eventId}/program`,
      `/events/${eventId}/schedule`,
    ];
    for(const ep of endpoints) {
      try {
        const r = await fetch(baseUrl + ep, { headers });
        const d = await r.json();
        results[ep] = { status: r.status, keys: Object.keys(d.data || d || {}), activities: d.data?.activities };
      } catch(e) {
        results[ep] = { error: e.message };
      }
    }
    return res.status(200).json(results);
  }

  // Normale werking
  try {
    let allItems = [], page = 1, totalPages = 1;
    while (page <= totalPages && page <= 12) {
      const r = await fetch(`${baseUrl}/events?limit=100&page=${page}`, { headers });
      const data = await r.json();
      const items = data.data || [];
      totalPages = data.page?.total_pages || 1;
      allItems = allItems.concat(items.filter(r => r.datetime_start?.slice(0,10) === date && r.status === 'confirmed'));
      if(items.length > 0 && items[items.length-1].datetime_start?.slice(0,10) > date && allItems.length > 0) break;
      page++;
    }
    return res.status(200).json({ data: allItems, total_today: allItems.length });
  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
