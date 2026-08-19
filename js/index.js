(function () {
  var input = document.getElementById("home-url");
  var check = document.getElementById("home-check");
  if (!input || !check) return;

  function ir() {
    var valor = input.value.trim();
    window.location.href = "analisar.html" + (valor ? "?url=" + encodeURIComponent(valor) : "#resultado");
  }

  check.addEventListener("click", ir);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") ir();
  });
})();