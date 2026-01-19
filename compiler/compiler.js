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
  const neutroniumPath = 'neutronium.js';
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectDir, 'package.json')));
  const entry = packageJson.main || 'App.js';

  try {
    log('📁 Scanning project files...');
    const allFiles = fs.readdirSync(projectDir);
    const jsFiles = allFiles.filter(f =>
      f.endsWith('.js') &&
      f !== 'compiler.js' &&
      !f.startsWith('.') &&
      !f.startsWith('dist')
    );

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
        code = `import * as _neutronium from './${neutroniumPath.replace(/\\/g, '/')}';\n\n${code}`;
      }

      // Check if code uses node_modules (detect imports that aren't relative)
      const nodeModuleImportRegex = /from\s+['"]((?!\.\/|\.\.\/|neutronium)[^'"]+)['"]/g;
      const matches = [...code.matchAll(nodeModuleImportRegex)];
      
      if (matches.length > 0) {
        log(`📦 Detected node_modules imports in ${file}`);
        
        // Copy node_modules to dist if it exists
        const srcNodeModules = path.join(projectDir, 'node_modules');
        const distNodeModules = path.join(distDir, 'node_modules');
        
        if (fs.existsSync(srcNodeModules)) {
          if (!fs.existsSync(distNodeModules)) {
            log('📂 Copying node_modules to dist...');
            
            // Create a symlink instead of copying (faster)
            try {
              fs.symlinkSync(srcNodeModules, distNodeModules, 'junction');
              log('🔗 Created symlink to node_modules');
            } catch (err) {
              // If symlink fails, fall back to copying specific packages
              log('📋 Symlinking failed, copying required packages...');
              ensureDir(distNodeModules);
              
              // Copy only the packages that are actually imported
              const packagesToCopy = new Set();
              matches.forEach(match => {
                const packageName = match[1].split('/')[0];
                if (packageName.startsWith('@')) {
                  // Scoped package like @babel/core
                  packagesToCopy.add(match[1].split('/').slice(0, 2).join('/'));
                } else {
                  packagesToCopy.add(packageName);
                }
              });
              
              packagesToCopy.forEach(pkg => {
                const srcPkg = path.join(srcNodeModules, pkg);
                const distPkg = path.join(distNodeModules, pkg);
                if (fs.existsSync(srcPkg)) {
                  copyRecursiveSync(srcPkg, distPkg);
                  log(`  ✓ Copied ${pkg}`);
                }
              });
            }
          }
        } else {
          log('⚠️  Warning: node_modules not found, imports may fail');
        }
      }

      // Replace imports to "neutronium" with local path
      code = code.replace(/from\s+['"]neutronium['"]/g, `from './${neutroniumPath.replace(/\\/g, '/')}'`);

      writeFile(outputPath, code);
    }

    log('🛠️ Generating index.html...');
    const htmlContent = baseHtml(`
      <script defer type="module" src="./${entry}"></script>
    `);
    writeFile(path.join(distDir, neutroniumPath), fs.readFileSync(path.join(projectDir, 'node_modules', 'neutronium', 'src', 'index.js'), 'utf-8'))
    writeFile(path.join(distDir, 'index.html'), htmlContent);

    log('✅ Compilation complete!');
    return true;
  } catch (e) {
    console.error('❌ Compilation failed:', e.message);
    return false;
  }
}

function compileProjectWatch(projectDir = process.cwd(), port = 3000) {
  const server = serveProject(projectDir, port);
  compileProject(projectDir);

  log('👀 Watching project for changes...');
  log(`Watching directory: ${projectDir}`);
  log('✋ Press Ctrl+C to stop the development server');

  let timeout;

  const watcher = chokidar.watch(projectDir, {
    ignoreInitial: true,
    ignored: [
      /(^|[\/\\])\../,  // dot files
      '**/node_modules/**',
      '**/dist/**',           // ← THIS IS CRITICAL
      '**/.git/**',
      '**/compiler.js'
    ],
    persistent: true,
    followSymlinks: false,
    depth: 5,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100
    }
  });

  watcher.on('ready', () => {
    const watched = watcher.getWatched();
    log('📡 File watcher ready and monitoring changes...');
    log(`Watching ${Object.keys(watched).length} directories`);
  });

  // REMOVE the 'all' event listener - it's just for debugging
  // watcher.on('all', (event, filePath) => {
  //   log(`📊 Event: ${event} - ${path.relative(projectDir, filePath)}`);
  // });

  watcher.on('change', filePath => {
    // Extra safety check: ignore dist folder
    if (filePath.includes(path.sep + 'dist' + path.sep) || filePath.includes('/dist/')) {
      return;
    }
    if (filePath.includes(path.sep + 'node_modules' + path.sep) || filePath.includes('/node_modules/')) {
      return;
    }
    if (filePath.includes(path.sep + '.git' + path.sep) || filePath.includes('/.git/')) {
      return;
    }
    if (filePath.includes(path.sep + 'compiler.js') || filePath.includes('/compiler.js')) {
      return;
    }
    if (!/\.(js|ts|tsx)$/.test(filePath)) {
      return;
    }

    log(`🔍 Detected change in: ${path.relative(projectDir, filePath)}`);

    clearTimeout(timeout);
    timeout = setTimeout(() => {
      log('🔨 Rebuilding project...');
      try {
        const success = compileProject(projectDir);
        if (success && server) {
          server();
          log('🔄 Browser reload triggered');
        }
      } catch (err) {
        console.error('❌ Rebuild failed:', err.stack || err.message);
      }
    }, 300);
  });

  watcher.on('add', filePath => {
    if (filePath.includes(path.sep + 'dist' + path.sep) || filePath.includes('/dist/') || filePath.includes(path.sep + 'node_modules' + path.sep) || filePath.includes("node_modules")) {
      return;
    }
    if (/\.(js|ts|tsx)$/.test(filePath)) {
      log(`📝 New file added: ${path.relative(projectDir, filePath)}`);
    }
  });

  watcher.on('unlink', filePath => {
    if (filePath.includes(path.sep + 'dist' + path.sep) || filePath.includes('/dist/')) {
      return;
    }
    if (/\.(js|ts|tsx)$/.test(filePath)) {
      log(`🗑️ File removed: ${path.relative(projectDir, filePath)}`);
    }
  });

  watcher.on('error', error => {
    console.error('❌ Watcher error:', error);
  });

  const cleanup = () => {
    log('🧹 Cleaning up...');
    watcher.close();
    if (server) server.close();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  return { server, watcher, cleanup };
}

function serveProject(projectDir = process.cwd(), port = 3000) {
  const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json')));
  const server = http.createServer((req, res) => {
    let reqPath = req.url;
    if (reqPath === '/' || reqPath === '/index.html') {
      reqPath = '/dist/index.html';
    }
    else if (!reqPath.startsWith('/dist/')) {
      reqPath = '/dist' + reqPath;
    }

    if (reqPath === '/favicon.ico') {
      if (!packageJson.favicon) {
        res.writeHead(204);
        return res.end();
      }

      const faviconPath = path.join(projectDir, packageJson.favicon);

      if (!fs.existsSync(faviconPath)) {
        res.writeHead(404);
        return res.end('Favicon not found');
      }

      const content = fs.readFileSync(faviconPath);
      const mimeType = Mime.getType(faviconPath) || 'image/x-icon';

      res.writeHead(200, {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=86400'
      });

      return res.end(content);
    }

    const filePath = path.join(projectDir, reqPath);

    if (!filePath.startsWith(projectDir)) {
      res.writeHead(403);
      return res.end('403 Forbidden');
    }
    if (!filePath.startsWith(path.join(projectDir, 'dist'))) {
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

  wss.on('connection', (ws) => {
    log('🔌 WebSocket client connected');
  });

  let broadcastReload = () => {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send('reload');
      }
    });
  };

  server.listen(port, () => {
    log(`🌐 Open your browser and navigate to: http://localhost:${port}`);
  });

  return broadcastReload;

}

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

module.exports = {
  compileProject,
  compileProjectWatch,
  serveProject,
  copyRecursiveSync
};