import { SECURITY_CONFIG, globalRateLimiter } from '@/lib/security-config';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const filenamePattern = SECURITY_CONFIG.VALIDATION.FILENAME_PATTERN;

const fileSchema = z.object({
  path: z.string()
    .max(SECURITY_CONFIG.FILE_LIMITS.MAX_FILENAME_LENGTH)
    .refine((p) => filenamePattern.test(p), 'Invalid filename characters')
    .refine((p) => !p.startsWith('/') && !p.includes('..'), 'Path must be relative and cannot contain ..')
    .refine((p) => !p.startsWith('.git/') && !p.includes('/.git/'), 'Illegal path'),
  content: z.string().max(SECURITY_CONFIG.FILE_LIMITS.MAX_FILE_SIZE, 'File too large')
});

const bodySchema = z.object({
  files: z.array(fileSchema).nonempty().max(SECURITY_CONFIG.FILE_LIMITS.MAX_FILES_PER_REQUEST),
  message: z.string().trim().min(1).max(200),
  branch: z.string().trim().min(1).max(100).optional()
});

function isAllowedExtension(pathname: string): boolean {
  const parts = pathname.split('.');
  const ext = parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  return SECURITY_CONFIG.FILE_LIMITS.ALLOWED_FILE_TYPES.includes(ext as any);
}

export async function POST(req: Request) {
  try {
    if (!process.env.GITHUB_REPO) {
      return NextResponse.json({ error: 'Missing GITHUB_REPO' }, { status: 500 });
    }

    // Dynamic import to avoid build-time issues
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    const sessionUserId = (session as any)?.user?.id || 'anonymous';
    const token = (session as any)?.accessToken as string | undefined;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Basic per-user rate limiting
    const rateKey = `git:${sessionUserId}`;
    const allowed = globalRateLimiter.check(rateKey, SECURITY_CONFIG.RATE_LIMITS.API_REQUESTS_PER_MINUTE, 60_000);
    if (!allowed) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: { 'Retry-After': '60' } });
    }

    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }

    const { files, message, branch } = parsed.data;

    // Enforce allowed extensions
    for (const f of files) {
      if (!isAllowedExtension(f.path)) {
        return NextResponse.json({ error: `Disallowed file type for ${f.path}` }, { status: 400 });
      }
    }

    const repo = process.env.GITHUB_REPO!; // owner/repo
    const targetBranch = branch || process.env.GITHUB_DEFAULT_BRANCH || 'main';

    const gh = async (path: string, init?: RequestInit) => {
      const url = `https://api.github.com/repos/${repo}${path}`;
      const res = await fetch(url, {
        ...init,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
          ...(init?.headers || {})
        }
      });
      if (!res.ok) {
        const text = await res.text();
        const error = new Error(`GitHub API error ${res.status} ${res.statusText}: ${text}`);
        // Attach status for upstream handling
        (error as any).status = res.status;
        throw error;
      }
      return res.json();
    };

    // Get the latest commit SHA on the target branch
    const ref = await gh(`/git/ref/heads/${encodeURIComponent(targetBranch)}`);
    const latestCommitSha = ref.object.sha as string;

    // Get the tree SHA for the latest commit
    const latestCommit = await gh(`/git/commits/${latestCommitSha}`);
    const baseTreeSha = latestCommit.tree.sha as string;

    // Build a new tree with our file changes
    const tree = files.map((f) => ({
      path: f.path,
      mode: '100644',
      type: 'blob',
      content: f.content
    }));

    const newTree = await gh(`/git/trees`, {
      method: 'POST',
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree
      })
    });

    // Create a commit
    const authorName = 'White Rabbit Bot';
    const authorEmail = 'bot@whiterabbit.dev';

    const newCommit = await gh(`/git/commits`, {
      method: 'POST',
      body: JSON.stringify({
        message: message || 'update',
        tree: newTree.sha,
        parents: [latestCommitSha],
        author: { name: authorName, email: authorEmail }
      })
    });

    // Update the branch ref to point to the new commit (no force)
    try {
      await gh(`/git/refs/heads/${encodeURIComponent(targetBranch)}`, {
        method: 'PATCH',
        body: JSON.stringify({ sha: newCommit.sha, force: false })
      });
    } catch (e: any) {
      const status = e?.status as number | undefined;
      if (status === 422) {
        // Non fast-forward
        return NextResponse.json({ error: 'Branch out of date. Please pull latest changes and retry.' }, { status: 409 });
      }
      throw e;
    }

    return NextResponse.json({ ok: true, commit: newCommit.sha }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Commit failed' }, { status: err?.status || 500 });
  }
}

