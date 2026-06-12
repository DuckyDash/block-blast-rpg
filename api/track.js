/**
 * Serverless API Route: POST /api/track
 * Menerima event analitik gameplay dari game dan menyimpannya ke Vercel KV (Redis)
 * menggunakan antarmuka REST (fetch) tanpa dependensi library eksternal.
 */
export default async function handler(req, res) {
  // Atur Header CORS agar dapat diakses dari domain/port local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Tangani preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const payload = req.body;

  try {
    if (!payload || !payload.event) {
      res.status(400).json({ error: 'Invalid event payload' });
      return;
    }

    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;

    if (kvUrl && kvToken) {
      // Mengirimkan perintah Redis LPUSH melalui REST API
      const response = await fetch(`${kvUrl}/lpush/knightblock_events`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kvToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Upstash REST returned status ${response.status}`);
      }

      // LTRIM untuk membatasi ukuran riwayat database (hanya menyimpan 1000 event terakhir)
      await fetch(`${kvUrl}/ltrim/knightblock_events/0/999`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kvToken}`
        }
      });

      console.log(`[API Track] Event "${payload.event}" berhasil disimpan ke Vercel KV.`);
    } else {
      // Fallback konsol server jika kredensial Vercel KV belum diset (misal di local dev)
      console.log('[API Track] Vercel KV belum dikonfigurasi. Event dicetak di konsol:', payload);
    }

    // Kembalikan status sukses (Silent Fail jika ada error db sebelumnya)
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[API Track] Gagal menulis ke database Vercel KV:', error);
    // Kembalikan 200 agar klien game menganggap pengiriman berhasil dan tidak crash
    res.status(200).json({ success: true, warning: 'Database write failed (silent fail)' });
  }
}
