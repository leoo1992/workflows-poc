'use client';

import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
} from '@xyflow/react';
import { useCallback, useMemo, useState } from 'react';
import {
  createNodeId,
  simulateWorkflow,
  validateWorkflow,
  type NodeKind,
  type WorkflowNodeData,
} from '@/lib/workflow';
import {
  WorkflowNode,
  type WorkflowCanvasNode,
} from './workflow-node';

const STORAGE_KEY = 'flowpilot-workflow-v1';

const palette: Array<{
  kind: NodeKind;
  label: string;
  description: string;
  icon: string;
}> = [
  { kind: 'trigger', label: 'Trigger', description: 'Inicia o fluxo', icon: '↯' },
  { kind: 'http', label: 'HTTP Request', description: 'Consome uma API', icon: '↗' },
  { kind: 'condition', label: 'Condition', description: 'Cria uma regra', icon: '?' },
  { kind: 'transform', label: 'Transform', description: 'Mapeia os dados', icon: 'ƒ' },
  { kind: 'webhook', label: 'Webhook', description: 'Envia um evento', icon: '⌁' },
  { kind: 'email', label: 'E-mail', description: 'Prepara uma mensagem', icon: '@' },
  { kind: 'delay', label: 'Delay', description: 'Aguarda antes de seguir', icon: '◷' },
];

const templates: Record<NodeKind, WorkflowNodeData> = {
  trigger: {
    kind: 'trigger',
    label: 'New event',
    subtitle: 'TRIGGER',
    config: { event: 'manual' },
  },
  http: {
    kind: 'http',
    label: 'Fetch API',
    subtitle: 'ACTION',
    config: { method: 'GET', url: 'https://api.example.com/data' },
  },
  condition: {
    kind: 'condition',
    label: 'Check condition',
    subtitle: 'LOGIC',
    config: { expression: 'score >= 80' },
  },
  transform: {
    kind: 'transform',
    label: 'Map payload',
    subtitle: 'DATA',
    config: { expression: '{ ...input, qualified: true }' },
  },
  webhook: {
    kind: 'webhook',
    label: 'Send webhook',
    subtitle: 'ACTION',
    config: { url: 'https://hooks.example.com/events' },
  },
  email: {
    kind: 'email',
    label: 'Notify team',
    subtitle: 'ACTION',
    config: { to: 'team@example.com', subject: 'FlowPilot event' },
  },
  delay: {
    kind: 'delay',
    label: 'Wait 5 seconds',
    subtitle: 'UTILITY',
    config: { duration: '5s' },
  },
};

const initialNodes: WorkflowCanvasNode[] = [
  {
    id: 'lead-trigger',
    type: 'workflow',
    position: { x: 80, y: 250 },
    data: {
      ...templates.trigger,
      label: 'Lead received',
      config: { event: 'form.submitted' },
    },
  },
  {
    id: 'enrich',
    type: 'workflow',
    position: { x: 360, y: 120 },
    data: {
      ...templates.http,
      label: 'Enrich company',
      config: { method: 'GET', url: 'https://api.example.com/company' },
    },
  },
  {
    id: 'qualify',
    type: 'workflow',
    position: { x: 650, y: 250 },
    data: {
      ...templates.condition,
      label: 'Score >= 80',
      config: { expression: 'score >= 80' },
    },
  },
  {
    id: 'normalize',
    type: 'workflow',
    position: { x: 930, y: 110 },
    data: {
      ...templates.transform,
      label: 'Normalize lead',
    },
  },
  {
    id: 'notify',
    type: 'workflow',
    position: { x: 1210, y: 250 },
    data: {
      ...templates.email,
      label: 'Notify sales',
      config: { to: 'sales@company.com', subject: 'Qualified lead' },
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e1',
    source: 'lead-trigger',
    target: 'enrich',
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'e2',
    source: 'enrich',
    target: 'qualify',
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'e3',
    source: 'qualify',
    target: 'normalize',
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'e4',
    source: 'normalize',
    target: 'notify',
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed },
  },
];

const nodeTypes = { workflow: WorkflowNode };

function Editor() {
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowCanvasNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [runLogs, setRunLogs] = useState<Array<{ nodeId: string; message: string }>>([]);
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState('Workflow pronto');
  const { screenToFlowPosition, fitView } = useReactFlow();

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedId) ?? null,
    [nodes, selectedId],
  );

  const validation = useMemo(
    () => validateWorkflow(nodes, edges),
    [nodes, edges],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((current) =>
        addEdge(
          {
            ...connection,
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed },
          },
          current,
        ),
      );
    },
    [setEdges],
  );

  const addNode = useCallback(
    (kind: NodeKind, position?: { x: number; y: number }) => {
      const id = createNodeId(kind);
      const offset = nodes.length * 24;
      const nextNode: WorkflowCanvasNode = {
        id,
        type: 'workflow',
        position: position ?? { x: 240 + offset, y: 180 + offset },
        data: structuredClone(templates[kind]),
      };

      setNodes((current) => [...current, nextNode]);
      setSelectedId(id);
      setNotice(`${templates[kind].label} adicionado`);
    },
    [nodes.length, setNodes],
  );

  const onDragStart = (event: React.DragEvent, kind: NodeKind) => {
    event.dataTransfer.setData('application/flowpilot-node', kind);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const kind = event.dataTransfer.getData(
        'application/flowpilot-node',
      ) as NodeKind;

      if (!templates[kind]) return;

      addNode(
        kind,
        screenToFlowPosition({ x: event.clientX, y: event.clientY }),
      );
    },
    [addNode, screenToFlowPosition],
  );

  const updateSelected = (
    field: 'label' | 'config',
    key: string,
    value: string,
  ) => {
    if (!selectedNode) return;

    setNodes((current) =>
      current.map((node) => {
        if (node.id !== selectedNode.id) return node;

        if (field === 'label') {
          return { ...node, data: { ...node.data, label: value } };
        }

        return {
          ...node,
          data: {
            ...node.data,
            config: { ...node.data.config, [key]: value },
          },
        };
      }),
    );
  };

  const saveWorkflow = () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ nodes, edges, savedAt: new Date().toISOString() }),
    );
    setNotice('Workflow salvo localmente');
  };

  const loadWorkflow = () => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setNotice('Nenhum workflow salvo ainda');
      return;
    }

    try {
      const parsed = JSON.parse(saved) as {
        nodes: WorkflowCanvasNode[];
        edges: Edge[];
      };
      setNodes(parsed.nodes);
      setEdges(parsed.edges);
      setSelectedId(null);
      window.requestAnimationFrame(() => fitView({ padding: 0.2 }));
      setNotice('Workflow restaurado');
    } catch {
      setNotice('Não foi possível ler o workflow salvo');
    }
  };

  const exportWorkflow = () => {
    const payload = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'flowpilot-workflow.json';
    link.click();
    URL.revokeObjectURL(url);
    setNotice('JSON exportado');
  };

  const runWorkflow = async () => {
    if (running) return;

    setRunLogs([]);

    if (!validation.valid) {
      setNotice(validation.errors[0] ?? 'Workflow inválido');
      return;
    }

    setRunning(true);
    setNotice('Executando workflow…');

    try {
      const steps = simulateWorkflow(nodes, edges);
      for (const step of steps) {
        await new Promise((resolve) => window.setTimeout(resolve, 260));
        setRunLogs((current) => [...current, step]);
      }
      setNotice(`Execução concluída · ${steps.length} etapas`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Falha na execução');
    } finally {
      setRunning(false);
    }
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="FlowPilot">
          <span className="brand-mark">
            <i />
            <i />
            <i />
          </span>
          <span>
            <strong>FlowPilot</strong>
            <small>Workflow automation studio</small>
          </span>
        </a>

        <div className="workflow-title">
          <span>WORKFLOW</span>
          <strong>Lead qualification</strong>
          <i className={validation.valid ? 'health health--ok' : 'health'} />
        </div>

        <div className="topbar-actions">
          <button className="button button--ghost" type="button" onClick={loadWorkflow}>
            Restaurar
          </button>
          <button className="button button--ghost" type="button" onClick={saveWorkflow}>
            Salvar
          </button>
          <button className="button button--ghost desktop-action" type="button" onClick={exportWorkflow}>
            Exportar JSON
          </button>
          <button
            className="button button--run"
            type="button"
            onClick={runWorkflow}
            disabled={running}
          >
            <span>{running ? 'Executando' : 'Executar'}</span>
            <b aria-hidden="true">▶</b>
          </button>
        </div>
      </header>

      <section className="workspace">
        <aside className="node-library">
          <div className="panel-heading">
            <span>01 / BLOCOS</span>
            <h2>Nodes</h2>
            <p>Arraste para o canvas ou clique para adicionar.</p>
          </div>

          <div className="node-list">
            {palette.map((item) => (
              <button
                className={`node-option node-option--${item.kind}`}
                draggable
                key={item.kind}
                type="button"
                onDragStart={(event) => onDragStart(event, item.kind)}
                onClick={() => addNode(item.kind)}
              >
                <span className="node-option__icon">{item.icon}</span>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
                <b>+</b>
              </button>
            ))}
          </div>

          <div className="library-foot">
            <span>TIP</span>
            <p>Conecte os handles laterais dos nodes para definir a ordem.</p>
          </div>
        </aside>

        <div
          className="canvas-wrap"
          onDrop={onDrop}
          onDragOver={(event) => event.preventDefault()}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedId(node.id)}
            onPaneClick={() => setSelectedId(null)}
            fitView
            minZoom={0.35}
            maxZoom={1.7}
            colorMode="dark"
            proOptions={{ hideAttribution: false }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={24}
              size={1.2}
              color="rgba(255,255,255,.10)"
            />
            <Controls position="bottom-left" />
            <MiniMap
              pannable
              zoomable
              position="bottom-right"
              nodeColor={(node) => {
                const kind = (node.data as WorkflowNodeData).kind;
                const colors: Record<NodeKind, string> = {
                  trigger: '#b8ff54',
                  http: '#8c7cff',
                  condition: '#ff7a4f',
                  transform: '#46d8d0',
                  webhook: '#ff65ad',
                  email: '#5f9dff',
                  delay: '#ffd65a',
                };
                return colors[kind];
              }}
            />
          </ReactFlow>

          <div className="canvas-label">
            <span>CANVAS / LIVE</span>
            <strong>{nodes.length} nodes · {edges.length} conexões</strong>
          </div>
        </div>

        <aside className="inspector">
          <div className="panel-heading">
            <span>02 / INSPECTOR</span>
            <h2>{selectedNode ? 'Configurar' : 'Execução'}</h2>
            <p>
              {selectedNode
                ? 'Edite o node selecionado.'
                : 'Selecione um node ou execute o workflow.'}
            </p>
          </div>

          {selectedNode ? (
            <div className="inspector-form">
              <label>
                <span>Nome</span>
                <input
                  value={selectedNode.data.label}
                  onChange={(event) =>
                    updateSelected('label', 'label', event.target.value)
                  }
                />
              </label>

              <div className="node-kind-badge">
                <span>TIPO</span>
                <strong>{selectedNode.data.kind}</strong>
              </div>

              {Object.entries(selectedNode.data.config).map(([key, value]) => (
                <label key={key}>
                  <span>{key}</span>
                  {value.length > 44 ? (
                    <textarea
                      rows={4}
                      value={value}
                      onChange={(event) =>
                        updateSelected('config', key, event.target.value)
                      }
                    />
                  ) : (
                    <input
                      value={value}
                      onChange={(event) =>
                        updateSelected('config', key, event.target.value)
                      }
                    />
                  )}
                </label>
              ))}

              <button
                className="danger-link"
                type="button"
                onClick={() => {
                  setNodes((current) =>
                    current.filter((node) => node.id !== selectedNode.id),
                  );
                  setEdges((current) =>
                    current.filter(
                      (edge) =>
                        edge.source !== selectedNode.id &&
                        edge.target !== selectedNode.id,
                    ),
                  );
                  setSelectedId(null);
                  setNotice('Node removido');
                }}
              >
                Remover node
              </button>
            </div>
          ) : (
            <>
              <div className="validation-card">
                <span className={validation.valid ? 'validation-dot validation-dot--ok' : 'validation-dot'} />
                <div>
                  <strong>{validation.valid ? 'Workflow válido' : 'Requer atenção'}</strong>
                  <p>
                    {validation.valid
                      ? 'Sem ciclos ou conexões quebradas.'
                      : validation.errors[0]}
                  </p>
                </div>
              </div>

              <div className="run-log">
                <div className="run-log__head">
                  <span>RUN LOG</span>
                  <b>{runLogs.length.toString().padStart(2, '0')}</b>
                </div>

                {runLogs.length === 0 ? (
                  <div className="empty-log">
                    <span>▶</span>
                    <p>Execute o fluxo para acompanhar cada etapa.</p>
                  </div>
                ) : (
                  <ol>
                    {runLogs.map((log, index) => (
                      <li key={`${log.nodeId}-${index}`}>
                        <span>{String(index + 1).padStart(2, '0')}</span>
                        <div>
                          <strong>{log.message}</strong>
                          <small>success · {log.nodeId}</small>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </>
          )}

          <div className="inspector-status" aria-live="polite">
            <i />
            <span>{notice}</span>
          </div>
        </aside>
      </section>
    </main>
  );
}

export function FlowPilot() {
  return (
    <ReactFlowProvider>
      <Editor />
    </ReactFlowProvider>
  );
}
