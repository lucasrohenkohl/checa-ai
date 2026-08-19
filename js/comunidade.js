(function () {
  var list = document.getElementById("question-list");
  var titulo = document.getElementById("titulo");
  var detalhes = document.getElementById("detalhes");
  var publish = document.getElementById("publish-button");
  var feedback = document.getElementById("form-feedback");
  if (!list) return;

  function esc(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function render(perguntas) {
    list.innerHTML = perguntas
      .map(function (p) {
        var tags = p.tags
          .split(",")
          .map(function (t) {
            return t.trim();
          })
          .filter(Boolean);
        tags.push(p.respostas + (p.respostas === 1 ? " resposta" : " respostas"));
        return (
          '<article class="card question"><h3>' +
          esc(p.titulo) +
          '</h3><div class="question-footer">' +
          tags.map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") +
          "</div></article>"
        );
      })
      .join("");
  }

  function carregar() {
    fetch("/api/perguntas")
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        render(data.perguntas);
      })
      .catch(function () {
        list.innerHTML = '<div class="empty-state">Não foi possível carregar as perguntas.</div>';
      });
  }

  function publicar() {
    var t = titulo.value.trim();
    var c = detalhes.value.trim();
    if (!t || !c) {
      feedback.textContent = "Preencha o título e o contexto.";
      feedback.className = "form-feedback error";
      return;
    }
    feedback.textContent = "Publicando...";
    feedback.className = "form-feedback";
    fetch("/api/perguntas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo: t, contexto: c }),
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        if (data.erro) throw new Error(data.erro);
        titulo.value = "";
        detalhes.value = "";
        feedback.textContent = "Pergunta publicada!";
        feedback.className = "form-feedback ok";
        carregar();
      })
      .catch(function (err) {
        feedback.textContent = err.message || "Não foi possível publicar. Tente novamente.";
        feedback.className = "form-feedback error";
      });
  }

  if (publish) publish.addEventListener("click", publicar);
  if (titulo && detalhes) {
    [titulo, detalhes].forEach(function (f) {
      f.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && f === titulo) publicar();
      });
    });
  }

  carregar();
})();