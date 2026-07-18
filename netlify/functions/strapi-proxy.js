// Netlify Function: /api/* -> no live CMS backend, return an empty Strapi-shaped response.
// This site has no real CMS content of its own, so there is nothing to fetch;
// returning instantly avoids a multi-second round trip to a third-party backend.

exports.handler = async () => {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({ data: [], meta: { pagination: {} } }),
  };
};
