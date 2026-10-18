import { prisma } from '../db/prisma.js';
import { runner } from '../runner/stubRunner.js';
import type {
  AssessmentData,
  BuildEvent,
  CandidateInfo,
  CodeAnnotation,
  CodeRevision,
  DiffLine,
  TestRun,
} from '../types/assessment.js';
import { computeDiffLines } from './diffService.js';
import { computeDeterministicMetrics } from './metricsService.js';
import { reportService } from './reportService.js';

export class SessionService {
  /**
   * Start a new assessment session
   */
  async startSession(input: {
    candidateId?: string;
    assessmentId?: string;
    taskTitle?: string;
    timeLimit?: string;
    aiPolicyLevel?: number;
    recordingDisclosureAccepted: boolean;
  }) {
    // Ensure a default candidate exists if not provided
    let candidateId = input.candidateId;
    if (!candidateId) {
      const candidateUser = await prisma.user.findFirst({ where: { role: 'candidate' } });
      candidateId = candidateUser?.id || (await this.createDefaultCandidate()).id;
    }

    // Ensure assessment exists
    let assessmentId = input.assessmentId;
    if (!assessmentId) {
      const assessment = await prisma.assessment.findFirst();
      assessmentId = assessment?.id || (await this.createDefaultAssessment(input.taskTitle)).id;
    }

    const assessment = await prisma.assessment.findUniqueOrThrow({ where: { id: assessmentId } });
    const now = new Date();
    const formattedDate = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const randomHex = Math.random().toString(16).substring(2, 6).toUpperCase();
    const submissionId = `ASM-${Math.floor(1000 + Math.random() * 9000)}-${randomHex}`;

    const session = await prisma.session.create({
      data: {
        submissionId,
        assessmentId,
        candidateId,
        status: 'In Progress',
        startedAt: formattedDate,
        duration: '00:00:00',
        recordingDisclosureAccepted: input.recordingDisclosureAccepted,
        aiPolicyLevel: input.aiPolicyLevel || assessment.aiPolicy,
      },
    });

    // Ingest initial start event
    await prisma.sessionEvent.create({
      data: {
        sessionId: session.id,
        seq: 1,
        timestamp: now.toTimeString().split(' ')[0],
        category: 'navigation',
        title: 'Problem viewed',
        detail: `Opened the problem statement and constraint notes for ${assessment.title}.`,
        ref: `evt_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      },
    });

    return session;
  }

  /**
   * Ingest a single telemetry/session event
   */
  async ingestEvent(
    sessionId: string,
    eventData: {
      category: string;
      title: string;
      detail: string;
      ref?: string;
      revision?: string;
      evidenceId?: string;
      timestamp?: string;
    },
  ) {
    const session = await prisma.session.findFirst({
      where: { OR: [{ id: sessionId }, { submissionId: sessionId }] },
    });
    if (!session) throw new Error('Session not found');

    const count = await prisma.sessionEvent.count({ where: { sessionId: session.id } });
    const timestamp = eventData.timestamp || new Date().toTimeString().split(' ')[0];
    const ref = eventData.ref || `evt_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    return await prisma.sessionEvent.create({
      data: {
        sessionId: session.id,
        seq: count + 1,
        timestamp,
        category: eventData.category,
        title: eventData.title,
        detail: eventData.detail,
        ref,
        revisionId: eventData.revision,
        evidenceId: eventData.evidenceId,
      },
    });
  }

  /**
   * Save a code revision and compute unified diff against previous revision
   */
  async saveRevision(
    sessionId: string,
    revisionData: {
      revisionId: string;
      label: string;
      filename?: string;
      language?: string;
      summary: string;
      previous?: string | null;
      code: string;
      annotations?: CodeAnnotation[];
      passedCount?: number;
      totalCount?: number;
    },
  ) {
    const session = await prisma.session.findFirst({
      where: { OR: [{ id: sessionId }, { submissionId: sessionId }] },
      include: { revisions: true },
    });
    if (!session) throw new Error('Session not found');

    // Find previous revision code if exists
    let previousCode: string | null = null;
    if (revisionData.previous) {
      const prevRev = session.revisions.find((r) => r.revisionId === revisionData.previous);
      if (prevRev) {
        // Reconstruct code from lines if needed or extract context lines
        const lines: DiffLine[] = JSON.parse(prevRev.linesJson);
        previousCode = lines.filter((l) => l.kind !== 'del').map((l) => l.text).join('\n');
      }
    }

    const { lines, additions, deletions } = computeDiffLines(previousCode, revisionData.code);
    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0];

    const revision = await prisma.codeRevision.create({
      data: {
        sessionId: session.id,
        revisionId: revisionData.revisionId,
        label: revisionData.label,
        timestamp,
        filename: revisionData.filename || 'solution.py',
        language: revisionData.language || 'python',
        summary: revisionData.summary,
        previousRevisionId: revisionData.previous || null,
        additions,
        deletions,
        linesJson: JSON.stringify(lines),
        annotationsJson: JSON.stringify(revisionData.annotations || []),
        passedCount: revisionData.passedCount || 0,
        totalCount: revisionData.totalCount || 4,
        duration: '0.04s',
      },
    });

    // Ingest code event
    await this.ingestEvent(session.id, {
      category: revisionData.revisionId === 'R1' ? 'code' : 'refactor',
      title: revisionData.label,
      detail: revisionData.summary,
      revision: revisionData.revisionId,
      timestamp,
    });

    return revision;
  }

  /**
   * Execute code run using isolated runner and record test result
   */
  async executeTestRun(sessionId: string, revisionId: string, code: string) {
    const session = await prisma.session.findFirst({
      where: { OR: [{ id: sessionId }, { submissionId: sessionId }] },
      include: { assessment: true },
    });
    if (!session) throw new Error('Session not found');

    // Run code through isolated sandbox stub runner
    const runResult = await runner.run({
      files: [{ filename: 'solution.py', content: code }],
      tests: session.assessment.problem,
    });

    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0];
    const runIndex = (await prisma.testResult.count({ where: { sessionId: session.id } })) + 1;
    const runId = `run-${runIndex < 10 ? '0' + runIndex : runIndex}`;
    const label = `Run after ${revisionId}`;

    const testResult = await prisma.testResult.create({
      data: {
        sessionId: session.id,
        runId,
        label,
        timestamp,
        revisionId,
        passed: runResult.passed,
        summary: `${runResult.passedCount} passed, ${runResult.totalCount - runResult.passedCount} failed in ${runResult.durationStr}`,
        output: runResult.output,
      },
    });

    // Update revision passed/total counts if exists
    const rev = await prisma.codeRevision.findFirst({
      where: { sessionId: session.id, revisionId },
    });
    if (rev) {
      await prisma.codeRevision.update({
        where: { id: rev.id },
        data: {
          passedCount: runResult.passedCount,
          totalCount: runResult.totalCount,
          duration: runResult.durationStr,
        },
      });
    }

    // Ingest event for test run
    await this.ingestEvent(session.id, {
      category: runResult.passed ? 'test-pass' : 'test-fail',
      title: runResult.passed ? 'Test run passed' : 'Test run failed',
      detail: runResult.passed
        ? `All ${runResult.totalCount} tests passed.`
        : `${runResult.totalCount - runResult.passedCount} of ${runResult.totalCount} tests failed.`,
      revision: revisionId,
      evidenceId: runResult.passed ? undefined : 'ev-failed-test',
      timestamp,
    });

    const returnItem: TestRun = {
      id: testResult.runId,
      label: testResult.label,
      time: testResult.timestamp,
      revision: testResult.revisionId as any,
      passed: testResult.passed,
      summary: testResult.summary,
      output: testResult.output,
    };

    return returnItem;
  }

  /**
   * End session and generate evidence-grounded report
   */
  async endSession(sessionId: string) {
    const session = await prisma.session.findFirst({
      where: { OR: [{ id: sessionId }, { submissionId: sessionId }] },
      include: {
        assessment: true,
        candidate: true,
        events: { orderBy: { seq: 'asc' } },
        revisions: true,
        testResults: true,
        aiExchanges: true,
      },
    });
    if (!session) throw new Error('Session not found');

    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0];

    // Ingest final submission event
    await this.ingestEvent(session.id, {
      category: 'submission',
      title: 'Submission',
      detail: 'Candidate submitted the assessment for review.',
      timestamp,
    });

    await prisma.session.update({
      where: { id: session.id },
      data: { status: 'Completed', duration: '01:28:47' },
    });

    return await this.getAssessmentData(session.submissionId);
  }

  /**
   * Assemble the complete AssessmentData structure matching contract verbatim
   */
  async getAssessmentData(submissionId: string): Promise<AssessmentData> {
    const session = await prisma.session.findUnique({
      where: { submissionId },
      include: {
        assessment: true,
        candidate: true,
        events: { orderBy: { seq: 'asc' } },
        revisions: true,
        testResults: true,
        aiExchanges: true,
        skillResults: { include: { evidence: true } },
        report: true,
      },
    });

    if (!session) {
      throw new Error(`Assessment submission "${submissionId}" not found`);
    }

    const candidate: CandidateInfo = {
      name: session.candidate.name,
      initials: session.candidate.initials,
      role: session.assessment.role,
      status: session.status,
      startedAt: session.startedAt,
      duration: session.duration,
      assessment: session.assessment.title,
      problem: session.assessment.problem,
      submissionId: session.submissionId,
    };

    const events: BuildEvent[] = session.events.map((e) => ({
      id: e.id,
      seq: e.seq,
      time: e.timestamp,
      category: e.category as any,
      title: e.title,
      detail: e.detail,
      ref: e.ref,
      revision: e.revisionId as any,
      evidenceId: e.evidenceId as any,
    }));

    const revisions: CodeRevision[] = session.revisions.map((r) => ({
      id: r.revisionId as any,
      label: r.label,
      time: r.timestamp,
      filename: r.filename,
      language: r.language,
      summary: r.summary,
      previous: r.previousRevisionId as any,
      additions: r.additions,
      deletions: r.deletions,
      lines: JSON.parse(r.linesJson),
      annotations: JSON.parse(r.annotationsJson),
      testResult: {
        passed: r.passedCount,
        total: r.totalCount,
        duration: r.duration,
      },
    }));

    const testRuns: TestRun[] = session.testResults.map((t) => ({
      id: t.runId,
      label: t.label,
      time: t.timestamp,
      revision: t.revisionId as any,
      passed: t.passed,
      summary: t.summary,
      output: t.output,
    }));

    const aiExchanges = session.aiExchanges.map((a) => ({
      id: a.exchangeId,
      role: a.role as 'candidate' | 'ai',
      time: a.timestamp,
      text: a.text,
      eventId: a.eventId,
      relatedRevision: a.relatedRevision as any,
    }));

    const finding = reportService.generateFinding(events, revisions, testRuns);
    const graph = reportService.generateDecisionGraph(events);
    const metrics = computeDeterministicMetrics(events, revisions, testRuns, session.duration);

    return {
      candidate,
      events,
      revisions,
      testRuns,
      aiExchanges,
      finding,
      graph,
      summary: metrics.summaryMetrics,
      summaryMetrics: metrics.summaryMetrics,
    };
  }

  private async createDefaultCandidate() {
    return await prisma.user.create({
      data: {
        email: 'aarav.sharma@example.com',
        passwordHash: 'seeded',
        role: 'candidate',
        name: 'Aarav Sharma',
        initials: 'AS',
      },
    });
  }

  private async createDefaultAssessment(title?: string) {
    return await prisma.assessment.create({
      data: {
        title: title || 'Task Manager',
        role: 'Backend Engineering · L3',
        problem: 'Implement a resilient Task Manager that filters tasks and handles empty search queries gracefully.',
        starterFilename: 'solution.py',
        language: 'python',
        timeLimit: '01:30:00',
        aiPolicy: 3,
        rubricJson: JSON.stringify({
          functionalCorrectness: 30,
          problemSolving: 20,
          debuggingValidation: 20,
          aiCollaboration: 15,
          codeUnderstanding: 15,
        }),
      },
    });
  }
}

export const sessionService = new SessionService();
