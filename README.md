# FlowPilot

FlowPilot é um **editor visual de workflows** inspirado em ferramentas de automação por nodes. O projeto foi criado como uma POC de produto: o usuário monta um fluxo no canvas, conecta etapas, configura cada node, valida a estrutura e acompanha uma execução simulada.

## Principais recursos

- Canvas visual com zoom, pan, seleção e MiniMap.
- Drag & drop e inclusão por clique.
- 7 tipos de nodes: Trigger, HTTP Request, Condition, Transform, Webhook, E-mail e Delay.
- Conexões visuais entre nodes.
- Inspector para editar nome e configurações.
- Validação de gatilho, conexões inválidas e ciclos.
- Simulação de execução em ordem topológica.
- Run log progressivo.
- Persistência local com `localStorage`.
- Exportação do workflow em JSON.
- Layout responsivo para desktop, tablet e mobile.
- Testes unitários do motor do workflow.
- CI com typecheck, ESLint, testes e build.
- Dockerfile pronto para execução em container.

## Stack

- Next.js 16
- React 19
- TypeScript
- React Flow / XYFlow
- Vitest
- ESLint

## Executar localmente

Requisitos: Node.js 22.12 ou superior.

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## Qualidade

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Docker

```bash
docker build -t flowpilot .
docker run --rm -p 3000:3000 flowpilot
```

## Arquitetura

```text
src/
├── app/
│   ├── globals.css
│   ├── icon.svg
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── flow-pilot.tsx
│   └── workflow-node.tsx
└── lib/
    ├── workflow.ts
    └── workflow.test.ts
```

O motor em `src/lib/workflow.ts` é independente da UI. Ele valida o grafo, detecta ciclos, calcula a ordem topológica e gera as etapas da execução simulada.

## Próximos passos

- Execução real de HTTP/Webhook através de um backend seguro.
- Branches TRUE/FALSE no node Condition.
- Histórico e versionamento de workflows.
- Templates prontos.
- Autenticação e persistência remota.
- Webhooks de entrada.
- Integrações com Gmail, Slack, GitHub e bancos de dados.
- Undo/redo e atalhos avançados.

## Segurança

Esta POC **não executa URLs arbitrárias no servidor**. A execução é simulada no navegador para evitar SSRF, vazamento de credenciais ou chamadas externas inesperadas.

## Licença

MIT © 2026 Leonardo Santos Custódio.
