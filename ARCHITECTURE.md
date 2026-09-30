# Arquitetura

O FlowPilot usa Next.js no frontend e React Flow para modelar e visualizar workflows.

## Camadas

- **Presentation**: páginas e componentes Next.js/React.
- **Workflow domain**: modelo, regras e manipulação dos nós/conexões.
- **Delivery**: build Next.js, container Docker e GitHub Actions.

O pipeline valida type checking, lint, testes, cobertura mínima de 80% e build.
