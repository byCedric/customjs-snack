const { serve, file, resolveSync } = require('bun');
const path = require('path');

const projectRoot = __dirname;

const server = serve({
  port: 3000,
  fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === '/_resolve') {
      return resolveFile(url);
    }

    return serveFile(url);
  },
});

console.log(`Listening on localhost:${server.port}`);

function resolveFile(url) {
  const module = url.searchParams.get('target');
  const origin = url.searchParams.get('origin');


  const search = !origin ? projectRoot : (
    path.dirname(origin)
  );

  console.log('Resolving', module, 'in', search);

  const filePath = resolveSync(module, search);

  console.log('  -> Found:', filePath);

  // const relativePath = path.relative(projectRoot, filePath);

  const response = new Response(`http://localhost:3000/${encodeURIComponent(filePath)}`);

  // Set open CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Expo-Resolved-Location');

  return response;
}

function serveFile(url) {
  const module = decodeURIComponent(url.pathname.substring(1));
  const origin = url.searchParams.get('origin');

  console.log('Serving', module, 'in', module);

  const filePath = require.resolve(module);

  console.log('  -> Found:', filePath);

  const response = new Response(file(filePath));

  // Set open CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

  return response;
}
