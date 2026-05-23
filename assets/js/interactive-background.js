(function () {
  if (!document.body || !document.body.classList.contains("page-home")) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var canvas = document.createElement("canvas");
  canvas.className = "animated-bg-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.insertBefore(canvas, document.body.firstChild);

  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var width = 0;
  var height = 0;
  var dpr = 1;
  var nodes = [];
  var pointer = { x: -9999, y: -9999 };
  var raf = 0;
  var isMobile = window.matchMedia && window.matchMedia("(max-width: 767px)").matches;

  function nodeCount() {
    if (isMobile) return 18;
    return Math.max(26, Math.min(42, Math.floor((width * height) / 48000)));
  }

  function spawnNodes(total) {
    nodes = [];
    for (var index = 0; index < total; index += 1) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22
      });
    }
  }

  function resize() {
    width = window.innerWidth || 0;
    height = window.innerHeight || 0;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    spawnNodes(nodeCount());
  }

  function update() {
    var maxDist = isMobile ? 120 : 160;
    var pull = isMobile ? 0.000015 : 0.00001;
    var centerPull = 0.00005;

    for (var i = 0; i < nodes.length; i += 1) {
      var node = nodes[i];
      node.vx += (pointer.x - node.x) * pull;
      node.vy += (pointer.y - node.y) * pull;
      node.vx += (width / 2 - node.x) * centerPull * 0.3;
      node.vy += (height / 2 - node.y) * centerPull * 0.3;
      node.vx *= 0.985;
      node.vy *= 0.985;
      node.x += node.vx;
      node.y += node.vy;

      if (node.x < -20 || node.x > width + 20) node.vx *= -1;
      if (node.y < -20 || node.y > height + 20) node.vy *= -1;
    }

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(248, 251, 255, 0.98)";
    ctx.fillRect(0, 0, width, height);

    for (var aIndex = 0; aIndex < nodes.length; aIndex += 1) {
      var a = nodes[aIndex];

      for (var bIndex = aIndex + 1; bIndex < nodes.length; bIndex += 1) {
        var b = nodes[bIndex];
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        var distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > maxDist) continue;

        var alpha = (1 - distance / maxDist) * 0.12;
        var gradient = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        gradient.addColorStop(0, "rgba(23, 116, 255, " + alpha.toFixed(3) + ")");
        gradient.addColorStop(0.5, "rgba(111, 45, 168, " + (alpha * 0.9).toFixed(3) + ")");
        gradient.addColorStop(1, "rgba(0, 184, 148, " + (alpha * 0.85).toFixed(3) + ")");
        ctx.strokeStyle = gradient;
        ctx.lineWidth = distance < 70 ? 1.25 : 0.85;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      var px = a.x - pointer.x;
      var py = a.y - pointer.y;
      var pd = Math.sqrt(px * px + py * py);
      if (pd < maxDist * 0.9) {
        var pAlpha = (1 - pd / (maxDist * 0.9)) * 0.14;
        ctx.strokeStyle = "rgba(0, 188, 212, " + pAlpha.toFixed(3) + ")";
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(pointer.x, pointer.y);
        ctx.stroke();
      }

      ctx.fillStyle = "rgba(17, 94, 204, 0.75)";
      ctx.beginPath();
      ctx.arc(a.x, a.y, isMobile ? 1.25 : 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    raf = window.requestAnimationFrame(update);
  }

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("pointermove", function (event) {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  }, { passive: true });
  window.addEventListener("pointerleave", function () {
    pointer.x = -9999;
    pointer.y = -9999;
  }, { passive: true });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && raf) {
      window.cancelAnimationFrame(raf);
      raf = 0;
    } else if (!document.hidden && !raf) {
      raf = window.requestAnimationFrame(update);
    }
  });

  resize();
  update();
})();
