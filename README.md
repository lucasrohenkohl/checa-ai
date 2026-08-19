# Checa aí — versão 2.0

Projeto multidisciplinar de conscientização sobre golpes, sites enganosos, phishing e riscos de compartilhamento de dados.

## Estrutura

- `index.html` — página inicial e identidade do projeto.
- `analisar.html` — interface do bot, chamado **Vigia**.
- `banco.html` — banco de dados (consulta via API).
- `comunidade.html` — perguntas, sinais e voluntários.
- `pulseira.html` — modo pulseira.
- `server.js` — servidor Node (sem dependências) que serve as páginas e a API do banco.
- `data/dados.db` — banco SQLite criado automaticamente no primeiro acesso (a pasta `data/` não vai para o Git).
- `docker-compose.yml` — expõe a porta 80 e mantém o banco em um volume persistente.
- `css/reset.css` — reset base.
- `css/base.css` — sistema visual compartilhado.
- `css/home.css` — estilos da página inicial.
- `css/app.css` — estilos das páginas internas.
- `js/theme.js` — persistência do tema claro/escuro (localStorage).
- `js/banco.js` — carrega os registros da API e controla busca e filtros.
- `assets/img/` — imagens fornecidas para os casos em destaque.

## Como rodar com Docker

```bash
docker compose up --build
```

Depois abra `http://localhost` (porta 80) — ou o IP do servidor, se estiver em uma máquina remota.

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

Os campos do Vigia e da comunidade desta entrega são interfaces demonstrativas. O banco de dados (`banco.html`) já é alimentado por uma API real. A arquitetura visual foi preparada para que novas camadas de backend/API possam alimentar as mesmas telas sem precisar reconstruir o design.