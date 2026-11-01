/*
 * XDC Outpost analytics (GoatCounter: cookie-free, no personal data).
 *
 * SETUP: replace REPLACE_ME below with your GoatCounter site code.
 * If your dashboard is https://xdcoutpost.goatcounter.com, the code is: xdcoutpost
 *
 * Until the code is set, nothing is sent anywhere.
 * Only visits to the live site (xdcoutpost.xyz) are counted, not local testing.
 */
(function () {
  var GOATCOUNTER_CODE = 'REPLACE_ME';

  // Count a named action, e.g. xdcTrack('calculator/calculated'). Safe to call any time.
  window.xdcTrack = function (name, title) {
    try {
      if (window.goatcounter && typeof window.goatcounter.count === 'function')
        window.goatcounter.count({ path: name, title: title || name, event: true });
    } catch (e) {}
  };

  if (!GOATCOUNTER_CODE || GOATCOUNTER_CODE === 'REPLACE_ME') return;
  if (!/(^|\.)xdcoutpost\.xyz$/.test(location.hostname)) return;

  var s = document.createElement('script');
  s.async = true;
  s.src = '/assets/goatcounter-count.js';
  s.setAttribute('data-goatcounter', 'https://' + GOATCOUNTER_CODE + '.goatcounter.com/count');
  document.head.appendChild(s);
})();
