export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.MICE_API_KEY;
  const baseUrl = process.env.MICE_BASE_URL;

  if (!apiKey) {
    return res.status(500).json({ error: 'MICE_API_KEY not configured' });
  }

  const { reservation_id, note } = req.body;

  if (!reservation_id || !note) {
    return res.status(400).json({ error: 'reservation_id en note zijn verplicht' });
  }

  try {
    // Post a note/comment to the reservation in MICE
    const response = await fetch(`${baseUrl}/reservations/${reservation_id}/notes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        note: note,
        type: 'internal'
      })
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ 
        error: `MICE API fout: ${response.status}`,
        detail: text
      });
    }

    const data = await response.json();
    return res.status(200).json({ success: true, data });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
