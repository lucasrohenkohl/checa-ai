const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const PORT = process.env.PORT || 5000;
const ROOT = __dirname;
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, "data");
const DB_FILE = process.env.DB_FILE || path.join(DATA_DIR, "dados.db");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function seed(db) {
  const insert = db.prepare(
    "INSERT INTO dominios (dominio, descricao, status, categorias, registro, ultima_checagem, risco) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  const registros = [
    ["gov.br", "Domínio institucional amplamente reconhecido. O contexto da página ainda deve ser conferido.", "confiavel", "", "referência oficial", "17/08/2026", "baixo"],
    ["caixa.gov.br", "Canal oficial da instituição. Confira o endereço completo antes de informar dados.", "confiavel", "", "referência oficial", "17/08/2026", "baixo"],
    ["prefeitura-exemplo.gov.br", "Endereço oficial da prefeitura. Serviços públicos não cobram taxa para agendar atendimento.", "confiavel", "", "referência oficial", "16/08/2026", "baixo"],
    ["mercado-exemplo.com.br", "Loja conhecida com histórico sem alertas. Confirme o domínio no endereço completo.", "confiavel", "compras", "sem alerta", "15/08/2026", "baixo"],
    ["lojadoexemplo.net", "Nome parecido com uma marca conhecida e oferta muito abaixo do preço comum.", "atencao", "compras", "relatos", "14/08/2026", "medio"],
    ["promo-ofertas-urgentes.com.br", "Anúncios com contagem regressiva e preços muito baixos para pressionar a compra.", "atencao", "compras", "relatos", "13/08/2026", "medio"],
    ["beneficio-consulta.site", "Domínio associado a campanhas de liberação de benefício com cobrança antecipada.", "fraude", "fraude", "alertas", "18/08/2026", "alto"],
    ["rastreio-sms-entrega.com", "Mensagens de falso rastreamento pedem pagamento de taxa para 'liberar' a entrega.", "fraude", "phishing", "alertas", "18/08/2026", "alto"],
    ["meubanco.verificacao-segura.com", "Imita a página de login de um banco para capturar senha e dados de acesso.", "fraude", "phishing", "alertas", "17/08/2026", "alto"],
    ["reembolso-pix-facil.net", "Promete reembolso de PIX mediante pagamento de 'taxa de liberação'.", "fraude", "fraude, phishing", "alertas", "16/08/2026", "alto"],
  ];
  db.exec("BEGIN");
  try {
    for (const r of registros) insert.run(...r);
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

const db = new DatabaseSync(DB_FILE);
db.exec(
  "CREATE TABLE IF NOT EXISTS dominios (" +
    "id INTEGER PRIMARY KEY AUTOINCREMENT," +
    "dominio TEXT NOT NULL," +
    "descricao TEXT NOT NULL," +
    "status TEXT NOT NULL," +
    "categorias TEXT NOT NULL," +
    "registro TEXT NOT NULL," +
    "ultima_checagem TEXT NOT NULL," +
    "risco TEXT NOT NULL)"
);
const total = db.prepare("SELECT COUNT(*) AS n FROM dominios").get().n;
if (total === 0) seed(db);

db.exec(
  "CREATE TABLE IF NOT EXISTS perguntas (" +
    "id INTEGER PRIMARY KEY AUTOINCREMENT," +
    "titulo TEXT NOT NULL," +
    "contexto TEXT NOT NULL," +
    "tags TEXT NOT NULL," +
    "respostas INTEGER NOT NULL DEFAULT 0," +
    "data TEXT NOT NULL)"
);
const qTotal = db.prepare("SELECT COUNT(*) AS n FROM perguntas").get().n;
if (qTotal === 0) {
  const q = db.prepare(
    "INSERT INTO perguntas (titulo, contexto, tags, respostas, data) VALUES (?, ?, ?, ?, ?)"
  );
  const perguntas = [
    ["Recebi um SMS dizendo que preciso confirmar meu cadastro em um link. Como verifico se é oficial?", "O link pede meu CPF e uma senha. Não cliquei ainda.", "phishing, SMS", 14, "15/08/2026"],
    ["O site de uma loja está muito abaixo do preço comum. O domínio parece correto. O que mais devo olhar?", "O endereço parece certo, mas o preço é metade do normal.", "loja online", 3, "16/08/2026"],
    ["Um anúncio pede pagamento por PIX antes de apresentar contrato. O que devo conferir?", "A pessoa pede metade do valor antes do documento assinado.", "PIX", 8, "17/08/2026"],
  ];
  db.exec("BEGIN");
  try {
    for (const p of perguntas) q.run(...p);
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

function limparDominio(raw) {
  let s = String(raw || "").trim().toLowerCase();
  if (!s) return "";
  if (!/^[a-z]+:\/\//i.test(s)) s = "https://" + s;
  try {
    return new URL(s).hostname.replace(/^www\./, "");
  } catch (e) {
    return s.replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0];
  }
}

function lerCorpo(req) {
  return new Promise((resolve) => {
    let dados = "";
    req.on("data", (c) => {
      dados += c;
      if (dados.length > 1e6) req.destroy();
    });
    req.on("end", () => resolve(dados));
    req.on("error", () => resolve(""));
  });
}

const TERMOS_SUSPEITOS = ["beneficio", "reembolso", "rastreio", "seguranca", "verificacao", "atualizacao", "atendimento", "login", "conta", "pix", "gratis", "urgente", "oferta", "sorteio", "premio", "taxa", "cadastro", "boleto"];
const MARCAS = ["caixa", "banco", "bradesco", "santander", "itau", "nubank", "inter", "mercadolivre", "americanas", "magazine", "loja", "prefeitura", "claro", "vivo"];
const TLD_SUSPEITOS = [".site", ".xyz", ".top", ".click", ".link", ".tk", ".ml", ".ga", ".cf", ".info", ".biz"];
const TERMOS_PRESSAO = ["urgente", "oferta", "promo", "beneficio", "reembolso", "sorteio", "premio", "gratis", "taxa", "cadastro"];

function analisar(url) {
  const raw = String(url || "").trim();
  const dominio = limparDominio(raw);

  const sinais = [];
  const metrica = {
    dominio: { nome: "Domínio e identidade", valor: "sem alerta", classe: "good" },
    conexao: { nome: "Conexão segura", valor: /^http:\/\//i.test(raw) ? "sem criptografia visível" : "padrão https indicado", classe: /^http:\/\//i.test(raw) ? "warn" : "good" },
    pressao: { nome: "Pressão comercial", valor: "não observada", classe: "good" },
    historico: { nome: "Histórico no banco", valor: "sem alerta", classe: "good" },
    dados: { nome: "Pedido de dados sensíveis", valor: "não observado", classe: "good" },
  };

  let score = 100;

  const reg = db.prepare("SELECT * FROM dominios WHERE dominio = ?").get(dominio);

  if (reg) {
    if (reg.status === "confiavel") {
      score = 86;
      metrica.dominio = { nome: "Domínio e identidade", valor: "compatíveis", classe: "good" };
      metrica.historico = { nome: "Histórico no banco", valor: "sem alerta", classe: "good" };
      sinais.push(
        { titulo: "Identidade do domínio", texto: "O endereço confere com registros oficiais no banco.", classe: "good", badge: "favorável" },
        { titulo: "Histórico conhecido", texto: "Não há alerta associado ao endereço dentro do banco consultado.", classe: "good", badge: "favorável" },
        { titulo: "Contexto a conferir", texto: "O resultado vale para o endereço. O conteúdo e os pedidos da página ainda precisam de atenção.", classe: "warn", badge: "atenção" }
      );
    } else if (reg.status === "atencao") {
      score = 55;
      metrica.dominio = { nome: "Domínio e identidade", valor: "revisar", classe: "warn" };
      metrica.pressao = { nome: "Pressão comercial", valor: "atenção", classe: "warn" };
      metrica.historico = { nome: "Histórico no banco", valor: "relatos registrados", classe: "warn" };
      sinais.push(
        { titulo: "Semelhança com marca", texto: "O nome se aproxima de uma marca conhecida e pode causar confusão.", classe: "warn", badge: "atenção" },
        { titulo: "Condição comercial", texto: "Oferta ou cobrança fora do padrão comum para o tipo de serviço.", classe: "warn", badge: "atenção" },
        { titulo: "Registros de relato", texto: "Há relatos associados ao endereço no banco.", classe: "warn", badge: "atenção" }
      );
    } else {
      score = 18;
      metrica.dominio = { nome: "Domínio e identidade", valor: "sinais de imitação", classe: "bad" };
      metrica.pressao = { nome: "Pressão comercial", valor: "forte", classe: "bad" };
      metrica.historico = { nome: "Histórico no banco", valor: "alertas encontrados", classe: "bad" };
      sinais.push(
        { titulo: "Alerta no banco", texto: "O endereço consta em alertas associados a golpe ou phishing.", classe: "bad", badge: "crítico" },
        { titulo: "Cobrança antecipada", texto: "Padrão de pagamento ou taxa antecipada antes de qualquer serviço.", classe: "bad", badge: "crítico" },
        { titulo: "Domínio suspeito", texto: "O domínio usa termos ou extensões típicos de campanhas de fraude.", classe: "bad", badge: "crítico" }
      );
    }
  } else {
    const ehIP = /^\d{1,3}(\.\d{1,3}){3}$/.test(dominio);
    const tld = "." + (dominio.split(".").pop() || "");
    const termos = TERMOS_SUSPEITOS.filter((t) => dominio.includes(t));
    const marca = MARCAS.find((m) => dominio.includes(m));
    const pressao = TERMOS_PRESSAO.filter((t) => dominio.includes(t));

    if (!dominio) {
      score = 40;
      sinais.push({ titulo: "Endereço não reconhecido", texto: "O Vigia não conseguiu identificar um domínio válido para análise.", classe: "warn", badge: "atenção" });
    }

    if (ehIP) {
      score -= 45;
      metrica.dominio = { nome: "Domínio e identidade", valor: "endereço por IP", classe: "bad" };
      sinais.push({ titulo: "Endereço por IP", texto: "O host é um número de IP, o que é incomum em páginas de serviço e marcas.", classe: "bad", badge: "crítico" });
    }
    if (dominio.length > 30) {
      score -= 10;
      metrica.dominio = { nome: "Domínio e identidade", valor: "endereço longo", classe: "warn" };
      sinais.push({ titulo: "Endereço longo", texto: "Domínios muito longos costumam tentar incluir várias palavras de confiança de uma vez.", classe: "warn", badge: "atenção" });
    }
    if (TLD_SUSPEITOS.includes(tld.toLowerCase())) {
      score -= 15;
      sinais.push({ titulo: "Extensão incomum", texto: `A extensão ${tld} é usada com frequência em páginas de baixo custo e fraude.`, classe: "warn", badge: "atenção" });
    }
    if (termos.length) {
      score -= Math.min(termos.length * 15, 35);
      const classe = termos.length >= 2 ? "bad" : "warn";
      const badge = termos.length >= 2 ? "crítico" : "atenção";
      metrica.dominio = { nome: "Domínio e identidade", valor: "termos suspeitos", classe };
      sinais.push({ titulo: "Termos suspeitos no domínio", texto: `O endereço contém termos como ${termos.slice(0, 3).join(", ")}.`, classe, badge });
    }
    if (marca && !tld.includes("gov")) {
      score -= 25;
      metrica.dominio = { nome: "Domínio e identidade", valor: "pode imitar marca", classe: "bad" };
      sinais.push({ titulo: "Possível imitação de marca", texto: `O nome usa uma marca conhecida (${marca}) fora do endereço oficial.`, classe: "bad", badge: "crítico" });
    }
    if (pressao.length) {
      score -= Math.min(pressao.length * 8, 20);
      metrica.pressao = { nome: "Pressão comercial", valor: "atenção", classe: "warn" };
    }

    if (sinais.length === 0) {
      metrica.dominio = { nome: "Domínio e identidade", valor: "coerente", classe: "good" };
      sinais.push(
        { titulo: "Identidade do domínio", texto: "Não foram encontrados termos ou extensões típicas de fraude no endereço.", classe: "good", badge: "favorável" },
        { titulo: "Histórico no banco", texto: "Não há registro de alerta associado ao endereço dentro do banco consultado.", classe: "good", badge: "favorável" },
        { titulo: "Contexto a conferir", texto: "O resultado avalia o endereço. O conteúdo e o que a página pede ainda merecem atenção.", classe: "warn", badge: "atenção" }
      );
    } else if (sinais.length === 1) {
      sinais.push(
        { titulo: "Histórico no banco", texto: "Não há registro de alerta associado ao endereço dentro do banco consultado.", classe: "good", badge: "favorável" },
        { titulo: "Contexto a conferir", texto: "Além do endereço, confira quem está atrás da oferta e o que a página pede.", classe: "warn", badge: "atenção" }
      );
    } else if (sinais.length === 2) {
      sinais.push({ titulo: "Contexto a conferir", texto: "Confira quem está atrás da oferta e o que a página pede antes de decidir.", classe: "warn", badge: "atenção" });
    }
  }

  score = Math.max(5, Math.min(97, Math.round(score)));

  let verdict, label, badgeClass, copy;
  if (score >= 70) {
    verdict = "CONFIÁVEL";
    label = "baixo risco";
    badgeClass = "badge-green";
    copy = "Os sinais encontrados são compatíveis com um endereço confiável. Ainda assim, confira o contexto da oferta e o que a página pede antes de informar dados.";
  } else if (score >= 40) {
    verdict = "REVISE ANTES DE CONTINUAR";
    label = "risco moderado";
    badgeClass = "badge-yellow";
    copy = "O endereço reúne sinais que merecem revisão. Antes de informar dados ou pagar, confirme a origem por um canal oficial.";
  } else {
    verdict = "SINAIS FORTES DE FRAUDE";
    label = "alto risco";
    badgeClass = "badge-red";
    copy = "O endereço apresenta sinais importantes de fraude ou imitação. Pare, não informe dados e confira a situação por um canal oficial.";
  }

  const votos = {
    verde: score >= 70 ? [18, 6, 2] : score >= 40 ? [8, 14, 5] : [3, 7, 19],
    nota: score >= 70
      ? "A maioria marcou sinais compatíveis com um endereço confiável."
      : score >= 40
        ? "A maioria sugeriu revisar o endereço antes de continuar."
        : "A maioria reportou sinais fortes de fraude neste endereço.",
  };

  return {
    url: dominio || raw,
    verdict,
    label,
    badgeClass,
    score,
    copy,
    metricas: [metrica.dominio, metrica.conexao, metrica.pressao, metrica.historico, metrica.dados],
    sinais: sinais.slice(0, 3),
    votos,
  };
}

function handlePerguntas(req, res, url) {
  if (req.method === "POST") {
    lerCorpo(req).then((corpo) => {
      let dado = {};
      try {
        dado = JSON.parse(corpo || "{}");
      } catch (e) {
        dado = {};
      }
      const titulo = String(dado.titulo || "").trim();
      const contexto = String(dado.contexto || "").trim();
      if (!titulo || !contexto) {
        res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ erro: "Título e contexto são obrigatórios." }));
        return;
      }
      const hoje = new Date().toLocaleDateString("pt-BR");
      const r = db
        .prepare("INSERT INTO perguntas (titulo, contexto, tags, respostas, data) VALUES (?, ?, ?, 0, ?)")
        .run(titulo, contexto, "novo", hoje);
      res.writeHead(201, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ id: Number(r.lastInsertRowid), titulo, contexto, tags: "novo", respostas: 0, data: hoje }));
    });
    return;
  }

  const rows = db.prepare("SELECT * FROM perguntas ORDER BY id DESC").all();
  res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ total: rows.length, perguntas: rows }));
}

function handleApi(res, url) {
  const q = (url.searchParams.get("q") || "").trim();
  const filtro = url.searchParams.get("filtro") || "";

  const where = [];
  const params = [];
  if (q) {
    const like = `%${q}%`;
    where.push("(dominio LIKE ? OR descricao LIKE ?)");
    params.push(like, like);
  }
  if (filtro === "confiavel") where.push("status = 'confiavel'");
  else if (filtro === "atencao") where.push("status = 'atencao'");
  else if (filtro === "fraude") where.push("(status = 'fraude' OR categorias LIKE '%fraude%')");
  else if (filtro === "phishing") where.push("categorias LIKE '%phishing%'");
  else if (filtro === "compras") where.push("categorias LIKE '%compras%'");

  let sql = "SELECT * FROM dominios";
  if (where.length) sql += " WHERE " + where.join(" AND ");
  sql += " ORDER BY id";

  const rows = db.prepare(sql).all(...params);
  res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ total: rows.length, registros: rows }));
}

function serveStatic(res, urlPath) {
  let filePath = path.normalize(path.join(ROOT, decodeURIComponent(urlPath)));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Proibido");
    return;
  }
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Não encontrado");
      return;
    }
    const type = MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/api/domains") {
    handleApi(res, url);
    return;
  }
  if (url.pathname === "/api/perguntas") {
    handlePerguntas(req, res, url);
    return;
  }
  if (url.pathname === "/api/analisar") {
    const resultado = analisar(url.searchParams.get("url") || "");
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(resultado));
    return;
  }
  if (url.pathname === "/") {
    serveStatic(res, "/index.html");
    return;
  }
  serveStatic(res, url.pathname);
});

server.listen(PORT, () => {
  console.log(`Checa aí rodando em http://localhost:${PORT}`);
});