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

  const results = [];
  const errors = [];

  // Maak een AbortController voor timeout
  const fetchWithTimeout = async (url, options, timeout = 8000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      return response;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  };

  for (const [key, count] of Object.entries(counts || {})) {
    if (!count || count <= 0) continue;
    const drink = (drinks || {})[key];
    if (!drink || !drink.miceId) continue;

    try {
      const response = await fetchWithTimeout(
        `${baseUrl}/events/${reservation_id}/products`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            product_id: drink.miceId,
            amount: count
          })
        },
        8000
      );
      const data = await response.json();

      if (response.ok) {
        results.push({ key, naam: drink.label, count, status: 'ok', response: JSON.stringify(data).slice(0,200) });
      } else {
        errors.push({ key, naam: drink.label, error: data.page?.message || JSON.stringify(data).slice(0,150) });
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        errors.push({ key, naam: drink.label, error: 'Timeout — MICE reageert te langzaam' });
      } else {
        errors.push({ key, naam: drink.label, error: err.message });
      }
    }
  }

  return res.status(200).json({ success: true, results, errors });
}
