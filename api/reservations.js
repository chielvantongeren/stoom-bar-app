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
    let allItems = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages && page <= 12) {
      const url = `${baseUrl}/events?limit=100&page=${page}`;
      const response = await fetch(url, { headers });
      const data = await response.json();
      const items = data.data || [];
      totalPages = data.page?.total_pages || 1;

      const gefilterd = items.filter(r => {
        const start = (r.datetime_start || '').slice(0, 10);
        return start === date && r.status === 'confirmed';
      });

      allItems = allItems.concat(gefilterd);

      if (items.length > 0) {
        const laatste = (items[items.length - 1].datetime_start || '').slice(0, 10);
        if (laatste > date && allItems.length > 0) break;
      }
      page++;
    }

    const eventsMetDetails = await Promise.all(
      allItems.map(async (event) => {
        try {
          const bookingId = event.booking_id;
          const bRes = await fetch(`${baseUrl}/bookings/${bookingId}`, { headers });
          const bData = await bRes.json();
          const booking = bData.data || {};
          return {
            ...event,
            activities: booking.activities || booking.program || event.activities || [],
            booking_data: booking
          };
        } catch(e) {
          return event;
        }
      })
    );

    return res.status(200).json({
      data: eventsMetDetails,
      total_today: eventsMetDetails.length
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}export default async function handler(req, res) {
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
    let allItems = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages && page <= 12) {
      // Voeg activities=1 toe om activiteiten mee te krijgen
      const url = `${baseUrl}/events?limit=100&page=${page}&activities=1`;
      const response = await fetch(url, { headers });
      const data = await response.json();
      const items = data.data || [];
      totalPages = data.page?.total_pages || 1;

      const gefilterd = items.filter(r => {
        const start = (r.datetime_start || '').slice(0, 10);
        return start === date && r.status === 'confirmed';
      });

      allItems = allItems.concat(gefilterd);

      if (items.length > 0) {
        const laatste = (items[items.length - 1].datetime_start || '').slice(0, 10);
        if (laatste > date && allItems.length > 0) break;
      }
      page++;
    }

    // Haal voor elk event de volledige details op inclusief activiteiten
    const eventsMetActiviteiten = await Promise.all(
      allItems.map(async (event) => {
        try {
          const detailRes = await fetch(`${baseUrl}/events/${event.id}`, { headers });
          const detail = await detailRes.json();
          return detail.data || event;
        } catch(e) {
          return event;
        }
      })
    );

    return res.status(200).json({
      data: eventsMetActiviteiten,
      total_today: eventsMetActiviteiten.length
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
