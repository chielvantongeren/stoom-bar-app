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

  // Probeer elk drankje als product toe te voegen aan het event
  for (const [key, count] of Object.entries(counts || {})) {
    if (!count || count <= 0) continue;
    const drink = (drinks || {})[key];
    if (!drink) continue;

    // Zoek product ID op in MICE op basis van naam
    try {
      const prodResp = await fetch(`${baseUrl}/products?limit=100`, { headers });
      const prodData = await prodResp.json();
      const allProds = prodData.data || [];

      const naam = drink.label.toLowerCase();
      const match = allProds.find(p => {
        const pn = (p.name || '').toLowerCase();
        return pn.includes(naam) || naam.includes(pn.split(' ')[0]);
      });

      if (match) {
        // Voeg product toe aan event
        const addResp = await fetch(`${baseUrl}/events/${reservation_id}/products`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            product_id: match.id,
            amount: count,
            price: match.price || drink.price || 0
          })
        });
        const addData = await addResp.json();
        if (addResp.ok) {
          results.push({ key, naam: drink.label, count, status: 'ok' });
        } else {
          errors.push({ key, naam: drink.label, error: addData.page?.message || 'Fout' });
        }
      } else {
        errors.push({ key, naam: drink.label, error: 'Product niet gevonden in MICE' });
      }
    } catch (err) {
      errors.push({ key, error: err.message });
    }
  }

  return res.status(200).json({ success: true, results, errors });
}
