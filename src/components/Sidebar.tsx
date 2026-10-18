import {
  ChevronLeft,
  ClipboardList,
  FileSearch,
  Github,
  LayoutDashboard,
  LayoutList,
  LogIn,
  LogOut,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AuthUserProfile } from '../lib/api';
import type { CandidateInfo, NavItemId } from '../types/assessment';

interface NavItem {
  id: NavItemId;
  label: string;
  icon: LucideIcon;
  shortcut: string;
}

export const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, shortcut: '1' },
  { id: 'buildtrail', label: 'BuildTrail', icon: LayoutList, shortcut: '2' },
  { id: 'evidence-inspector', label: 'Evidence Inspector', icon: FileSearch, shortcut: '3' },
  { id: 'reports', label: 'Reports', icon: ClipboardList, shortcut: '4' },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare, shortcut: '5' },
];

interface SidebarProps {
  candidate: CandidateInfo;
  activeNav: NavItemId;
  onNavSelect: (id: NavItemId) => void;
  onBack: () => void;
  onCloseDrawer?: () => void;
  drawer?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  currentUser?: AuthUserProfile | null;
  onOpenAuth?: () => void;
  onLogout?: () => void;
  onOpenGitHub?: () => void;
  isGitHubConnected?: boolean;
  githubUsername?: string | null;
}

export function Sidebar({
  candidate,
  activeNav,
  onNavSelect,
  onBack,
  onCloseDrawer,
  drawer = false,
  collapsed = false,
  onToggleCollapse,
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenGitHub,
  isGitHubConnected = false,
  githubUsername,
}: SidebarProps) {
  return (
    <div className="flex h-full w-full flex-col bg-nav-bg">
      {/* Brand header */}
      <div
        className={`flex items-center bg-nav-header transition-all ${
          collapsed ? 'justify-center p-3' : 'gap-2.5 px-4 py-3.5'
        }`}
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-accent text-white shadow-sm"
          title="PROOF Assessment Platform"
        >
          <ShieldCheck size={18} strokeWidth={2.2} aria-hidden="true" />
        </span>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="text-[14px] font-bold leading-none tracking-[0.06em] text-nav-text">PROOF</p>
            <p className="mt-1 text-[11px] font-medium leading-none text-nav-muted whitespace-nowrap">
              Evidence-Driven Assessment
            </p>
          </div>
        ) : null}
        {drawer && onCloseDrawer ? (
          <button
            type="button"
            onClick={onCloseDrawer}
            aria-label="Close navigation"
            className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-nav-muted transition-colors hover:bg-nav-hover hover:text-nav-text"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      {/* Candidate summary */}
      {collapsed ? (
        <div className="flex flex-col items-center gap-2 p-3">
          <span
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-nav-active text-[12px] font-bold text-nav-text transition-colors hover:bg-accent"
            title={`${candidate.name} · ${candidate.role} (${candidate.status})`}
          >
            {candidate.initials}
          </span>
          {onOpenGitHub ? (
            <button
              type="button"
              onClick={onOpenGitHub}
              title={isGitHubConnected ? `GitHub: @${githubUsername || 'connected'}` : 'Connect GitHub'}
              className="relative flex h-8 w-8 items-center justify-center rounded-[6px] text-nav-muted hover:bg-nav-hover hover:text-nav-text"
            >
              <Github size={16} />
              {isGitHubConnected ? (
                <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-success ring-1 ring-nav-bg" />
              ) : null}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="mx-3 mb-2 mt-3 rounded-[8px] border border-nav-line bg-nav-header/70 p-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nav-active text-[12px] font-bold text-nav-text">
              {candidate.initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold leading-tight text-nav-text">
                {candidate.name}
              </p>
              <p className="truncate text-[12px] leading-tight text-nav-muted">{candidate.role}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex min-h-[24px] items-center gap-1.5 rounded-[5px] border border-success/30 bg-success/20 px-2 py-0.5 text-[12px] font-semibold text-nav-text">
              <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" />
              {candidate.status}
            </span>
            <span className="inline-flex min-h-[24px] items-center rounded-[5px] border border-nav-line bg-nav-hover px-2 py-0.5 font-mono text-[12px] font-semibold text-nav-muted">
              {candidate.duration}
            </span>
          </div>

          {/* GitHub Connection Banner */}
          {onOpenGitHub ? (
            <div className="mt-3 pt-2.5 border-t border-nav-line">
              <button
                type="button"
                onClick={onOpenGitHub}
                className={`flex w-full items-center justify-between rounded-[6px] px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                  isGitHubConnected
                    ? 'bg-nav-hover text-nav-text hover:bg-nav-active'
                    : 'border border-dashed border-nav-line text-nav-muted hover:border-nav-hover hover:text-nav-text'
                }`}
              >
                <span className="flex items-center gap-1.5 truncate">
                  <Github size={14} className="shrink-0" />
                  <span className="truncate">
                    {isGitHubConnected ? `@${githubUsername || 'connected'}` : 'Connect GitHub'}
                  </span>
                </span>
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    isGitHubConnected ? 'bg-success' : 'bg-muted/40'
                  }`}
                />
              </button>
            </div>
          ) : null}

          <dl className="mt-2.5 space-y-1.5 border-t border-nav-line pt-2 text-[12px]">
            <div className="flex items-baseline justify-between gap-2">
              <dt className="shrink-0 text-nav-muted">Started</dt>
              <dd className="truncate font-medium text-nav-text">{candidate.startedAt}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <dt className="shrink-0 text-nav-muted">Assessment</dt>
              <dd className="truncate font-medium text-nav-text">{candidate.assessment}</dd>
            </div>
          </dl>
        </div>
      )}

      {/* Workspace navigation */}
      <nav aria-label="Assessment sections" className="min-h-0 flex-1 overflow-y-auto px-2.5 pb-2">
        {!collapsed ? (
          <p className="px-2 pb-2 pt-1 text-[12px] font-bold uppercase tracking-[0.08em] text-nav-muted">
            Workspace
          </p>
        ) : null}
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = item.id === activeNav;
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onNavSelect(item.id)}
                  title={`${item.label} (Press ${item.shortcut})`}
                  aria-current={active ? 'page' : undefined}
                  className={`flex w-full items-center rounded-[6px] text-left transition-colors focus-visible:ring-2 focus-visible:ring-accent ${
                    collapsed
                      ? 'min-h-[40px] justify-center p-2.5'
                      : 'min-h-[40px] gap-3 px-3.5 py-2 text-[14px] font-medium'
                  } ${
                    active
                      ? 'bg-nav-active font-semibold text-nav-text shadow-sm'
                      : 'text-nav-muted hover:bg-nav-hover hover:text-nav-text'
                  }`}
                >
                  <Icon
                    size={18}
                    strokeWidth={2}
                    className={active ? 'text-white' : 'text-nav-muted'}
                    aria-hidden="true"
                  />
                  {!collapsed ? (
                    <>
                      <span className="truncate">{item.label}</span>
                      {active ? (
                        <span
                          className="ml-auto h-2 w-2 shrink-0 rounded-full bg-accent"
                          aria-hidden="true"
                        />
                      ) : null}
                    </>
                  ) : active ? (
                    <span
                      className="absolute right-1 h-2 w-2 shrink-0 rounded-full bg-accent"
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Session & Footer Actions */}
      <div className="border-t border-nav-line p-2.5 space-y-1.5">
        {currentUser ? (
          !collapsed ? (
            <div className="flex items-center justify-between rounded-[6px] bg-nav-header px-2.5 py-1.5 text-[12px]">
              <div className="min-w-0 pr-2">
                <p className="truncate font-semibold text-nav-text">{currentUser.name}</p>
                <p className="truncate text-[11px] text-nav-muted capitalize">{currentUser.role}</p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                title="Sign Out"
                className="rounded p-1 text-nav-muted hover:bg-nav-hover hover:text-nav-text"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onLogout}
              title={`Sign Out (${currentUser.name})`}
              className="flex min-h-[36px] w-full items-center justify-center rounded-[6px] text-nav-muted hover:bg-nav-hover hover:text-nav-text"
            >
              <LogOut size={16} />
            </button>
          )
        ) : (
          !collapsed ? (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex min-h-[36px] w-full items-center justify-center gap-2 rounded-[6px] bg-accent/20 border border-accent/40 px-3 py-1.5 text-[13px] font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
            >
              <LogIn size={15} />
              <span>Sign In / Register</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              title="Sign In / Register"
              className="flex min-h-[36px] w-full items-center justify-center rounded-[6px] text-accent hover:bg-nav-hover"
            >
              <LogIn size={16} />
            </button>
          )
        )}

        {onToggleCollapse && !drawer ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar ( [ )' : 'Collapse sidebar ( [ )'}
            className="flex min-h-[34px] w-full items-center justify-center gap-2 rounded-[6px] px-2.5 py-1 text-[12px] font-medium text-nav-muted transition-colors hover:bg-nav-hover hover:text-nav-text focus-visible:ring-2 focus-visible:ring-accent"
          >
            {collapsed ? (
              <PanelLeftOpen size={16} />
            ) : (
              <>
                <PanelLeftClose size={16} />
                <span className="truncate">Collapse sidebar</span>
                <kbd className="ml-auto rounded border border-nav-line bg-nav-header px-1.5 py-0.5 text-[11px] font-bold text-nav-muted">
                  [
                </kbd>
              </>
            )}
          </button>
        ) : null}

        {!collapsed ? (
          <button
            type="button"
            onClick={onBack}
            className="flex min-h-[34px] w-full items-center justify-center gap-2 rounded-[6px] border border-nav-line bg-nav-header px-3 py-1 text-[12px] font-medium text-nav-muted transition-colors hover:border-nav-hover hover:bg-nav-hover hover:text-nav-text focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ChevronLeft size={14} strokeWidth={2} aria-hidden="true" />
            Back to Assessments
          </button>
        ) : null}
      </div>
    </div>
  );
}
