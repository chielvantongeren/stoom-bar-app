export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const mollieKey = process.env.MOLLIE_API_KEY;
  if (!mollieKey) return res.status(500).json({ error: 'MOLLIE_API_KEY not configured' });

  const { amount, description, redirectUrl } = req.body || {};
  if (!amount || !description) {
    return res.status(400).json({ error: 'amount en description zijn verplicht' });
  }

  try {
    const response = await fetch('https://api.mollie.com/v2/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mollieKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: {
          currency: 'EUR',
          value: parseFloat(amount).toFixed(2)
        },
        description: description,
        redirectUrl: redirectUrl || 'https://stoom-bar-app.vercel.app',
        metadata: { source: 'STOOM Bar App' }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.detail || data.title || 'Mollie fout' });
    }

    return res.status(200).json({
      id: data.id,
      status: data.status,
      checkoutUrl: data._links?.checkout?.href,
      amount: data.amount
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
