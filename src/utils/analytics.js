/**
 * Pengirim Event Analitik Gameplay dengan Fallback LocalStorage (Silent Fail).
 * Mengirimkan data event secara asinkron ke serverless route /api/track.
 * 
 * @param {string} eventName Nama event yang direkam (e.g. 'game_start', 'game_over')
 * @param {object} payload Informasi tambahan terkait event
 */
export async function trackEvent(eventName, payload) {
  const timestamp = new Date().toISOString();
  const data = {
    event: eventName,
    timestamp,
    payload: payload || {}
  };

  console.log(`[Analytics] Merekam Event: ${eventName}`, data);

  // Fungsi penyimpanan cadangan ke LocalStorage jika terjadi kendala jaringan/server
  const storeLocal = () => {
    try {
      const localLogs = JSON.parse(localStorage.getItem('knightblock_analytics_logs') || '[]');
      localLogs.push(data);
      localStorage.setItem('knightblock_analytics_logs', JSON.stringify(localLogs));
      console.log('[Analytics] Event disimpan ke LocalStorage.');
    } catch (e) {
      console.warn('[Analytics] Gagal menyimpan event ke LocalStorage:', e);
    }
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // Batas waktu 3 detik

    const response = await fetch('/api/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('[Analytics] API remote mengembalikan status error. Menyimpan ke LocalStorage.');
      storeLocal();
    }
  } catch (error) {
    console.warn('[Analytics] Gagal mengirim event ke API (Offline atau Lambat). Menyimpan ke LocalStorage:', error.message);
    storeLocal();
  }
}
