import express from 'express';
import compression from 'compression';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(compression());
app.use(cors());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// In-memory sessions store
const sessions = new Map();

// Helper to format bytes
function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
}

// Helper to format seconds to dhms
function formatSeconds(sec) {
  if (sec <= 0) return '0s';
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(' ');
}

// MikroTik Hotspot Template Processor
function renderMikrotikTemplate(htmlContent, vars = {}) {
  let output = htmlContent;

  // Process conditional blocks $(if var == 'val')...$(elif ...)...$(else)...$(endif)
  // 1. $(if error)...$(endif)
  output = output.replace(/\$\(if\s+error\)([\s\S]*?)\$(endif)/g, (match, body) => {
    return vars.error ? body : '';
  });

  // 2. $(if chap-id)...$(endif)
  output = output.replace(/\$\(if\s+chap-id\)([\s\S]*?)\$(endif)/g, (match, body) => {
    return vars['chap-id'] ? body : '';
  });

  // 3. $(if logged-in == 'yes') ... $(else) ... $(endif)
  output = output.replace(/\$\(if\s+logged-in\s*==\s*'yes'\)([\s\S]*?)(?:\$\(else\)([\s\S]*?))?\$\(endif\)/g, (match, ifBody, elseBody) => {
    return vars['logged-in'] === 'yes' ? ifBody : (elseBody || '');
  });

  // 4. $(if session-time-left) ... $(else) ... $(endif)
  output = output.replace(/\$\(if\s+session-time-left\)([\s\S]*?)(?:\$\(else\)([\s\S]*?))?\$\(endif\)/g, (match, ifBody, elseBody) => {
    return vars['session-time-left'] ? ifBody : (elseBody || '');
  });

  // 5. $(if advert-pending == 'yes') ... $(endif)
  output = output.replace(/\$\(if\s+advert-pending\s*==\s*'yes'\)([\s\S]*?)\$(endif)/g, (match, body) => {
    return vars['advert-pending'] === 'yes' ? body : '';
  });

  // 6. $(if login-by-mac != 'yes') ... $(endif)
  output = output.replace(/\$\(if\s+login-by-mac\s*!=\s*'yes'\)([\s\S]*?)\$(endif)/g, (match, body) => {
    return vars['login-by-mac'] !== 'yes' ? body : '';
  });

  // 7. General clean up of any lingering $(if ...)...$(endif)
  output = output.replace(/\$\(if[\s\S]*?\$\(endif\)/g, (match) => {
    // If not matched above, strip or evaluate
    return '';
  });

  // Replace variable substitutions $(variable)
  const defaultVars = {
    username: vars.username !== undefined ? vars.username : '',
    ip: vars.ip || '192.168.88.254',
    mac: vars.mac || 'D4:6E:5C:8B:12:3A',
    uptime: vars.uptime || '00:00:00',
    'session-time-left': vars['session-time-left'] || '',
    'bytes-total': vars['bytes-total'] || '0',
    'remain-bytes-total': vars['remain-bytes-total'] || '0',
    'bytes-in-nice': vars['bytes-in-nice'] || '0 B',
    'bytes-out-nice': vars['bytes-out-nice'] || '0 B',
    'link-login': vars['link-login'] || '/login.html',
    'link-login-only': vars['link-login-only'] || '/login',
    'link-logout': vars['link-logout'] || '/logout',
    'link-status': vars['link-status'] || '/status.html',
    'link-orig': vars['link-orig'] || 'http://google.com',
    'link-advert': vars['link-advert'] || '/radvert.html',
    'refresh-timeout-secs': vars['refresh-timeout-secs'] || '300',
    'session-timeout-secs': vars['session-timeout-secs'] || '86400',
    error: vars.error || '',
    'chap-id': vars['chap-id'] || '',
    'chap-challenge': vars['chap-challenge'] || ''
  };

  const finalVars = { ...defaultVars, ...vars };

  for (const [key, val] of Object.entries(finalVars)) {
    const regex = new RegExp(`\\$\\(${key}\\)`, 'g');
    output = output.replace(regex, String(val));
  }

  // Safely guard against setting innerHTML on null elements during runtime rendering
  output = output.replace(
    /document\.getElementById\(["']timeLeft["']\)\.innerHTML\s*=\s*([^;\n]+);?/g,
    'var _tl = document.getElementById("timeLeft"); if (_tl) { _tl.innerHTML = $1; }'
  );
  output = output.replace(
    /document\.getElementById\(["']clock["']\)\.innerHTML\s*=\s*([^;\n]+);?/g,
    'var _clk = document.getElementById("clock"); if (_clk) { _clk.innerHTML = $1; }'
  );

  // Ensure slideit() and safe error suppression in browser runtime
  const safeScript = `<head><script>
window.slideit = window.slideit || function(){};
window.addEventListener('error', function(e) {
  if (e.message && (e.message.includes('addEventListener') || e.message.includes('null'))) {
    e.preventDefault();
  }
});
</script>`;
  if (output.includes('<head>')) {
    output = output.replace('<head>', safeScript);
  } else if (output.includes('<HEAD>')) {
    output = output.replace('<HEAD>', safeScript);
  }

  return output;
}

// Serve safe label.js with null guards dynamically (keeps original file untouched on disk)
app.get('/assets/js/label.js', (req, res) => {
  const filePath = path.join(__dirname, 'assets', 'js', 'label.js');
  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) return res.status(404).send('Not found');
    let safeData = data
      .replace(
        'document.getElementById("submit_btn").addEventListener',
        'var _sb = document.getElementById("submit_btn"); if (_sb) _sb.addEventListener'
      )
      .replace(
        'menu_btn.addEventListener',
        'if (menu_btn && menu) menu_btn.addEventListener'
      )
      .replace(
        "window.addEventListener('click', function(e){",
        "window.addEventListener('click', function(e){ if (!menu || !menu_btn) return;"
      )
      .replace(
        /this\.parentNode\.querySelector\(['"]label['"]\)\.classList/g,
        '(this.parentNode.querySelector("label") && this.parentNode.querySelector("label").classList)'
      );
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.send(safeData);
  });
});

// Serve static directory files (assets, css, fonts, images, img, xml, etc.)
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/fonts', express.static(path.join(__dirname, 'fonts')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use('/xml', express.static(path.join(__dirname, 'xml')));
app.use('/favicon.ico', express.static(path.join(__dirname, 'favicon.ico')));
app.use('/md5.js', express.static(path.join(__dirname, 'md5.js')));

// Middleware to get current session
function getSession(req) {
  const sessionId = req.cookies.hotspot_session;
  if (sessionId && sessions.has(sessionId)) {
    const session = sessions.get(sessionId);
    // update live dynamic uptime and bytes
    const elapsedSecs = Math.floor((Date.now() - session.startTime) / 1000);
    const downloaded = session.baseDownloaded + elapsedSecs * 15360; // 15 KB/s simulated
    const uploaded = session.baseUploaded + elapsedSecs * 3072; // 3 KB/s simulated
    const total = downloaded + uploaded;
    const remaining = Math.max(0, session.quotaBytes - total);
    const remainingTimeSecs = Math.max(0, session.durationSecs - elapsedSecs);

    return {
      ...session,
      uptime: formatSeconds(elapsedSecs),
      'session-time-left': formatSeconds(remainingTimeSecs),
      'bytes-total': total,
      'remain-bytes-total': remaining,
      'bytes-in-nice': formatBytes(downloaded),
      'bytes-out-nice': formatBytes(uploaded),
      'logged-in': 'yes'
    };
  }
  return null;
}

// Route: Root & Login page
app.get(['/', '/login.html', '/login'], (req, res) => {
  // If GET has username query parameter (e.g. login?username=...), handle login!
  if (req.query.username) {
    const username = req.query.username.trim();
    const sessionId = 'hs_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    const durationSecs = 10 * 3600;
    const quotaBytes = 1000 * 1024 * 1024;
    sessions.set(sessionId, {
      id: sessionId,
      username: username,
      ip: req.ip.replace('::ffff:', '') || '192.168.88.254',
      mac: 'D4:6E:5C:' + Math.floor(Math.random() * 89 + 10) + ':' + Math.floor(Math.random() * 89 + 10) + ':' + Math.floor(Math.random() * 89 + 10),
      startTime: Date.now() - 35 * 60 * 1000,
      durationSecs: durationSecs,
      quotaBytes: quotaBytes,
      baseDownloaded: 114 * 1024 * 1024,
      baseUploaded: 14.5 * 1024 * 1024
    });
    res.cookie('hotspot_session', sessionId, { maxAge: 24 * 3600 * 1000, httpOnly: true });
    res.cookie('username', username, { maxAge: 24 * 3600 * 1000 });
    return res.redirect('/status');
  }

  const session = getSession(req);
  const filePath = path.join(__dirname, 'login.html');
  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
      return res.status(500).send('Error loading login template: ' + err.message);
    }
    let rendered = renderMikrotikTemplate(data, {
      username: session ? session.username : '',
      error: req.query.error || '',
      'logged-in': session ? 'yes' : 'no',
      'link-login-only': '/login'
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(rendered);
  });
});

// Route: Handle Login submission
app.post(['/login', '/login.html'], (req, res) => {
  const username = (req.body.username || req.query.username || '100').trim();
  const password = req.body.password || req.query.password || '';

  if (!username) {
    return res.redirect('/login.html?error=invalid+username+or+password');
  }

  // Create new simulated session
  const sessionId = 'hs_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  const durationSecs = 10 * 3600; // 10 hours
  const quotaBytes = 1000 * 1024 * 1024; // 1000 MB

  sessions.set(sessionId, {
    id: sessionId,
    username: username,
    ip: req.ip.replace('::ffff:', '') || '192.168.88.254',
    mac: 'D4:6E:5C:' + Math.floor(Math.random() * 89 + 10) + ':' + Math.floor(Math.random() * 89 + 10) + ':' + Math.floor(Math.random() * 89 + 10),
    startTime: Date.now() - 35 * 60 * 1000, // pretend connected 35 mins ago for realism
    durationSecs: durationSecs,
    quotaBytes: quotaBytes,
    baseDownloaded: 114 * 1024 * 1024,
    baseUploaded: 14.5 * 1024 * 1024
  });

  res.cookie('hotspot_session', sessionId, { maxAge: 86400 * 1000, httpOnly: true, sameSite: 'lax', path: '/' });
  res.cookie('username', username, { maxAge: 86400 * 1000, sameSite: 'lax', path: '/' });
  if (req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest' || req.headers.accept?.includes('application/json')) {
    return res.json({ success: true, redirect: '/status.html?user=' + encodeURIComponent(username) });
  }
  res.redirect('/status.html?user=' + encodeURIComponent(username));
});

// Route: Status page
app.get(['/status.html', '/status'], (req, res) => {
  let session = getSession(req);
  const queryUser = req.query.user || req.query.username;

  if (!session) {
    const fallbackUsername = queryUser || req.cookies.username || req.cookies.uname || '100';
    session = {
      username: fallbackUsername,
      ip: req.ip.replace('::ffff:', '') || '192.168.88.254',
      mac: 'D4:6E:5C:8B:12:3A',
      uptime: '00:35:12',
      'session-time-left': '2h 24m 48s',
      'bytes-total': 134742016,
      'remain-bytes-total': 913842176,
      'bytes-in-nice': '128.5 MB',
      'bytes-out-nice': '14.2 MB',
      'logged-in': 'yes'
    };
  } else if (queryUser && session.username !== queryUser) {
    session.username = queryUser;
  }

  const filePath = path.join(__dirname, 'status.html');
  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
      return res.status(500).send('Error loading status template');
    }
    const rendered = renderMikrotikTemplate(data, session);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(rendered);
  });
});

// Route: Logout
app.all(['/logout', '/logout.html'], (req, res) => {
  const session = getSession(req);
  const logoutData = session || {
    username: '100',
    ip: '192.168.88.254',
    mac: 'D4:6E:5C:8B:12:3A',
    uptime: '00:48:22',
    'session-time-left': '2h 11m 38s',
    'bytes-in-nice': '132.8 MB',
    'bytes-out-nice': '15.4 MB'
  };

  const eraseCookie = req.query['erase-cookie'] || (req.body && req.body['erase-cookie']);
  const sessionId = req.cookies.hotspot_session;
  if (sessionId) {
    sessions.delete(sessionId);
    res.clearCookie('hotspot_session');
  }

  // If normal logout (erase-cookie != 'on'), MikroTik redirects immediately to login.html with logout notice
  // This completely eliminates any intermediate page, black screen or flicker
  if (eraseCookie !== 'on') {
    return res.redirect('/login.html?logout=success');
  }

  const filePath = path.join(__dirname, 'logout.html');
  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
      return res.status(500).send('Error loading logout template');
    }
    const rendered = renderMikrotikTemplate(data, {
      ...logoutData,
      'logged-in': 'no',
      'link-login': '/login.html'
    });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(rendered);
  });
});

// Route: Prices redirect to modal on login page
app.get('/prices.html', (req, res) => {
  res.redirect('/login.html');
});

// Route: Error page
app.get('/error.html', (req, res) => {
  const filePath = path.join(__dirname, 'error.html');
  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
      return res.status(500).send('Error loading error template');
    }
    const rendered = renderMikrotikTemplate(data, {
      error: req.query.error || 'invalid username or password',
      'link-login': '/login.html'
    });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(rendered);
  });
});

// Route: Block page
app.get('/block.html', (req, res) => {
  const filePath = path.join(__dirname, 'block.html');
  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
      return res.status(500).send('Error loading block template');
    }
    const rendered = renderMikrotikTemplate(data);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(rendered);
  });
});

// Route: Advert page
app.get('/radvert.html', (req, res) => {
  const filePath = path.join(__dirname, 'radvert.html');
  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
      return res.status(500).send('Error loading advert template');
    }
    const rendered = renderMikrotikTemplate(data);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(rendered);
  });
});

// Route: Redirect & alogin pages
app.get(['/redirect.html', '/alogin.html', '/rlogin.html'], (req, res) => {
  const target = req.path.substring(1);
  const filePath = path.join(__dirname, target);
  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
      return res.redirect('/status.html');
    }
    const rendered = renderMikrotikTemplate(data, {
      'link-status': '/status.html',
      'link-orig': '/'
    });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(rendered);
  });
});

// Route: Hotspot API JSON
app.get('/api.json', (req, res) => {
  const session = getSession(req);
  res.json({
    captive: !session,
    'user-portal-url': '/login.html',
    'seconds-remaining': session ? 36000 : 0,
    'bytes-remaining': session ? session['remain-bytes-total'] : 0,
    'can-extend-session': true
  });
});

// Route: Download Clean MikroTik Hotspot Package
app.get('/api/download-hotspot', (req, res) => {
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="alkary-mikrotik-hotspot.zip"');

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);

  const filesToInclude = [
    'login.html', 'status.html', 'logout.html',
    'error.html', 'block.html', 'radvert.html', 'redirect.html',
    'rlogin.html', 'alogin.html', 'api.json', 'md5.js', 'favicon.ico', 'errors.txt'
  ];

  for (const f of filesToInclude) {
    const fullPath = path.join(__dirname, f);
    if (fs.existsSync(fullPath)) {
      archive.file(fullPath, { name: f });
    }
  }

  const dirsToInclude = ['assets', 'css', 'fonts', 'images', 'img', 'xml'];
  for (const d of dirsToInclude) {
    const fullPath = path.join(__dirname, d);
    if (fs.existsSync(fullPath)) {
      archive.directory(fullPath, d);
    }
  }

  archive.finalize();
});

// Fallback for any other .html request
app.get('/:page.html', (req, res) => {
  const filePath = path.join(__dirname, req.params.page + '.html');
  if (fs.existsSync(filePath)) {
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) return res.status(404).send('Not found');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(renderMikrotikTemplate(data));
    });
  } else {
    res.redirect('/login.html');
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Alkary Net Hotspot Server running on http://0.0.0.0:${PORT}`);
});
