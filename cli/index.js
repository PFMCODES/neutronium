#!/usr/bin/env node
const { default: inquirer } = require('inquirer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { transformSync } = require('@babel/core');

const [, , command, ...args] = process.argv;

const babelRc = `{
  "plugins": [
    [
      "@babel/plugin-transform-react-jsx",
      {
        "pragma": "h",
        "pragmaFrag": "Fragment"
      }
    ]
  ]
}`;

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

async function init() {
  let targetPath = process.cwd();
  let createdFolder = false;

  const { confirmInit } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmInit',
      message: 'Initialize a Neutronium app in this folder?',
      default: true
    }
  ]);

  let appName = 'neutronium-app';

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

  const appPath = path.join(targetPath, 'App.js');
  fs.writeFileSync(appPath, AppJs.trim());

  fs.writeFileSync(path.join(targetPath, '.babelrc'), babelRc);

  execSync('npm init -y', { cwd: targetPath, stdio: 'inherit' });
  execSync('npm install neutronium', { cwd: targetPath, stdio: 'inherit' });
  execSync('npm install --save-dev @babel/core @babel/cli @babel/plugin-transform-react-jsx', {
    cwd: targetPath,
    stdio: 'inherit'
  });

  const result = transformSync(AppJs, {
    filename: 'App.js',
    presets: [],
    plugins: [['@babel/plugin-transform-react-jsx', { pragma: 'h' }]]
  });

  const finalHtml = htmlTemplate(appName, result.code);
  const distPath = path.join(targetPath, 'dist');
  if (!fs.existsSync(distPath)) fs.mkdirSync(distPath);
  fs.writeFileSync(path.join(distPath, 'index.html'), finalHtml);

  const folderCmd = createdFolder ? `cd ${path.basename(targetPath)}` : '';
  console.log('\n✅ Neutronium app is ready!');
  console.log(`➡️  Run the following to get started:\n\n   ${folderCmd}\n   npx serve dist\n`);
}

const { compileProject, compileProjectWatch } = require('../compiler/compiler');

switch (command) {
  case 'init':
  case 'create-app':
  case 'create-neutronium-app':
    init();
    break;
  case 'start':
    if (args[0] === '--watch') {
      compileProjectWatch();
    } else {
      compileProject();
    }
    break;
  default:
    console.log('❌ Unknown command.');
    console.log('Usage: neu-cli init');
}