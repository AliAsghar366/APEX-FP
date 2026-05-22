// Vercel: stub for Cloudflare CDN scripts not needed in self-hosted mode
export default function handler(req, res) {
  res.setHeader("Content-Type", "text/javascript");
  res.status(200).send("/* cloudflare cdn stub */");
}
