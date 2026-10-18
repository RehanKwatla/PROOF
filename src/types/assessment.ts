export type EventCategory =
  | 'navigation'
  | 'ai-prompt'
  | 'ai-response'
  | 'code'
  | 'test-fail'
  | 'test-pass'
  | 'question'
  | 'refactor'
  | 'submission';

export type RevisionId = 'R1' | 'R2';

export type EvidenceId = 'ev-failed-test' | 'ev-revision-r2' | 'ev-ai-exchange';

export type DiffLineKind = 'context' | 'add' | 'del';

export interface DiffLine {
  kind: DiffLineKind;
  oldNo: number | null;
  newNo: number | null;
  text: string;
}

export interface CodeAnnotation {
  line: number;
  tone: 'danger' | 'success' | 'info';
  text: string;
}

export interface CodeRevision {
  id: RevisionId;
  label: string;
  time: string;
  filename: string;
  language: string;
  summary: string;
  previous: RevisionId | null;
  additions: number;
  deletions: number;
  lines: DiffLine[];
  annotations: CodeAnnotation[];
  testResult: {
    passed: number;
    total: number;
    duration: string;
  };
}

export interface BuildEvent {
  id: string;
  seq: number;
  time: string;
  category: EventCategory;
  title: string;
  detail: string;
  ref: string;
  revision?: RevisionId;
  evidenceId?: EvidenceId;
}

export interface TestRun {
  id: string;
  label: string;
  time: string;
  revision: RevisionId;
  passed: boolean;
  summary: string;
  output: string;
}

export interface AiExchange {
  id: string;
  role: 'candidate' | 'ai';
  time: string;
  text: string;
  eventId: string;
  relatedRevision?: RevisionId;
}

export type EvidenceKind = 'test' | 'revision' | 'interaction';
export type EvidenceAction = 'output' | 'diff' | 'interaction';

export interface SupportingEvidenceItem {
  id: EvidenceId;
  kind: EvidenceKind;
  title: string;
  meta: string;
  detail: string;
  action: EvidenceAction;
  actionLabel: string;
  revision?: RevisionId;
  eventId: string;
}

export interface Finding {
  id: string;
  title: string;
  status: 'Demonstrated' | 'Partial' | 'Not observed';
  observation: string;
  confidence: 'High' | 'Medium' | 'Low';
  impact: 'High' | 'Medium' | 'Low';
  sourceLinks: number;
  aiContribution: {
    label: string;
    text: string;
  };
  uncertainty: {
    label: string;
    text: string;
  };
  tags: string[];
  evidence: SupportingEvidenceItem[];
}

export interface GraphNodeSpec {
  id: string;
  kind: EventCategory | 'start';
  label: string;
  meta: string;
  x: number;
  y: number;
  eventId?: string;
}

/**
 * Which connection point an edge uses on its endpoints. Every row in the graph
 * reads left→right, so an edge is either a straight horizontal run or a wrap
 * that steps down into the gap between rows. Naming the handles keeps React
 * Flow from routing an edge back through the very nodes it connects.
 */
export type GraphEdgeRoute = 'forward' | 'down';

export interface GraphEdgeSpec {
  id: string;
  source: string;
  target: string;
  variant: 'default' | 'retry';
  label?: string;
  route?: GraphEdgeRoute;
}

export interface CandidateInfo {
  name: string;
  initials: string;
  role: string;
  status: string;
  startedAt: string;
  duration: string;
  assessment: string;
  problem: string;
  submissionId: string;
}

export type MetricTone = 'neutral' | 'success' | 'accent' | 'violet' | 'amber';

export interface SummaryMetric {
  id: string;
  label: string;
  value: string;
  sub: string;
  tone: MetricTone;
}

export interface AssessmentData {
  candidate: CandidateInfo;
  events: BuildEvent[];
  revisions: CodeRevision[];
  testRuns: TestRun[];
  aiExchanges: AiExchange[];
  finding: Finding;
  graph: {
    nodes: GraphNodeSpec[];
    edges: GraphEdgeSpec[];
  };
  summary: SummaryMetric[];
  summaryMetrics?: SummaryMetric[];
}

export type DiffTab = 'evidence' | 'diff' | 'tests' | 'ai';
export type NavItemId =
  | 'overview'
  | 'buildtrail'
  | 'evidence-inspector'
  | 'decision-graph'
  | 'ai-interactions'
  | 'test-results'
  | 'code-revisions'
  | 'reports'
  | 'feedback';
