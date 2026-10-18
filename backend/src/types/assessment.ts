import { z } from 'zod';

// ============================================================================
// VERBATIM TYPESCRIPT TYPES FROM FRONTEND_CONTRACT.md
// ============================================================================

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

export type RevisionId = 'R1' | 'R2' | string;

export type EvidenceId = 'ev-failed-test' | 'ev-revision-r2' | 'ev-ai-exchange' | string;

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

// ============================================================================
// ZOD VALIDATION SCHEMAS FOR API INPUTS & STRUCTURED LLM OUTPUTS
// ============================================================================

export const RunTestRequestSchema = z.object({
  revisionId: z.string().min(1, 'revisionId is required'),
  code: z.string().min(1, 'code is required'),
});
export type RunTestRequest = z.infer<typeof RunTestRequestSchema>;

export const AiCoachRequestSchema = z.object({
  prompt: z.string().min(1, 'prompt is required'),
  contextRevisionId: z.string().optional(),
});
export type AiCoachRequest = z.infer<typeof AiCoachRequestSchema>;

export const StartSessionRequestSchema = z.object({
  assessmentId: z.string().optional(),
  taskTitle: z.string().optional(),
  timeLimit: z.string().optional(),
  aiPolicyLevel: z.number().int().min(1).max(4).default(3),
  recordingDisclosureAccepted: z.boolean().refine((val) => val === true, {
    message: 'recordingDisclosureAccepted must be true to start the assessment',
  }),
});
export type StartSessionRequest = z.infer<typeof StartSessionRequestSchema>;

export const IngestEventRequestSchema = z.object({
  category: z.enum([
    'navigation',
    'ai-prompt',
    'ai-response',
    'code',
    'test-fail',
    'test-pass',
    'question',
    'refactor',
    'submission',
  ]),
  title: z.string().min(1),
  detail: z.string().min(1),
  ref: z.string().optional(),
  revision: z.string().optional(),
  evidenceId: z.string().optional(),
  timestamp: z.string().optional(),
});
export type IngestEventRequest = z.infer<typeof IngestEventRequestSchema>;

export const SaveRevisionRequestSchema = z.object({
  revisionId: z.string().min(1),
  label: z.string().min(1),
  filename: z.string().default('solution.py'),
  language: z.string().default('python'),
  summary: z.string().min(1),
  previous: z.string().nullable().optional(),
  code: z.string(),
  annotations: z
    .array(
      z.object({
        line: z.number().int(),
        tone: z.enum(['danger', 'success', 'info']),
        text: z.string(),
      }),
    )
    .optional(),
  passedCount: z.number().int().optional(),
  totalCount: z.number().int().optional(),
});
export type SaveRevisionRequest = z.infer<typeof SaveRevisionRequestSchema>;

export const RecordTestRunRequestSchema = z.object({
  revisionId: z.string().min(1),
  label: z.string().optional(),
  passed: z.boolean(),
  summary: z.string(),
  output: z.string(),
});
export type RecordTestRunRequest = z.infer<typeof RecordTestRunRequestSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RegisterRequestSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['candidate', 'recruiter']).default('candidate'),
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const SelectRepoRequestSchema = z.object({
  repoFullName: z.string().min(1, 'Repository full name is required'),
  defaultBranch: z.string().optional().default('main'),
  sessionId: z.string().optional(),
});
export type SelectRepoRequest = z.infer<typeof SelectRepoRequestSchema>;

