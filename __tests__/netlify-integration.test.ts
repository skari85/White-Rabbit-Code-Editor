/**
 * NetlifyIntegration deploy flow tests
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NetlifyIntegration } from '../lib/netlify-integration';
import { FileContent } from '../hooks/use-code-builder';

const files: FileContent[] = [
  {
    name: 'index.html',
    content: '<html></html>',
    type: 'html',
    lastModified: new Date(),
  },
];

function jsonResponse(body: any, ok = true) {
  return {
    ok,
    status: ok ? 200 : 500,
    text: () => Promise.resolve(JSON.stringify(body)),
    json: () => Promise.resolve(body),
  } as Response;
}

describe('NetlifyIntegration', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('creates a site then deploys a zip when no siteId is given', async () => {
    const fetchMock = global.fetch as any;
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          id: 'site-123',
          name: 'my-app',
          url: 'my-app.netlify.app',
          ssl_url: 'https://my-app.netlify.app',
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          id: 'deploy-456',
          url: 'my-app.netlify.app',
          deploy_ssl_url: 'https://my-app.netlify.app',
          state: 'ready',
        })
      );

    const netlify = new NetlifyIntegration('test-token');
    const deployment = await netlify.deployProject('My App', files);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain('/sites');
    expect(fetchMock.mock.calls[1][0]).toContain('/sites/site-123/deploys');
    expect(fetchMock.mock.calls[1][1].headers['Content-Type']).toBe(
      'application/zip'
    );
    expect(deployment.id).toBe('deploy-456');
    expect(NetlifyIntegration.getDeploymentUrl(deployment)).toBe(
      'https://my-app.netlify.app'
    );
    expect(NetlifyIntegration.isDeploymentReady(deployment)).toBe(true);
  });

  it('deploys directly to an existing site when siteId is provided', async () => {
    const fetchMock = global.fetch as any;
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        id: 'deploy-789',
        url: 'existing.netlify.app',
        deploy_ssl_url: 'https://existing.netlify.app',
        state: 'building',
      })
    );

    const netlify = new NetlifyIntegration('test-token');
    await netlify.deployProject('My App', files, 'existing-site');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain(
      '/sites/existing-site/deploys'
    );
  });

  it('surfaces API errors the same way VercelIntegration does', async () => {
    const fetchMock = global.fetch as any;
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Unauthorized'),
    } as Response);

    const netlify = new NetlifyIntegration('bad-token');

    await expect(netlify.getUser()).rejects.toThrow(/Netlify API error: 401/);
  });
});
