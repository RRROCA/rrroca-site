import express from 'express';
import { chatHandler } from './chat.js';

const app = express();

app.use(express.json({ limit: '16kb' }));

// Health check for Cloud Run
app.get('/', (_req, res) => res.json({ status: 'ok', service: 'rrroca-chatbot' }));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Chat endpoint
app.post('/api/chat', chatHandler);

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(JSON.stringify({ severity: 'ERROR', message: err.message, stack: err.stack }));
  res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error', fallback: true });
});

const PORT = parseInt(process.env.PORT ?? '8080', 10);
app.listen(PORT, () => console.log(JSON.stringify({ severity: 'INFO', message: `Listening on port ${PORT}` })));
