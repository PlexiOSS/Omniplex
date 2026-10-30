import { writeFile } from "node:fs/promises";

const SPEC_URL = process.env.OPENAPI_URL ?? "https://api.omniplex.gg/openapi";
const SCHEMA_REF = "#/components/schemas/";

const res = await fetch(SPEC_URL);
if (!res.ok) throw new Error(`Fetching ${SPEC_URL} failed: ${res.status}`);
const spec = await res.json();

const renamed = new Map();
const schemas = spec.components?.schemas ?? {};
for (const name of Object.keys(schemas)) {
  if (!name.includes("/")) continue;
  const clean = name.replaceAll("/", ".");
  schemas[clean] = schemas[name];
  delete schemas[name];
  renamed.set(name, clean);
}

const fixRefs = (node) => {
  if (Array.isArray(node)) return node.forEach(fixRefs);
  if (!node || typeof node !== "object") return;
  for (const [key, value] of Object.entries(node)) {
    if (
      key === "$ref" &&
      typeof value === "string" &&
      value.startsWith(SCHEMA_REF)
    ) {
      const name = value.slice(SCHEMA_REF.length);
      if (renamed.has(name)) node[key] = SCHEMA_REF + renamed.get(name);
    } else {
      fixRefs(value);
    }
  }
};
fixRefs(spec);

await writeFile("./openapi.json", `${JSON.stringify(spec, null, 2)}\n`);

console.log(
  `Saved the OpenAPI schema from ${SPEC_URL}` +
    (renamed.size
      ? ` (renamed ${renamed.size} schemas with "/" in their name)`
      : ""),
);
