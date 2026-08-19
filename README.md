# Checa aí — versão 3.0

Projeto multidisciplinar de conscientização sobre golpes, sites enganosos, phishing e riscos de compartilhamento de dados.

## Estrutura

- `index.html` — página inicial e identidade do projeto.
- `analisar.html` — interface do bot, chamado **Vigia**.
- `banco.html` — banco de dados (consulta via API).
- `comunidade.html` — perguntas, sinais e voluntários.
- `pulseira.html` — modo pulseira.
- `server.js` — servidor Node (sem dependências) que serve as páginas e a API do banco.
- `data/dados.db` — banco SQLite criado automaticamente no primeiro acesso (a pasta `data/` não vai para o Git).
- `docker-compose.yml` — expõe a porta 5000 e mantém o banco em um volume persistente.
- `css/reset.css` — reset base.
- `css/base.css` — sistema visual compartilhado.
- `css/home.css` — estilos da página inicial.
- `css/app.css` — estilos das páginas internas.
- `js/theme.js` — persistência do tema claro/escuro (localStorage).
- `js/banco.js` — carrega os registros da API e controla busca e filtros.
- `js/vigia.js` — envia o endereço para o analisador e atualiza o parecer.
- `js/comunidade.js` — lista e publica perguntas no banco.
- `js/pulseira.js` — alterna os estados da pulseira.
- `js/index.js` — input da página inicial leva o endereço para o Vigia.
- `assets/img/` — imagens fornecidas para os casos em destaque.

## Como rodar com Docker

```bash
docker compose up --build
```

Depois abra `http://localhost:5000` — ou o IP do servidor, se estiver em uma máquina remota.

Sem Docker, basta ter Node.js 24+ instalado:

```bash
node server.js   # acessa em http://localhost:5000
```

O banco fica em um volume do Docker (`checaai-dados`), então os registros sobrevivem a rebuilds. Para reiniciar do zero, apague o volume (`docker compose down -v`) e suba de novo.

## Deploy em um servidor com Docker + Portainer

1. Suba o projeto para um repositório (ex.: GitHub privado).
2. No servidor: `git clone <url-do-repo> && cd <pasta> && docker compose up -d --build`.
3. Pelo Portainer, o container aparece em **Containers** (logs, restart, etc.).
4. Alternativa só pela interface: no Portainer, **Stacks → Add stack → Repository**, cole o repositório — ele clona, faz o build e sobe sozinho.

## Banco de dados

O banco é SQLite, com a tabela `dominios`. O arquivo `data/dados.db` é criado e preenchido automaticamente no primeiro acesso.

### API

- `GET /api/domains` — lista todos os registros.
- `GET /api/domains?q=termo` — busca por domínio ou descrição.
- `GET /api/domains?filtro=confiavel` — filtros: `confiavel`, `atencao`, `fraude`, `phishing`, `compras`.
- `GET /api/analisar?url=endereco` — analisa um endereço e devolve o parecer (verde/amarelo/vermelho), pontuação, métricas, sinais e votos.
- `GET /api/perguntas` — lista as perguntas da comunidade.
- `POST /api/perguntas` — publica uma pergunta (`{"titulo": "...", "contexto": "..."}`).

Resposta:

```json
{
  "total": 2,
  "registros": [
    {
      "id": 1,
      "dominio": "gov.br",
      "descricao": "Domínio institucional amplamente reconhecido.",
      "status": "confiavel",
      "categorias": "",
      "registro": "referência oficial",
      "ultima_checagem": "17/08/2026",
      "risco": "baixo"
    }
  ]
}
```

## Identidade

Paleta principal: azul elétrico, amarelo de sinalização, vermelho de alerta, verde de confirmação, preto e off-white.

O site usa HTML, CSS e uma camada mínima de JavaScript. O layout é responsivo para desktop, tablets e celulares. O tema claro/escuro é controlado pelo próprio HTML/CSS e a escolha do usuário é lembrada no navegador.

## Observação de implementação

O banco de dados (`banco.html`), o Vigia (`analisar.html`) e a comunidade (`comunidade.html`) são alimentados por API real com SQLite. O Vigia cruza o endereço com os registros do banco e aplica heurísticas de domínio (IP, extensões e termos suspeitos, imitação de marca). A comunidade permite publicar perguntas que ficam salvas no banco.
