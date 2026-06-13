import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/constants';

// Server-side only - never exposed to client
const BACKEND_URL = process.env.CMS_API_URL || process.env.NEXT_PUBLIC_CMS_API || 'http://localhost:4000';

// Paths that don't require authentication
const PUBLIC_PATHS = ['/v1/auth/login', '/v1/auth/register'];

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

async function proxy(request: NextRequest, pathParts: string[], method: Method): Promise<NextResponse> {
  const path = pathParts.join('/');
  const url = `${BACKEND_URL}/${path}`;
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p.replace(/^\//, '')));

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  // For protected endpoints, require auth
  if (!isPublic && !token) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Build headers to forward to backend
  const forwardHeaders = new Headers();
  const contentType = request.headers.get('Content-Type');

  if (contentType) {
    forwardHeaders.set('Content-Type', contentType);
  }
  if (token) {
    forwardHeaders.set('Authorization', `Bearer ${token}`);
  }

  // Forward body for non-GET/HEAD/OPTIONS requests
  let body: BodyInit | undefined;
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    if (contentType?.includes('multipart/form-data')) {
      body = await request.formData();
      // Don't set Content-Type for multipart; let fetch handle boundary
      forwardHeaders.delete('Content-Type');
    } else if (contentType?.includes('application/json')) {
      const text = await request.text();
      body = text;
    } else {
      body = await request.text();
    }
  }

  try {
    const response = await fetch(url, {
      method,
      headers: forwardHeaders,
      body,
      // Don't cache
      cache: 'no-store',
    });

    // Build response headers
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      // Don't forward Set-Cookie from backend; we manage cookies ourselves
      if (key.toLowerCase() === 'set-cookie') return;
      responseHeaders.set(key, value);
    });

    const responseBody = await response.text();
    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[Proxy ${method} /${path}]`, error);
    return NextResponse.json(
      { ok: false, error: 'Backend unavailable' },
      { status: 502 }
    );
  }
}

// Helper to create route handlers
function createHandler(method: Method) {
  return async (
    request: NextRequest,
    context: { params: { path: string[] } }
  ): Promise<NextResponse> => {
    return proxy(request, context.params.path, method);
  };
}

export const GET = createHandler('GET');
export const POST = createHandler('POST');
export const PUT = createHandler('PUT');
export const PATCH = createHandler('PATCH');
export const DELETE = createHandler('DELETE');
export const HEAD = createHandler('HEAD');
export const OPTIONS = createHandler('OPTIONS');
