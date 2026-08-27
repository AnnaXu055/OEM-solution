(() => {
  const routeMeta = {
    "oem-eu": "OEM-EU | Streamax OEM GSR Solutions",
    cms31: "CMS31 | Streamax OEM GSR Solutions",
    ess20: "ESS 2.0 | Streamax OEM GSR Solutions"
  };

  const views = [...document.querySelectorAll("[data-view]")];
  const tabs = [...document.querySelectorAll("[data-route]")];
  const picker = document.querySelector("#solution-picker");
  const pickerTrigger = picker?.querySelector(".mobile-viewer__trigger");
  const pickerValue = picker?.querySelector(".mobile-viewer__value");
  const pickerOptions = [...(picker?.querySelectorAll("[data-picker-route]") || [])];
  const viewer = document.querySelector("#image-viewer");
  const viewerStage = viewer?.querySelector(".image-dialog__stage");
  const viewerImage = viewerStage?.appendChild(document.createElement("img")) || null;
  const viewerTitle = viewer?.querySelector("#viewer-title");
  const viewerClose = viewer?.querySelector("[data-viewer-close]");
  const mountCanvas = document.querySelector("[data-mount-hotspots]");
  const mountHotspots = [...(mountCanvas?.querySelectorAll(".mount-hotspot") || [])];
  const mountCard = mountCanvas?.parentElement?.querySelector("[data-hotspot-card]");
  const mountCardTitle = mountCard?.querySelector("[data-hotspot-card-title]");
  const mountCardCopy = mountCard?.querySelector("[data-hotspot-card-copy]");
  const heroHotspots = [...document.querySelectorAll("[data-product-panel]")];
  const heroPanels = [...document.querySelectorAll("[data-hero-panel]")];
  let viewerTrigger = null;
  let viewerNaturalWidth = 0;
  let viewerNaturalHeight = 0;
  let viewerMode = "standard";
  let activeMountHotspot = null;
  let activeHeroPanel = null;

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

  const routeLabels = {
    "oem-eu": "OEM-EU",
    cms31: "CMS31",
    ess20: "ESS 2.0"
  };

  const setPickerOpen = (open) => {
    if (!picker || !pickerTrigger) return;
    picker.classList.toggle("is-open", open);
    pickerTrigger.setAttribute("aria-expanded", String(open));
    if (open) {
      const selected = pickerOptions.find((option) => option.getAttribute("aria-selected") === "true");
      (selected || pickerOptions[0])?.focus({ preventScroll: true });
    }
  };

  const syncPicker = (route) => {
    if (pickerValue) pickerValue.textContent = routeLabels[route] || routeLabels["oem-eu"];
    pickerOptions.forEach((option) => {
      option.setAttribute("aria-selected", String(option.dataset.pickerRoute === route));
    });
  };

  const closeMountCallout = () => {
    activeMountHotspot = null;
    mountCanvas?.classList.remove("has-callout");
    mountCard?.setAttribute("aria-hidden", "true");
    mountHotspots.forEach((hotspot) => hotspot.setAttribute("aria-pressed", "false"));
  };

  const showMountCallout = (hotspot) => {
    if (!mountCanvas || !mountCard || !mountCardTitle || !mountCardCopy) return;
    if (activeMountHotspot === hotspot) {
      closeMountCallout();
      return;
    }
    activeMountHotspot = hotspot;
    mountHotspots.forEach((item) => item.setAttribute("aria-pressed", String(item === hotspot)));
    mountCardTitle.textContent = hotspot.dataset.hotspotTitle || "CMS31 mount detail";
    mountCardCopy.textContent = hotspot.dataset.hotspotCopy || "";
    mountCard.setAttribute("aria-hidden", "false");
    mountCanvas.classList.add("has-callout");
  };

  mountHotspots.forEach((hotspot) => {
    hotspot.addEventListener("click", (event) => {
      event.stopPropagation();
      showMountCallout(hotspot);
    });
  });

  mountCanvas?.addEventListener("click", (event) => {
    if (!event.target.closest(".mount-hotspot, .mount-hotspot-card")) closeMountCallout();
  });

  const updateHeroPanel = (panelKey = null) => {
    activeHeroPanel = panelKey;
    heroHotspots.forEach((hotspot) => {
      hotspot.setAttribute("aria-expanded", String(hotspot.dataset.productPanel === panelKey));
    });
    heroPanels.forEach((panel) => {
      const active = panel.dataset.heroPanel === panelKey;
      panel.classList.toggle("is-active", active);
      panel.setAttribute("aria-hidden", String(!active));
      if (active) panel.removeAttribute("inert");
      else panel.setAttribute("inert", "");
    });
  };

  heroHotspots.forEach((hotspot) => {
    hotspot.addEventListener("click", () => {
      const panelKey = hotspot.dataset.productPanel;
      updateHeroPanel(activeHeroPanel === panelKey ? null : panelKey);
    });
  });

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

    syncPicker(activeRoute);
    setPickerOpen(false);
    closeMountCallout();
    updateHeroPanel(null);
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

  pickerTrigger?.addEventListener("click", () => {
    setPickerOpen(!picker?.classList.contains("is-open"));
  });

  pickerOptions.forEach((option) => {
    option.addEventListener("click", () => {
      const route = option.dataset.pickerRoute;
      if (!validRoute(route)) return;
      setPickerOpen(false);
      if (routeFromHash() === route) {
        showView(route, { focusHeading: true });
        return;
      }
      location.hash = route;
    });
  });

  pickerTrigger?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setPickerOpen(false);
  });

  document.addEventListener("click", (event) => {
    if (picker && !picker.contains(event.target)) setPickerOpen(false);
    if (mountCanvas && !mountCanvas.contains(event.target) && !mountCard?.contains(event.target)) closeMountCallout();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (picker?.classList.contains("is-open")) {
      setPickerOpen(false);
      pickerTrigger?.focus();
    }
    closeMountCallout();
  });

  window.addEventListener("hashchange", () => {
    showView(routeFromHash(), { focusHeading: true });
  });

  const sizeViewerImage = () => {
    if (!viewerStage || !viewerImage || !viewerNaturalWidth || !viewerNaturalHeight) return;

    const availableWidth = Math.max(1, viewerStage.clientWidth - 24);
    const availableHeight = Math.max(1, viewerStage.clientHeight - 24);
    const aspect = viewerNaturalWidth / viewerNaturalHeight;
    const isLandscapeZoom = viewerMode === "landscape" && window.matchMedia("(max-width: 760px)").matches;
    if (isLandscapeZoom) {
      viewerImage.removeAttribute("style");
      viewerStage.classList.remove("is-overflowing");
      viewerStage.scrollLeft = 0;
      viewerStage.scrollTop = 0;
      return;
    }
    const isLandscape = window.innerWidth > window.innerHeight;
    const heightFitWidth = availableHeight * aspect;
    const targetWidth = isLandscape
      ? Math.min(availableWidth, heightFitWidth)
      : Math.max(availableWidth, heightFitWidth);
    const width = Math.min(viewerNaturalWidth, Math.max(1, Math.round(targetWidth)));
    const height = Math.max(1, Math.round(width / aspect));

    viewerImage.style.width = `${width}px`;
    viewerImage.style.height = `${height}px`;
    viewerStage.classList.toggle(
      "is-overflowing",
      width + 24 > viewerStage.clientWidth || height + 24 > viewerStage.clientHeight
    );

    requestAnimationFrame(() => {
      viewerStage.scrollLeft = Math.max(0, (viewerStage.scrollWidth - viewerStage.clientWidth) / 2);
      viewerStage.scrollTop = Math.max(0, (viewerStage.scrollHeight - viewerStage.clientHeight) / 2);
    });
  };

  const prepareViewerImage = () => {
    if (!viewerStage || !viewerImage?.naturalWidth || !viewerImage.naturalHeight) return;
    viewerNaturalWidth = viewerImage.naturalWidth;
    viewerNaturalHeight = viewerImage.naturalHeight;
    sizeViewerImage();
  };

  document.querySelectorAll("[data-zoom-src]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!viewer || !viewerImage) return;
      viewerTrigger = button;
      viewerMode = button.dataset.zoomMode || "standard";
      viewer.dataset.viewerMode = viewerMode;
      if (viewerTitle) {
        viewerTitle.textContent = button.dataset.zoomCaption || button.dataset.zoomAlt || "Selected image";
      }
      viewerImage.removeAttribute("style");
      viewerStage?.classList.remove("is-overflowing");
      viewerImage.src = button.dataset.zoomSrc || "";
      viewerImage.alt = button.dataset.zoomAlt || "Selected image";
      viewer.showModal();
      viewerStage?.focus();
    });
  });

  viewerImage?.addEventListener("load", prepareViewerImage);
  window.addEventListener("resize", () => {
    if (viewer?.open) sizeViewerImage();
  });

  const closeViewer = () => {
    if (viewer?.open) viewer.close();
  };

  viewerClose?.addEventListener("click", closeViewer);

  viewer?.addEventListener("close", () => {
    if (viewerImage) {
      viewerImage.removeAttribute("style");
      viewerImage.removeAttribute("src");
    }
    viewerStage?.classList.remove("is-overflowing");
    delete viewer.dataset.viewerMode;
    viewerMode = "standard";
    if (viewerTitle) viewerTitle.textContent = "Selected image";
    viewerNaturalWidth = 0;
    viewerNaturalHeight = 0;
    viewerTrigger?.focus();
    viewerTrigger = null;
  });

  const initialRoute = routeFromHash();
  if (!location.hash || !validRoute(location.hash.slice(1))) {
    history.replaceState(null, "", `#${initialRoute}`);
  }
  showView(initialRoute);
})();
