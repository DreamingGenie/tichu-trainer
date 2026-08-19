// 의존성 없는 정적 서버. ES 모듈은 file://에서 CORS로 막히므로 개발할 때는 이걸 띄운다.
//   node tools/serve.js [포트]

import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const port = Number(process.argv[2]) || 8000;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let path = decodeURIComponent(url.pathname);
  if (path.endsWith('/')) path += 'index.html';

  // 루트 밖으로 나가는 경로는 막는다.
  const target = join(root, normalize(path));
  if (!target.startsWith(root + sep)) {
    res.writeHead(403).end('403');
    return;
  }

  let info;
  try {
    info = statSync(target);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('404 — 파일이 없습니다: ' + path);
    return;
  }
  if (info.isDirectory()) {
    res.writeHead(301, { location: path + '/' }).end();
    return;
  }

  res.writeHead(200, {
    'content-type': TYPES[extname(target).toLowerCase()] || 'application/octet-stream',
    'cache-control': 'no-cache',
  });
  createReadStream(target).pipe(res);
}).listen(port, () => {
  console.log(`http://localhost:${port} 에서 tichu-trainer 를 서비스합니다.`);
});
