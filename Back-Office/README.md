# GoEverywhere — Back-Office

Painel de administração em **Vue 3 + Vite**, alinhado com os layouts exportados do Figma em `templatr_figma/` (sidebar escura, navegação principal, breadcrumbs, páginas de relatórios, produtos, estafetas, mapa, clientes e login).

## Desenvolvimento

```bash
cd Back-Office
npm install
npm run dev
```

A app corre em **http://localhost:5174** (o Front-Office costuma usar 5173).

## Build

```bash
npm run build
npm run preview
```

## Requisitos LEGSI (implementação neste módulo)

| ID | Descrição |
|----|-----------|
| RF14 | Login **Google OAuth 2.0** (GIS com `VITE_GOOGLE_CLIENT_ID`) + **email/password**; sem client ID há botão demo Google. |
| RF15 | **Pedidos**: filtros estado, prioridade 1–5, datas, tipo, zona + pesquisa. |
| RF16–RF20 | **Detalhe do pedido** (`/orders/:id`): aprovar (loja Continente, custo, ETA, recursos), rejeitar (justificação + email simulado), pedir info (email + estado), atribuir estafeta na zona, prioridade com **alerta** se P5. |
| RF21–RF25 | **Estafetas**: registo completo (RF21), edição pós-verificação, estados E-01…E-06, online/offline e limite entregas, **detalhe** com stats e documentos. |
| RF26–RF28 | **Mapa**: Leaflet, pins animados, painel estafetas / painel encomendas. |
| RF29 | **Dashboard**: 4 KPIs, barras, volume horário, donut estados, avaliações, atividade, entregas por área. |
| RF30 | **Relatórios**: receita 6 meses, packs, zonas, cancelamento, **export CSV**. |
| RF31 | **Clientes**: contacto, cidade, encomendas, gasto, última encomenda, avaliação média. |

Emails são **simulados** (lista em memória + toast). Dados em `logisticsStore.js` (demo).

## Autenticação

Sessão em `localStorage` (`go_bo_session` + `go_bo_user`). **Sair** limpa tudo.

## Variáveis de ambiente

Copia `.env.example` para `.env` e ajusta:

- `VITE_FRONT_OFFICE_URL` — usado nos links «Voltar ao GoGummies» / «Voltar ao site GoGummies».

## Estrutura

- `src/layouts/AdminLayout.vue` — shell com sidebar, top bar, breadcrumb
- `src/views/` — Dashboard, Produtos, Encomendas, Estafetas (+ novo estafeta), Mapa (Leaflet/OSM), Clientes, Relatórios, Login
- `src/styles/bo-tokens.css` — tokens de cor e tipografia (base Figma + refinamentos)

## Nota de design

Cores base: sidebar `#252b3d`, fundo `#f5f6fa`, marca `#1b8a4a`. Podes ajustar tudo em `bo-tokens.css`.

## Auditoria / enquadramento

- **Shell**: subtítulo «Centro Logístico» na sidebar, conteúdo limitado a `--bo-content-max` (1400px), breadcrumbs com ligação de volta em detalhe de pedido/estafeta.
- **Pesquisa global**: na top bar, **Enter** abre **Pedidos** com o termo em `?q=`.
- **Copy**: textos de interface sem referências «RF»; requisitos LEGSI ficam documentados na tabela acima.

### Para produção (ainda não no código)

API REST ou GraphQL, base de dados, envio SMTP real, validação server-side do JWT Google, roles (admin vs gestor), testes e CI.
