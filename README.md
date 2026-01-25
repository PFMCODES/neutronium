# ⚛️ Neutronium v3.3.8

**Ultra-dense JavaScript framework – maximum performance, minimal overhead**

[![npm](https://img.shields.io/badge/Downloads-3.2k-CB3837?logo=npm&logoColor=CB3837&style=flat-square)](https://www.npmjs.com/package/neutronium)
[![License: MIT](https://img.shields.io/npm/l/neutronium?style=flat-square)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/npm/v/neutronium?style=flat-square)](https://www.npmjs.com/package/neutronium)
[![Website](https://img.shields.io/badge/Neutronium_Website-online-0bff03?logo=GoogleChrome&logoColor=d4d2d2&style=flat-square)](https://neutronium-website.onrender.com)
[![Playground](https://img.shields.io/badge/Online_Playground-0368ff?logo=stackblitz&style=flat-square)](https://neutronium-website.onrender.com/Playground/)
[![Documentation](https://img.shields.io/badge/Documentation-3d3c3b?logo=readthedocs&style=flat-square)](https://neutronium-website.onrender.com/Docuemntation/)
---

## 🎉 What's new?
- ⚡ Faster compilation for complex projects
- ✨ useState, and useEffect
- ⚛️ React like syntax for easier switching
- 🌐 browser-safe Neutronium code compilation using /sandbox.mjs
- 🖼️ Apply favicon to your site
---

## ℹ️ About

**Neutronium** is a lightweight, efficient JavaScript framework designed for building modern web applications with **React-like simplicity** but **minimal overhead**.

> Ultra-fast ⚡️. Tiny footprint 📦. No build tools 🛠️. Pure JavaScript ✨.

---

## ✨ Features

- ⚡️ **Blazing fast rendering**
- 🧠 **Simple component logic**
- 🔌 **No dependencies or virtual DOM**
- 📦 **Small size (~184kB unpacked)**
- 🛠️ **Works out of the box**
- 🔁 **Easy JSX-style structure**

---

## 📦 Installation

```bash
npm i neutronium@latest -g
```

---

## 🛠️ Setup

```
neu-cli create-app my-app
```

---

## Usage Example
```jsx
// App.js
import { createApp } from 'neutronium' // or ts-neutronium for ts devs

function Greeting(props) {
  return <h2>Hello, {props.name}!</h2>;
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

## Result:
![Results](https://raw.githubusercontent.com/PFMCODES/neutronium/main/results.png)

---

## NPM Packages using Neutronium
### [@neuhq/alert](https://www.npmjs.com/package/@neuhq/alert)
### [neutronium-alert](https://npmjs.org/package/neutronium-alert)

---

## Found a bug or a problem?
### Report [here.](https://github.com/PFMCODES/neutronium/issues/new)
