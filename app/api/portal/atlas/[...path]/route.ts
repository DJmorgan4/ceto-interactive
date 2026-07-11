import { NextRequest, NextResponse } from 'next/server';

const ATLAS_API_URL =
  process.env.ATLAS_API_URL ??
  'http://127.0.0.1:8000';

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

async function proxy(
  request: NextRequest,
  context: RouteContext,
) {
  const { path } = await context.params;

  const destination = new URL(
    `${ATLAS_API_URL}/${path.join('/')}`,
  );

  request.nextUrl.searchParams.forEach((value, key) => {
    destination.searchParams.set(key, value);
  });

  const method = request.method;
  const headers = new Headers();

  headers.set('Content-Type', 'application/json');

  let body: string | undefined;

  if (!['GET', 'HEAD'].includes(method)) {
    body = await request.text();
  }

  try {
    const response = await fetch(destination, {
      method,
      headers,
      body,
      cache: 'no-store',
    });

    const text = await response.text();

    return new NextResponse(text, {
      status: response.status,
      headers: {
        'Content-Type':
          response.headers.get('Content-Type') ??
          'application/json',
      },
    });
  } catch (error) {
    console.error('Atlas proxy error:', error);

    return NextResponse.json(
      {
        error:
          'The Ceto portal could not reach the Atlas API.',
      },
      {
        status: 503,
      },
    );
  }
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  return proxy(request, context);
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  return proxy(request, context);
}
