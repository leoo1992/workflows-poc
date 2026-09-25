import { describe, expect, it } from 'vitest';
import {
  createNodeId,
  getExecutionOrder,
  simulateWorkflow,
  validateWorkflow,
  type WorkflowGraphNode,
} from './workflow';

const nodes: WorkflowGraphNode[] = [
  {
    id: 'trigger',
    data: {
      label: 'Form submitted',
      kind: 'trigger',
      subtitle: 'Trigger',
      config: {},
    },
  },
  {
    id: 'condition',
    data: {
      label: 'Score > 80',
      kind: 'condition',
      subtitle: 'Rule',
      config: {},
    },
  },
  {
    id: 'email',
    data: {
      label: 'Notify sales',
      kind: 'email',
      subtitle: 'Action',
      config: {},
    },
  },
];

describe('workflow engine', () => {
  it('returns a topological execution order', () => {
    const order = getExecutionOrder(nodes, [
      { source: 'trigger', target: 'condition' },
      { source: 'condition', target: 'email' },
    ]);

    expect(order).toEqual(['trigger', 'condition', 'email']);
  });

  it('detects circular workflows', () => {
    const result = validateWorkflow(nodes, [
      { source: 'trigger', target: 'condition' },
      { source: 'condition', target: 'email' },
      { source: 'email', target: 'trigger' },
    ]);

    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('ciclo');
  });

  it('requires a trigger', () => {
    const result = validateWorkflow(nodes.slice(1), []);
    expect(result.valid).toBe(false);
  });

  it('creates execution log entries', () => {
    const result = simulateWorkflow(nodes, [
      { source: 'trigger', target: 'condition' },
      { source: 'condition', target: 'email' },
    ]);

    expect(result).toHaveLength(3);
    expect(result[2]?.message).toContain('Notify sales');
  });

  it('creates stable ids for a supplied timestamp', () => {
    expect(createNodeId('http', 123)).toBe('http-3f');
  });
});
