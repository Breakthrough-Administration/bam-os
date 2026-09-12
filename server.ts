import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import * as pricingRoute from './app/api/pricing/calculate/route';
import * as incidentsRoute from './app/api/incidents/route';
import * as webhook17hatsRoute from './app/api/webhooks/17hats/route';
import * as geminiGenerateRoute from './app/api/gemini/generate/route';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser for API requests
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Breakthrough Manager OS - Clinical Governance & NDIS PAPL Engine',
      version: '2.5.0',
      securityStatus: 'Zero-Trust Perimeter Enforced',
    });
  });

  // --- NDIS Pricing Arrangements & Price Limits (PAPL) Calculation API ---
  app.post(['/app/api/pricing/calculate', '/api/pricing/calculate'], (req, res) => {
    pricingRoute.POST(req, res);
  });
  app.get(['/app/api/pricing/calculate', '/api/pricing/calculate'], (req, res) => {
    pricingRoute.GET(req, res);
  });

  // --- NDIS Reportable Incidents Module API ---
  app.get(['/app/api/incidents', '/api/incidents'], (req, res) => {
    incidentsRoute.GET(req, res);
  });
  app.post(['/app/api/incidents', '/api/incidents'], (req, res) => {
    incidentsRoute.POST(req, res);
  });
  app.patch(['/app/api/incidents', '/api/incidents'], (req, res) => {
    incidentsRoute.PATCH(req, res);
  });

  // --- Cryptographically Protected Webhooks (HMAC-SHA256) ---
  app.post(['/app/api/webhooks/17hats', '/api/webhooks/17hats'], (req, res) => {
    webhook17hatsRoute.POST(req, res);
  });

  // --- Authenticated AI Proxy Route (Gemini with Server Guardrails) ---
  app.post(['/app/api/gemini/generate', '/api/gemini/generate'], (req, res) => {
    geminiGenerateRoute.POST(req as any, res);
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Breakthrough Manager OS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
