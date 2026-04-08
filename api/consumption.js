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

  const today = new Date().toISOString().slice(0, 10);
  const bonNummer = `STOOM-${Date.now()}`;

  // Stap 1: POS setup
  try {
    await fetch(`${baseUrl}/pos/${reservation_id}/setup`, {
      method: 'POST', headers,
      body: JSON.stringify({ date: today })
    });
  } catch(e) {}

  // Stap 2: Bouw items — alleen strikt positieve integers, nooit negatief
  // Prosecco als welkomst-toggle heeft count 0 of negatief — wordt hier gefilterd
  const items = [];
  for (const [key, count] of Object.entries(counts || {})) {
    const n = parseInt(count, 10);
    if (!n || n <= 0) continue; // Filter alles wat niet strikt positief is
    const d = (drinks || {})[key];
    if (!d || !d.miceId) continue;
    const priceIncl = parseFloat((d.price || 0).toFixed(2));
    const vatRate = (d.vat || 0) / 100;
    const priceExcl = parseFloat((d.priceExcl || priceIncl / (1 + vatRate)).toFixed(2));
    const ledger = vatRate === 0.21 ? '8302' : vatRate === 0.09 ? '8301' : '';
    items.push({
      object_type: 'product',
      object_code: String(d.miceId),
      name: d.label,
      amount: n,
      date: today,
      vat_rates: [{
        price: priceIncl,
        vat_rate: vatRate,
        general_ledger_number: ledger
      }]
    });
  }

  if (items.length === 0) {
    return res.status(400).json({ error: 'Geen consumpties om te registreren' });
  }

  // Stap 3: POS receipt versturen
  try {
    const response = await fetch(`${baseUrl}/pos/${reservation_id}/receipt`, {
      method: 'POST', headers,
      body: JSON.stringify({ date: today, synced: false, billed: false, identifier: bonNummer, items })
    });
    const data = await response.json();
    if (response.ok && data.page?.status === 'success') {
      return res.status(200).json({ success: true, message: `${items.length} product(en) opgeslagen in MICE`, bonNummer, items_sent: items });
    } else {
      return res.status(200).json({ success: false, error: data.page?.message || 'Onbekende fout van MICE', detail: data, items_sent: items });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
