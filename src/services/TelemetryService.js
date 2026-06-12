/**
 * TelemetryService - Mengirim data gameplay ke website analitik utama (CORS API Gateway).
 * Memiliki mekanisme penyimpanan cadangan otomatis (LocalStorage fallback) jika terjadi kegagalan jaringan.
 */
class TelemetryService {
  constructor() {
    // URL REST API tujuan telemetri pusat
    this.apiUrl = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? "http://localhost:3000/api/track"
      : "https://www.yellowhouse.my.id/api/track";
      
    this.projectName = "knight-block";
    this.localKey = "knightblock_telemetry_logs";
  }

  /**
   * Menyimpan log secara lokal jika pengiriman jaringan gagal
   * @param {Object} payload 
   */
  _storeLocal(payload) {
    try {
      const logs = JSON.parse(localStorage.getItem(this.localKey) || "[]");
      logs.push({
        ...payload,
        timestamp: new Date().toISOString(),
        offline: true
      });
      localStorage.setItem(this.localKey, JSON.stringify(logs));
      console.log("[Telemetry] Log disimpan secara lokal (offline fallback).");
    } catch (e) {
      console.warn("[Telemetry] Gagal menyimpan log cadangan ke LocalStorage:", e);
    }
  }

  /**
   * Mengirim log analitik ke database pusat
   * @param {string} slug - Status/posisi dalam game (e.g. "/menu", "/play")
   * @param {string} eventName - Nama aktivitas (e.g. "page_view", "game_start", "game_over")
   * @param {Object} metadata - Detail gameplay tambahan (e.g. { score, kills, level })
   * @param {boolean} adViewed - Status penayangan iklan Google AdSense
   */
  async trackEvent(slug, eventName, metadata = {}, adViewed = false) {
    const payload = {
      slug,
      projectName: this.projectName,
      eventName,
      adViewed,
      metadata
    };

    console.log(`[Telemetry] Merekam event: ${eventName}`, payload);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500); // Timeout 3.5 detik

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`[Telemetry] Server merespon dengan status: ${response.status}. Mengalihkan ke lokal.`);
        this._storeLocal(payload);
      }
    } catch (error) {
      // Kebijakan Fail-Silent: Jangan biarkan loop game Phaser crash karena kesalahan API
      console.warn("[Telemetry] Gagal mengirim log telemetri (Offline/Timeout). Mengalihkan ke lokal:", error.message);
      this._storeLocal(payload);
    }
  }
}

// Export singleton instance
export const telemetry = new TelemetryService();
