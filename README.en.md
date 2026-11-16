# FlowPilot

FlowPilot is a visual workflow editor inspired by node-based automation tools. Users can build a flow on a canvas, connect and configure nodes, validate the graph, and simulate execution.

## Features
- Canvas with zoom, pan, selection, and MiniMap
- Drag-and-drop node creation
- Trigger, HTTP Request, Condition, Transform, Webhook, Email, and Delay nodes
- Graph validation and cycle detection
- Simulated topological execution and run log
- Local persistence and JSON export

## Stack
- Next.js 16, React 19, TypeScript
- React Flow / XYFlow
- Vitest and ESLint

## Run
Requires Node.js 22.12 or later.

```bash
npm install
npm run dev
```

Open http://localhost:3000. Quality checks: `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.
