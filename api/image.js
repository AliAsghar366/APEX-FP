// Vercel: /_next/image?url=...&w=...&q=...
// Decodes the url param and redirects to the actual local static file.

export default function handler(req, res) {
  const { url } = req.query;
  if (!url) {
    res.status(400).send("Missing url param");
    return;
  }
  // url is double-encoded by Next.js image component
  let decoded = decodeURIComponent(decodeURIComponent(url));
  if (!decoded.startsWith("/")) decoded = "/" + decoded;
  // Redirect to the static file
  res.redirect(302, decoded);
}
