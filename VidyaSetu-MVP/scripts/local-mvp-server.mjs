import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

import adews from '../api/adews.js';
import counselor from '../api/counselor.js';
import health from '../api/health.js';
import intake from '../api/intake.js';
import journey from '../api/journey.js';
import jobs from '../api/jobs.js';
import outreach from '../api/outreach.js';
import passportHandler from '../api/passport.js';
import pathway from '../api/pathway.js';
import progress from '../api/progress.js';
import resume from '../api/resume.js';
import signup from '../api/signup.js';

await loadLocalEnv();

const handlers = {
  '/api/adews': adews,
  '/api/counselor': counselor,
  '/api/health': health,
  '/api/intake': intake,
  '/api/journey': journey,
  '/api/jobs': jobs,
  '/api/outreach': outreach,
  '/api/passport': passportHandler,
  '/api/pathway': pathway,
  '/api/progress': progress,
  '/api/resume': resume,
  '/api/signup': signup,
};

const contentTypes = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (handlers[url.pathname]) {
    return handlers[url.pathname](req, res);
  }

  const requestedFile = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = path.join(process.cwd(), 'dist', requestedFile);

  try {
    const data = await fs.readFile(filePath);
    res.setHeader('Content-Type', contentTypes[path.extname(filePath)] || 'application/octet-stream');
    res.end(data);
  } catch {
    const data = await fs.readFile(path.join(process.cwd(), 'dist', 'index.html'));
    res.setHeader('Content-Type', 'text/html');
    res.end(data);
  }
});

server.listen(4175, '0.0.0.0', () => {
  console.log('VidyaSetu local MVP server ready at http://localhost:4175');
});

async function loadLocalEnv() {
  for (const fileName of ['.env.local', '.env']) {
    try {
      const text = await fs.readFile(path.join(process.cwd(), fileName), 'utf8');
      text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#') && line.includes('='))
        .forEach((line) => {
          const [key, ...rest] = line.split('=');
          if (!process.env[key]) {
            process.env[key] = rest.join('=').replace(/^["']|["']$/g, '');
          }
        });
    } catch {
      // Local env files are optional.
    }
  }
}
