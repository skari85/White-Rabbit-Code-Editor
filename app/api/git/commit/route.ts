import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { files, message, branch } = await req.json();

    if (!process.env.GITHUB_REPO) {
      return NextResponse.json({ error: 'Missing GITHUB_REPO' }, { status: 500 });
    }

    const session = await auth();
    const token = (session as any)?.accessToken || process.env.GITHUB_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'Missing GitHub credentials' }, { status: 401 });
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
          ...(init?.headers || {})
        }
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`GitHub API error ${res.status} ${res.statusText}: ${text}`);
      }
      return res.json();
    };

    // Get the latest commit SHA on the target branch
    const ref = await gh(`/git/ref/heads/${defaultBranch}`);
    const latestCommitSha = ref.object.sha as string;

    // Get the tree SHA for the latest commit
    const latestCommit = await gh(`/git/commits/${latestCommitSha}`);
    const baseTreeSha = latestCommit.tree.sha as string;

    // Build a new tree with our file changes
    const tree = files.map((f: { path: string; content: string }) => ({
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

    // Update the branch ref to point to the new commit
    await gh(`/git/refs/heads/${defaultBranch}`, {
      method: 'PATCH',
      body: JSON.stringify({ sha: newCommit.sha, force: true })
    });

    return NextResponse.json({ ok: true, commit: newCommit.sha });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Commit failed' }, { status: 500 });
  }
}

