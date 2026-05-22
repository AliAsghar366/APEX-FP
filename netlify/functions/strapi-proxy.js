// Netlify Function: /api/* -> Strapi CMS proxy

const STRAPI_BASE = "https://best-crystal-311b010c7b.strapiapp.com";
const STRAPI_TOKEN =
  "ece0f68d62142b4fe9bff594b8a4f023849f664b03b8e578092544214b9791a2b87" +
  "d5ee018c43acf683dbf272f3106e39d8ced21f879cd94efbb62dc40c29c34b632df" +
  "cb2b4c5ed4f59513b94d48c702ba7491217c6a42ea7c09d5944c21b0b4979cfcfe4" +
  "5dd40e586b5845e8edfcfe564b4e1ede3e73ce21e9d686501a1a508";

exports.handler = async (event) => {
  const path = event.path.replace(/^\/.netlify\/functions\/strapi-proxy/, "") || "/api";
  const qs = event.rawQuery ? "?" + event.rawQuery : "";
  const url = STRAPI_BASE + "/api" + path + qs;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    const data = await res.text();
    return {
      statusCode: res.status,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: data,
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [], meta: { pagination: {} } }),
    };
  }
};
