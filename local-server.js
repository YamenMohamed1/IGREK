const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = __dirname;
const dataFile = path.join(root, 'content-data.json');
const adminConfigFile = path.join(root, 'admin-config.json');
const applicationsFile = path.join(root, 'applications.json');

// MIME types supported by the server
const types = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff'
};

// In-memory active admin sessions
const activeSessions = new Set();

function getAdminCredentials() {
  try {
    if (fs.existsSync(adminConfigFile)) {
      return JSON.parse(fs.readFileSync(adminConfigFile, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading admin config:', err);
  }
  return { username: 'admin', password: 'igrek2026' };
}

function verifyAdmin(request) {
  const authHeader = request.headers['authorization'] || request.headers['x-admin-token'];
  if (!authHeader) return false;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  return activeSessions.has(token);
}

function parseJsonBody(request, maxSize = 2 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    request.on('data', chunk => {
      size += chunk.length;
      if (size > maxSize) {
        request.destroy();
        reject(new Error('Payload too large'));
        return;
      }
      body += chunk;
    });
    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    request.on('error', reject);
  });
}

// ==========================================
// GOOGLE SHEETS WEBHOOK INTEGRATION
// Paste your Google Apps Script Web App URL below when ready:
// Example: const GOOGLE_SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/.../exec';
// ==========================================
const GOOGLE_SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzecMhIPiZ39zDaZN5ZtGmoVxlz_-RbvR99tlVHtAZzf-Bw7-v78ZZltEW9eeqwvZFmvQ/exec';

async function forwardToGoogleSheets(application) {
  if (!GOOGLE_SHEETS_WEBHOOK_URL) return;
  try {
    const payload = JSON.stringify(application);
    const targetUrl = new URL(GOOGLE_SHEETS_WEBHOOK_URL);
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };
    const reqModule = targetUrl.protocol === 'https:' ? require('https') : require('http');
    const req = reqModule.request(targetUrl, options, res => {
      res.resume();
    });
    req.on('error', err => console.error('Google Sheets forward error:', err));
    req.write(payload);
    req.end();
  } catch (err) {
    console.error('Google Sheets request failed:', err);
  }
}

http.createServer(async (request, response) => {
  const urlObj = new URL(request.url, `http://${request.headers.host || 'localhost:8000'}`);
  const pathname = decodeURIComponent(urlObj.pathname);

  const isGetOrHead = request.method === 'GET' || request.method === 'HEAD';

  // 1. Root and friendly redirects
  if (pathname === '/' && isGetOrHead) {
    response.writeHead(302, { Location: '/home/' }).end();
    return;
  }
  if ((pathname === '/home/admin' || pathname === '/home/admin/') && isGetOrHead) {
    response.writeHead(302, { Location: '/admin/' }).end();
    return;
  }
  if ((pathname === '/home/apply' || pathname === '/home/apply/') && isGetOrHead) {
    response.writeHead(302, { Location: '/apply/' }).end();
    return;
  }

  // 2. Public Content API (GET) - strictly sanitizes any credentials
  if (pathname === '/api/content' && request.method === 'GET') {
    fs.readFile(dataFile, 'utf8', (error, contents) => {
      response.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      });
      if (error) {
        return response.end('{}');
      }
      try {
        const parsed = JSON.parse(contents);
        delete parsed.admin; // Ensure credentials never leak publicly
        response.end(JSON.stringify(parsed));
      } catch {
        response.end('{}');
      }
    });
    return;
  }

  // 3. Admin Login API (POST)
  if (pathname === '/api/admin/login' && request.method === 'POST') {
    try {
      const data = await parseJsonBody(request);
      const creds = getAdminCredentials();
      if (data.username === creds.username && data.password === creds.password) {
        const token = crypto.randomBytes(32).toString('hex');
        activeSessions.add(token);
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ success: true, token }));
      } else {
        response.writeHead(401, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ success: false, error: 'Incorrect username or password.' }));
      }
    } catch (err) {
      response.writeHead(400, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // 4. Admin Content Save API (POST) - requires authentication
  if (pathname === '/api/content' && request.method === 'POST') {
    if (!verifyAdmin(request)) {
      response.writeHead(401, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    try {
      const content = await parseJsonBody(request);
      delete content.admin;
      fs.writeFile(dataFile, JSON.stringify(content, null, 2), 'utf8', error => {
        if (error) {
          response.writeHead(500, { 'Content-Type': 'application/json' });
          return response.end(JSON.stringify({ error: 'Unable to save content' }));
        }
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ saved: true }));
      });
    } catch (err) {
      response.writeHead(400, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 5. Job Application Submission API (POST)
  if (pathname === '/api/apply' && request.method === 'POST') {
    try {
      const data = await parseJsonBody(request);
      if (!data.name || !data.email || !data.phone || !data.vocaroo || !data.lastPosition) {
        response.writeHead(400, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ success: false, error: 'All fields are required.' }));
        return;
      }

      const newApp = {
        id: 'app_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: String(data.name).trim(),
        email: String(data.email).trim(),
        phone: String(data.phone).trim(),
        vocaroo: String(data.vocaroo).trim(),
        experience: String(data.experience || 'Not specified').trim(),
        lastPosition: String(data.lastPosition).trim(),
        submittedAt: new Date().toISOString()
      };

      let apps = [];
      try {
        if (fs.existsSync(applicationsFile)) {
          apps = JSON.parse(fs.readFileSync(applicationsFile, 'utf8'));
          if (!Array.isArray(apps)) apps = [];
        }
      } catch (e) {
        apps = [];
      }

      apps.unshift(newApp); // Newest first

      fs.writeFile(applicationsFile, JSON.stringify(apps, null, 2), 'utf8', err => {
        if (err) {
          response.writeHead(500, { 'Content-Type': 'application/json' });
          response.end(JSON.stringify({ success: false, error: 'Could not store application.' }));
          return;
        }

        // Trigger Google Sheets forward (async)
        forwardToGoogleSheets(newApp);

        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ success: true, message: 'Application submitted successfully.' }));
      });
    } catch (err) {
      response.writeHead(400, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // 6. Admin Applications Retrieval API (GET) - requires authentication
  if (pathname === '/api/applications' && request.method === 'GET') {
    if (!verifyAdmin(request)) {
      response.writeHead(401, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    fs.readFile(applicationsFile, 'utf8', (err, data) => {
      response.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      });
      response.end(err ? '[]' : data);
    });
    return;
  }

  // 7. Static File Serving with Directory Redirection
  let relPath = pathname.replace(/^[/\\]+/, '');
  if (!relPath) relPath = 'home';

  let filePath = path.join(root, relPath);
  if (!filePath.startsWith(root)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err) {
      response.writeHead(404).end('Not found');
      return;
    }

    // If it's a directory:
    if (stats.isDirectory()) {
      if (!pathname.endsWith('/')) {
        response.writeHead(302, { Location: pathname + '/' }).end();
        return;
      }
      filePath = path.join(filePath, 'index.html');
    }

    fs.readFile(filePath, (readErr, contents) => {
      if (readErr) {
        response.writeHead(404).end('Not found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      response.writeHead(200, {
        'Content-Type': types[ext] || 'application/octet-stream',
        'Cache-Control': ext === '.html' ? 'no-cache' : 'max-age=3600'
      });
      if (request.method === 'HEAD') {
        response.end();
      } else {
        response.end(contents);
      }
    });
  });
}).listen(8000, '0.0.0.0', () => console.log('IGREK is running at http://localhost:8000'));
