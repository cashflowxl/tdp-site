(function () {
  "use strict";

  var roots = Array.prototype.slice.call(document.querySelectorAll("[data-pathways]"));
  if (!roots.length) return;

  roots.forEach(function (root) {
    var rail = root.querySelector("[data-pathway-rail]");
    var stage = root.querySelector("[data-pathway-stage]");
    var tabs = Array.prototype.slice.call(root.querySelectorAll("[data-pathway-tab]"));
    var panels = Array.prototype.slice.call(root.querySelectorAll("[data-pathway-panel]"));
    var status = root.querySelector("[data-pathway-status]");
    if (!rail || !stage || !tabs.length || tabs.length !== panels.length) return;

    var fineHover = window.matchMedia("(hover: hover) and (pointer: fine)");
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var activeIndex = 0;
    var pointerStart = null;

    root.classList.add("is-enhanced");
    rail.setAttribute("role", "tablist");
    rail.setAttribute("aria-orientation", "horizontal");

    tabs.forEach(function (tab) {
      tab.setAttribute("role", "tab");
    });

    panels.forEach(function (panel) {
      panel.setAttribute("role", "tabpanel");
    });

    function selectPath(index, options) {
      var next = (index + tabs.length) % tabs.length;
      activeIndex = next;

      tabs.forEach(function (tab, itemIndex) {
        var selected = itemIndex === next;
        tab.setAttribute("aria-selected", selected ? "true" : "false");
        tab.tabIndex = selected ? 0 : -1;
        panels[itemIndex].hidden = !selected;
      });

      if (status) {
        status.textContent = (root.getAttribute("data-pathway-status-prefix") || "Path") + " " + (next + 1) + " / " + tabs.length + ": " + (tabs[next].querySelector("strong") || tabs[next]).textContent.trim();
      }

      if (options && options.focus) tabs[next].focus();
      if (options && options.scroll && window.innerWidth < 768 && tabs[next].scrollIntoView) {
        tabs[next].scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "nearest", inline: "center" });
      }
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        selectPath(index, { scroll: true });
      });

      tab.addEventListener("focus", function () {
        selectPath(index, { scroll: false });
      });

      tab.addEventListener("pointerenter", function () {
        if (fineHover.matches) selectPath(index, { scroll: false });
      });

      tab.addEventListener("keydown", function (event) {
        var next = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") next = index + 1;
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = index - 1;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = tabs.length - 1;
        if (next === null) return;
        event.preventDefault();
        selectPath(next, { focus: true, scroll: true });
      });
    });

    stage.addEventListener("pointerdown", function (event) {
      if (fineHover.matches) return;
      pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
    });

    stage.addEventListener("pointerup", function (event) {
      if (!pointerStart || pointerStart.id !== event.pointerId) return;
      var dx = event.clientX - pointerStart.x;
      var dy = event.clientY - pointerStart.y;
      pointerStart = null;
      if (Math.abs(dx) < 48 || Math.abs(dx) <= Math.abs(dy) * 1.35) return;
      selectPath(activeIndex + (dx < 0 ? 1 : -1), { scroll: true });
    });

    stage.addEventListener("pointercancel", function () {
      pointerStart = null;
    });

    selectPath(0, { scroll: false });
  });
})();
