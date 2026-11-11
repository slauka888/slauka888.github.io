(() => {
  const showUpdateNotice = () => {
    if (document.querySelector("[data-sw-update-notice]")) return;
    const message = document.body.dataset.swUpdateText || "A fresh version of Kacher is ready. Refresh when convenient.";
    const notice = document.createElement("button");
    notice.type = "button";
    notice.dataset.swUpdateNotice = "1";
    notice.className = "sw-update-notice";
    notice.textContent = message;
    notice.addEventListener("click", () => window.location.reload());
    document.body.appendChild(notice);
  };

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").then(registration => {
        if (registration.waiting) showUpdateNotice();
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              showUpdateNotice();
              worker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      }).catch(() => {});
    });
    navigator.serviceWorker.addEventListener("message", event => {
      if (event.data && event.data.type === "KACHER_SW_UPDATED") showUpdateNotice();
    });
  }

  const send = (event, surface = document.body.dataset.surface || "site") => {
    if (!event) return;
    const payload = JSON.stringify({ event, surface });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/events", new Blob([payload], { type: "application/json" }));
      return;
    }
    fetch("/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
  };

  document.addEventListener("click", event => {
    const target = event.target.closest("[data-track]");
    if (target) send(target.dataset.track);
  });

  document.addEventListener("submit", event => {
    const target = event.target.closest("[data-track]");
    if (target) send(target.dataset.track);
  });

  const pricing = document.querySelector("[data-track-view]");
  if (pricing && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        send(pricing.dataset.trackView);
        observer.disconnect();
      }
    }, { threshold: 0.35 });
    observer.observe(pricing);
  }

  /* ── Payment method dropdown ─────────────────────────────────── */
  document.querySelectorAll(".pm-dropdown").forEach(dd => {
    const trigger = dd.querySelector(".pm-trigger");
    const menu = dd.querySelector(".pm-menu");
    const hidden = dd.closest("form").querySelector(".checkout-provider-hidden");
    const options = () => dd.querySelectorAll(".pm-option");
    let focusIdx = -1;

    const close = () => { dd.classList.remove("pm-open"); focusIdx = -1; options().forEach(o => o.classList.remove("pm-focus")); };
    const open = () => { dd.classList.add("pm-open"); };

    const select = (opt) => {
      const val = opt.dataset.value;
      const label = opt.dataset.label;
      const price = opt.dataset.price;
      const kind = opt.dataset.kind;
      if (hidden) hidden.value = val;
      trigger.querySelector(".pm-trigger-label").textContent = label;
      trigger.querySelector(".pm-trigger-price").textContent = price;
      trigger.querySelector(".pm-trigger-icon").textContent = kind === "crypto" ? "◆" : "●";
      options().forEach(o => o.classList.remove("pm-active"));
      opt.classList.add("pm-active");
      close();
    };

    trigger.addEventListener("click", e => {
      e.stopPropagation();
      dd.classList.contains("pm-open") ? close() : open();
    });

    menu.addEventListener("click", e => {
      const opt = e.target.closest(".pm-option");
      if (opt) select(opt);
    });

    dd.addEventListener("keydown", e => {
      const opts = options();
      if (e.key === "Escape") { close(); trigger.focus(); return; }
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); dd.classList.contains("pm-open") ? (focusIdx >= 0 && select(opts[focusIdx])) : open(); return; }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!dd.classList.contains("pm-open")) { open(); }
        opts.forEach(o => o.classList.remove("pm-focus"));
        focusIdx = e.key === "ArrowDown" ? Math.min(focusIdx + 1, opts.length - 1) : Math.max(focusIdx - 1, 0);
        opts[focusIdx].classList.add("pm-focus");
        opts[focusIdx].scrollIntoView({ block: "nearest" });
      }
    });

    document.addEventListener("click", e => { if (!dd.contains(e.target)) close(); });
  });
})();
