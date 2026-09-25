export type NodeKind =
  | 'trigger'
  | 'http'
  | 'condition'
  | 'transform'
  | 'webhook'
  | 'email'
  | 'delay';

export interface WorkflowNodeData extends Record<string, unknown> {
  label: string;
  kind: NodeKind;
  subtitle: string;
  config: Record<string, string>;
}

export interface WorkflowGraphNode {
  id: string;
  data: WorkflowNodeData;
}

export interface WorkflowGraphEdge {
  id?: string;
  source: string;
  target: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ExecutionStep {
  nodeId: string;
  status: 'success';
  message: string;
}

export function createNodeId(kind: NodeKind, now = Date.now()) {
  return `${kind}-${now.toString(36)}`;
}

export function validateWorkflow(
  nodes: WorkflowGraphNode[],
  edges: WorkflowGraphEdge[],
): ValidationResult {
  const errors: string[] = [];

  if (nodes.length === 0) {
    errors.push('O workflow precisa ter pelo menos um node.');
    return { valid: false, errors };
  }

  if (!nodes.some((node) => node.data.kind === 'trigger')) {
    errors.push('Adicione pelo menos um gatilho para iniciar o workflow.');
  }

  const ids = new Set(nodes.map((node) => node.id));

  edges.forEach((edge) => {
    if (!ids.has(edge.source) || !ids.has(edge.target)) {
      errors.push('Existe uma conexão apontando para um node inexistente.');
    }
  });

  try {
    getExecutionOrder(nodes, edges);
  } catch {
    errors.push('O workflow contém um ciclo. Remova a conexão circular.');
  }

  return { valid: errors.length === 0, errors };
}

export function getExecutionOrder(
  nodes: WorkflowGraphNode[],
  edges: WorkflowGraphEdge[],
): string[] {
  const inDegree = new Map(nodes.map((node) => [node.id, 0]));
  const adjacency = new Map(nodes.map((node) => [node.id, [] as string[]]));

  edges.forEach((edge) => {
    if (!inDegree.has(edge.source) || !inDegree.has(edge.target)) return;
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    adjacency.get(edge.source)?.push(edge.target);
  });

  const queue = nodes
    .filter((node) => (inDegree.get(node.id) ?? 0) === 0)
    .map((node) => node.id);

  const order: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    order.push(current);

    adjacency.get(current)?.forEach((target) => {
      const nextDegree = (inDegree.get(target) ?? 0) - 1;
      inDegree.set(target, nextDegree);
      if (nextDegree === 0) queue.push(target);
    });
  }

  if (order.length !== nodes.length) {
    throw new Error('Workflow contains a cycle.');
  }

  return order;
}

export function simulateWorkflow(
  nodes: WorkflowGraphNode[],
  edges: WorkflowGraphEdge[],
): ExecutionStep[] {
  const validation = validateWorkflow(nodes, edges);

  if (!validation.valid) {
    throw new Error(validation.errors.join(' '));
  }

  const byId = new Map(nodes.map((node) => [node.id, node]));

  return getExecutionOrder(nodes, edges).map((nodeId) => {
    const node = byId.get(nodeId)!;

    const action: Record<NodeKind, string> = {
      trigger: 'Evento recebido',
      http: 'Requisição HTTP concluída',
      condition: 'Condição avaliada',
      transform: 'Dados transformados',
      webhook: 'Webhook enviado',
      email: 'E-mail preparado',
      delay: 'Espera concluída',
    };

    return {
      nodeId,
      status: 'success' as const,
      message: `${action[node.data.kind]} · ${node.data.label}`,
    };
  });
}
