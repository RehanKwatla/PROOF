import {
  Award,
  CheckCircle2,
  Compass,
  MessageSquare,
  Sparkles,
  Target,
} from 'lucide-react';
import type { AssessmentData } from '../../types/assessment';
import { Badge, Panel } from '../Panel';

interface FeedbackViewProps {
  data: AssessmentData;
}

export function FeedbackView({ data }: FeedbackViewProps) {
  const { candidate } = data;

  const strengths = [
    {
      title: 'Targeted Edge-Case Diagnosis',
      description:
        'When your search implementation returned an empty list for blank queries, you quickly identified that empty query strings should return the complete catalog rather than zero items.',
    },
    {
      title: 'Corrective Revision & State Preservation',
      description:
        'In your corrective revision, you resolved the empty-query handling and ensured that active filter states remain preserved across task status updates, achieving a 100% automated test pass rate.',
    },
    {
      title: 'Disciplined AI Verification',
      description:
        'You leveraged the AI Coach effectively under Level 3 Verify guidance—asking focused conceptual questions about API conventions rather than requesting solution code—keeping your problem solving authentic.',
    },
  ];

  const practiceRecommendations = [
    {
      topic: 'Empty-Input Semantics in Filter & Search APIs',
      action:
        'Define explicit boundary contracts for search and filter functions when passed empty strings, whitespace, or null values to avoid unexpected empty collections.',
      difficulty: 'Medium',
    },
    {
      topic: 'Defensive Input Validation (Empty Titles & Unknown IDs)',
      action:
        'Enforce boundary guards and raise clear domain exceptions when attempting to update non-existent task IDs or when creating tasks with blank titles.',
      difficulty: 'Introductory',
    },
    {
      topic: 'Test-First Edge-Case Coverage (Empty Query & Empty Catalogs)',
      action:
        'Write parameterized boundary unit tests covering empty queries, empty catalog states, and filter state transitions before beginning implementation.',
      difficulty: 'Best Practice',
    },
  ];

  return (
    <div className="flex w-full min-h-0 flex-col space-y-5 pb-12">
      {/* Header Banner */}
      <div className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-violetSoft text-violet">
            <MessageSquare size={22} strokeWidth={2.2} />
          </span>
          <div>
            <div className="flex items-center gap-2.5">
              <Badge tone="violet">Candidate Feedback</Badge>
              <span className="font-mono text-[12px] font-medium text-muted">{candidate.submissionId}</span>
            </div>
            <h1 className="mt-1.5 text-[21px] font-bold tracking-tight text-ink">
              Personalized Performance Feedback & Growth Path
            </h1>
            <p className="mt-1 text-[13px] text-muted">
              Prepared for <strong className="font-semibold text-ink">{candidate.name}</strong> on completion of{' '}
              <strong className="font-semibold text-ink">{candidate.assessment}</strong>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Identified Strengths (2-3 items) */}
        <Panel title="Identified Engineering Strengths" icon={Sparkles} subtitle="Demonstrated during the session">
          <div className="space-y-3.5 p-4">
            {strengths.map((s, idx) => (
              <div key={idx} className="rounded-card border border-line bg-surface-2 p-4">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="shrink-0 text-success" />
                  <h3 className="text-[14px] font-semibold text-ink">{s.title}</h3>
                </div>
                <p className="mt-1.5 pl-6 text-[14px] leading-relaxed text-muted">{s.description}</p>
              </div>
            ))}
          </div>
        </Panel>

        {/* Practice Recommendations (2-3 items with difficulty tags) */}
        <Panel title="Recommended Practice & Next Steps" icon={Compass} subtitle="Curated skill enhancements">
          <div className="space-y-3.5 p-4">
            {practiceRecommendations.map((rec, idx) => (
              <div key={idx} className="rounded-card border border-line bg-surface-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                    <Target size={15} className="shrink-0 text-accent" />
                    {rec.topic}
                  </span>
                  <Badge tone="neutral">{rec.difficulty}</Badge>
                </div>
                <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{rec.action}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Plain Competency Snapshot (No weights, no confidence scores, no evt-ID jargon) */}
      <Panel title="Demonstrated Competency Snapshot" icon={Award} subtitle="Plain summary of your session performance">
        <div className="p-5 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <h3 className="text-[16px] font-bold text-ink">Validation & Edge-Case Debugging</h3>
            <Badge tone="success">Demonstrated</Badge>
          </div>
          <p className="text-[14px] leading-relaxed text-ink">
            During this assessment, you demonstrated strong analytical debugging and edge-case handling skills. When your initial implementation returned an empty list for empty search queries, you diagnosed the boundary condition, verified the expected behavior for search collections, and implemented a clean fix that returned all tasks while preserving active filter state.
          </p>
          <p className="text-[13px] leading-relaxed text-muted">
            All five automated test scenarios passed upon your final revision, confirming full functional correctness and robust state management.
          </p>
        </div>
      </Panel>
    </div>
  );
}
