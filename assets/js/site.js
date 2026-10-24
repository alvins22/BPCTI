// BPCTI — small progressive enhancements. The site works without JS.
(function () {
  // Mobile menu
  var menuBtn = document.querySelector(".menu-btn");
  var nav = document.getElementById("site-nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menuBtn.textContent = open ? "Close" : "Menu";
    });
  }

  // Programs dropdown (click / keyboard)
  document.querySelectorAll(".has-sub").forEach(function (li) {
    var btn = li.querySelector(".sub-toggle");
    if (!btn) return;
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = li.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    li.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { li.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); btn.focus(); }
    });
  });
  document.addEventListener("click", function () {
    document.querySelectorAll(".has-sub.open").forEach(function (li) {
      li.classList.remove("open");
      var b = li.querySelector(".sub-toggle"); if (b) b.setAttribute("aria-expanded", "false");
    });
  });

  // Curriculum: expand / collapse all
  var toggleAll = document.querySelector("[data-toggle-weeks]");
  if (toggleAll) {
    var weeks = document.querySelectorAll(".week");
    toggleAll.addEventListener("click", function () {
      var anyClosed = Array.prototype.some.call(weeks, function (d) { return !d.open; });
      weeks.forEach(function (d) { d.open = anyClosed; });
      toggleAll.textContent = anyClosed ? "Collapse all weeks" : "Expand all weeks";
      toggleAll.setAttribute("aria-expanded", anyClosed ? "true" : "false");
    });
  }
})();
