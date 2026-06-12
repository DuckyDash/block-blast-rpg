/**
 * Mendeteksi apakah iklan Google AdSense sukses dimuat oleh browser.
 * Memeriksa keberadaan tag iframe atau atribut data-ad-status="filled"
 * di dalam tag <ins class="adsbygoogle"> setelah jeda pemuatan (2.5 detik).
 * 
 * @returns {Promise<boolean>} True jika setidaknya satu iklan berhasil dirender, false jika tidak.
 */
export function checkAdSenseImpressions() {
  return new Promise((resolve) => {
    setTimeout(() => {
      const adInsList = document.querySelectorAll('ins.adsbygoogle');
      if (adInsList.length === 0) {
        resolve(false);
        return;
      }
      
      let anyAdLoaded = false;
      adInsList.forEach((ins) => {
        const hasIframe = ins.getElementsByTagName('iframe').length > 0;
        const isFilled = ins.getAttribute('data-ad-status') === 'filled';
        if (hasIframe || isFilled) {
          anyAdLoaded = true;
        }
      });
      
      resolve(anyAdLoaded);
    }, 2500);
  });
}
