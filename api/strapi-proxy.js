// Vercel: /api/* -> no live CMS backend, return an empty Strapi-shaped response.
// This site has no real CMS content of its own, so there is nothing to fetch;
// returning instantly avoids a multi-second round trip to a third-party backend.

export default async function handler(req, res) {
  res.status(200).json({ data: [], meta: { pagination: {} } });
}
