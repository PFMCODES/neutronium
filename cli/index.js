#!/usr/bin/env node

const { default: inquirer } = require('inquirer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { transformSync } = require('@babel/core');
const { compileProject, compileProjectWatch } = require('../compiler/compiler');

const [, , command, ...args] = process.argv;

const babelRc = `{
  "plugins": [
    ["@babel/plugin-transform-react-jsx", {
      "pragma": "_neutronium.h",
      "pragmaFrag": "_neutronium.Fragment",
      "runtime": "classic",
      "useBuiltIns": false,
      "sourceMaps": true,
      "comments": false,
      "minified": true
    }]
  ]
}`;

const AppTs = `
import { createApp } from 'neutronium';

function App() {
    return (
        <h1>Hello World (TypeScript)</h1>
    );
}

createApp(App).mount("body");
`;

const AppJs = `
import { createApp } from 'neutronium';

function App() {
    return (
        <h1>Hello World</h1>
    );
}

createApp(App).mount("body");
`;

const htmlTemplate = (title, jsCode) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>${title}</title>
  </head>
  <body>
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
        message: 'Enter your project name:',
        default: 'neutronium-app'
      }
    ]);
    appName = projectName;
    targetPath = path.resolve(process.cwd(), projectName);
    createdFolder = true;
    if (!fs.existsSync(targetPath)) fs.mkdirSync(targetPath);
  }

  // Ask language preference
  const { language } = await inquirer.prompt([
    {
      type: 'list',
      name: 'language',
      message: 'Choose your language:',
      choices: ['JavaScript', 'TypeScript']
    }
  ]);

  const appFileName = language === 'TypeScript' ? 'App.ts' : 'App.js';
  fs.writeFileSync(path.join(targetPath, appFileName), (language === 'TypeScript' ? AppTs : AppJs).trim());

  fs.writeFileSync(path.join(targetPath, '.babelrc'), babelRc);

  execSync('npm init -y', { cwd: targetPath, stdio: 'inherit' });
  execSync('npm install neutronium', { cwd: targetPath, stdio: 'inherit' });
  execSync('npm install --save-dev @babel/core @babel/cli @babel/plugin-transform-react-jsx', {
    cwd: targetPath, stdio: 'inherit'
  });

  if (language === 'TypeScript') {
    execSync('npm install --save-dev typescript', { cwd: targetPath, stdio: 'inherit' });
    fs.writeFileSync(path.join(targetPath, 'tsconfig.json'), `
{
  "compilerOptions": {
    "outDir": "build",
    "rootDir": ".",
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["DOM", "ES2020"],
    "jsx": "react",
    "jsxFactory": "h",
    "jsxFragmentFactory": "Fragment",
    "moduleResolution": "Node",
    "strict": true,
    "allowJs": true,
    "checkJs": false,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["**/*"],
  "exclude": ["dist", "node_modules"]
}
    `.trim());
  }

  const packageJsonPath = path.join(targetPath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  packageJson.scripts = packageJson.scripts || {};
  packageJson.scripts.start = language === 'TypeScript'
    ? 'tsc && neu-cli start --watch'
    : 'neu-cli start --watch';

  packageJson.scripts.compile = 'neu-cli start';
  packageJson.scripts.update = 'npm i neutronium@latest -g && npm i neutronium@latest';

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

  // Create preview HTML
  const jsxWithImport = `import * as _neutronium from 'neutronium';\n\n${AppJs}`;
  let compiledCode = '';
  try {
    compiledCode = transformSync(jsxWithImport, {
      filename: 'App.js',
      babelrc: false,
      configFile: false,
      presets: [],
      plugins: [[
        '@babel/plugin-transform-react-jsx',
        {
          pragma: '_neutronium.h',
          pragmaFrag: '_neutronium.Fragment',
          runtime: 'classic'
        }
      ]]
    }).code;
  } catch (e) {
    console.warn('⚠️ Babel preview transform failed:', e.message);
  }

  const distPath = path.join(targetPath, 'dist');
  if (!fs.existsSync(distPath)) fs.mkdirSync(distPath);
  fs.writeFileSync(path.join(distPath, 'index.html'), htmlTemplate(appName, compiledCode));

  const folderCmd = createdFolder ? `   cd ${path.basename(targetPath)} \n` : '';
  console.log('\n✅ Neutronium app is ready!');
  console.log(`➡️  Run the following to get started:\n\n${folderCmd}   npm start\nto apply favicon:\n   neu-cli apply-favicon [favicon path]\n`);
}

// --- CLI Command Routing ---
switch (command) {
  case 'init':
  case 'create-app':
  case 'create-neutronium-app':
    init();
    break;

  case 'start':
    if (args[0] === '--watch') compileProjectWatch();
    else compileProject();
    break;

  case '--lang':
    const lang = args[0];
    const pkgPath = path.join(process.cwd(), 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

    if (lang === 'ts') {
      fs.unlinkSync('App.js');
      fs.writeFileSync('App.ts', AppTs);
      fs.writeFileSync('tsconfig.json', `
{
  "compilerOptions": {
    "outDir": "build",
    "rootDir": ".",
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["DOM", "ES2020"],
    "jsx": "react",
    "jsxFactory": "h",
    "jsxFragmentFactory": "Fragment",
    "moduleResolution": "Node",
    "strict": true,
    "allowJs": true,
    "checkJs": false,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["**/*"],
  "exclude": ["dist", "node_modules"]
}
      `.trim());
      pkg.scripts.start = 'tsc && neu-cli start --watch';
    }

    if (lang === 'js') {
      fs.unlinkSync('App.ts');
      fs.writeFileSync('App.js', AppJs);
      if (fs.existsSync('tsconfig.json')) fs.unlinkSync('tsconfig.json');
      pkg.scripts.start = pkg.scripts.start.replace(/^tsc &&\s*/, '');
    }

    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    break;
  case 'install':
  if (!args[0]) {
    console.log('❌ Please specify a package to install');
    break;
  }
  
  const distDir = path.join(process.cwd(), 'dist');
  
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
  }
  
  try {
    execSync(`cd ${distDir} && npm install ${args[0]}`, { stdio: 'inherit' });
    
    // Delete package.json and package-lock.json if they exist
    const pkgJsonPath = path.join(distDir, 'package.json');
    const pkgLockPath = path.join(distDir, 'package-lock.json');
    
    if (fs.existsSync(pkgJsonPath)) {
      fs.unlinkSync(pkgJsonPath);
      console.log('🗑️  Removed dist/package.json');
    }
    
    if (fs.existsSync(pkgLockPath)) {
      fs.unlinkSync(pkgLockPath);
      console.log('🗑️  Removed dist/package-lock.json');
    }
    
    console.log(`✅ Installed ${args[0]} in dist/node_modules`);
  } catch (err) {
    console.error('❌ Installation failed:', err.message);
  }
  break;
  case "apply-favicon":
    if (!args[0]) {
      console.error('❌ Please provide a URL for favicon');
      console.log('Usage: neu-cli apply-favicon <url>');
    }
    else {
      try {
        const faviconUrl = args[0];
        const pkgPath = path.join(process.cwd(), 'package.json');
        const packageJSON = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        
        packageJSON.favicon = faviconUrl;
        
        // Save it back to the file
        fs.writeFileSync(pkgPath, JSON.stringify(packageJSON, null, 2));
        
        console.log(`✅ Favicon set to: ${faviconUrl}`);
        console.log('💡 Run "npm start" to see changes');
      } catch (err) {
        console.error('❌ Error setting favicon:', err.message);
      }
    }
    break;
  default:
    console.log('❌ Unknown command.');
    console.log(`
Available Commands:
  init | create-app | create-neutronium-app
      👉 Initialize a new Neutronium project

  start
      👉 Compiles your app once

  start --watch
      👉 Start dev server and rebuild on changes

  --lang js | ts
      👉 Switch between JS and TS
`);
}