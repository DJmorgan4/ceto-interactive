export const runtime = 'nodejs';

type FeedItem = {
  title: string;
  link: string;
  source: string;
  publishedAt?: string;
};

export async function GET() {
  // First: return something guaranteed so you can confirm routing works.
  return Response.json({
    ok: true,
    message: 'updates API route is alive'
  });
}

