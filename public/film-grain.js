/**
 * Full-screen film grain / noise overlay — vanilla JS, no dependencies.
 * Sony Vegas–style noise via canvas ImageData, requestAnimationFrame.
 *
 * Usage: include this script in your HTML (e.g. <script src="/film-grain.js"></script>).
 * Options (optional): window.FILM_GRAIN_OPACITY = 0.2; window.FILM_GRAIN_DENSITY = 0.7;
 */

(function () {
  'use strict';

  var opacity = typeof window.FILM_GRAIN_OPACITY !== 'undefined' ? window.FILM_GRAIN_OPACITY : 0.2;
  var density = typeof window.FILM_GRAIN_DENSITY !== 'undefined' ? window.FILM_GRAIN_DENSITY : 0.7; // 60–80% of pixels
  var alphaMin = 20;
  var alphaMax = 40;

  var style = document.createElement('style');
  style.textContent =
    '#film-grain-overlay {' +
    'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;' +
    'z-index: 9999; pointer-events: none; overflow: hidden;' +
    '}' +
    '#film-grain-canvas { display: block; width: 100%; height: 100%; }';
  document.head.appendChild(style);

  var overlay = document.createElement('div');
  overlay.id = 'film-grain-overlay';

  var canvas = document.createElement('canvas');
  canvas.id = 'film-grain-canvas';

  overlay.appendChild(canvas);
  document.body.insertBefore(overlay, document.body.firstChild);

  canvas.style.opacity = String(opacity);

  var ctx = canvas.getContext('2d', { alpha: true });
  var width = 0;
  var height = 0;

  function setSize() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    if (w === width && h === height) return;
    width = canvas.width = w;
    height = canvas.height = h;
  }

  function drawNoise() {
    if (width === 0 || height === 0) {
      requestAnimationFrame(drawNoise);
      return;
    }
    var imageData = ctx.createImageData(width, height);
    var data = imageData.data;
    var len = data.length;
    for (var i = 0; i < len; i += 4) {
      if (Math.random() < density) {
        var g = Math.floor(Math.random() * 256);
        var a = Math.floor(alphaMin + Math.random() * (alphaMax - alphaMin + 1));
        data[i] = g;
        data[i + 1] = g;
        data[i + 2] = g;
        data[i + 3] = a;
      } else {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 0;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    requestAnimationFrame(drawNoise);
  }

  window.addEventListener('resize', setSize);
  setSize();
  requestAnimationFrame(drawNoise);
})();
