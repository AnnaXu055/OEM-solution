(() => {
  const routeMeta = {
    "oem-eu": "OEM-EU | Streamax OEM GSR Solutions",
    cms31: "CMS31 | Streamax OEM GSR Solutions",
    ess20: "ESS 2.0 | Streamax OEM GSR Solutions"
  };

  const views = [...document.querySelectorAll("[data-view]")];
  const tabs = [...document.querySelectorAll("[data-route]")];
  const select = document.querySelector("#solution-select");
  const viewer = document.querySelector("#image-viewer");
  const viewerStage = viewer?.querySelector(".image-dialog__stage");
  const viewerImage = viewerStage?.appendChild(document.createElement("img")) || null;
  const viewerClose = viewer?.querySelector("[data-viewer-close]");
  const viewerZoomIn = viewer?.querySelector("[data-viewer-zoom-in]");
  const viewerZoomOut = viewer?.querySelector("[data-viewer-zoom-out]");
  const viewerZoomReset = viewer?.querySelector("[data-viewer-zoom-reset]");
  const viewerZoomStatus = viewer?.querySelector("#viewer-zoom-status");
  let viewerTrigger = null;
  let viewerZoom = 1;
  let viewerFit = 1;
  let viewerNaturalWidth = 0;
  let viewerNaturalHeight = 0;
  let viewerRenderFrame = 0;

  if (viewerImage) {
    viewerImage.id = "viewer-image";
    viewerImage.alt = "";
  }

  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  const validRoute = (route) => Object.hasOwn(routeMeta, route);

  const routeFromHash = () => {
    const route = location.hash.slice(1);
    return validRoute(route) ? route : "oem-eu";
  };

  const hydrateView = (view) => {
    view.querySelectorAll("img[data-src]").forEach((image) => {
      image.src = image.dataset.src;
      if (image.dataset.srcset) image.srcset = image.dataset.srcset;
      image.removeAttribute("data-src");
      image.removeAttribute("data-srcset");
    });

    view.querySelectorAll("source[data-srcset]").forEach((source) => {
      source.srcset = source.dataset.srcset;
      source.removeAttribute("data-srcset");
    });
  };

  const moveToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  };

  const showView = (route, { focusHeading = false } = {}) => {
    const activeRoute = validRoute(route) ? route : "oem-eu";
    let activeView = null;

    views.forEach((view) => {
      const active = view.dataset.view === activeRoute;
      view.hidden = !active;
      view.setAttribute("aria-hidden", String(!active));
      if (active) activeView = view;
    });

    if (activeView) hydrateView(activeView);

    tabs.forEach((tab) => {
      const active = tab.dataset.route === activeRoute;
      tab.classList.toggle("is-active", active);
      if (active) tab.setAttribute("aria-current", "page");
      else tab.removeAttribute("aria-current");
    });

    if (select) select.value = activeRoute;
    document.title = routeMeta[activeRoute];
    moveToTop();

    if (focusHeading) {
      requestAnimationFrame(() => {
        activeView?.querySelector("h1")?.focus({ preventScroll: true });
      });
    }
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const route = tab.dataset.route;
      if (!route) return;
      if (routeFromHash() === route) {
        showView(route, { focusHeading: true });
        return;
      }
      location.hash = route;
    });
  });

  select?.addEventListener("change", () => {
    if (routeFromHash() === select.value) {
      showView(select.value, { focusHeading: true });
      return;
    }
    location.hash = select.value;
  });

  window.addEventListener("hashchange", () => {
    showView(routeFromHash(), { focusHeading: true });
  });

  const renderViewerZoom = ({ center = true } = {}) => {
    if (!viewerStage || !viewerImage || !viewerNaturalWidth || !viewerNaturalHeight) return;

    const previousScrollWidth = Math.max(viewerStage.scrollWidth, viewerStage.clientWidth);
    const previousScrollHeight = Math.max(viewerStage.scrollHeight, viewerStage.clientHeight);
    const previousCenterX = viewerStage.scrollLeft + viewerStage.clientWidth / 2;
    const previousCenterY = viewerStage.scrollTop + viewerStage.clientHeight / 2;
    const scale = viewerFit * viewerZoom;
    const width = Math.max(1, Math.round(viewerNaturalWidth * scale));
    const height = Math.max(1, Math.round(viewerNaturalHeight * scale));

    viewerImage.style.width = `${width}px`;
    viewerImage.style.height = `${height}px`;
    viewerStage.classList.toggle(
      "is-overflowing",
      width + 24 > viewerStage.clientWidth || height + 24 > viewerStage.clientHeight
    );
    if (viewerZoomStatus) {
      viewerZoomStatus.value = viewerZoom === 1 ? "Fit" : `${Math.round(viewerZoom * 100)}%`;
      viewerZoomStatus.textContent = viewerZoom === 1 ? "Fit" : `${Math.round(viewerZoom * 100)}%`;
    }

    cancelAnimationFrame(viewerRenderFrame);
    viewerRenderFrame = requestAnimationFrame(() => {
      if (!center) {
        viewerStage.scrollLeft = Math.max(0, (viewerStage.scrollWidth - viewerStage.clientWidth) / 2);
        viewerStage.scrollTop = Math.max(0, (viewerStage.scrollHeight - viewerStage.clientHeight) / 2);
        return;
      }

      const xRatio = previousCenterX / previousScrollWidth;
      const yRatio = previousCenterY / previousScrollHeight;
      viewerStage.scrollLeft = Math.max(0, xRatio * viewerStage.scrollWidth - viewerStage.clientWidth / 2);
      viewerStage.scrollTop = Math.max(0, yRatio * viewerStage.scrollHeight - viewerStage.clientHeight / 2);
    });
  };

  const fitViewerImage = () => {
    if (!viewerStage || !viewerImage?.naturalWidth || !viewerImage.naturalHeight) return;
    viewerNaturalWidth = viewerImage.naturalWidth;
    viewerNaturalHeight = viewerImage.naturalHeight;
    const availableWidth = Math.max(1, viewerStage.clientWidth - 24);
    const availableHeight = Math.max(1, viewerStage.clientHeight - 24);
    viewerFit = Math.min(1, availableWidth / viewerNaturalWidth, availableHeight / viewerNaturalHeight);
    viewerZoom = 1;
    renderViewerZoom({ center: false });
  };

  const setViewerZoom = (zoom) => {
    viewerZoom = Math.min(4, Math.max(1, zoom));
    renderViewerZoom();
  };

  const stepViewerZoom = (direction) => {
    const steps = [1, 1.25, 1.5, 2, 2.5, 3, 4];
    const currentIndex = steps.reduce((closest, value, index) => {
      return Math.abs(value - viewerZoom) < Math.abs(steps[closest] - viewerZoom) ? index : closest;
    }, 0);
    const nextIndex = Math.min(steps.length - 1, Math.max(0, currentIndex + direction));
    setViewerZoom(steps[nextIndex]);
  };

  document.querySelectorAll("[data-zoom-src]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!viewer || !viewerImage) return;
      viewerTrigger = button;
      viewerImage.removeAttribute("style");
      viewerStage?.classList.remove("is-overflowing");
      viewerImage.src = button.dataset.zoomSrc || "";
      viewerImage.alt = button.dataset.zoomAlt || "Image detail";
      viewer.showModal();
      viewerStage?.focus();
    });
  });

  viewerImage?.addEventListener("load", fitViewerImage);
  viewerZoomIn?.addEventListener("click", () => stepViewerZoom(1));
  viewerZoomOut?.addEventListener("click", () => stepViewerZoom(-1));
  viewerZoomReset?.addEventListener("click", () => setViewerZoom(1));

  const closeViewer = () => {
    if (viewer?.open) viewer.close();
  };

  viewerClose?.addEventListener("click", closeViewer);

  viewer?.addEventListener("click", (event) => {
    if (event.target === viewer) closeViewer();
  });

  viewer?.addEventListener("close", () => {
    if (viewerImage) {
      viewerImage.removeAttribute("style");
      viewerImage.removeAttribute("src");
    }
    viewerStage?.classList.remove("is-overflowing");
    viewerZoom = 1;
    viewerFit = 1;
    viewerTrigger?.focus();
    viewerTrigger = null;
  });

  const initialRoute = routeFromHash();
  if (!location.hash || !validRoute(location.hash.slice(1))) {
    history.replaceState(null, "", `#${initialRoute}`);
  }
  showView(initialRoute);
})();
