/**
 * Serverless API Route: GET /api/analytics
 * Mengambil data event analitik gameplay dari Vercel KV (Redis)
 * menggunakan antarmuka REST (fetch) tanpa dependensi library eksternal.
 */
export default async function handler(req, res) {
  // Atur Header CORS agar dapat diakses dari domain/port dashboard eksternal
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Tangani preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;

    if (kvUrl && kvToken) {
      // Mengambil seluruh list data event dari Vercel KV lewat LRANGE REST API
      const response = await fetch(`${kvUrl}/lrange/knightblock_events/0/-1`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kvToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Upstash REST returned status ${response.status}`);
      }

      const data = await response.json();
      // data.result biasanya bertipe string array, parse masing-masing string menjadi object
      const rawEvents = data.result || [];
      const parsedEvents = rawEvents.map(eventStr => {
        try {
          return typeof eventStr === 'string' ? JSON.parse(eventStr) : eventStr;
        } catch (e) {
          console.warn('[API Analytics] Gagal mem-parse event string:', eventStr, e);
          return { error: 'Invalid JSON', raw: eventStr };
        }
      });

      res.status(200).json(parsedEvents);
    } else {
      // Fallback lokal jika kredensial Vercel KV belum diset
      console.warn('[API Analytics] Vercel KV belum dikonfigurasi.');
      res.status(200).json([
        {
          event: 'system_warning',
          timestamp: new Date().toISOString(),
          payload: { message: 'Vercel KV not configured on this environment.' }
        }
      ]);
    }
  } catch (error) {
    console.error('[API Analytics] Gagal membaca dari database Vercel KV:', error);
    res.status(500).json({ error: 'Failed to retrieve analytics data' });
  }
}
