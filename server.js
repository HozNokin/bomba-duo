const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const seen = new Map(); // ip -> { firstSeen, lastSeen, hits, ua }

function nomeAparelho(ua = '') {
  if (/iPhone/i.test(ua)) return '📱 iPhone';
  if (/iPad/i.test(ua)) return '📱 iPad';
  if (/Android/i.test(ua)) return '📱 Android';
  if (/Macintosh|Mac OS/i.test(ua)) return '💻 Mac/PC';
  if (/Windows/i.test(ua)) return '💻 Windows';
  return '🌐 Dispositivo';
}

function registrar(req) {
  const ip = (req.socket.remoteAddress || '').replace('::ffff:', '');
  const ua = req.headers['user-agent'] || '';
  const agora = new Date();
  const hora = agora.toLocaleTimeString('pt-BR');
  if (!seen.has(ip)) {
    seen.set(ip, { firstSeen: agora, lastSeen: agora, hits: 1, ua });
    console.log(`\n  ✅ NOVO DISPOSITIVO #${seen.size} — ${hora}`);
    console.log(`     ${nomeAparelho(ua)} | IP: ${ip}`);
    console.log(`     ${ua.slice(0, 110)}`);
  } else {
    const d = seen.get(ip);
    d.lastSeen = agora; d.hits++;
  }
  return ip;
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath !== '/favicon.ico') registrar(req);

  // API: lista de dispositivos conectados
  if (urlPath === '/dispositivos') {
    const lista = [...seen.entries()].map(([ip, d], i) => ({
      n: i + 1, ip,
      aparelho: nomeAparelho(d.ua),
      primeiraVez: d.firstSeen.toLocaleTimeString('pt-BR'),
      ultimaVez: d.lastSeen.toLocaleTimeString('pt-BR'),
      acessos: d.hits,
    }));
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify(lista, null, 2));
  }

  // Painel visual no navegador
  if (urlPath === '/painel') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>📡 Dispositivos — Bomba Duo</title>
<style>body{font-family:system-ui,sans-serif;background:#faf5ec;color:#3E3226;padding:20px;max-width:600px;margin:auto}
.card{background:rgba(255,255,255,.8);border-radius:16px;padding:14px;margin:10px 0;box-shadow:0 4px 14px rgba(0,0,0,.08)}
h1{font-size:1.3rem}.n{font-size:1.4rem;font-weight:800;color:#8B5E3C}
small{color:#8A7560}</style></head><body>
<h1>📡 Dispositivos conectados (<span id="q">0</span>)</h1>
<p><small>Atualiza sozinho a cada 3s • <a href="/">voltar ao jogo</a></small></p>
<div id="lista"></div>
<script>async function up(){const r=await fetch('/dispositivos');const d=await r.json();
document.getElementById('q').textContent=d.length;
document.getElementById('lista').innerHTML=d.map(x=>'<div class=card><span class=n>#'+x.n+'</span> <b>'+x.aparelho+'</b><br>IP: <b>'+x.ip+'</b><br><small>Entrou: '+x.primeiraVez+' • Visto: '+x.ultimaVez+' • Acessos: '+x.acessos+'</small></div>').join('')||'<p>Nenhum ainda. Abra o jogo no iPhone!</p>'}
up();setInterval(up,3000)</script></body></html>`);
  }

  let file = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath.slice(1));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Arquivo não encontrado');
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const { networkInterfaces } = require('os');
  const ips = Object.values(networkInterfaces()).flat()
    .filter(n => n && n.family === 'IPv4' && !n.internal)
    .map(n => n.address);
  console.log(`\n  💣 Bomba Duo rodando!`);
  console.log(`  Local:      http://localhost:${PORT}`);
  ips.forEach(ip => console.log(`  No iPhone:  http://${ip}:${PORT}`));
  console.log(`\n  No iPhone, abra o Safari e digite o endereço "No iPhone" (mesmo Wi-Fi).`);
  console.log(`  Painel de dispositivos: http://localhost:${PORT}/painel\n`);
});
