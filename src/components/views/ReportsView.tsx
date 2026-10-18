import {
  ArrowRight,
  Award,
  Bot,
  CircleDot,
  Download,
  FileCheck2,
  FileSearch,
  FileText,
  HelpCircle,
  Link2,
  ShieldAlert,
} from 'lucide-react';
import type { AssessmentData, NavItemId } from '../../types/assessment';
import { Badge, QuietButton } from '../Panel';

interface ReportsViewProps {
  data: AssessmentData;
  onExport: () => void;
  onExportMarkdown?: () => void;
  onNavigate?: (tab: NavItemId) => void;
}

export function ReportsView({
  data,
  onExport,
  onExportMarkdown,
  onNavigate,
}: ReportsViewProps) {
  const { candidate, finding } = data;

  const rubricRows = [
    {
      competency: 'Functional Correctness',
      weight: '30%',
      status: 'Demonstrated',
      confidence: 'High',
      score: '100%',
    },
    {
      competency: 'Problem Solving & Decomposition',
      weight: '20%',
      status: 'Demonstrated',
      confidence: 'High',
      score: '90%',
    },
    {
      competency: 'Debugging & Validation',
      weight: '20%',
      status: 'Demonstrated',
      confidence: 'High',
      score: '95%',
    },
    {
      competency: 'AI Collaboration & Review',
      weight: '15%',
      status: 'Demonstrated',
      confidence: 'High',
      score: '85%',
    },
    {
      competency: 'Code Understanding & Adaptability',
      weight: '15%',
      status: 'Demonstrated',
      confidence: 'Medium',
      score: '90%',
    },
  ];

  const followUpQuestions = [
    {
      q: 'How would you extend search_tasks to support pagination or sorting by priority without increasing memory overhead?',
      purpose: 'Assesses API scalability and knowledge of Python generators vs memory caching.',
    },
    {
      q: 'Why did you choose to return list(self.tasks.values()) on an empty query rather than raising a validation error?',
      purpose: 'Tests understanding of UX search contracts and defensive error boundaries.',
    },
    {
      q: 'In revision R2 you preserved self.active_filter. How would you handle concurrent updates while a filter is active?',
      purpose: 'Evaluates concurrency awareness and thread safety in Python data stores.',
    },
  ];

  return (
    <div className="flex w-full min-h-0 flex-col space-y-5 pb-12">
      {/* Report Header */}
      <div className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone="success">Evaluated Report</Badge>
            <span className="font-mono text-[12px] text-muted">{candidate.submissionId}</span>
          </div>
          <h1 className="mt-1.5 text-[20px] sm:text-[22px] font-bold tracking-tight text-ink">
            PROOF Recruiter Skill Findings Report
          </h1>
          <p className="mt-1 text-[13px] text-muted">
            Candidate: <strong className="text-ink">{candidate.name}</strong> · Role:{' '}
            <strong className="text-ink">{candidate.role}</strong> · Completed in{' '}
            <strong className="text-ink">{candidate.duration}</strong>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <QuietButton icon={Download} onClick={onExport} primary>
            Export Report (PDF)
          </QuietButton>
          {onExportMarkdown ? (
            <QuietButton icon={FileText} onClick={onExportMarkdown} title="Export Markdown summary">
              Export .md
            </QuietButton>
          ) : null}
        </div>
      </div>

      {/* Evaluation Rubric Table */}
      <div className="rounded-card border border-line bg-surface shadow-card overflow-hidden">
        <div className="border-b border-line px-5 py-3.5 bg-surface-2/60">
          <div className="flex items-center gap-2">
            <Award size={16} className="text-accent" />
            <h2 className="text-[13px] font-bold uppercase tracking-wider text-ink">
              Evaluation Rubric & Competency Weightings
            </h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-line bg-surface-2/40 text-[11px] font-bold uppercase tracking-wider text-muted">
                <th className="px-5 py-3">Competency</th>
                <th className="px-4 py-3">Weight</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-5 py-3 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rubricRows.map((row) => (
                <tr key={row.competency} className="transition-colors hover:bg-surface-2/40">
                  <td className="px-5 py-3.5 font-semibold text-ink max-w-[280px]">
                    <span className="line-clamp-2 leading-snug">{row.competency}</span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-muted">{row.weight}</td>
                  <td className="px-4 py-3.5">
                    <Badge tone="success">{row.status}</Badge>
                  </td>
                  <td className="px-4 py-3.5 text-muted">{row.confidence}</td>
                  <td className="px-5 py-3.5 text-right font-bold text-success font-mono">
                    {row.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Findings as Document Text */}
      <div className="rounded-card border border-line bg-surface p-5 shadow-card space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                Verified Skill Finding
              </span>
              <Badge tone="success">
                <CircleDot size={10} />
                {finding.status}
              </Badge>
              <Badge tone="neutral">Confidence · {finding.confidence}</Badge>
              <Badge tone="neutral">Impact · {finding.impact}</Badge>
            </div>
            <h2 className="mt-2 text-[18px] font-bold text-ink">
              {finding.title}
            </h2>
          </div>
          {onNavigate ? (
            <button
              type="button"
              onClick={() => onNavigate('evidence-inspector')}
              className="inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-[6px] bg-accent px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-accent/90"
            >
              <FileSearch size={15} />
              <span>Inspect in Evidence Inspector</span>
              <ArrowRight size={14} />
            </button>
          ) : null}
        </div>

        {/* Observation text with evt citations */}
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted">
            Evaluator Observation (Timeline Citations)
          </h3>
          <p className="mt-2 text-[14px] leading-relaxed text-ink">
            {finding.observation}
          </p>
        </div>

        {/* AI Contribution Analysis */}
        <div className="rounded-[8px] border border-violet/30 bg-violetSoft/40 p-4">
          <h4 className="flex items-center gap-2 text-[13px] font-bold text-violet">
            <Bot size={15} />
            AI Contribution Analysis ({finding.aiContribution.label})
          </h4>
          <p className="mt-2 text-[13px] leading-relaxed text-ink">
            {finding.aiContribution.text}
          </p>
        </div>

        {/* Uncertainty & Evidence Boundary */}
        <div className="rounded-[8px] border border-amber-300/70 bg-[#FFFBEB] dark:bg-[#2B2312] p-4">
          <h4 className="flex items-center gap-2 text-[13px] font-bold text-[#92400E] dark:text-[#FBBF24]">
            <HelpCircle size={15} />
            Uncertainty & Evidence Boundary ({finding.uncertainty.label})
          </h4>
          <p className="mt-2 text-[13px] leading-relaxed text-[#92400E] dark:text-[#FDE68A]">
            {finding.uncertainty.text}
          </p>
        </div>

        {/* Supporting Evidence Chronology with Deep-Links */}
        <div className="border-t border-line pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Supporting Evidence Chronology
            </h3>
            <span className="font-mono text-[12px] text-muted">
              <Link2 size={13} className="inline mr-1" />
              {finding.evidence.length} linked records
            </span>
          </div>
          <div className="mt-3 space-y-2.5">
            {finding.evidence.map((ev) => (
              <div
                key={ev.id}
                className="flex flex-col gap-2 rounded-[8px] border border-line bg-surface-2 p-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-ink">{ev.title}</span>
                    <span className="font-mono text-[11px] text-muted">({ev.eventId})</span>
                    <span className="font-mono text-[12px] text-muted">· {ev.meta}</span>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{ev.detail}</p>
                </div>
                {onNavigate ? (
                  <button
                    type="button"
                    onClick={() => onNavigate('evidence-inspector')}
                    className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-accent hover:underline"
                  >
                    <span>Inspect</span>
                    <ArrowRight size={12} />
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Evidence Coverage & Follow-up Technical Questions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Evidence Coverage */}
        <div className="rounded-card border border-line bg-surface p-5 shadow-card">
          <div className="flex items-center gap-2 border-b border-line pb-3">
            <FileCheck2 size={16} className="text-success" />
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-ink">
              Evidence Coverage Summary
            </h3>
          </div>
          <div className="mt-4 space-y-3 text-[13px]">
            <div className="flex items-center justify-between">
              <span className="text-muted">Telemetry Linkage</span>
              <span className="font-mono font-bold text-success">100% verified</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Recorded Timeline Events</span>
              <span className="font-mono font-semibold text-ink">12 events</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Code Revisions Captured</span>
              <span className="font-mono font-semibold text-ink">2 revisions (R1, R2)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Automated Test Executions</span>
              <span className="font-mono font-semibold text-ink">5 test runs</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">AI Coach Exchanges</span>
              <span className="font-mono font-semibold text-ink">2 messages (Level 3)</span>
            </div>
          </div>
        </div>

        {/* Follow-up Technical Interview Questions */}
        <div className="rounded-card border border-line bg-surface p-5 shadow-card">
          <div className="flex items-center gap-2 border-b border-line pb-3">
            <HelpCircle size={16} className="text-accent" />
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-ink">
              Recommended Technical Follow-up Questions
            </h3>
          </div>
          <div className="mt-3 space-y-3">
            {followUpQuestions.map((item, idx) => (
              <div key={idx} className="rounded-[6px] border border-line bg-surface-2/60 p-3 text-[13px]">
                <p className="font-semibold text-ink">"{item.q}"</p>
                <p className="mt-1 text-[12px] text-muted italic">Purpose: {item.purpose}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Limitations Section */}
      <div className="rounded-card border border-amber-300/70 bg-[#FFFBEB] dark:bg-[#2B2312] p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldAlert size={18} className="text-[#92400E] dark:text-[#FBBF24]" />
          <h3 className="text-[14px] font-bold text-[#92400E] dark:text-[#FBBF24]">
            Assessment Scope Limitations & Boundary Notice
          </h3>
        </div>
        <ul className="mt-3 space-y-1.5 text-[13px] leading-relaxed text-[#92400E] dark:text-[#FDE68A]">
          <li>• <strong>Short-duration format (18m 42s):</strong> Evaluates targeted debugging, boundary diagnosis, and policy adherence; does not measure multi-week architectural stewardship.</li>
          <li>• <strong>Observable Telemetry Boundary:</strong> Records buffer edits, test executions, and coach dialogue. Does not capture unexpressed candidate internal cognition or offline ideation.</li>
          <li>• <strong>Single Contributor Scope:</strong> Did not evaluate team pull request reviews, asynchronous git merge conflict resolution, or cross-functional stakeholder negotiations.</li>
        </ul>
      </div>

      {/* Report Footer */}
      <div className="flex flex-col gap-2 rounded-[6px] border border-line bg-surface-2 px-5 py-3 text-[12px] text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          Generated by PROOF Assessment Engine — evidence linked to session{' '}
          <strong className="text-ink font-mono">{candidate.submissionId}</strong>
        </p>
        <span className="font-mono text-[11px] text-muted">
          SHA-256 Verified · PROOF v0.1.0
        </span>
      </div>
    </div>
  );
}
