document.addEventListener("DOMContentLoaded", function () {
  function animateCounter(counter, target) {
    var safeTarget = Number.isFinite(target) && target > 0 ? Math.floor(target) : 0;
    var duration = 800;
    var start = performance.now();

    function frame(now) {
      var progress = Math.min((now - start) / duration, 1);
      var value = Math.floor(safeTarget * progress);
      counter.textContent = value.toLocaleString("es-CO");
      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    }

    requestAnimationFrame(frame);
  }

  function setCounterValue(source, value) {
    var nodes = document.querySelectorAll('[data-counter-source="' + source + '"]');
    nodes.forEach(function (node) {
      animateCounter(node, value);
    });
  }

  function initRetroBackground() {
    if (document.body.classList.contains("stem-playground")) return;

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    var canvas = document.createElement("canvas");
    canvas.className = "retro-bg-canvas";
    canvas.setAttribute("aria-hidden", "true");
    document.body.insertBefore(canvas, document.body.firstChild);

    var noise = document.createElement("div");
    noise.className = "retro-noise";
    noise.setAttribute("aria-hidden", "true");
    document.body.appendChild(noise);

    var scanlines = document.createElement("div");
    scanlines.className = "retro-scanlines";
    scanlines.setAttribute("aria-hidden", "true");
    document.body.appendChild(scanlines);

    var ctx = canvas.getContext("2d");
    var width = 0;
    var height = 0;
    var nodes = [];
    var mouse = { x: -9999, y: -9999 };

    function createNodes(count) {
      nodes = [];
      for (var i = 0; i < count; i += 1) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45
        });
      }
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * Math.min(window.devicePixelRatio || 1, 1.8));
      canvas.height = Math.floor(height * Math.min(window.devicePixelRatio || 1, 1.8));
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
      createNodes(Math.max(34, Math.floor((width * height) / 20000)));
    }

    function updateNodes() {
      for (var i = 0; i < nodes.length; i += 1) {
        var n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
      }
    }

    function drawNodesAndLines() {
      var maxDist = Math.min(180, width * 0.14);

      for (var i = 0; i < nodes.length; i += 1) {
        var a = nodes[i];

        for (var j = i + 1; j < nodes.length; j += 1) {
          var b = nodes[j];
          var dx = a.x - b.x;
          var dy = a.y - b.y;
          var dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            var alpha = (1 - dist / maxDist) * 0.5;
            ctx.strokeStyle = "rgba(122, 214, 255, " + alpha.toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }

        var mdx = a.x - mouse.x;
        var mdy = a.y - mouse.y;
        var md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < maxDist * 1.1) {
          var malpha = (1 - md / (maxDist * 1.1)) * 0.45;
          ctx.strokeStyle = "rgba(65, 246, 185, " + malpha.toFixed(3) + ")";
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }

        ctx.fillStyle = "rgba(197, 226, 255, 0.8)";
        ctx.beginPath();
        ctx.arc(a.x, a.y, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function render(now) {
      ctx.clearRect(0, 0, width, height);

      var gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "rgba(9, 13, 30, 0.96)");
      gradient.addColorStop(0.52, "rgba(6, 9, 23, 0.9)");
      gradient.addColorStop(1, "rgba(3, 5, 14, 0.98)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      updateNodes();
      drawNodesAndLines();

      requestAnimationFrame(render);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", function (event) {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
    });
    window.addEventListener("mouseleave", function () {
      mouse.x = -9999;
      mouse.y = -9999;
    });
    requestAnimationFrame(render);
  }

  initRetroBackground();

  var revealItems = document.querySelectorAll(".reveal-up");
  if (revealItems.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("show");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );
    revealItems.forEach(function (item) {
      observer.observe(item);
    });
  }

  var staticCounters = document.querySelectorAll("[data-countup]");
  staticCounters.forEach(function (counter) {
    var target = parseInt(counter.getAttribute("data-countup") || "0", 10);
    animateCounter(counter, target);
  });

  var navLinks = document.querySelectorAll(".navbar .nav-link[data-nav]");
  var path = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  navLinks.forEach(function (link) {
    if ((link.getAttribute("data-nav") || "").toLowerCase() === path) {
      link.classList.add("active");
    }
  });

  var hasPublicCounters = document.querySelectorAll("[data-counter-source]").length > 0;
  if (!hasPublicCounters) return;

  var namespace = "elprofequeaprende.com";
  var today = new Date().toISOString().slice(0, 10);

  Promise.all([
    fetch("https://api.countapi.xyz/hit/" + namespace + "/visitas-total"),
    fetch("https://api.countapi.xyz/hit/" + namespace + "/visitas-" + today)
  ])
    .then(function (responses) {
      return Promise.all(responses.map(function (res) { return res.json(); }));
    })
    .then(function (json) {
      var total = Number(json[0] && json[0].value);
      var todayCount = Number(json[1] && json[1].value);
      setCounterValue("total", Number.isFinite(total) ? total : 0);
      setCounterValue("today", Number.isFinite(todayCount) ? todayCount : 0);
    })
    .catch(function () {
      var fallbackTotal = Number(localStorage.getItem("epqa_total_visitas") || "0") + 1;
      var fallbackTodayKey = "epqa_day_" + today;
      var fallbackToday = Number(localStorage.getItem(fallbackTodayKey) || "0") + 1;
      localStorage.setItem("epqa_total_visitas", String(fallbackTotal));
      localStorage.setItem(fallbackTodayKey, String(fallbackToday));
      setCounterValue("total", fallbackTotal);
      setCounterValue("today", fallbackToday);
    });
});
