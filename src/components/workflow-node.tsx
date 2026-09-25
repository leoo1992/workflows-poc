'use client';

import {
  Handle,
  Position,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import type { WorkflowNodeData } from '@/lib/workflow';

export type WorkflowCanvasNode = Node<WorkflowNodeData, 'workflow'>;

const visual: Record<
  WorkflowNodeData['kind'],
  { icon: string; tone: string }
> = {
  trigger: { icon: '↯', tone: 'lime' },
  http: { icon: '↗', tone: 'violet' },
  condition: { icon: '?', tone: 'orange' },
  transform: { icon: 'ƒ', tone: 'cyan' },
  webhook: { icon: '⌁', tone: 'pink' },
  email: { icon: '@', tone: 'blue' },
  delay: { icon: '◷', tone: 'yellow' },
};

export function WorkflowNode({ data, selected }: NodeProps<WorkflowCanvasNode>) {
  const meta = visual[data.kind];

  return (
    <div
      className={`flow-node flow-node--${meta.tone} ${selected ? 'flow-node--selected' : ''}`}
    >
      <Handle className="flow-handle" type="target" position={Position.Left} />
      <div className="flow-node__icon" aria-hidden="true">
        {meta.icon}
      </div>
      <div className="flow-node__copy">
        <span>{data.subtitle}</span>
        <strong>{data.label}</strong>
      </div>
      <div className="flow-node__status" aria-label="Configurado">
        ✓
      </div>
      <Handle className="flow-handle" type="source" position={Position.Right} />
    </div>
  );
}
