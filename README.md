# ⚛️ Neutronium v3.4.1

**Ultra-dense JavaScript framework – maximum performance, minimal overhead**

[![npm](https://img.shields.io/npm/dw/neutronium?style=flat-square&logo=npm)](https://www.npmjs.com/package/neutronium)
[![Version](https://img.shields.io/npm/v/neutronium?style=flat-square)](https://www.npmjs.com/package/neutronium)
[![License](https://img.shields.io/npm/l/neutronium?style=flat-square)](https://opensource.org/licenses/MIT)
[![Website](https://neutronium-website.onrender.com/browser.svg)](https://neutronium-website.onrender.com)
[![Playground](https://neutronium-website.onrender.com/playground.svg)](https://neutronium-website.onrender.com/Playground/)
[![Documentation](https://img.shields.io/badge/Documentation-3d3c3b?logo=readthedocs&style=flat-square)](https://neutronium-website.onrender.com/Documentation/)

---

## 🎉 What’s new in v3.4.1

- ⚡ Faster compilation for complex projects  
- ✨ `useState` and `useEffect` hooks  
- ⚛️ React-like JSX syntax for easier switching  
- 🌐 **Browser-safe compilation** via `/sandbox.mjs`  
- 🖼️ Apply favicon programmatically  
- 📦 Massive package size reduction using `.npmignore`

---

## ℹ️ About

**Neutronium** is a lightweight, high-performance JavaScript framework built for developers who want **explicit control**, **predictable behavior**, and **zero unnecessary abstractions**.

It offers **React-like ergonomics** without a virtual DOM, build step, or heavy runtime.

> Ultra-fast ⚡ · Tiny footprint 📦 · No build tools 🛠️ · Pure JavaScript ✨

---

## ✨ Features

- ⚡ **Blazing fast rendering**
- 🧠 **Simple, predictable component logic**
- 🔌 **No dependencies and no virtual DOM**
- 📦 **Tiny footprint (~57.7 kB unpacked)**
- 🧩 **TypeScript types (~4.35 kB)**
- 🛠️ **Works directly in the browser**
- 🔁 **JSX-style component structure**
- 🌐 **Sandboxed browser compiler**

---

## 📦 Installation

Install the Neutronium runtime:

```bash
npm install neutronium
```
Install the CLI globally(optional, recommended):
```bash
npm install neutronium -g
```
---
## 🛠️ Create a Project
```bash
neu-cli create-app my-app
cd my-app
```
---
## 🚀 Usage Example
```jsx
// App.js
import { createApp } from 'neutronium' // or ts-neutronium for TypeScript

function Greeting({ name }) {
  return <h2>Hello, {name}!</h2>;
}

export default function App() {
  return (
    <>
      <h1>Welcome to Neutronium</h1>
      <Greeting name="yourName" />
    </>
  );
}

createApp(App).mount('body');
```

---

## 🧪 Result
![Result](https://raw.githubusercontent.com/PFMCODES/neutronium/main/results.png)

## Browser Sandbox
Neutronium provides a **browser-safe compiler** for live environments such as playgrounds:
```javascript
import { compile } from "neutronium/sandbox.mjs";

const result = compile(code);
```
This allows Neutronium code to be compiled without Node.js, making it ideal for online editors and sandboxes.

---

## 📚 Documentation & Links
- 🌐 Website: https://neutronium-website.onrender.com/
- 📖 Docs: https://neutronium-website.onrender.com/Documentation/
- 🧪 Playground: https://neutronium-website.onrender.com/Playground/
- 🧠 GitHub: https://github.com/PFMCODES/neutronium
- 📦 NPM: https://www.npmjs.com/package/neutronium

---

## 📦 Packages Built with Neutronium
- [@neuhq/alert](https://www.npmjs.com/package/@neuhq/alert)
- [neutronium-alert](https://www.npmjs.com/package/neutronium-alert)

---

## 🐞 Found a Bug or Issue?
Please report it here:
👉 https://github.com/PFMCODES/neutronium/issues/new

---
## License
MIT © PFMCODES