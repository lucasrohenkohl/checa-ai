(function () {
  var display = document.querySelector(".bracelet-display");
  var screen = document.querySelector(".bracelet-screen strong");
  var screenText = document.querySelector(".bracelet-screen span");
  var cards = document.querySelectorAll("[data-estado]");
  if (!display || !screen || !screenText) return;

  var ESTADOS = {
    verde: { titulo: "VERDE", texto: "baixo risco observado", classe: "bracelet-verde" },
    amarelo: { titulo: "AMARELO", texto: "revise antes de continuar", classe: "bracelet-amarelo" },
    vermelho: { titulo: "VERMELHO", texto: "pare e confira", classe: "bracelet-vermelho" },
  };

  function aplicar(estado) {
    var e = ESTADOS[estado];
    if (!e) return;
    screen.textContent = e.titulo;
    screenText.textContent = e.texto;
    display.classList.remove("bracelet-verde", "bracelet-amarelo", "bracelet-vermelho");
    display.classList.add(e.classe);
    cards.forEach(function (c) {
      c.classList.toggle("ativo", c.getAttribute("data-estado") === estado);
    });
  }

  cards.forEach(function (c) {
    c.addEventListener("click", function () {
      aplicar(c.getAttribute("data-estado"));
    });
  });
})();