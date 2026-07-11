import { NextRequest, NextResponse } from 'next/server';

const ATLAS_API_URL = (
  process.env.ATLAS_API_URL ??
  'http://127.0.0.1:8000'
)
  .trim()
  .replace(/^['"]|['"]$/g, '')
  .replace(/\/+$/, '');

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

async function proxy(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { path } = await context.params;

    if (!path || path.length === 0) {
      return NextResponse.json(
        { error: 'Missing Atlas API path.' },
        { status: 400 },
      );
    }

    const destination = new URL(
      `${ATLAS_API_URL}/${path.join('/')}`,
    );

    request.nextUrl.searchParams.forEach((value, key) => {
      destination.searchParams.set(key, value);
    });

    const method = request.method;
    const headers = new Headers();

    const contentType =
      request.headers.get('content-type') ??
      'application/json';

    headers.set('Content-Type', contentType);

    const authorization =
      request.headers.get('authorization');

    if (authorization) {
      headers.set('Authorization', authorization);
    }

    let body: string | undefined;

    if (!['GET', 'HEAD'].includes(method)) {
      body = await request.text();
    }

    const response = await fetch(destination, {
      method,
      headers,
      body,
      cache: 'no-store',
    });

    const responseBody = await response.text();

    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        'Content-Type':
          response.headers.get('content-type') ??
          'application/json',
      },
    });
  } catch (error) {
    console.error('Atlas proxy error:', {
      error,
      atlasUrlConfigured: Boolean(
        process.env.ATLAS_API_URL,
      ),
      atlasUrlLength:
        process.env.ATLAS_API_URL?.length ?? 0,
    });

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

export async function PUT(
  request: NextRequest,
  context: RouteContext,
) {
  return proxy(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  return proxy(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  return proxy(request, context);
}
