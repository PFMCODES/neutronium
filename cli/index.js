#!/usr/bin/env node

// --- Module Imports ---
const { default: inquirer } = require('inquirer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { transformSync } = require('@babel/core');
const { compileProject, compileProjectWatch } = require('../compiler/compiler');

// --- CLI Arguments ---
const [, , command, ...args] = process.argv;

// --- Default Babel Config ---
const babelRc = `{
"plugins": [
  ["@babel/plugin-transform-react-jsx", {
    "pragma": "_neutronium.h",
    "pragmaFrag": "_neutronium.Fragment",
    "runtime": "classic",
    "useBuiltIns": false,
    "sourceMaps": true,
    "comments": false,
    "minified": true,
  }]
]
`;

// --- Default App.js Starter Template ---
const AppJs = `
import { h, createApp } from 'neutronium';

function App() {
    return (
        <div class="container">
            <h1>Hello from Neutronium!</h1>
            <p>Start building your app in JSX!</p>
        </div>
    );
}

createApp(App).mount('#app');
`;

// --- Basic HTML Template Function ---
const htmlTemplate = (title, jsCode) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
</head>
<body>
  <div id="app"></div>
  <script type="module">
  ${jsCode}
  </script>
</body>
</html>
`.trim();

// --- Project Initializer Function ---
async function init() {
  let targetPath = process.cwd();   // default to current folder
  let createdFolder = false;

  // Prompt user for init location
  const { confirmInit } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmInit',
      message: 'Initialize a Neutronium app in this folder?',
      default: true
    }
  ]);

  let appName = 'neutronium-app';

  // If no, ask for folder name and create it
  if (!confirmInit) {
    const { projectName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Please enter your project name:',
        default: 'neutronium-app'
      }
    ]);
    appName = projectName;
    targetPath = path.resolve(process.cwd(), projectName);
    createdFolder = true;
    if (!fs.existsSync(targetPath)) fs.mkdirSync(targetPath);
    else console.log('⚠️ Folder already exists. Using it anyway.');
  }

  // Write App.js
  const appPath = path.join(targetPath, 'App.js');
  fs.writeFileSync(appPath, AppJs.trim());

  // Write .babelrc
  fs.writeFileSync(path.join(targetPath, '.babelrc'), babelRc);

  // Init NPM and install dependencies
  execSync('npm init -y', { cwd: targetPath, stdio: 'inherit' });
  execSync('npm install neutronium', { cwd: targetPath, stdio: 'inherit' });
  execSync('npm install --save-dev @babel/core @babel/cli @babel/plugin-transform-react-jsx', {
    cwd: targetPath,
    stdio: 'inherit'
  });

  // Transpile App.js (in-memory) for preview HTML
  const jsxWithImport = `import * as _neutronium from 'neutronium';\n\n${AppJs}`;
  const result = transformSync(jsxWithImport, {
    filename: 'App.js',
    babelrc: false,
    configFile: false,
    presets: [],
    plugins: [
      ['@babel/plugin-transform-react-jsx', {
        pragma: '_neutronium.h',
        pragmaFrag: '_neutronium.Fragment',
        runtime: 'classic',
        useBuiltIns: false,
        sourceMaps: true,
        comments: false,
        minified: true,
      }]
    ]
  });

  // Write dist/index.html with inlined JS
  const finalHtml = htmlTemplate(appName, result.code);
  const distPath = path.join(targetPath, 'dist');
  if (!fs.existsSync(distPath)) fs.mkdirSync(distPath);
  fs.writeFileSync(path.join(distPath, 'index.html'), finalHtml);

  // Print instructions to user
  const folderCmd = createdFolder ? `cd ${path.basename(targetPath)}` : '';
  console.log('\n✅ Neutronium app is ready!');
  console.log(`➡️  Run the following to get started:\n\n   ${folderCmd}\n   npx serve dist\n`);
}

// --- CLI Command Routing ---
switch (command) {
  case 'init':
  case 'create-app':
  case 'create-neu-app':
  case 'create-new-app':
  case 'create-neutronium-app':
    init();
    break;

  case 'start':
    // Watch mode for development
    if (args[0] === '--watch') {
      compileProjectWatch();
    } else {
      // Build once without watching
      compileProject();
    }
    break;

  default:
    // Help text
    console.log('❌ Unknown command.');
    console.log(`
Available Commands:

  init | create-app | create-neutronium-app
      👉 Initialize a new Neutronium project

  start
      👉 Compiles your app once

  start --watch
      👉 Start dev server and rebuild on changes
`);
}