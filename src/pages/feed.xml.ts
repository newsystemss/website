import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>New</title>
  <link href="https://newsystems.ca/feed.xml" rel="self"/>
  <link href="https://newsystems.ca/"/>
  <updated>${new Date().toISOString()}</updated>
  <id>https://newsystems.ca</id>
  <author>
    <name>New</name>
    <email>email@newsystems.ca</email>
  </author>
</feed>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
