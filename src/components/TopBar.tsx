import {
  Download,
  Github,
  Keyboard,
  LogIn,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Share2,
  Sun,
} from 'lucide-react';
import type { AuthUserProfile } from '../lib/api';
import type { CandidateInfo } from '../types/assessment';
import { QuietButton } from './Panel';

interface TopBarProps {
  candidate: CandidateInfo;
  activeNav?: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onExport: () => void;
  onShare: () => void;
  onOpenMenu: () => void;
  onOpenSwitcher?: () => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onOpenShortcuts?: () => void;
  currentUser?: AuthUserProfile | null;
  onOpenAuth?: () => void;
  onLogout?: () => void;
  onOpenGitHub?: () => void;
  isGitHubConnected?: boolean;
}

const navLabels: Record<string, string> = {
  overview: 'Overview',
  buildtrail: 'BuildTrail',
  'evidence-inspector': 'Evidence Inspector',
  'decision-graph': 'Decision Graph',
  'ai-interactions': 'AI Interactions',
  'test-results': 'Test Results',
  'code-revisions': 'Code Revisions',
  reports: 'Reports',
  feedback: 'Feedback',
};

export function TopBar({
  candidate,
  activeNav = 'evidence-inspector',
  theme,
  onToggleTheme,
  onExport,
  onShare,
  onOpenMenu,
  onOpenSwitcher,
  sidebarCollapsed = false,
  onToggleSidebar,
  onOpenShortcuts,
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenGitHub,
  isGitHubConnected = false,
}: TopBarProps) {
  const currentNavTitle = navLabels[activeNav] || 'Evidence Inspector';
  const crumbs = ['Assessments', candidate.assessment, currentNavTitle];

  return (
    <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-line bg-surface px-4 sm:px-5">
      {/* Mobile drawer toggle */}
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open navigation"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] border border-line text-muted hover:bg-surface-2 hover:text-ink lg:hidden"
      >
        <Menu size={16} aria-hidden="true" />
      </button>

      {/* Desktop sidebar rail toggle */}
      {onToggleSidebar ? (
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar ( [ )' : 'Collapse sidebar ( [ )'}
          title={sidebarCollapsed ? 'Expand sidebar ( [ )' : 'Collapse sidebar ( [ )'}
          className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-[6px] border border-line text-muted transition-colors hover:border-line-strong hover:bg-surface-2 hover:text-ink lg:flex focus-visible:ring-2 focus-visible:ring-accent"
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen size={16} aria-hidden="true" />
          ) : (
            <PanelLeftClose size={16} aria-hidden="true" />
          )}
        </button>
      ) : null}

      <nav aria-label="Breadcrumb" className="min-w-0">
        <ol className="flex min-w-0 items-center gap-2 text-[13px]">
          {crumbs.map((crumb, index) => {
            const last = index === crumbs.length - 1;
            return (
              <li key={crumb} className="flex min-w-0 items-center gap-2">
                {index > 0 ? (
                  <span className="text-line-strong" aria-hidden="true">
                    /
                  </span>
                ) : null}
                {last ? (
                  <span className="truncate font-semibold text-ink" aria-current="page">
                    {crumb}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenSwitcher}
                    title="Switch assessment"
                    className="truncate rounded text-muted transition-colors hover:text-accent hover:underline"
                  >
                    {crumb}
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <span className="hidden items-center gap-1.5 font-mono text-[12px] text-muted xl:flex">
        <span className="h-2 w-2 rounded-full bg-success" />
        {candidate.submissionId}
      </span>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        {/* GitHub Integration Action */}
        {onOpenGitHub ? (
          <button
            type="button"
            onClick={onOpenGitHub}
            title={isGitHubConnected ? 'GitHub connected (Click to manage)' : 'Connect GitHub account'}
            className="flex min-h-[32px] items-center gap-1.5 rounded-[6px] border border-line bg-surface px-2.5 py-1 text-[12px] font-medium text-ink transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Github size={15} />
            <span className="hidden md:inline">GitHub</span>
            <span
              className={`h-2 w-2 rounded-full ${isGitHubConnected ? 'bg-success' : 'bg-muted/50'}`}
              title={isGitHubConnected ? 'Connected' : 'Disconnected'}
            />
          </button>
        ) : null}

        <QuietButton icon={Download} onClick={onExport} title="Download evaluation report as PDF (Press E)">
          <span className="hidden sm:inline">Export Report (PDF)</span>
          <span className="sm:hidden">PDF</span>
        </QuietButton>

        <QuietButton icon={Share2} onClick={onShare} title="Copy shareable link">
          <span className="hidden sm:inline">Share</span>
        </QuietButton>

        {onOpenShortcuts ? (
          <button
            type="button"
            onClick={onOpenShortcuts}
            title="Desktop keyboard shortcuts (Press ?)"
            aria-label="Keyboard shortcuts"
            className="hidden min-h-[32px] items-center gap-1.5 rounded-[6px] border border-line bg-surface px-2.5 text-muted transition-colors hover:border-line-strong hover:bg-surface-2 hover:text-ink sm:flex focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Keyboard size={15} strokeWidth={2} aria-hidden="true" />
            <kbd className="font-mono text-[12px] font-bold text-muted">?</kbd>
          </button>
        ) : null}

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === 'light' ? 'Switch to dark theme (Press T)' : 'Switch to light theme (Press T)'}
          title={theme === 'light' ? 'Switch to dark theme (Press T)' : 'Switch to light theme (Press T)'}
          className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-line bg-surface text-muted transition-colors hover:border-line-strong hover:bg-surface-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
        >
          {theme === 'light' ? (
            <Moon size={15} strokeWidth={2} aria-hidden="true" />
          ) : (
            <Sun size={15} strokeWidth={2} aria-hidden="true" />
          )}
        </button>

        {/* User Profile / Auth Button */}
        <div className="ml-1 flex items-center gap-2 border-l border-line pl-2.5">
          {currentUser ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenSwitcher}
                title={`Logged in: ${currentUser.name} (${currentUser.role}) · Click to switch assessment`}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[12px] font-bold text-surface ring-2 ring-transparent transition-all hover:ring-accent focus-visible:ring-2 focus-visible:ring-accent"
              >
                {currentUser.initials}
              </button>
              {onLogout ? (
                <button
                  type="button"
                  onClick={onLogout}
                  title="Sign Out"
                  aria-label="Sign out"
                  className="hidden rounded p-1 text-muted hover:bg-surface-2 hover:text-ink sm:block"
                >
                  <LogOut size={14} />
                </button>
              ) : null}
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 rounded-[6px] bg-accent px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-accent/90"
            >
              <LogIn size={13} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
