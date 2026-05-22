// Netlify Function: /_next/image?url=...
// Redirects to the decoded static file path.

exports.handler = async (event) => {
  const params = event.queryStringParameters || {};
  let url = params.url || "";
  if (!url) {
    return { statusCode: 400, body: "Missing url param" };
  }
  let decoded = decodeURIComponent(decodeURIComponent(url));
  if (!decoded.startsWith("/")) decoded = "/" + decoded;
  return {
    statusCode: 302,
    headers: { Location: decoded },
    body: "",
  };
};
