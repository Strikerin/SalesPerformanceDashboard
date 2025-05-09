const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Setup proxy with path rewrite to remove '/api' prefix when forwarding to backend
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5001',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '' // Remove '/api' prefix when forwarding to backend
      },
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        // Log the proxied request URL
        console.log('Proxying to:', req.method, proxyReq.path);
      },
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Proxy error connecting to API' }));
      }
    })
  );
};