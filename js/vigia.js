(function () {
  var input = document.getElementById("site");
  var checkBtn = document.getElementById("check-button");
  var resultado = document.getElementById("resultado");
  if (!input || !checkBtn) return;

  function esc(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function aplicar(d) {
    var verdict = document.getElementById("analysis-verdict");
    var badge = document.getElementById("analysis-badge");
    var copy = document.getElementById("analysis-copy");
    var scoreNumber = document.getElementById("score-number");
    var scoreTrack = document.getElementById("score-track");
    var metricList = document.getElementById("metric-list");
    var signalGrid = document.getElementById("signal-grid");

    if (verdict) verdict.textContent = d.verdict;
    if (badge) {
      badge.className = "badge " + d.badgeClass;
      badge.textContent = d.label;
    }
    if (copy) copy.textContent = d.copy;
    if (scoreNumber) scoreNumber.textContent = d.score + " / 100";
    if (scoreTrack) scoreTrack.style.width = d.score + "%";
    if (metricList) {
      metricList.innerHTML = d.metricas
        .map(function (m) {
          return '<div class="metric"><span>' + esc(m.nome) + '</span><strong class="' + m.classe + '">' + esc(m.valor) + "</strong></div>";
        })
        .join("");
    }
    if (signalGrid) {
      signalGrid.innerHTML = d.sinais
        .map(function (s) {
          return (
            '<article class="signal-card"><div class="signal-card-head"><span class="badge ' +
            (s.classe === "good" ? "badge-green" : s.classe === "bad" ? "badge-red" : "badge-yellow") +
            '">' +
            s.badge +
            '</span><span class="signal-line ' +
            s.classe +
            '">' +
            (s.classe === "good" ? "sinal positivo" : s.classe === "bad" ? "sinal crítico" : "revisar") +
            "</span></div><h3>" +
            esc(s.titulo) +
            "</h3><p>" +
            esc(s.texto) +
            "</p></article>"
          );
        })
        .join("");
    }

    var vg = document.getElementById("vote-green");
    var vy = document.getElementById("vote-yellow");
    var vr = document.getElementById("vote-red");
    var nota = document.getElementById("community-note");
    if (vg) vg.innerHTML = "VERDE<br>" + d.votos.verde[0];
    if (vy) vy.innerHTML = "AMARELO<br>" + d.votos.verde[1];
    if (vr) vr.innerHTML = "VERMELHO<br>" + d.votos.verde[2];
    if (nota) nota.textContent = d.votos.nota;
  }

  function analisar() {
    var valor = input.value.trim();
    if (!valor) {
      input.focus();
      return;
    }
    fetch("/api/analisar?url=" + encodeURIComponent(valor))
      .then(function (r) {
        return r.json();
      })
      .then(aplicar)
      .catch(function () {
        if (resultado) {
          var v = document.getElementById("analysis-verdict");
          var c = document.getElementById("analysis-copy");
          if (v) v.textContent = "FALHA NA ANÁLISE";
          if (c) c.textContent = "O Vigia não conseguiu processar o endereço. Verifique a conexão e tente novamente.";
        }
      });
  }

  checkBtn.addEventListener("click", analisar);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") analisar();
  });

  var params = new URLSearchParams(window.location.search);
  var urlParam = params.get("url");
  if (urlParam) {
    input.value = urlParam;
    analisar();
  }
})();