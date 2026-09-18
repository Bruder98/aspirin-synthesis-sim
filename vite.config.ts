import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'screenshot-saver',
      configureServer(server) {
        server.middlewares.use('/save-screenshot', (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            return res.end();
          }
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const { name, data } = JSON.parse(body);
              const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
              const targetPath = path.resolve(process.cwd(), name);
              fs.writeFileSync(targetPath, Buffer.from(base64Data, 'base64'));
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, path: targetPath }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        });
      },
    },
  ],
  server: {
    port: 3001,
    open: false,
  },
  build: {
    chunkSizeWarningLimit: 1200,
  },
});

