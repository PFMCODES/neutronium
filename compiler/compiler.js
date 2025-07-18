const babel = require('@babel/core');
const path = require('path');
const fs = require('fs');
const { baseHtml } = require('./template');
const { log, writeFile, ensureDir } = require('./utils');
const chokidar = require('chokidar');
const http = require('http');
const { default: Mime } = require('mime');
const WebSocket = require('ws');
const { default: open } = require('open');
const { execSync } = require('child_process');

async function compileProject(projectDir = process.cwd()) {
  const distDir = path.join(projectDir, 'dist');
  const neutroniumPath = '../node_modules/neutronium/src/index.js';
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectDir, 'package.json')));
  const entry = packageJson.main || 'App.js';

  try {
    log('📁 Scanning project files...');
    const allFiles = fs.readdirSync(projectDir);
    const jsFiles = allFiles.filter(f => f.endsWith('.js') && f !== 'compiler.js' && !f.startsWith('.'));

    if (fs.existsSync(path.join(projectDir, 'tsconfig.json'))) {
      try {
        require.resolve('typescript');
      } catch {
        log('📦 Installing TypeScript...');
        execSync('npm install typescript@latest', { stdio: 'inherit' });
      }

      log('🛠️ Compiling TypeScript...');
      execSync('npx tsc', { stdio: 'inherit' });
    }

    if (!jsFiles.includes(entry)) {
      throw new Error(`❌ Entry file "${entry}" not found!`);
    }

    ensureDir(distDir);

    for (const file of jsFiles) {
      const inputPath = path.join(projectDir, file);
      const outputPath = path.join(distDir, file);

      log(`⚙️ Babel transforming ${file}...`);
      const source = fs.readFileSync(inputPath, 'utf-8');

      let { code } = babel.transformSync(source, {
        filename: file,
        babelrc: false,
        configFile: false,
        presets: [],
        plugins: [[
          '@babel/plugin-transform-react-jsx',
          {
            pragma: '_neutronium.h',
            pragmaFrag: '_neutronium.Fragment',
            runtime: 'classic',
          }
        ]]
      });

      // Ensure _neutronium is imported
      if (!source.includes('_neutronium')) {
        code = `import * as _neutronium from '${neutroniumPath}';\n\n${code}`;
      }

      // Replace imports to local neutronium
      code = code.replace(/from\s+['"]neutronium['"]/g, `from '${neutroniumPath}'`);

      writeFile(outputPath, code);
    }

    log('🛠️ Generating index.html...');
    const htmlContent = baseHtml(`
      <script defer type="module" src="./${entry}"></script>
    `, entry);

    writeFile(path.join(distDir, 'index.html'), htmlContent);

    log('✅ Compilation complete!');
    return true;
  } catch (e) {
    console.error('❌ Compilation failed:', e.message);
    return false;
  }
}

function compileProjectWatch(projectDir = process.cwd(), port = 3000) {
  // Start server first
  const server = serveProject(projectDir, port);
  
  // Do initial compilation
  compileProject(projectDir);

  log('👀 Watching project for changes...');
  log('✋ Press Ctrl+C to stop the development server');
  
  let timeout;

  // Watch files more specifically
  const watcher = chokidar.watch(projectDir, {
    ignoreInitial: true,
    ignored: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.git/**',
      '**/*',
      'compiler.js'
    ],
    persistent: true,
    followSymlinks: false,
    depth: 2,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 100
    }
  });

  watcher.on('ready', () => {
    log('📡 File watcher ready and monitoring changes...');
  });

  watcher.on('change', filePath => {
    // Only watch js, ts, tsx files
    if (!/\.(js|ts|tsx)$/.test(filePath)) {
      return;
    }

    log(`🔍 Detected change in: ${path.relative(projectDir, filePath)}`);
    
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      log('🔨 Rebuilding project...');

      try {
        const success = compileProject(projectDir);
        if (success) {
          log('✅ Rebuild successful!');
          // Trigger browser reload
          if (server && server.broadcastReload) {
            server.broadcastReload();
            log('🔄 Browser reload triggered');
          }
        }
      } catch (err) {
        console.error('❌ Rebuild failed:', err.stack || err.message);
      }
    }, 300); // Slightly longer debounce
  });

  watcher.on('add', filePath => {
    if (!/\.(js|ts|tsx)$/.test(filePath)) {
      return;
    }
    log(`📝 New file added: ${path.relative(projectDir, filePath)}`);
  });

  watcher.on('unlink', filePath => {
    if (!/\.(js|ts|tsx)$/.test(filePath)) {
      return;
    }
    log(`🗑️ File removed: ${path.relative(projectDir, filePath)}`);
  });

  watcher.on('error', error => {
    console.error('❌ Watcher error:', error);
  });

  // Cleanup function
  const cleanup = () => {
    log('🧹 Cleaning up...');
    watcher.close();
    if (server) {
      server.close();
    }
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  return { server, watcher, cleanup };
}

function serveProject(projectDir = process.cwd(), port = 3000) {
  const server = http.createServer((req, res) => {
    let reqPath = req.url;
    
    // Handle root and index requests
    if (reqPath === '/' || reqPath === '/index.html') {
      reqPath = '/dist/index.html';
    }
    
    // Handle favicon requests
    if (reqPath === '/favicon.ico') {
      res.writeHead(204);
      return res.end();
    }

    const filePath = path.join(projectDir, reqPath);
    
    // Security check - ensure file is within project directory
    if (!filePath.startsWith(projectDir)) {
      res.writeHead(403);
      return res.end('403 Forbidden');
    }
    
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      return res.end('404 Not Found');
    }

    try {
      const content = fs.readFileSync(filePath);
      const mimeType = Mime.getType(filePath) || 'application/octet-stream';
      
      res.writeHead(200, { 
        'Content-Type': mimeType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.end(content);
    } catch (err) {
      console.error('Error serving file:', err);
      res.writeHead(500);
      res.end('500 Internal Server Error');
    }
  });

  const wss = new WebSocket.Server({ server });
  
  // Add WebSocket connection handling
  wss.on('connection', (ws) => {
    log('🔌 WebSocket client connected');
    
    ws.on('close', () => {
      log('🔌 WebSocket client disconnected');
    });
  });

  server.broadcastReload = () => {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send('reload');
      }
    });
  };

  server.listen(port, () => {
    log(`🚀 Server running at http://localhost:${port}`);
    log(`🌐 Open your browser and navigate to: http://localhost:${port}`);
    
    // Remove the open() call completely for now to avoid hanging
    // User can manually open browser
  });

  return server;
}

module.exports = { compileProject, compileProjectWatch, serveProject };