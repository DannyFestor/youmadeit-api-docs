// Regenerates contract/docs/index.html from contract/openapi.json.
//
// Produces a single self-contained HTML file that renders the OpenAPI document
// with Scalar. The spec is INLINED at generation time (embedded in the page),
// so index.html opens straight from the filesystem (file://) with no server and
// no live fetch of a local JSON file. Only the Scalar renderer itself is loaded
// from a pinned CDN. Zero npm dependencies — this script uses Node built-ins.
//
// Run: pnpm --dir contract/docs generate   (or: node contract/docs/generate.mjs)

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Pinned Scalar standalone build for reproducible output. Bump deliberately.
const SCALAR_VERSION = '1.63.0';

const here = dirname(fileURLToPath(import.meta.url));
const specPath = resolve(here, '..', 'openapi.json');
const outPath = resolve(here, 'index.html');

// Read the spec fresh every run so the docs never drift from the contract.
const specText = readFileSync(specPath, 'utf8');

// Validate it is parseable and pull the title for <title>.
const spec = JSON.parse(specText);
const title = spec?.info?.title ?? 'API Reference';

// Embed the spec in a JSON <script> block rather than a JS string literal: the
// only escaping needed is breaking up a literal `</` so the JSON cannot close
// the surrounding <script> element early.
const inlinedSpec = specText.replace(/<\//g, '<\\/');

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body>
    <div id="app"></div>

    <!-- OpenAPI document, inlined at generation time from contract/openapi.json -->
    <script id="openapi-spec" type="application/json">
${inlinedSpec}
    </script>

    <!-- Scalar API Reference renderer (pinned) -->
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@${SCALAR_VERSION}"></script>
    <script>
      Scalar.createApiReference('#app', {
        content: document.getElementById('openapi-spec').textContent,
      });
    </script>
  </body>
</html>
`;

writeFileSync(outPath, html);
console.log(`Wrote ${outPath} from ${specPath} (Scalar ${SCALAR_VERSION}).`);
