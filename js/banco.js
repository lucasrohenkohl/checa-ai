(function () {
  var grid = document.getElementById("registros");
  var countEl = document.getElementById("result-count");
  var input = document.getElementById("search-input");
  var filters = document.querySelectorAll(".filter");
  var activeFiltro = "";

  if (!grid) return;

  var STATUS = {
    confiavel: { label: "confiável", badge: "badge-green" },
    atencao: { label: "atenção", badge: "badge-yellow" },
    fraude: { label: "fraude", badge: "badge-red" },
  };
  var RISCO = {
    baixo: "status-green",
    medio: "status-yellow",
    alto: "status-red",
  };

  function esc(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function cardHTML(reg) {
    var st = STATUS[reg.status] || STATUS.atencao;
    var risco = RISCO[reg.risco] || "";
    return (
      '<article class="card site-card">' +
      '<div class="site-card-top"><span class="site-domain">' + esc(reg.dominio) + '</span><span class="badge ' + st.badge + '">' + st.label + "</span></div>" +
      "<p>" + esc(reg.descricao) + "</p>" +
      '<div class="site-evidence">' +
      "<div><span>Registro</span><span>" + esc(reg.registro) + "</span></div>" +
      "<div><span>Última checagem</span><span>" + esc(reg.ultima_checagem) + "</span></div>" +
      '<div><span>Risco</span><span class="' + risco + '">' + esc(reg.risco) + "</span></div>" +
      "</div>" +
      "</article>"
    );
  }

  function render(rows) {
    if (countEl) {
      countEl.textContent = rows.length === 1
        ? "1 registro encontrado"
        : rows.length + " registros encontrados";
    }
    if (!rows.length) {
      grid.innerHTML = '<div class="empty-state">Nenhum registro encontrado. Tente outro termo ou filtro.</div>';
      return;
    }
    grid.innerHTML = rows.map(cardHTML).join("");
  }

  function load() {
    grid.innerHTML = '<div class="empty-state">Carregando registros...</div>';
    var params = new URLSearchParams();
    if (activeFiltro) params.set("filtro", activeFiltro);
    if (input && input.value.trim()) params.set("q", input.value.trim());
    fetch("/api/domains?" + params.toString())
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        render(data.registros);
      })
      .catch(function () {
        grid.innerHTML = '<div class="empty-state">Não foi possível consultar o banco.</div>';
        if (countEl) countEl.textContent = "";
      });
  }

  if (input) input.addEventListener("input", load);

  filters.forEach(function (f) {
    f.addEventListener("click", function () {
      filters.forEach(function (x) {
        x.classList.remove("active");
      });
      f.classList.add("active");
      activeFiltro = f.getAttribute("data-filtro") || "";
      load();
    });
  });

  load();
})();