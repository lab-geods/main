/* GEO-DS | navigation and progressive technology tabs. No dependencies. */
(() => {
  "use strict";
  const doc = document,
    root = doc.documentElement;
  root.classList.add("js");
  const menu = doc.querySelector(".main-nav"),
    toggle = doc.querySelector(".menu-toggle");
  const compact = window.matchMedia("(max-width:1100px)");
  const closeMenu = () => {
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", toggle.dataset.openLabel);
    menu.classList.remove("is-open");
  };
  toggle.hidden = false;
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? toggle.dataset.closeLabel : toggle.dataset.openLabel);
    menu.classList.toggle("is-open", open);
  });
  menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => closeMenu()));
  doc.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      closeMenu();
      toggle.focus();
    }
  });
  doc.addEventListener("click", (event) => {
    if (!menu.contains(event.target) && !toggle.contains(event.target)) closeMenu();
  });
  compact.addEventListener("change", () => closeMenu());
  function adaptToggle() {
    toggle.hidden = !compact.matches;
  }
  compact.addEventListener("change", adaptToggle);
  adaptToggle();
  const tabs = [...doc.querySelectorAll('[role="tab"]')],
    panels = tabs.map((tab) => doc.getElementById(tab.getAttribute("aria-controls")));
  function select(index, focus = false) {
    tabs.forEach((tab, i) => {
      const active = i === index;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      panels[i].hidden = !active;
    });
    if (focus) tabs[index].focus();
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", (event) => {
      event.preventDefault();
      select(i);
    });
    tab.addEventListener("keydown", (event) => {
      let index = i;
      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          index = (i + 1) % tabs.length;
          break;
        case "ArrowLeft":
        case "ArrowUp":
          index = (i - 1 + tabs.length) % tabs.length;
          break;
        case "Home":
          index = 0;
          break;
        case "End":
          index = tabs.length - 1;
          break;
        default:
          return;
      }
      event.preventDefault();
      select(index, true);
    });
  });
  const requested = tabs.findIndex((tab) => tab.getAttribute("href") === location.hash);
  select(requested < 0 ? 0 : requested);
})();
