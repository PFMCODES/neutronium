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

function compileProject(projectDir = process.cwd()) {
  const appJsPath = path.join(projectDir, 'App.js');
  const distDir = path.join(projectDir, 'dist');
  const outHtmlPath = path.join(distDir, 'index.html');
  const outJsPath = path.join(distDir, 'App.compiled.js');
  const neutroniumPath = '../node_modules/neutronium/src/index.js';

  try {
    log('📖 Reading App.js...');
    const sourceCode = fs.readFileSync(appJsPath, 'utf-8');

    log('⚙️ Compiling JSX with Babel...');
    let { code: transpiled } = babel.transformSync(sourceCode, {
  filename: 'App.js', // or use path.basename(appJsPath)
  babelrc: false,
  configFile: false,
  presets: [],
  plugins: [
  ['@babel/plugin-transform-react-jsx', {
    pragma: '_neutronium.h',
    pragmaFrag: '_neutronium.Fragment',
    runtime: 'classic',
    useBuiltIns: false // <- IMPORTANT
  }]
]
});

    // Remove CommonJS require if present
    transpiled = transpiled.replace(
      /(const|var|let)\s+_neutronium\s*=\s*require\(["']neutronium["']\);?/g,
      ''
    );
    transpiled = transpiled.replace("import { createApp } from 'neutronium';", "import { createApp } from '../node_modules/neutronium/src/index.js';")

    const finalJsCode = `
import * as _neutronium from '${neutroniumPath}';

"use strict";

${transpiled}

_neutronium.createApp(App).mount('#app');
`.trim();

    ensureDir(distDir);
    writeFile(outJsPath, finalJsCode);

    log('🛠️ Generating index.html...');
    const finalHtml = baseHtml(`<div id="app"></div>`, 'App.compiled.js');
    writeFile(outHtmlPath, finalHtml);

    log('✅ Compilation complete!');
    log(`➡️ Output: ${outHtmlPath}`);
  } catch (e) {
    console.error('❌ Compilation failed:', e.message);
  }
}

function compileProjectWatch(projectDir = process.cwd(), port = 3000) {
  const appJsPath = path.join(projectDir, 'App.js');

  const server = serveProject(projectDir, port);
  compileProject(projectDir);

  log('👀 Watching App.js for changes...');
  chokidar.watch(appJsPath).on('change', () => {
    console.clear();
    log('🔁 Detected change in App.js...');
    compileProject(projectDir);
    if (server.broadcastReload) {
      server.broadcastReload();
    }
  });
}

function serveProject(projectDir = process.cwd(), port = 3000) {
  const distDir = path.join(projectDir, 'dist');

  const server = http.createServer((req, res) => {
    let reqPath = req.url;

    // Redirect "/" to "dist/index.html"
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