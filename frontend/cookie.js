/**
 * Taxi Freising – Cookie Consent Manager
 * DSGVO / §25 TTDSG konform
 */
(function () {
  'use strict';

  var KEY = 'tf_consent';
  var consent = null;
  try { consent = localStorage.getItem(KEY); } catch (e) {}

  /* ── Loader helpers ─────────────────────────────── */
  function loadFonts() {
    if (document.getElementById('tf-gfonts')) return;
    var pc1 = document.createElement('link');
    pc1.rel = 'preconnect'; pc1.href = 'https://fonts.googleapis.com';
    var pc2 = document.createElement('link');
    pc2.rel = 'preconnect'; pc2.href = 'https://fonts.gstatic.com'; pc2.crossOrigin = '';
    var css = document.createElement('link');
    css.id = 'tf-gfonts'; css.rel = 'stylesheet';
    css.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap';
    document.head.appendChild(pc1);
    document.head.appendChild(pc2);
    document.head.appendChild(css);
  }

  function loadMaps() {
    if (document.getElementById('tf-gmaps')) return;
    var s = document.createElement('script');
    s.id = 'tf-gmaps';
    s.async = true;
    s.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyA7wWp8hvzPOVGUsy4pTFVgTzF9QBkmFxI&libraries=places&loading=async';
    document.head.appendChild(s);
  }

  /* ── Accept / Decline ───────────────────────────── */
  function activate(accepted) {
    try { localStorage.setItem(KEY, accepted ? 'accepted' : 'declined'); } catch (e) {}
    hideBanner();
    if (accepted) {
      loadFonts();
      if (window.TF_NEEDS_MAPS) loadMaps();
    }
  }

  function hideBanner() {
    var b = document.getElementById('tf-cookie-banner');
    if (!b) return;
    b.style.transition = 'opacity .25s, transform .25s';
    b.style.opacity = '0';
    b.style.transform = 'translateY(16px)';
    setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 280);
  }

  /* ── Banner HTML ────────────────────────────────── */
  function showBanner() {
    if (document.getElementById('tf-cookie-banner')) return;

    var b = document.createElement('div');
    b.id = 'tf-cookie-banner';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-modal', 'true');
    b.setAttribute('aria-label', 'Cookie-Einstellungen');

    b.style.cssText =
      'position:fixed;bottom:0;left:0;right:0;z-index:99999;' +
      'background:#0d0d0d;border-top:2px solid #e5a716;' +
      'padding:16px 24px;' +
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;' +
      'box-shadow:0 -6px 32px rgba(0,0,0,.45);' +
      'display:flex;align-items:center;gap:20px;flex-wrap:wrap;';

    b.innerHTML =
      '<div style="flex:1;min-width:220px;">' +
        '<p style="margin:0 0 5px;font-size:15px;font-weight:700;color:#fff;letter-spacing:-.01em;">' +
          '🍪 Wir verwenden Cookies' +
        '</p>' +
        '<p style="margin:0;font-size:12.5px;color:rgba(255,255,255,.58);line-height:1.55;">' +
          'Wir nutzen Cookies und externe Dienste (Google Fonts, Google Maps) für optimale Funktionalität. ' +
          'Mehr in unserer ' +
          '<a href="/datenschutz.html" style="color:#e5a716;text-decoration:none;font-weight:600;">' +
            'Datenschutzerklärung' +
          '</a>.' +
        '</p>' +
      '</div>' +
      '<div style="display:flex;gap:10px;flex-shrink:0;flex-wrap:wrap;align-items:center;">' +
        '<button id="tf-cookie-decline" type="button" style="' +
          'background:transparent;border:1.5px solid rgba(255,255,255,.28);color:rgba(255,255,255,.7);' +
          'padding:9px 18px;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;' +
          'font-family:inherit;white-space:nowrap;line-height:1;">' +
          'Nur notwendige' +
        '</button>' +
        '<button id="tf-cookie-accept" type="button" style="' +
          'background:#e5a716;border:none;color:#0d0d0d;' +
          'padding:9px 22px;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;' +
          'font-family:inherit;white-space:nowrap;line-height:1;">' +
          '✓ Alle akzeptieren' +
        '</button>' +
      '</div>';

    document.body.appendChild(b);

    document.getElementById('tf-cookie-accept').addEventListener('click', function () { activate(true); });
    document.getElementById('tf-cookie-decline').addEventListener('click', function () { activate(false); });
  }

  /* ── Boot logic ─────────────────────────────────── */
  if (consent === 'accepted') {
    loadFonts();
    if (window.TF_NEEDS_MAPS) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadMaps);
      } else {
        loadMaps();
      }
    }
    return;
  }

  if (consent === 'declined') {
    return; // no external resources loaded
  }

  // First visit – show banner after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showBanner);
  } else {
    showBanner();
  }
})();
