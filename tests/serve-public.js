const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(process.cwd(), 'public');
const PORT = 1314;

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8',
};

function resolvePath(requestPath) {
  const cleanPath = decodeURIComponent(requestPath.split('?')[0]);
  let candidate = path.join(ROOT, cleanPath);

  if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
    candidate = path.join(candidate, 'index.html');
  } else if (!path.extname(candidate)) {
    const htmlCandidate = `${candidate}.html`;
    const indexCandidate = path.join(candidate, 'index.html');
    if (fs.existsSync(htmlCandidate)) {
      candidate = htmlCandidate;
    } else if (fs.existsSync(indexCandidate)) {
      candidate = indexCandidate;
    }
  }

  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    return { filePath: candidate, statusCode: 200 };
  }

  return {
    filePath: path.join(ROOT, '404.html'),
    statusCode: 404,
  };
}

const server = http.createServer((req, res) => {
  const { filePath, statusCode } = resolvePath(new URL(req.url, `http://${req.headers.host}`).pathname);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Internal Server Error');
      return;
    }

    res.writeHead(statusCode, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.listen(PORT, () => {
  process.stdout.write(`Static test server listening on http://localhost:${PORT}\n`);
});
