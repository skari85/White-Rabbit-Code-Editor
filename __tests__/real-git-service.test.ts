/**
 * RealGitService ahead/behind tests
 */

import git from 'isomorphic-git';
import { beforeEach, describe, expect, it } from 'vitest';
import { BrowserFileSystemAPI } from '../lib/filesystem-api';
import { RealGitService } from '../lib/real-git-service';

const REPO_DIR = '/repo';

async function makeRepo() {
  const fs = new BrowserFileSystemAPI();
  const service = new RealGitService(fs, REPO_DIR);
  await service.init();
  return { fs, dir: REPO_DIR, service };
}

async function commitFile(
  service: RealGitService,
  fs: BrowserFileSystemAPI,
  path: string,
  content: string,
  message: string
): Promise<string> {
  await fs.writeFile(`${REPO_DIR}/${path}`, content);
  await service.add([path]);
  return service.commit(message);
}

describe('RealGitService.countAheadBehind', () => {
  let service: RealGitService;
  let fs: BrowserFileSystemAPI;

  beforeEach(async () => {
    const repo = await makeRepo();
    service = repo.service;
    fs = repo.fs;
  });

  it('reports 0/0 for identical commits', async () => {
    const oid = await commitFile(service, fs, 'a.txt', 'v1', 'base');

    const result = await service.countAheadBehind(oid, oid);

    expect(result).toEqual({ ahead: 0, behind: 0 });
  });

  it('reports ahead-only when local has extra commits', async () => {
    const base = await commitFile(service, fs, 'a.txt', 'v1', 'base');
    const local1 = await commitFile(
      service,
      fs,
      'a.txt',
      'v2',
      'local change 1'
    );
    const local2 = await commitFile(
      service,
      fs,
      'a.txt',
      'v3',
      'local change 2'
    );

    const result = await service.countAheadBehind(local2, base);

    expect(result).toEqual({ ahead: 2, behind: 0 });
  });

  it('reports behind-only when remote has extra commits', async () => {
    const base = await commitFile(service, fs, 'a.txt', 'v1', 'base');

    await service.createBranch('remote-sim', base);
    await service.checkout('remote-sim');
    const remoteTip = await commitFile(
      service,
      fs,
      'a.txt',
      'remote-v2',
      'remote change'
    );

    const result = await service.countAheadBehind(base, remoteTip);

    expect(result).toEqual({ ahead: 0, behind: 1 });
  });

  it('reports both ahead and behind when histories diverge', async () => {
    const base = await commitFile(service, fs, 'a.txt', 'v1', 'base');

    await service.createBranch('remote-sim', base);
    await service.checkout('remote-sim');
    const remoteTip = await commitFile(
      service,
      fs,
      'b.txt',
      'remote-v2',
      'remote change'
    );

    await service.checkout('main');
    const local1 = await commitFile(
      service,
      fs,
      'c.txt',
      'local-v2',
      'local change 1'
    );
    const localTip = await commitFile(
      service,
      fs,
      'c.txt',
      'local-v3',
      'local change 2'
    );

    const result = await service.countAheadBehind(localTip, remoteTip);

    expect(result).toEqual({ ahead: 2, behind: 1 });
  });

  it('listBranches() surfaces ahead/behind against a remote-tracking ref', async () => {
    const base = await commitFile(service, fs, 'a.txt', 'v1', 'base');
    await service.addRemote('origin', 'https://example.com/repo.git');
    await git.writeRef({
      fs,
      dir: REPO_DIR,
      ref: 'refs/remotes/origin/main',
      value: base,
      force: true,
    });

    await commitFile(service, fs, 'a.txt', 'v2', 'local-only change');

    const branches = await service.listBranches();
    const main = branches.find(b => b.name === 'main');

    expect(main?.ahead).toBe(1);
    expect(main?.behind).toBe(0);
  });
});
