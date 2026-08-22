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

    var carouselViewport = document.createElement("div");
    var carouselTrack = document.createElement("div");
    var carouselFrames = [frame];
    var carouselVideos = [video];
    carouselViewport.className = "lingdi-ai-scenes__carousel";
    carouselTrack.className = "lingdi-ai-scenes__carousel-track";
    carouselViewport.setAttribute("role", "group");
    carouselViewport.setAttribute("aria-label", root.getAttribute("data-carousel-label") || "AI 场景横向翻页");
    frame.parentNode.insertBefore(carouselViewport, frame);
    carouselViewport.appendChild(carouselTrack);
    carouselTrack.appendChild(frame);
    tabs.slice(1).forEach(function (tab) {
      var clone = frame.cloneNode(true);
      var cloneVideo = clone.querySelector("[data-ai-scene-video]");
      var cloneSource = tab.getAttribute("data-src");
      var clonePoster = tab.getAttribute("data-poster");
      cloneVideo.setAttribute("src", cloneSource || "");
      if (clonePoster) cloneVideo.poster = clonePoster;
      cloneVideo.setAttribute("aria-label", tab.getAttribute("data-video-label") || tab.getAttribute("data-title") || "");
      cloneVideo.muted = true;
      cloneVideo.loop = true;
      cloneVideo.playsInline = true;
      cloneVideo.controls = false;
      carouselTrack.appendChild(clone);
      carouselFrames.push(clone);
      carouselVideos.push(cloneVideo);
    });
    var carouselControls = document.createElement("div");
    var previousButton = document.createElement("button");
    var nextButton = document.createElement("button");
    carouselControls.className = "lingdi-ai-scenes__carousel-controls";
    previousButton.type = "button";
    nextButton.type = "button";
    previousButton.textContent = "←";
    nextButton.textContent = "→";
    previousButton.setAttribute("aria-label", "上一条场景");
    nextButton.setAttribute("aria-label", "下一条场景");
    carouselControls.appendChild(previousButton);
    carouselControls.appendChild(nextButton);
    carouselViewport.appendChild(carouselControls);

    var fineHover = window.matchMedia("(hover: hover) and (pointer: fine)");
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var saveData = Boolean(navigator.connection && navigator.connection.saveData);
    var activeIndex = 0;
    var visible = false;
    var pointerStart = null;

    root.classList.add("is-enhanced");
    carouselVideos.forEach(function (item) {
      item.muted = true;
      item.loop = true;
      item.playsInline = true;
      item.controls = false;
      if (saveData) item.preload = "none";
    });

    function currentVideo() {
      return carouselVideos[activeIndex] || video;
    }

    function canAutoplay() {
      return !reducedMotion.matches && !saveData && visible && !document.hidden;
    }

    function playIfAllowed() {
      if (!canAutoplay()) return;
      carouselVideos.forEach(function (item, index) {
        if (index !== activeIndex) item.pause();
      });
      var attempt = currentVideo().play();
      if (attempt && typeof attempt.catch === "function") attempt.catch(function () {});
    }

    function selectScene(index, options) {
      var next = Math.max(0, Math.min(tabs.length - 1, index));
      var tab = tabs[next];
      var wasPlaying = !currentVideo().paused;
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
      carouselTrack.style.transform = "translate3d(-" + (next * 100) + "%, 0, 0)";
      previousButton.disabled = next === 0;
      nextButton.disabled = next === tabs.length - 1;

      if (status) {
        status.textContent = (root.getAttribute("data-status-prefix") || "Scene") + " " + (next + 1) + " / " + tabs.length + ": " + (tab.getAttribute("data-title") || "");
      }

      if (options && options.focus) tab.focus();
      if ((options && options.autoplay) || wasPlaying) playIfAllowed();
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

    carouselViewport.addEventListener("pointerdown", function (event) {
      pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
    });

    carouselViewport.addEventListener("pointerup", function (event) {
      if (!pointerStart || pointerStart.id !== event.pointerId) return;
      var dx = event.clientX - pointerStart.x;
      var dy = event.clientY - pointerStart.y;
      pointerStart = null;
      if (Math.abs(dx) < 56 || Math.abs(dx) <= Math.abs(dy) * 1.35) return;
      selectScene(activeIndex + (dx < 0 ? 1 : -1), { autoplay: true });
    });

    carouselViewport.addEventListener("pointercancel", function () { pointerStart = null; });
    previousButton.addEventListener("click", function () { selectScene(activeIndex - 1, { autoplay: true }); });
    nextButton.addEventListener("click", function () { selectScene(activeIndex + 1, { autoplay: true }); });

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        visible = Boolean(entries[0] && entries[0].isIntersecting && entries[0].intersectionRatio >= 0.2);
        if (visible) playIfAllowed();
        else carouselVideos.forEach(function (item) { item.pause(); });
      }, { threshold: [0, 0.2, 0.5] });
      observer.observe(carouselViewport);
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) carouselVideos.forEach(function (item) { item.pause(); });
      else playIfAllowed();
    });

    var mediaChange = function () {
      if (!canAutoplay()) carouselVideos.forEach(function (item) { item.pause(); });
      else playIfAllowed();
    };
    if (fineHover.addEventListener) fineHover.addEventListener("change", mediaChange);
    if (reducedMotion.addEventListener) reducedMotion.addEventListener("change", mediaChange);

    selectScene(0, { autoplay: false });
  });
})();
