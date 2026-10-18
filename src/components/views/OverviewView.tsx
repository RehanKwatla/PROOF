import {
  ArrowRight,
  Bot,
  CheckCircle2,
  FileSearch,
  FileText,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { AssessmentData, NavItemId } from '../../types/assessment';
import { Badge, QuietButton } from '../Panel';
import { SummaryMetrics } from '../SummaryMetrics';

interface OverviewViewProps {
  data: AssessmentData;
  onNavigate: (tab: NavItemId) => void;
}

export function OverviewView({ data, onNavigate }: OverviewViewProps) {
  const { candidate, summary, finding } = data;

  return (
    <div className="flex w-full min-h-0 flex-col space-y-5 pb-12">
      {/* Hero Welcome & Mission Brief */}
      <div className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-sm">
              <ShieldCheck size={26} strokeWidth={2.2} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <Badge tone="accent">Mission Brief</Badge>
                <span className="font-mono text-[12px] text-muted">{candidate.submissionId}</span>
              </div>
              <h1 className="mt-1.5 text-[20px] sm:text-[22px] font-bold tracking-tight text-ink">
                {candidate.assessment}
              </h1>
              <p className="mt-1 text-[13px] text-muted">
                Role: <span className="font-semibold text-ink">{candidate.role}</span> · Candidate:{' '}
                <span className="font-semibold text-ink">{candidate.name}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <QuietButton
              icon={FileSearch}
              onClick={() => onNavigate('evidence-inspector')}
              primary
            >
              Open Evidence Inspector
            </QuietButton>
          </div>
        </div>

        {/* Task Specification */}
        <div className="mt-5 rounded-[8px] border border-line bg-surface-2 p-4">
          <h2 className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#475569]">
            <FileText size={15} className="text-accent" />
            Task Specification & Requirements
          </h2>
          <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-ink">
            {candidate.problem}
          </p>
        </div>

        {/* Success Criteria & Evaluation Rubric */}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-[8px] border border-line bg-surface p-4 shadow-sm">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-ink">
              <CheckCircle2 size={16} className="text-success" />
              Success Criteria
            </div>
            <ul className="mt-2.5 space-y-1.5 text-[13px] text-muted">
              <li>• Pass all automated boundary unit tests</li>
              <li>• Handle empty inputs & edge cases</li>
              <li>• Explain rationale when debugging with AI Coach</li>
            </ul>
          </div>

          <div className="rounded-[8px] border border-line bg-surface p-4 shadow-sm">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-ink">
              <Bot size={16} className="text-violet" />
              AI Collaboration Policy
            </div>
            <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
              Assistance up to <strong>Level 3 (Verify)</strong>; Level 4 code generation disabled to ensure authentic problem solving.
            </p>
          </div>

          <div className="rounded-[8px] border border-line bg-surface p-4 shadow-sm">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-ink">
              <Sparkles size={16} className="text-amber" />
              Recording & Transparency
            </div>
            <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
              All IDE buffer edits, test runs, and AI exchanges are captured as observable timeline
              evidence.
            </p>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <SummaryMetrics metrics={summary} />

      {/* Primary Competency Strip (Full Width) */}
      <div className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                Primary Evaluated Competency
              </span>
              <Badge tone="success">{finding.status}</Badge>
              <Badge tone="neutral">Confidence · {finding.confidence}</Badge>
            </div>
            <h3 className="text-[17px] font-bold text-ink sm:text-[18px]">{finding.title}</h3>
            <p className="max-w-4xl text-[14px] leading-relaxed text-muted">{finding.observation}</p>
          </div>
          <div className="shrink-0 pt-1">
            <button
              type="button"
              onClick={() => onNavigate('evidence-inspector')}
              className="inline-flex min-h-[38px] items-center gap-2 rounded-[6px] bg-accent px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span>Inspect in Evidence Inspector</span>
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-line pt-3 text-[13px] text-muted">
          <span>{finding.evidence.length} linked evidence records</span>
          <span>·</span>
          <span>Validated against Python Task Manager test suite</span>
          <span>·</span>
          <span>Impact: {finding.impact}</span>
        </div>
      </div>
    </div>
  );
}
