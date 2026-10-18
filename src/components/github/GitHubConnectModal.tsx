import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  GitBranch,
  Github,
  Globe,
  Loader2,
  Lock,
  RefreshCw,
  Search,
  Star,
  Unlink2,
  X,
} from 'lucide-react';
import {
  apiDisconnectGitHub,
  apiGetGitHubAuthUrl,
  apiGetGitHubRepos,
  apiGetGitHubStatus,
  apiSelectGitHubRepo,
  type GitHubRepoItem,
} from '../../lib/api';

interface GitHubConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string;
  onRepoSelected?: (repoFullName: string, defaultBranch: string) => void;
  showToast?: (message: string) => void;
}

export function GitHubConnectModal({
  isOpen,
  onClose,
  sessionId,
  onRepoSelected,
  showToast,
}: GitHubConnectModalProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<any | null>(null);
  const [repos, setRepos] = useState<GitHubRepoItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    loadStatus();
  }, [isOpen]);

  const loadStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const status = await apiGetGitHubStatus();
      setIsConnected(status.connected);
      setAccount(status.account);
      if (status.account?.selectedRepo) {
        setSelectedRepo(status.account.selectedRepo);
      }

      if (status.connected) {
        const repoData = await apiGetGitHubRepos();
        setRepos(repoData.repositories);
      }
    } catch (err: any) {
      console.warn('[GitHubModal] Status load error:', err);
      setError(err.message || 'Could not load GitHub connection status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const { url } = await apiGetGitHubAuthUrl();
      // Redirect browser to OAuth authorization URL
      window.location.href = url;
    } catch (err: any) {
      setError(err.message || 'Failed to start GitHub authorization');
      setIsConnecting(false);
    }
  };

  const handleSelectRepo = async (repo: GitHubRepoItem) => {
    setIsSelecting(true);
    setError(null);
    try {
      await apiSelectGitHubRepo(repo.fullName, repo.defaultBranch, sessionId);
      setSelectedRepo(repo.fullName);
      if (onRepoSelected) {
        onRepoSelected(repo.fullName, repo.defaultBranch);
      }
      if (showToast) {
        showToast(`Repository "${repo.fullName}" linked to assessment evidence`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to link repository');
    } finally {
      setIsSelecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect your GitHub account from PROOF?')) return;
    setIsLoading(true);
    setError(null);
    try {
      await apiDisconnectGitHub();
      setIsConnected(false);
      setAccount(null);
      setRepos([]);
      setSelectedRepo(null);
      if (showToast) {
        showToast('GitHub account disconnected');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect GitHub');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredRepos = repos.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close modal overlay"
        onClick={onClose}
        className="fixed inset-0 bg-ink/40 backdrop-blur-[2px] transition-opacity"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="github-modal-title"
        className="proof-scale-in relative z-10 flex max-h-[90vh] w-full max-w-[620px] flex-col rounded-card border border-line bg-surface shadow-pop"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-canvas">
              <Github size={22} />
            </span>
            <div>
              <h2 id="github-modal-title" className="text-[17px] font-bold text-ink">
                GitHub Repository Integration
              </h2>
              <p className="text-[12px] text-muted">
                Link code repositories to provide observable engineering evidence
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-[6px] p-1.5 text-muted hover:bg-surface-2 hover:text-ink"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6 space-y-4">
          {error ? (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-[6px] border border-danger/30 bg-dangerSoft/40 p-3 text-[13px] text-danger"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p className="leading-snug">{error}</p>
            </div>
          ) : null}

          {/* Connection Status Card */}
          <div className="rounded-card border border-line bg-surface-2/60 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Status</span>
                  {isConnected ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-successSoft px-2.5 py-0.5 text-[11px] font-semibold text-success">
                      <CheckCircle2 size={12} /> Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 border border-line px-2.5 py-0.5 text-[11px] font-medium text-muted">
                      Not Connected (Optional)
                    </span>
                  )}
                </div>
                {isConnected && account ? (
                  <p className="mt-1 text-[13px] text-ink">
                    Connected as <strong className="font-semibold text-accent">@{account.username}</strong>
                    {account.displayName ? ` (${account.displayName})` : ''}
                  </p>
                ) : (
                  <p className="mt-1 text-[13px] text-muted">
                    Assessments function fully without GitHub. Connecting allows referencing existing project code.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={loadStatus}
                      className="flex items-center gap-1.5 rounded-[6px] border border-line bg-surface px-3 py-1.5 text-[12px] font-medium text-ink hover:bg-surface-2"
                      title="Refresh repositories"
                    >
                      <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                      <span>Refresh</span>
                    </button>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={handleDisconnect}
                      className="flex items-center gap-1.5 rounded-[6px] border border-danger/30 bg-dangerSoft/30 px-3 py-1.5 text-[12px] font-medium text-danger hover:bg-dangerSoft/50"
                    >
                      <Unlink2 size={13} />
                      <span>Disconnect</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={isConnecting}
                    onClick={handleConnect}
                    className="flex items-center gap-2 rounded-[6px] bg-ink px-4 py-2 text-[13px] font-semibold text-canvas shadow-sm transition-colors hover:bg-ink/90"
                  >
                    {isConnecting ? <Loader2 size={14} className="animate-spin" /> : <Github size={14} />}
                    <span>Connect GitHub Account</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Repositories Section */}
          {isConnected ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[13px] font-bold text-ink uppercase tracking-wider">
                    Select Assessment Repository
                  </h3>
                  <p className="text-[12px] text-muted">
                    Choose an authorized repository to link to your assessment telemetry
                  </p>
                </div>
                <div className="relative w-48 sm:w-60">
                  <Search size={14} className="absolute left-2.5 top-2.5 text-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search repositories..."
                    className="w-full rounded-[6px] border border-line bg-surface py-1.5 pl-8 pr-2.5 text-[12px] text-ink placeholder:text-muted focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              {/* Repositories List */}
              <div className="max-h-[300px] space-y-2 overflow-y-auto rounded-[8px] border border-line bg-surface p-2">
                {filteredRepos.length > 0 ? (
                  filteredRepos.map((repo) => {
                    const isSelected = selectedRepo === repo.fullName;
                    return (
                      <div
                        key={repo.id}
                        className={`flex flex-col gap-2 rounded-[6px] border p-3 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                          isSelected
                            ? 'border-accent bg-accentSoft/20'
                            : 'border-line bg-surface-2/40 hover:bg-surface-2/80'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[13px] text-ink truncate">
                              {repo.fullName}
                            </span>
                            {repo.isPrivate ? (
                              <span className="flex items-center gap-0.5 rounded bg-surface-2 border border-line px-1.5 py-0.5 text-[10px] text-muted">
                                <Lock size={10} /> Private
                              </span>
                            ) : (
                              <span className="flex items-center gap-0.5 rounded bg-surface-2 border border-line px-1.5 py-0.5 text-[10px] text-muted">
                                <Globe size={10} /> Public
                              </span>
                            )}
                          </div>
                          {repo.description ? (
                            <p className="mt-0.5 text-[12px] text-muted truncate">{repo.description}</p>
                          ) : null}
                          <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted">
                            <span className="flex items-center gap-1 font-mono">
                              <GitBranch size={11} /> {repo.defaultBranch}
                            </span>
                            {repo.language ? (
                              <span className="rounded-full bg-accent/10 px-2 py-0.2 text-accent font-medium">
                                {repo.language}
                              </span>
                            ) : null}
                            {repo.stars > 0 ? (
                              <span className="flex items-center gap-0.5">
                                <Star size={11} className="text-amber-500" /> {repo.stars}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <a
                            href={repo.htmlUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-[6px] p-1.5 text-muted hover:bg-surface hover:text-ink"
                            title="Open on GitHub"
                          >
                            <ExternalLink size={14} />
                          </a>
                          <button
                            type="button"
                            disabled={isSelecting || isSelected}
                            onClick={() => handleSelectRepo(repo)}
                            className={`rounded-[6px] px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                              isSelected
                                ? 'bg-success text-white cursor-default'
                                : 'bg-accent text-white hover:bg-accent/90'
                            }`}
                          >
                            {isSelected ? 'Linked' : 'Link Repository'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-[13px] text-muted">
                    {searchQuery ? 'No matching repositories found.' : 'No repositories found.'}
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Privacy & Safety Guarantee */}
          <div className="rounded-[6px] border border-line bg-surface-2/40 p-3 text-[12px] text-muted">
            <p className="font-semibold text-ink">Read-Only Safety Guarantee</p>
            <p className="mt-0.5 leading-relaxed">
              PROOF only requests minimum read permissions to identify repositories and branch metadata for assessment provenance. PROOF never pushes commits, modifies code, or alters your GitHub settings.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-line px-6 py-3.5 bg-surface-2/40">
          <span className="text-[11px] text-muted font-mono">
            OAuth 2.0 PKCE Protected · read:user,repo
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[6px] border border-line bg-surface px-4 py-1.5 text-[13px] font-semibold text-ink hover:bg-surface-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
