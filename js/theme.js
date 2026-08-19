(function () {
  var KEY = "checaai-theme";
  var toggle = document.getElementById("theme-toggle");
  if (!toggle) return;

  function save() {
    try {
      localStorage.setItem(KEY, toggle.checked ? "dark" : "light");
    } catch (e) {}
  }

  toggle.addEventListener("change", save);
})();