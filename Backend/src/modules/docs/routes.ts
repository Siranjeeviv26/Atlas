import type { ServerRoute } from '@hapi/hapi'
import { env } from '../../config/env.js'
import { openApiDocument } from './openapi.js'

/**
 * Swagger UI is loaded from the CDN: the docs page is a dev-time convenience,
 * so it is deliberately not bundled into the API build.
 */
const SWAGGER_UI_VERSION = '5.17.14'

const docsPage = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Atlas API — docs</title>
<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui.css">
<style>
  body { margin: 0; background: #f7f4ee; }
  #topbar { display:none }
  .swagger-ui .topbar { display:none }
</style>
</head>
<body>
<div id="ui"></div>
<script src="https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-bundle.js" crossorigin></script>
<script>
  window.ui = SwaggerUIBundle({
    url: 'openapi.json',
    dom_id: '#ui',
    deepLinking: true,
    tryItOutEnabled: true,
    docExpansion: 'list',
    filter: true,
    withCredentials: true
  });
</script>
</body>
</html>`

export const docsRoutes: ServerRoute[] = [
  {
    method: 'GET',
    path: '/api/v1/openapi.json',
    options: {
      description: 'OpenAPI 3.1 description of the Atlas API',
      tags: ['api', 'docs'],
      cache: { expiresIn: 300_000, privacy: 'public' },
      response: {
        // `true` disables Hapi's response validation — the document is a
        // hand-written const object, not a Joi shape.
        schema: true,
      },
      handler: () => openApiDocument,
    },
  },
  {
    method: 'GET',
    path: '/api/v1/docs',
    options: {
      description: 'Interactive Swagger UI for the Atlas API',
      tags: ['api', 'docs'],
      cache: { expiresIn: 60_000, privacy: 'public' },
      handler: (_request, h) => h.response(docsPage).type('text/html'),
    },
  },
  {
    method: 'GET',
    path: '/api/v1/docs/',
    options: {
      plugins: { proxy: true },
      handler: (_request, h) => h.redirect('/api/v1/docs').permanent(),
    },
  },
]

export const docsIndex = {
  service: 'atlas-api',
  version: '1.0.0',
  docs: '/api/v1/docs',
  openapi: '/api/v1/openapi.json',
  baseUrl: env.API_URL,
}
