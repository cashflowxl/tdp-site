(() => {
  "use strict";

  const DESKTOP_QUERY = "(min-width: 1200px)";
  const MOBILE_QUERY = "(max-width: 700px)";
  const DESKTOP_HOVER_QUERY = "(hover: hover) and (pointer: fine)";
  const SWIPE_DISTANCE = 46;

  document.querySelectorAll("[data-founder-story]").forEach((story) => {
    const buttons = Array.from(story.querySelectorAll("[data-founder-trigger]"));
    const panels = Array.from(story.querySelectorAll("[data-founder-panel]"));
    const timeline = story.querySelector(".lingdi-founder-story__timeline");
    const status = story.querySelector("[data-founder-status]");
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const mobile = window.matchMedia(MOBILE_QUERY);
    const desktopHover = window.matchMedia(DESKTOP_HOVER_QUERY);
    const isEnglish = document.documentElement.lang.toLowerCase().startsWith("en");
    let resizeFrame = 0;
    let suppressClickUntil = 0;
    let gesture = null;

    if (!buttons.length || buttons.length !== panels.length || !timeline) return;

    story.classList.add("is-enhanced");

    const activeIndex = () => {
      const parsed = Number.parseInt(story.dataset.founderActive || "0", 10);
      return Number.isNaN(parsed) ? 0 : parsed;
    };

    const updateMobileStageHeight = (index) => {
      window.cancelAnimationFrame(resizeFrame);
      if (!mobile.matches) {
        story.style.removeProperty("--lfs-mobile-panel-height");
        return;
      }

      resizeFrame = window.requestAnimationFrame(() => {
        const panel = panels[index];
        const previousMinHeight = panel.style.minHeight;
        panel.style.minHeight = "0px";
        const measured = Math.max(300, Math.ceil(panel.scrollHeight));
        panel.style.minHeight = previousMinHeight;
        const nextHeight = `${measured}px`;
        if (story.style.getPropertyValue("--lfs-mobile-panel-height") !== nextHeight) {
          story.style.setProperty("--lfs-mobile-panel-height", nextHeight);
        }
      });
    };

    const updateStatus = (index) => {
      if (!status) return;
      if (!mobile.matches) {
        status.textContent = "";
        return;
      }

      const button = buttons[index];
      const label = button.dataset.founderMobileLabel || button.querySelector("strong")?.textContent?.trim() || "";
      const year = button.querySelector(".lingdi-founder-story__year")?.textContent?.trim() || "";
      status.textContent = isEnglish
        ? `${index + 1} / ${buttons.length} · ${label} · ${year} · Swipe horizontally to switch`
        : `${String(index + 1).padStart(2, "0")} / ${String(buttons.length).padStart(2, "0")} · ${label} · ${year} · 左右轻扫切换`;
    };

    const activate = (index, moveFocus = false) => {
      const safeIndex = (index + buttons.length) % buttons.length;
      const desktopMode = desktop.matches;
      const mobileMode = mobile.matches;
      const selectiveMode = desktopMode || mobileMode;

      story.classList.toggle("is-mobile-stage", mobileMode);

      buttons.forEach((button, buttonIndex) => {
        const selected = buttonIndex === safeIndex;
        const year = button.querySelector(".lingdi-founder-story__year")?.textContent?.trim() || "";
        const mobileLabel = button.dataset.founderMobileLabel || button.querySelector("strong")?.textContent?.trim() || "";
        button.setAttribute("aria-expanded", selectiveMode ? String(selected) : "true");
        if (selected) button.setAttribute("aria-current", "step");
        else button.removeAttribute("aria-current");
        if (mobileMode) button.setAttribute("aria-label", `${mobileLabel}, ${year}`);
        else button.removeAttribute("aria-label");
      });

      panels.forEach((panel, panelIndex) => {
        panel.hidden = selectiveMode && panelIndex !== safeIndex;
      });

      story.dataset.founderActive = String(safeIndex);
      updateStatus(safeIndex);
      updateMobileStageHeight(safeIndex);
      if (moveFocus) buttons[safeIndex].focus();
    };

    buttons.forEach((button, index) => {
      button.addEventListener("click", (event) => {
        if (window.performance.now() < suppressClickUntil) {
          event.preventDefault();
          return;
        }
        activate(index);
      });

      button.addEventListener("pointerenter", () => {
        if (desktop.matches && desktopHover.matches) activate(index);
      });

      button.addEventListener("focus", () => {
        if (desktop.matches || mobile.matches) activate(index);
      });

      button.addEventListener("keydown", (event) => {
        const selectiveMode = desktop.matches || mobile.matches;
        if (!selectiveMode) return;
        let targetIndex = null;
        if (event.key === "ArrowRight") targetIndex = index + 1;
        if (event.key === "ArrowLeft") targetIndex = index - 1;
        if (desktop.matches && event.key === "ArrowDown") targetIndex = index + 1;
        if (desktop.matches && event.key === "ArrowUp") targetIndex = index - 1;
        if (event.key === "Home") targetIndex = 0;
        if (event.key === "End") targetIndex = buttons.length - 1;
        if (targetIndex === null) return;
        event.preventDefault();
        activate(targetIndex, true);
      });
    });

    const finishGesture = (event) => {
      if (!gesture || event.pointerId !== gesture.pointerId) return;
      const deltaX = event.clientX - gesture.startX;
      const deltaY = event.clientY - gesture.startY;
      const horizontalSwipe = gesture.intent === "horizontal"
        && Math.abs(deltaX) >= SWIPE_DISTANCE
        && Math.abs(deltaX) > Math.abs(deltaY) * 1.2;

      if (horizontalSwipe) {
        activate(activeIndex() + (deltaX < 0 ? 1 : -1));
        suppressClickUntil = window.performance.now() + 360;
      }
      gesture = null;
    };

    timeline.addEventListener("pointerdown", (event) => {
      if (!mobile.matches || event.pointerType === "mouse" || !event.isPrimary) return;
      gesture = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        intent: null,
      };
      if (typeof timeline.setPointerCapture === "function") {
        timeline.setPointerCapture(event.pointerId);
      }
    });

    timeline.addEventListener("pointermove", (event) => {
      if (!gesture || event.pointerId !== gesture.pointerId) return;
      const deltaX = event.clientX - gesture.startX;
      const deltaY = event.clientY - gesture.startY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (!gesture.intent && Math.max(absX, absY) > 10) {
        if (absY > absX * 1.12) gesture.intent = "vertical";
        else if (absX > absY * 1.2) gesture.intent = "horizontal";
      }

      if (gesture.intent === "horizontal" && event.cancelable) event.preventDefault();
    }, { passive: false });

    timeline.addEventListener("pointerup", finishGesture);
    timeline.addEventListener("pointercancel", () => { gesture = null; });

    const syncLayout = () => activate(activeIndex());

    [desktop, mobile].forEach((query) => {
      if (typeof query.addEventListener === "function") {
        query.addEventListener("change", syncLayout);
      } else if (typeof query.addListener === "function") {
        query.addListener(syncLayout);
      }
    });

    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver(() => {
        if (mobile.matches) updateMobileStageHeight(activeIndex());
      });
      panels.forEach((panel) => resizeObserver.observe(panel));
    }

    activate(0);

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            story.classList.add("is-visible");
            observer.disconnect();
          }
        });
      }, { threshold: 0.12 });
      observer.observe(story);
    } else {
      story.classList.add("is-visible");
    }
  });
})();
