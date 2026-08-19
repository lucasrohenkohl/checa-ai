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
  if (url.pathname === "/") {
    serveStatic(res, "/index.html");
    return;
  }
  serveStatic(res, url.pathname);
});

server.listen(PORT, () => {
  console.log(`Checa aí rodando em http://localhost:${PORT}`);
});