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
  } catch (e) {
    console.error('❌ Compilation failed:', e.message);
  }
}

function compileProjectWatch(projectDir = process.cwd(), port = 3000) {
  const server = serveProject(projectDir, port);
  compileProject(projectDir);

  log('👀 Watching project for changes...');
  let timeout;

  chokidar.watch([
    path.join(projectDir, '**/*.js'),
    path.join(projectDir, '**/*.ts'),
    path.join(projectDir, '**/*.tsx')
  ], {
    ignoreInitial: true,
  }).on('change', filePath => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      console.clear();
      log(`🔁 File changed: ${filePath}`);
      log('🔨 Rebuilding project...');

      try {
        compileProject(projectDir);

        if (server?.broadcastReload) {
          server.broadcastReload();
          log('🔃 Reload broadcasted');
        }
      } catch (err) {
        console.error('❌ Rebuild failed:', err.stack || err.message);
      }
    }, 100); // Debounce multiple rapid file changes
  });
}

function serveProject(projectDir = process.cwd(), port = 3000) {
  const server = http.createServer((req, res) => {
    let reqPath = req.url;
    if (reqPath === '/' || reqPath === '/index.html') {
      reqPath = '/dist/index.html';
    }

    const filePath = path.join(projectDir, reqPath);
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      return res.end('404 Not Found');
    }

    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': Mime.getType(filePath) });
    res.end(content);
  });

  const wss = new WebSocket.Server({ server });
  server.broadcastReload = () => {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send('reload');
      }
    });
  };

  server.listen(port, () => {
    log(`🚀 Server running at http://localhost:${port}`);
    open(`http://localhost:${port}/dist/index.html`);
  });

  return server;
}

module.exports = { compileProject, compileProjectWatch };