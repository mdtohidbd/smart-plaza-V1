/**
 * Base URL for storefront JSON APIs: `/api/public/...` on the backend.
 *
 * Env examples:
 * - `http://localhost:5001` → `http://localhost:5001/api/public`
 * - `http://localhost:5001/api` → `http://localhost:5001/api/public`
 * - `http://localhost:5001/api/public` → unchanged
 */
export function getPublicApiBase() {
  const raw =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    'http://localhost:5001/api';

  let u = String(raw).trim().replace(/\/$/, '');

  if (u.endsWith('/api/public')) {
    return u;
  }

  // Wrong legacy shape e.g. http://host:port/public (no /api)
  if (u.endsWith('/public') && !u.endsWith('/api/public')) {
    u = u.replace(/\/public$/, '');
  }

  if (u.endsWith('/api')) {
    return `${u}/public`;
  }

  return `${u}/api/public`;
}
