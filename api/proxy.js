const https = require('https');
const http = require('http');

module.exports = (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    const targetUrl = req.query ? req.query.url : null;

    if (!targetUrl) {
      res.status(200).send('FlashBoy CORS Proxy Service Active');
      return;
    }

    const urlObj = new URL(targetUrl);
    const lib = urlObj.protocol === 'https:' ? https : http;

    const proxyReq = lib.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
        'Referer': targetUrl
      }
    }, (proxyRes) => {
      const chunks = [];
      proxyRes.on('data', chunk => chunks.push(chunk));
      proxyRes.on('end', () => {
        const buffer = Buffer.concat(chunks);
        res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'application/octet-stream');
        res.setHeader('Content-Length', buffer.length);
        res.status(200).send(buffer);
      });
    });

    proxyReq.on('error', (err) => {
      res.status(200).send(`Proxy Error: ${err.message}`);
    });
  } catch (e) {
    res.status(200).send(`Proxy Exception: ${e.message}`);
  }
};
