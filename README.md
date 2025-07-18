# ⚛️ Neutronium

**Ultra-dense JavaScript framework – maximum performance, minimal overhead**

[![NPM Downloads](https://img.shields.io/npm/dw/neutronium?style=flat-square)](https://www.npmjs.com/package/neutronium)
[![License: MIT](https://img.shields.io/npm/l/neutronium?style=flat-square)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/npm/v/neutronium?style=flat-square)](https://www.npmjs.com/package/neutronium)

---

## 🚀 About

**Neutronium** is a lightweight, efficient JavaScript framework designed for building modern web applications with **React-like simplicity** but **minimal overhead**.

> Ultra-fast ⚡️. Tiny footprint 📦. No build tools 🛠️. Pure JavaScript ✨.

---

## ✨ Features

- ⚡️ **Blazing fast rendering**
- 🧠 **Simple component logic**
- 🔌 **No dependencies or virtual DOM**
- 📦 **Small size (~139kB unpacked)**
- 🛠️ **Works out of the box**
- 🔁 **Easy JSX-style structure**

---

## 📦 Installation

```bash
npm i neutronium@latest -g
```

## 🛠️ Setup

```
neu-cli create-app my-app
```

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

## Other helpful packages you might need
### [@neuhq/alert](https://www.npmjs.com/package/@neuhq/alert)
## ⚒️ In dev
### [@neuhq/router](https://www.npmjs.com/package/@neuhq/router) 