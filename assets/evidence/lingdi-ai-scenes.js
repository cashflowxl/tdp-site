(function () {
  "use strict";

  var roots = Array.prototype.slice.call(document.querySelectorAll("[data-ai-scenes]"));
  if (!roots.length) return;

  roots.forEach(function (root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll("[data-ai-scene-tab]"));
    var video = root.querySelector("[data-ai-scene-video]");
    var frame = root.querySelector("[data-ai-scene-frame]");
    var meta = root.querySelector("[data-ai-scene-meta]");
    var title = root.querySelector("[data-ai-scene-title]");
    var summary = root.querySelector("[data-ai-scene-summary]");
    var panel = root.querySelector("[data-ai-scene-panel]");
    var status = root.querySelector("[data-ai-scene-status]");
    if (!tabs.length || !video || !frame || !meta || !title || !summary) return;

    var fineHover = window.matchMedia("(hover: hover) and (pointer: fine)");
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var saveData = Boolean(navigator.connection && navigator.connection.saveData);
    var activeIndex = 0;
    var visible = false;
    var pointerStart = null;
    var sceneTimes = Object.create(null);
    var loadToken = 0;

    root.classList.add("is-enhanced");
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    if (saveData) video.preload = "none";

    function canAutoplay() {
      return !reducedMotion.matches && !saveData && visible && !document.hidden;
    }

    function playIfAllowed() {
      if (!canAutoplay()) return;
      var attempt = video.play();
      if (attempt && typeof attempt.catch === "function") attempt.catch(function () {});
    }

    function selectScene(index, options) {
      var next = (index + tabs.length) % tabs.length;
      var tab = tabs[next];
      var src = tab.getAttribute("data-src");
      var poster = tab.getAttribute("data-poster");
      var wasPlaying = !video.paused;
      var previousSrc = video.getAttribute("src") || "";
      if (previousSrc && Number.isFinite(video.currentTime)) sceneTimes[previousSrc] = video.currentTime;
      activeIndex = next;

      tabs.forEach(function (item, itemIndex) {
        var selected = itemIndex === next;
        item.setAttribute("aria-selected", selected ? "true" : "false");
        item.tabIndex = selected ? 0 : -1;
      });

      meta.textContent = tab.getAttribute("data-meta") || "";
      title.textContent = tab.getAttribute("data-title") || "";
      summary.textContent = tab.getAttribute("data-summary") || "";
      if (panel && tab.id) panel.setAttribute("aria-labelledby", tab.id);
      video.setAttribute("aria-label", tab.getAttribute("data-video-label") || tab.getAttribute("data-title") || "");

      if (poster) video.poster = poster;
      if (src && previousSrc !== src) {
        loadToken += 1;
        var expectedToken = loadToken;
        video.pause();
        video.setAttribute("src", src);
        video.load();
        video.addEventListener("loadedmetadata", function restoreSceneTime() {
          if (expectedToken !== loadToken || video.getAttribute("src") !== src) return;
          var savedTime = sceneTimes[src] || 0;
          if (savedTime > 0 && savedTime < video.duration) video.currentTime = savedTime;
          if (options && options.autoplay) playIfAllowed();
        }, { once: true });
      }

      if (status) {
        status.textContent = (root.getAttribute("data-status-prefix") || "Scene") + " " + (next + 1) + " / " + tabs.length + ": " + (tab.getAttribute("data-title") || "");
      }

      if (options && options.focus) tab.focus();
      if ((options && options.autoplay) || wasPlaying) playIfAllowed();
      if (tab.scrollIntoView && window.innerWidth < 768) {
        tab.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "nearest", inline: "center" });
      }
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        selectScene(index, { autoplay: true });
      });

      tab.addEventListener("pointerenter", function () {
        if (fineHover.matches) selectScene(index, { autoplay: true });
      });

      tab.addEventListener("keydown", function (event) {
        var next = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") next = index + 1;
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = index - 1;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = tabs.length - 1;
        if (next === null) return;
        event.preventDefault();
        selectScene(next, { autoplay: true, focus: true });
      });
    });

    frame.addEventListener("pointerdown", function (event) {
      if (fineHover.matches) return;
      pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
    });

    frame.addEventListener("pointerup", function (event) {
      if (!pointerStart || pointerStart.id !== event.pointerId) return;
      var dx = event.clientX - pointerStart.x;
      var dy = event.clientY - pointerStart.y;
      pointerStart = null;
      if (Math.abs(dx) < 48 || Math.abs(dx) <= Math.abs(dy) * 1.35) return;
      selectScene(activeIndex + (dx < 0 ? 1 : -1), { autoplay: false });
    });

    frame.addEventListener("pointercancel", function () {
      pointerStart = null;
    });

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        visible = Boolean(entries[0] && entries[0].isIntersecting && entries[0].intersectionRatio >= 0.48);
        if (visible) playIfAllowed();
        else video.pause();
      }, { threshold: [0, 0.48, 0.75] });
      observer.observe(root);
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) video.pause();
      else playIfAllowed();
    });

    var mediaChange = function () {
      if (!canAutoplay()) video.pause();
      else playIfAllowed();
    };
    if (fineHover.addEventListener) fineHover.addEventListener("change", mediaChange);
    if (reducedMotion.addEventListener) reducedMotion.addEventListener("change", mediaChange);

    selectScene(0, { autoplay: false });
  });
})();
