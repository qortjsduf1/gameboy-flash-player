const https = require('https');
const http = require('http');
const { URL } = require('url');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const targetUrl = req.query && req.query.url;

  if (!targetUrl) {
    res.status(200).send('FlashBoy Proxy Active');
    return;
  }

  try {
    const parsedUrl = new URL(targetUrl);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Referer': targetUrl
      }
    };

    const proxyReq = client.request(options, (proxyRes) => {
      const contentType = proxyRes.headers['content-type'] || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);

      const chunks = [];
      proxyRes.on('data', (chunk) => chunks.push(chunk));
      proxyRes.on('end', () => {
        const buffer = Buffer.concat(chunks);
        res.setHeader('Content-Length', buffer.length);
        res.status(200).send(buffer);
      });
    });

    proxyReq.on('error', (err) => {
      res.status(500).send(`Proxy Network Error: ${err.message}`);
    });

    proxyReq.end();
  } catch (err) {
    res.status(500).send(`Proxy Exception: ${err.message}`);
  }
};
