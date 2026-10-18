import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
} from 'lucide-react';
import { AppLayout } from './components/AppLayout';
import { AssessmentSwitcherModal } from './components/AssessmentSwitcherModal';
import { BuildTrail, categoryMeta } from './components/BuildTrail';
import { DecisionGraph } from './components/DecisionGraph';
import { FindingDetails } from './components/FindingDetails';
import { FindingsQueue } from './components/FindingsQueue';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { RevisionDiff } from './components/RevisionDiff';
import { QuietButton } from './components/Panel';
import { AiInteractionsView } from './components/views/AiInteractionsView';
import { FeedbackView } from './components/views/FeedbackView';
import { OverviewView } from './components/views/OverviewView';
import { ReportsView } from './components/views/ReportsView';
import { TestResultsView } from './components/views/TestResultsView';
import { assessment as fallbackAssessment } from './data/assessment';
import { AuthModal } from './components/auth/AuthModal';
import { GitHubConnectModal } from './components/github/GitHubConnectModal';
import {
  apiGetCurrentUser,
  apiGetGitHubStatus,
  apiLogout,
  fetchAssessment,
  fetchAssessments,
  fetchShareLink,
  type AuthUserProfile,
} from './lib/api';
import { exportReportPdf } from './lib/exportPdf';
import { buildReportMarkdown, downloadTextFile } from './lib/exportReport';
import { applyTheme, getInitialTheme } from './lib/theme';
import type {
  AiExchange,
  AssessmentData,
  BuildEvent,
  CandidateInfo,
  DiffTab,
  EventCategory,
  Finding,
  NavItemId,
  RevisionId,
  SupportingEvidenceItem,
  TestRun,
} from './types/assessment';

const allCategories = Object.keys(categoryMeta) as EventCategory[];

function getHashSubmissionId(): string | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash;
  if (hash.startsWith('#submission/')) {
    return hash.replace('#submission/', '').trim();
  }
  return null;
}

function getInitialNav(): NavItemId {
  if (typeof window === 'undefined') return 'overview';
  const hash = window.location.hash.toLowerCase();
  if (hash.includes('overview')) return 'overview';
  if (hash.includes('evidence')) return 'evidence-inspector';
  if (hash.includes('buildtrail')) return 'buildtrail';
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab') as NavItemId;
  if (tab) return tab;
  return 'overview';
}

export default function App() {
  const [activeNav, setActiveNav] = useState<NavItemId>(() => getInitialNav());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 1280;
  });
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isFindingDrawerOpen, setIsFindingDrawerOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1440,
  );

  useEffect(() => {
    const onResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      if (width < 1280) {
        setSidebarCollapsed(true);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isWideScreen = windowWidth >= 1440;

  const [selectedRevision, setSelectedRevision] = useState<RevisionId>('R2');
  const [activeTab, setActiveTab] = useState<DiffTab>('evidence');
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>('evt-008');
  const [activeCategories, setActiveCategories] = useState<Set<EventCategory>>(
    () => new Set(allCategories),
  );
  const [theme, setTheme] = useState<'light' | 'dark'>(() => getInitialTheme());
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    applyTheme(theme, false);
  }, [theme]);

  // Auth & GitHub state
  const [currentUser, setCurrentUser] = useState<AuthUserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [isGitHubConnected, setIsGitHubConnected] = useState(false);
  const [githubUsername, setGithubUsername] = useState<string | null>(null);

  const loadGitHubStatus = useCallback(async () => {
    try {
      const res = await apiGetGitHubStatus();
      setIsGitHubConnected(res.connected);
      if (res.account?.username) {
        setGithubUsername(res.account.username);
      }
    } catch {
      setIsGitHubConnected(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    await apiLogout();
    setCurrentUser(null);
    setIsGitHubConnected(false);
    setGithubUsername(null);
    showToast('Successfully signed out');
  }, [showToast]);

  // Initial user profile & GitHub status check
  useEffect(() => {
    apiGetCurrentUser().then((user) => {
      if (user) setCurrentUser(user);
    });
    loadGitHubStatus();

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const gh = params.get('github');
      const ghErr = params.get('github_error');
      if (gh === 'connected') {
        showToast('GitHub account connected successfully!');
        loadGitHubStatus();
        window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
      } else if (ghErr) {
        showToast(`GitHub connection error: ${ghErr}`);
        window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
      }
    }
  }, [loadGitHubStatus, showToast]);

  // Live Data State
  const [currentSubmissionId, setCurrentSubmissionId] = useState<string>(
    () => getHashSubmissionId() || 'ASM-3088-TASK',
  );
  const [data, setData] = useState<AssessmentData>(fallbackAssessment);

  const selectedBuildEvent = useMemo(() => {
    return data.events.find((e) => e.id === highlightedEventId) || data.events[0] || null;
  }, [data.events, highlightedEventId]);

  const [selectedFindingId, setSelectedFindingId] = useState<string>('finding-03');
  const [isGraphCollapsed, setIsGraphCollapsed] = useState(false);

  const findingsQueueList = useMemo<Finding[]>(() => {
    return [
      data.finding,
      {
        id: 'finding-01',
        title: 'Problem Solving & Decomposition',
        status: 'Demonstrated',
        observation:
          'Decomposed the task manager requirements into discrete modules: task registration, completion status toggle, tag indexing, and query evaluation without architectural debt.',
        confidence: 'High',
        impact: 'High',
        sourceLinks: 2,
        aiContribution: {
          label: 'Candidate Owned',
          text: 'Architecture and method interfaces planned independently without coach prompting.',
        },
        uncertainty: {
          label: 'Low uncertainty',
          text: 'Directly evidenced by initial R1 commit structure (evt-001).',
        },
        tags: ['Decomposition', 'Architecture', 'Python'],
        evidence: [
          {
            id: 'ev-failed-test' as any,
            kind: 'revision',
            title: 'Initial implementation R1',
            meta: '14:35:10 · 27 lines added',
            detail: 'Task manager data structures and initial method skeletons created.',
            action: 'diff',
            actionLabel: 'View Diff',
            revision: 'R1',
            eventId: 'evt-001',
          },
        ],
      },
      {
        id: 'finding-02',
        title: 'AI Collaboration & Review',
        status: 'Demonstrated',
        observation:
          'Demonstrated disciplined use of AI under Level 3 Verify guidance: asked focused questions about empty-string boundary conventions rather than requesting solution code.',
        confidence: 'High',
        impact: 'Medium',
        sourceLinks: 1,
        aiContribution: {
          label: 'Level 3 Verify',
          text: 'AI provided standard convention guidance; candidate synthesized and implemented logic.',
        },
        uncertainty: {
          label: 'Low uncertainty',
          text: 'Full prompt and response recorded in session telemetry (evt-006, evt-007).',
        },
        tags: ['AI Policy', 'Verification', 'Discipline'],
        evidence: [
          {
            id: 'ev-ai-exchange' as any,
            kind: 'interaction',
            title: 'Debugging exchange',
            meta: '14:41:00 · 2 messages',
            detail: 'Targeted inquiry on search empty query handling.',
            action: 'interaction',
            actionLabel: 'View Interaction',
            eventId: 'evt-006',
          },
        ],
      },
      {
        id: 'finding-04',
        title: 'Code Understanding & Adaptability',
        status: 'Demonstrated',
        observation:
          'Demonstrated high familiarity with Python collections and dictionaries, adapting task storage to support multi-attribute filtering and status mutations seamlessly.',
        confidence: 'Medium',
        impact: 'Medium',
        sourceLinks: 1,
        aiContribution: {
          label: 'Candidate Owned',
          text: 'All dictionary access and state mutations authored directly by the candidate.',
        },
        uncertainty: {
          label: 'Low uncertainty',
          text: 'Verified by revision R2 diff additions.',
        },
        tags: ['Data Structures', 'Python', 'State'],
        evidence: [
          {
            id: 'ev-revision-r2' as any,
            kind: 'revision',
            title: 'Corrective code revision R2',
            meta: '14:48:30 · +7 −3',
            detail: 'Updated dictionary value iteration to return all tasks when query is empty.',
            action: 'diff',
            actionLabel: 'View Diff',
            revision: 'R2',
            eventId: 'evt-008',
          },
        ],
      },
    ];
  }, [data.finding]);

  const activeFinding = useMemo(() => {
    return findingsQueueList.find((f) => f.id === selectedFindingId) || data.finding;
  }, [findingsQueueList, selectedFindingId, data.finding]);

  const [assessmentsList, setAssessmentsList] = useState<CandidateInfo[]>([
    fallbackAssessment.candidate,
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  // Fetch assessment list for switcher
  useEffect(() => {
    fetchAssessments().then((res) => {
      if (res.items && res.items.length > 0) {
        setAssessmentsList(res.items);
      }
    });
  }, []);

  // Listen for hash changes
  useEffect(() => {
    const onHashChange = () => {
      const hashId = getHashSubmissionId();
      if (hashId && hashId !== currentSubmissionId) {
        setCurrentSubmissionId(hashId);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [currentSubmissionId]);

  // Fetch active assessment data from backend
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    fetchAssessment(currentSubmissionId)
      .then((loadedData) => {
        if (!active) return;
        setData(loadedData);
        // Reset selections to first revision of loaded assessment
        if (loadedData.revisions.length > 0) {
          const revId =
            loadedData.revisions.find((r) => r.id === 'R2')?.id || loadedData.revisions[0].id;
          setSelectedRevision(revId);
        }
        if (loadedData.finding?.evidence && loadedData.finding.evidence.length > 0) {
          setSelectedEvidenceId(loadedData.finding.evidence[0].id);
        } else {
          setSelectedEvidenceId(null);
        }
      })
      .catch((err) => {
        console.error('Failed to load assessment:', err);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentSubmissionId]);

  const handleToggleCategory = useCallback((category: EventCategory) => {
    setActiveCategories((current) => {
      const next = new Set(current);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

  const handleClearFilters = useCallback(() => {
    setActiveCategories(new Set(allCategories));
  }, []);

  const focusEvent = useCallback(
    (event: BuildEvent) => {
      setHighlightedEventId(event.id);
      if (event.revision) setSelectedRevision(event.revision);
      if (event.evidenceId) {
        setSelectedEvidenceId(event.evidenceId);
        const item = data.finding.evidence.find((entry) => entry.id === event.evidenceId);
        if (item) setActiveTab(item.action === 'output' ? 'tests' : item.action === 'diff' ? 'diff' : 'ai');
      }
    },
    [data.finding.evidence],
  );

  const handleSelectEvent = useCallback(
    (event: BuildEvent) => focusEvent(event),
    [focusEvent],
  );

  const handleGraphSelect = useCallback(
    (eventId: string) => {
      const event = data.events.find((item) => item.id === eventId);
      if (event) focusEvent(event);
    },
    [data.events, focusEvent],
  );

  const handleEvidenceSelect = useCallback((item: SupportingEvidenceItem) => {
    setSelectedEvidenceId(item.id);
    setHighlightedEventId(item.eventId);
    if (item.revision) setSelectedRevision(item.revision);
    setActiveTab(item.action === 'output' ? 'tests' : item.action === 'diff' ? 'diff' : 'ai');
    setActiveNav('evidence-inspector');
    if (window.innerWidth < 1440) {
      setIsFindingDrawerOpen(false);
    }
  }, []);

  const handleSelectFinding = useCallback((findingId: string) => {
    setSelectedFindingId(findingId);
    const found = findingsQueueList.find((f) => f.id === findingId);
    if (found && found.evidence.length > 0) {
      const firstEv = found.evidence[0];
      setSelectedEvidenceId(firstEv.id);
      if (firstEv.revision) setSelectedRevision(firstEv.revision);
      if (firstEv.eventId) setHighlightedEventId(firstEv.eventId);
      setActiveTab(firstEv.action === 'output' ? 'tests' : firstEv.action === 'diff' ? 'diff' : 'ai');
    }
  }, [findingsQueueList]);

  const handleNavSelect = useCallback((id: NavItemId) => {
    setActiveNav(id);
  }, []);

  const handleBack = useCallback(() => {
    setIsSwitcherOpen(true);
  }, []);

  const handleSelectAssessment = useCallback((submissionId: string) => {
    window.location.hash = `#submission/${submissionId}`;
    setCurrentSubmissionId(submissionId);
    showToast(`Switched to assessment ${submissionId}`);
  }, [showToast]);

  const handleExport = useCallback(() => {
    try {
      const filename = exportReportPdf(data);
      showToast(`Exported PDF: ${filename}`);
    } catch (err: any) {
      showToast(`Export failed: ${err.message || 'Could not generate PDF'}`);
    }
  }, [data, showToast]);

  const handleExportMarkdown = useCallback(() => {
    try {
      const markdown = buildReportMarkdown(data);
      downloadTextFile(
        `proof-report-${data.candidate.submissionId}.md`,
        markdown,
        'text/markdown;charset=utf-8',
      );
      showToast('Assessment report downloaded as Markdown.');
    } catch {
      showToast('Failed to download Markdown report.');
    }
  }, [data, showToast]);

  const handleShare = useCallback(async () => {
    try {
      const link = await fetchShareLink(data.candidate.submissionId);
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
      } else {
        const input = document.createElement('input');
        input.value = link;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      showToast('Share link copied to clipboard.');
    } catch {
      showToast('Failed to copy share link.');
    }
  }, [data.candidate.submissionId, showToast]);

  // Handle new live AI exchange from AiInteractionsView
  const handleNewExchange = useCallback((newExchange: AiExchange) => {
    setData((prev) => ({
      ...prev,
      aiExchanges: [...prev.aiExchanges, newExchange],
    }));
  }, []);

  // Handle new live test run from TestResultsView
  const handleNewTestRun = useCallback((newRun: TestRun) => {
    setData((prev) => ({
      ...prev,
      testRuns: [...prev.testRuns, newRun],
    }));
  }, []);

  const handleToggleTheme = useCallback(() => {
    const next: 'light' | 'dark' = theme === 'light' ? 'dark' : 'light';
    applyTheme(next, true);
    setTheme(next);
  }, [theme]);

  // Desktop Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === '[') {
        e.preventDefault();
        setSidebarCollapsed((prev) => !prev);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setIsFocusMode((prev) => !prev);
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        handleToggleTheme();
      } else if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        handleExport();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (data.revisions.length > 0) {
          const revIndex = data.revisions.findIndex((r) => r.id === selectedRevision);
          const nextIndex = (revIndex + 1) % data.revisions.length;
          setSelectedRevision(data.revisions[nextIndex].id);
          showToast(`Revision ${data.revisions[nextIndex].id}`);
        }
      } else if (e.key >= '1' && e.key <= '5') {
        const index = parseInt(e.key, 10) - 1;
        const navList: NavItemId[] = [
          'overview',
          'buildtrail',
          'evidence-inspector',
          'reports',
          'feedback',
        ];
        if (index < navList.length) {
          e.preventDefault();
          setActiveNav(navList[index]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [data.revisions, selectedRevision, handleToggleTheme, handleExport, showToast]);

  const graph = useMemo(() => data.graph, [data.graph]);

  return (
    <AppLayout
      candidate={data.candidate}
      activeNav={activeNav}
      onNavSelect={handleNavSelect}
      onBack={handleBack}
      theme={theme}
      onToggleTheme={handleToggleTheme}
      onExport={handleExport}
      onShare={handleShare}
      sidebarOpen={sidebarOpen}
      onOpenSidebar={() => setSidebarOpen(true)}
      onCloseSidebar={() => setSidebarOpen(false)}
      onOpenSwitcher={() => setIsSwitcherOpen(true)}
      sidebarCollapsed={sidebarCollapsed}
      onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
      onOpenShortcuts={() => setIsShortcutsOpen(true)}
      currentUser={currentUser}
      onOpenAuth={() => setIsAuthModalOpen(true)}
      onLogout={handleLogout}
      onOpenGitHub={() => setIsGitHubModalOpen(true)}
      isGitHubConnected={isGitHubConnected}
      githubUsername={githubUsername}
    >
      {isLoading ? (
        <div className="flex h-64 w-full items-center justify-center gap-2 text-muted">
          <Loader2 size={18} className="animate-spin text-accent" />
          <span className="text-[12px] font-medium">Loading assessment from backend...</span>
        </div>
      ) : null}

      {!isLoading && activeNav === 'evidence-inspector' && (
        <div className="flex h-full min-h-0 flex-1 flex-col">
          {/* Quick drawer banner when screen < 1440px */}
          {!isWideScreen && !isFocusMode ? (
            <div className="mb-3 flex items-center justify-between rounded-card border border-line bg-surface px-4 py-2.5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-ink">Selected Finding:</span>
                <span className="truncate text-[13px] text-muted">{activeFinding.title}</span>
              </div>
              <QuietButton
                onClick={() => setIsFindingDrawerOpen(true)}
                title="Open Finding Details Drawer"
                className="min-h-[32px] px-3.5 text-[13px] font-semibold"
              >
                Inspect Finding Details ({activeFinding.evidence.length} items)
              </QuietButton>
            </div>
          ) : null}

          {isFocusMode ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <RevisionDiff
                revisions={data.revisions}
                selectedRevision={selectedRevision}
                onRevisionChange={setSelectedRevision}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                testRuns={data.testRuns}
                aiExchanges={data.aiExchanges}
                focusAnnotation={selectedEvidenceId !== null}
                isFocusMode={isFocusMode}
                onToggleFocusMode={() => setIsFocusMode((prev) => !prev)}
              />
            </div>
          ) : isWideScreen ? (
            /* Full Workspace (>= 1440px): Findings Queue | Collapsible Graph + Code Revision Inspector | Finding Details */
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:min-h-0 xl:grid-cols-[280px_minmax(480px,1fr)_380px]">
              <div className="order-2 flex h-full min-h-[400px] min-w-0 xl:order-1 xl:min-h-0">
                <FindingsQueue
                  findings={findingsQueueList}
                  selectedFindingId={activeFinding.id}
                  onSelectFinding={handleSelectFinding}
                />
              </div>

              <div className="order-1 flex h-full min-h-0 min-w-0 flex-col gap-3 lg:order-1 lg:col-span-2 xl:order-2 xl:col-span-1">
                {/* Collapsible Decision Graph */}
                <div className="shrink-0 rounded-card border border-line bg-surface shadow-card overflow-hidden">
                  <div className="flex items-center justify-between border-b border-line px-4 py-2 bg-surface-2/60">
                    <div className="flex items-center gap-2">
                      <Activity size={15} className="text-accent" />
                      <span className="text-[12px] font-bold uppercase tracking-wider text-ink">
                        Decision Graph Flow
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsGraphCollapsed((prev) => !prev)}
                      className="inline-flex items-center gap-1 text-[12px] font-semibold text-muted hover:text-ink transition-colors"
                    >
                      {isGraphCollapsed ? (
                        <>
                          <span>Expand Graph</span>
                          <ChevronDown size={14} />
                        </>
                      ) : (
                        <>
                          <span>Collapse Graph</span>
                          <ChevronUp size={14} />
                        </>
                      )}
                    </button>
                  </div>
                  {!isGraphCollapsed && (
                    <DecisionGraph graph={graph} theme={theme} onSelectEventId={handleGraphSelect} />
                  )}
                </div>

                <div className="min-h-0 flex-1">
                  <RevisionDiff
                    revisions={data.revisions}
                    selectedRevision={selectedRevision}
                    onRevisionChange={setSelectedRevision}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    testRuns={data.testRuns}
                    aiExchanges={data.aiExchanges}
                    focusAnnotation={selectedEvidenceId !== null}
                    isFocusMode={isFocusMode}
                    onToggleFocusMode={() => setIsFocusMode((prev) => !prev)}
                  />
                </div>
              </div>

              <div className="order-3 flex h-full min-h-[400px] min-w-0 xl:min-h-0">
                <FindingDetails
                  finding={activeFinding}
                  selectedEvidenceId={selectedEvidenceId}
                  onSelectEvidence={handleEvidenceSelect}
                />
              </div>
            </div>
          ) : (
            /* 2-Column Workspace (< 1440px, e.g. 1366px laptop): Findings Queue | Collapsible Graph + Code Revision Inspector */
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-[260px_minmax(0,1fr)]">
              <div className="flex h-full min-h-[400px] min-w-0 md:min-h-0">
                <FindingsQueue
                  findings={findingsQueueList}
                  selectedFindingId={activeFinding.id}
                  onSelectFinding={handleSelectFinding}
                />
              </div>

              <div className="flex h-full min-h-0 min-w-0 flex-col gap-3">
                {/* Collapsible Decision Graph */}
                <div className="shrink-0 rounded-card border border-line bg-surface shadow-card overflow-hidden">
                  <div className="flex items-center justify-between border-b border-line px-4 py-2 bg-surface-2/60">
                    <div className="flex items-center gap-2">
                      <Activity size={15} className="text-accent" />
                      <span className="text-[12px] font-bold uppercase tracking-wider text-ink">
                        Decision Graph Flow
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsGraphCollapsed((prev) => !prev)}
                      className="inline-flex items-center gap-1 text-[12px] font-semibold text-muted hover:text-ink transition-colors"
                    >
                      {isGraphCollapsed ? (
                        <>
                          <span>Expand Graph</span>
                          <ChevronDown size={14} />
                        </>
                      ) : (
                        <>
                          <span>Collapse Graph</span>
                          <ChevronUp size={14} />
                        </>
                      )}
                    </button>
                  </div>
                  {!isGraphCollapsed && (
                    <DecisionGraph graph={graph} theme={theme} onSelectEventId={handleGraphSelect} />
                  )}
                </div>

                <div className="min-h-0 flex-1">
                  <RevisionDiff
                    revisions={data.revisions}
                    selectedRevision={selectedRevision}
                    onRevisionChange={setSelectedRevision}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    testRuns={data.testRuns}
                    aiExchanges={data.aiExchanges}
                    focusAnnotation={selectedEvidenceId !== null}
                    isFocusMode={isFocusMode}
                    onToggleFocusMode={() => setIsFocusMode((prev) => !prev)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Finding Details Slide-over Drawer for < 1440px screens */}
          {!isWideScreen && isFindingDrawerOpen ? (
            <div className="fixed inset-0 z-50 flex justify-end">
              <button
                type="button"
                aria-label="Close drawer overlay"
                onClick={() => setIsFindingDrawerOpen(false)}
                className="fixed inset-0 bg-ink/40 backdrop-blur-[1px]"
              />
              <div className="proof-fade-in relative z-10 h-full w-[380px] max-w-full bg-surface shadow-pop">
                <FindingDetails
                  finding={activeFinding}
                  selectedEvidenceId={selectedEvidenceId}
                  onSelectEvidence={handleEvidenceSelect}
                  onClose={() => setIsFindingDrawerOpen(false)}
                />
              </div>
            </div>
          ) : null}

          {/* Status bar */}
          <div className="mt-3 flex shrink-0 items-center justify-between rounded-[6px] border border-line bg-surface-2 px-4 py-2 text-[12px] text-[#475569]">
            <p className="truncate">
              Evidence records observable actions, outputs, and timestamps captured during the assessment.
            </p>
            <span className="hidden font-mono text-[12px] text-[#475569] sm:inline">
              PROOF Assessment Engine v0.1.0
            </span>
          </div>
        </div>
      )}

      {!isLoading && activeNav === 'overview' && (
        <OverviewView data={data} onNavigate={handleNavSelect} />
      )}

      {!isLoading && activeNav === 'buildtrail' && (
        <div className="flex h-full min-h-0 flex-1 flex-col space-y-2.5 overflow-hidden">
          <div className="grid h-full min-h-0 flex-1 grid-cols-1 gap-2.5 lg:grid-cols-[340px_minmax(0,1fr)]">
            <BuildTrail
              events={data.events}
              activeCategories={activeCategories}
              onToggleCategory={handleToggleCategory}
              onClearFilters={handleClearFilters}
              highlightedEventId={highlightedEventId}
              onSelectEvent={handleSelectEvent}
            />
            <div className="flex h-full min-h-0 flex-col gap-3">
              <div className="shrink-0">
                <DecisionGraph graph={graph} theme={theme} onSelectEventId={handleGraphSelect} />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {selectedBuildEvent ? (
                  <div className="rounded-card border border-line bg-surface p-5 shadow-card">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px] border ${
                            categoryMeta[selectedBuildEvent.category]?.chip || 'border-line bg-surface-2'
                          }`}
                        >
                          {(() => {
                            const IconComponent = categoryMeta[selectedBuildEvent.category]?.icon || FileText;
                            return <IconComponent size={16} className={categoryMeta[selectedBuildEvent.category]?.iconClass} />;
                          })()}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                              {categoryMeta[selectedBuildEvent.category]?.label || selectedBuildEvent.category}
                            </span>
                            <span className="font-mono text-[12px] text-muted">· {selectedBuildEvent.time}</span>
                            {selectedBuildEvent.revision ? (
                              <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-ink">
                                {selectedBuildEvent.revision}
                              </span>
                            ) : null}
                          </div>
                          <h3 className="text-[16px] font-semibold text-ink mt-0.5">
                            {selectedBuildEvent.title}
                          </h3>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveNav('evidence-inspector');
                          setHighlightedEventId(selectedBuildEvent.id);
                          if (selectedBuildEvent.revision) setSelectedRevision(selectedBuildEvent.revision);
                          if (selectedBuildEvent.evidenceId) {
                            setSelectedEvidenceId(selectedBuildEvent.evidenceId);
                            const item = data.finding.evidence.find((e) => e.id === selectedBuildEvent.evidenceId);
                            if (item) setActiveTab(item.action === 'output' ? 'tests' : item.action === 'diff' ? 'diff' : 'ai');
                          }
                        }}
                        className="inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-[6px] bg-accent px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-accent/90"
                      >
                        <span>Inspect evidence</span>
                        <ArrowRight size={14} aria-hidden="true" />
                      </button>
                    </div>

                    <div className="mt-4 space-y-3.5">
                      <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted">
                          Event Description & Telemetry Detail
                        </h4>
                        <p className="mt-1.5 text-[14px] leading-relaxed text-ink">
                          {selectedBuildEvent.detail}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1 text-[13px]">
                        <div className="rounded-[6px] border border-line bg-surface-2/60 p-3">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Event ID</span>
                          <p className="mt-0.5 font-mono text-[13px] font-semibold text-ink">{selectedBuildEvent.id}</p>
                        </div>
                        <div className="rounded-[6px] border border-line bg-surface-2/60 p-3">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Sequence</span>
                          <p className="mt-0.5 font-mono text-[13px] font-semibold text-ink">#{selectedBuildEvent.seq}</p>
                        </div>
                      </div>

                      {selectedBuildEvent.evidenceId ? (
                        <div className="rounded-[6px] border border-accent/20 bg-accentSoft/30 p-3 text-[13px]">
                          <span className="font-semibold text-accent">Linked to Competency Finding:</span>
                          <span className="ml-1.5 text-ink">This event forms key observable telemetry supporting the Validation & Debugging finding.</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-48 flex-col items-center justify-center rounded-card border border-dashed border-line bg-surface-2/30 p-6 text-center text-muted">
                    <p className="text-[14px] font-medium text-ink">No Event Selected</p>
                    <p className="mt-1 text-[13px]">Click any event from the timeline or flow strip to inspect details.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!isLoading && activeNav === 'decision-graph' && (
        <div className="flex min-h-0 flex-1 flex-col space-y-3 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <DecisionGraph graph={graph} theme={theme} onSelectEventId={handleGraphSelect} />
          </div>
        </div>
      )}

      {!isLoading && activeNav === 'ai-interactions' && (
        <AiInteractionsView
          submissionId={data.candidate.submissionId}
          exchanges={data.aiExchanges}
          activeRevision={selectedRevision}
          onNewExchange={handleNewExchange}
          showToast={showToast}
        />
      )}

      {!isLoading && activeNav === 'test-results' && (
        <TestResultsView
          submissionId={data.candidate.submissionId}
          testRuns={data.testRuns}
          revisions={data.revisions}
          selectedRevision={selectedRevision}
          onNewTestRun={handleNewTestRun}
          showToast={showToast}
        />
      )}

      {!isLoading && activeNav === 'reports' && (
        <ReportsView
          data={data}
          onExport={handleExport}
          onExportMarkdown={handleExportMarkdown}
          onNavigate={handleNavSelect}
        />
      )}

      {!isLoading && activeNav === 'feedback' && (
        <FeedbackView data={data} />
      )}

      {/* Assessment Switcher Modal */}
      <AssessmentSwitcherModal
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
        assessments={assessmentsList}
        currentSubmissionId={data.candidate.submissionId}
        onSelect={handleSelectAssessment}
      />

      {/* Desktop Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Signed in as ${user.name}`);
          loadGitHubStatus();
        }}
      />

      {/* GitHub Integration Modal */}
      <GitHubConnectModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        sessionId={data.candidate.submissionId}
        onRepoSelected={() => {
          loadGitHubStatus();
          fetchAssessment(currentSubmissionId).then((refreshed) => setData(refreshed));
        }}
        showToast={showToast}
      />

      {/* Toast Notification */}
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="proof-fade-in fixed bottom-4 right-4 z-[60] flex max-w-[340px] items-start gap-2 rounded-card border border-line bg-surface px-3 py-2.5 shadow-pop"
        >
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
          <p className="text-[13px] font-medium leading-snug text-ink">{toast}</p>
        </div>
      ) : null}
    </AppLayout>
  );
}
