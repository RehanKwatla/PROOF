import { assessment as fallbackAssessment } from '../data/assessment';
import type {
  AiExchange,
  AssessmentData,
  CandidateInfo,
  TestRun,
} from '../types/assessment';

const API_BASE = (import.meta.env.VITE_API_URL as string) || '/api';

export interface AuthUserProfile {
  id: string;
  email: string;
  name: string;
  role: 'candidate' | 'recruiter' | 'admin';
  initials: string;
  githubConnected?: boolean;
  githubUsername?: string | null;
  selectedRepo?: string | null;
  gitHubAccount?: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    profileUrl: string | null;
    selectedRepo: string | null;
    selectedBranch: string | null;
    repoMetadata: any | null;
    connectedAt: string;
  } | null;
}

export interface GitHubRepoItem {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  defaultBranch: string;
  isPrivate: boolean;
  htmlUrl: string;
  stars: number;
  language: string | null;
  updatedAt: string;
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('proof_auth_token');
}

export function setAuthToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('proof_auth_token', token);
  } else {
    localStorage.removeItem('proof_auth_token');
  }
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Register a new user
 */
export async function apiRegister(payload: {
  name: string;
  email: string;
  password: string;
  role?: 'candidate' | 'recruiter';
}): Promise<{ token: string; user: AuthUserProfile }> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Registration failed');
  }
  setAuthToken(data.token);
  return data;
}

/**
 * Login existing user
 */
export async function apiLogin(credentials: {
  email: string;
  password: string;
}): Promise<{ token: string; user: AuthUserProfile }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Login failed');
  }
  setAuthToken(data.token);
  return data;
}

/**
 * Fetch current authenticated user
 */
export async function apiGetCurrentUser(): Promise<AuthUserProfile | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      if (res.status === 401) {
        setAuthToken(null);
      }
      return null;
    }
    const data = await res.json();
    return data.user;
  } catch (err) {
    console.warn('[API] Could not fetch current user:', err);
    return null;
  }
}

/**
 * Logout
 */
export async function apiLogout(): Promise<void> {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  } catch {
    // Ignore network error on logout
  } finally {
    setAuthToken(null);
  }
}

/**
 * GitHub OAuth & Integration APIs
 */
export async function apiGetGitHubAuthUrl(): Promise<{ url: string; state: string }> {
  const res = await fetch(`${API_BASE}/auth/github?format=json`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to initiate GitHub authorization');
  }
  return await res.json();
}

export async function apiGetGitHubStatus(): Promise<{ connected: boolean; account: any | null }> {
  const res = await fetch(`${API_BASE}/auth/github/status`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    return { connected: false, account: null };
  }
  return await res.json();
}

export async function apiGetGitHubRepos(): Promise<{ repositories: GitHubRepoItem[]; total: number }> {
  const res = await fetch(`${API_BASE}/auth/github/repos`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch repositories');
  }
  return data;
}

export async function apiSelectGitHubRepo(
  repoFullName: string,
  defaultBranch: string = 'main',
  sessionId?: string,
): Promise<any> {
  const res = await fetch(`${API_BASE}/auth/github/select-repo`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ repoFullName, defaultBranch, sessionId }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to select repository');
  }
  return data;
}

export async function apiDisconnectGitHub(): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/github`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to disconnect GitHub');
  }
}

/**
 * Fetch all available assessments / candidates
 */
export async function fetchAssessments(): Promise<{ items: CandidateInfo[]; total: number }> {
  try {
    const res = await fetch(`${API_BASE}/assessments`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Could not fetch assessments list, using local fallback:', err);
    return {
      items: [fallbackAssessment.candidate],
      total: 1,
    };
  }
}

/**
 * Fetch a full AssessmentData object by submissionId
 */
export async function fetchAssessment(submissionId: string): Promise<AssessmentData> {
  try {
    const res = await fetch(`${API_BASE}/assessments/${submissionId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[API] Could not fetch assessment "${submissionId}", using local fallback:`, err);
    return fallbackAssessment;
  }
}

/**
 * Fetch Markdown report content
 */
export async function fetchReportMarkdown(submissionId: string): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/assessments/${submissionId}/report`, {
      headers: {
        ...getAuthHeaders(),
        Accept: 'text/markdown',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    console.warn('[API] Could not fetch report markdown:', err);
    return '';
  }
}

/**
 * Fetch shareable link
 */
export async function fetchShareLink(submissionId: string): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/assessments/${submissionId}/share`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.url;
  } catch {
    return `${window.location.origin}${window.location.pathname}#submission/${submissionId}`;
  }
}

/**
 * Run tests for a candidate code revision
 */
export async function runCandidateTests(
  submissionId: string,
  revisionId: string,
  code: string,
): Promise<TestRun> {
  const res = await fetch(`${API_BASE}/candidates/assessments/${submissionId}/runs`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ revisionId, code }),
  });
  if (!res.ok) throw new Error(`Test run failed with HTTP ${res.status}`);
  return await res.json();
}

/**
 * Send inquiry to AI Coach
 */
export async function askAiCoach(
  submissionId: string,
  prompt: string,
  contextRevisionId?: string,
): Promise<AiExchange> {
  const res = await fetch(`${API_BASE}/candidates/assessments/${submissionId}/ai-coach`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ prompt, contextRevisionId }),
  });
  if (!res.ok) throw new Error(`AI Coach request failed with HTTP ${res.status}`);
  return await res.json();
}
