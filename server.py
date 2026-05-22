"""
ApexFX local server — full-featured replacement for Next.js server.

Features:
- Serves all static files with correct MIME types
- Handles HTTP range requests (needed for <video> elements)
- Next.js routing: /about -> about.html or about/index.html
- Proxies Strapi API calls to the live server (with caching)
- Serves _next/data/ routes for client-side navigation
- CORS headers for all responses
- Graceful 404 for missing files
"""

import http.server
import socketserver
import os
import sys
import mimetypes
import urllib.parse
import urllib.request
import json
import threading

PORT = 3000
SITE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "site", "apexfx.com")
STRAPI_BASE = "https://best-crystal-311b010c7b.strapiapp.com"
STRAPI_TOKEN = (
    "ece0f68d62142b4fe9bff594b8a4f023849f664b03b8e578092544214b9791a2b87d5ee018c43acf"
    "683dbf272f3106e39d8ced21f879cd94efbb62dc40c29c34b632dfcb2b4c5ed4f59513b94d48c702"
    "ba7491217c6a42ea7c09d5944c21b0b4979cfcfe45dd40e586b5845e8edfcfe564b4e1ede3e73ce2"
    "1e9d686501a1a508"
)

# Register extra MIME types
for ext, mime in [
    (".js",    "text/javascript"),
    (".mjs",   "text/javascript"),
    (".json",  "application/json"),
    (".webp",  "image/webp"),
    (".avif",  "image/avif"),
    (".woff2", "font/woff2"),
    (".woff",  "font/woff"),
    (".ttf",   "font/ttf"),
    (".otf",   "font/otf"),
    (".svg",   "image/svg+xml"),
    (".webm",  "video/webm"),
    (".mp4",   "video/mp4"),
    (".m4v",   "video/mp4"),
    (".glb",   "model/gltf-binary"),
    (".gltf",  "model/gltf+json"),
]:
    mimetypes.add_type(mime, ext)

# Simple in-memory API cache
_api_cache: dict[str, bytes] = {}
_cache_lock = threading.Lock()


def proxy_strapi(path: str) -> tuple[int, bytes, str]:
    """Forward API request to live Strapi, cache result."""
    with _cache_lock:
        if path in _api_cache:
            return 200, _api_cache[path], "application/json"
    url = STRAPI_BASE + path
    try:
        req = urllib.request.Request(
            url,
            headers={
                "Authorization": f"Bearer {STRAPI_TOKEN}",
                "User-Agent": "Mozilla/5.0",
            },
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            data = r.read()
        with _cache_lock:
            _api_cache[path] = data
        return r.status, data, "application/json"
    except Exception as e:
        # Return empty Strapi-shaped response so React doesn't crash
        empty = json.dumps({"data": [], "meta": {"pagination": {}}}).encode()
        return 200, empty, "application/json"


class ApexFXHandler(http.server.BaseHTTPRequestHandler):

    def do_GET(self):
        raw = self.path
        parsed = urllib.parse.urlparse(raw)
        path = urllib.parse.unquote(parsed.path)

        # ── Next.js Image Optimization handler ────────────────────────────────
        # Handles both /_next/image?url=... (standard) and
        # /_next/image@url=... (wget-mangled variant still in old HTML)
        if path == "/_next/image" or path.startswith("/_next/image@") or path.startswith("/_next/image%3F"):
            # Extract url= from query string or from mangled @-path
            qs = urllib.parse.parse_qs(parsed.query)
            img_url = qs.get("url", [""])[0]
            if not img_url and "@" in path:
                # Mangled form: /_next/image@url=ENCODED&w=...
                rest = path.split("@", 1)[1]
                for part in rest.split("&"):
                    if part.startswith("url="):
                        img_url = part[4:]
                        break
            if img_url:
                decoded = urllib.parse.unquote(urllib.parse.unquote(img_url))
                local = os.path.normpath(os.path.join(SITE_DIR, decoded.lstrip("/")))
                if os.path.isfile(local):
                    self._serve_file(local)
                    return
                flat_name = decoded.lstrip("/").replace("/", "_")
                flat_path = os.path.join(SITE_DIR, "_next", "static", "media", flat_name)
                if os.path.isfile(flat_path):
                    self._serve_file(flat_path)
                    return
            self._send_404(f"/_next/image url={img_url}")
            return

        # ── Cloudflare CDN stubs (not needed locally) ─────────────────────────
        if path.startswith("/cdn-cgi/"):
            self._respond(200, b"/* cloudflare stub */", "text/javascript")
            return

        # ── Strapi API proxy ──────────────────────────────────────────────────
        if path.startswith("/api/") or path.startswith("/uploads/"):
            status, data, ctype = proxy_strapi(raw)
            self._respond(status, data, ctype)
            return

        # ── Static file serving ───────────────────────────────────────────────
        # Strip query string for all static file lookups
        fs_path = self._resolve(path)

        if fs_path and os.path.isfile(fs_path):
            self._serve_file(fs_path)
        else:
            self._send_404(path)

    def _resolve(self, path: str) -> str | None:
        """Map URL path to local filesystem path, with fallbacks."""
        base = os.path.normpath(os.path.join(SITE_DIR, path.lstrip("/")))

        candidates = [
            base,
            base + ".html",
            os.path.join(base, "index.html"),
        ]
        for c in candidates:
            if os.path.isfile(c):
                return c
        return None

    def _serve_file(self, fspath: str):
        ext = os.path.splitext(fspath)[1].lower()
        ctype = mimetypes.guess_type(fspath)[0] or "application/octet-stream"
        fsize = os.path.getsize(fspath)

        # Range request support (required for <video>)
        range_header = self.headers.get("Range")
        if range_header and range_header.startswith("bytes="):
            try:
                ranges = range_header[6:].split("-")
                start = int(ranges[0]) if ranges[0] else 0
                end   = int(ranges[1]) if len(ranges) > 1 and ranges[1] else fsize - 1
                end   = min(end, fsize - 1)
                length = end - start + 1
                self.send_response(206)
                self.send_header("Content-Type", ctype)
                self.send_header("Content-Range", f"bytes {start}-{end}/{fsize}")
                self.send_header("Content-Length", str(length))
                self.send_header("Accept-Ranges", "bytes")
                self._cors()
                self.end_headers()
                with open(fspath, "rb") as f:
                    f.seek(start)
                    self.wfile.write(f.read(length))
                return
            except Exception:
                pass  # fall through to full file

        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(fsize))
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Cache-Control", "public, max-age=3600")
        self._cors()
        self.end_headers()
        with open(fspath, "rb") as f:
            self.wfile.write(f.read())

    def _respond(self, status: int, data: bytes, ctype: str):
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self._cors()
        self.end_headers()
        self.wfile.write(data)

    def _send_404(self, path: str):
        body = f"404 Not Found: {path}".encode()
        self.send_response(404)
        self.send_header("Content-Type", "text/plain")
        self.send_header("Content-Length", str(len(body)))
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def log_message(self, fmt, *args):
        # Suppress asset noise; show pages and 404s
        msg = fmt % args
        if "404" in msg or (" 200 " in msg and not any(
            x in msg for x in ["_next/static", ".png", ".webp", ".avif",
                                ".svg", ".woff", ".mp4", ".webm", ".js", ".css"]
        )):
            print(f"  {self.address_string()} {msg}")


class ThreadedServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    with ThreadedServer(("", PORT), ApexFXHandler) as httpd:
        print(f"\n  ApexFX Local Site")
        print(f"  Open: http://localhost:{PORT}")
        print(f"  Root: {SITE_DIR}")
        print(f"  Press Ctrl+C to stop\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")
