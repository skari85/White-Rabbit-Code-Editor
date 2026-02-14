/**
 * Auth stub — GitHub authentication has been removed.
 * This file is kept so any remaining imports don't break at build time.
 */

// No-op handlers
export const handlers = {
  GET: async () => new Response('Auth disabled', { status: 200 }),
  POST: async () => new Response('Auth disabled', { status: 200 }),
};

export async function signIn() {
  return undefined;
}

export async function signOut() {
  return undefined;
}

export async function auth() {
  return null;
}
