import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage } from 'node:http';

// A UI (src/web) é só um adaptador de teste manual: monta um HeldState e chama o
// cérebro (src/core). O core não depende de nada disto.

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

// Proxy de dev para o Jev: a chave é lida só no servidor e nunca vai pro bundle.
function jevProxy(apiKey: string): Plugin {
  return {
    name: 'jev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/jev', async (req, res) => {
        const send = (status: number, payload: unknown) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(payload));
        };

        if (req.method !== 'POST') {
          send(405, { error: 'Método não permitido' });
          return;
        }

        if (!apiKey) {
          send(503, { error: 'JEV_API_KEY não configurada' });
          return;
        }

        try {
          const body = await readBody(req);
          const upstream = await fetch('https://api.typesafe.ai/v1/systemone', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body,
          });
          const text = await upstream.text();
          res.statusCode = upstream.status;
          res.setHeader('Content-Type', 'application/json');
          res.end(text);
        } catch {
          send(502, { error: 'Falha ao contatar o Jev' });
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = env.JEV_API_KEY ?? process.env.JEV_API_KEY ?? '';
  return {
    plugins: [react(), jevProxy(apiKey)],
  };
});
