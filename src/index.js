// src/index.js

function h(type, props = {}, ...children) {
  const el = document.createElement(type);

  for (const [key, value] of Object.entries(props || {})) {
    if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      el.setAttribute(key, value);
    }
  }

  children.flat().forEach(child => {
    if (typeof child === 'string' || typeof child === 'number') {
      el.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      el.appendChild(child);
    }
  });

  return el;
}

function createApp(component) {
  return {
    mount(selector) {
      const root = document.querySelector(selector);
      if (!root) {
        console.error(`❌ Root element '${selector}' not found`);
        return;
      }

      const vnode = component();
      root.innerHTML = '';
      root.appendChild(vnode);
    }
  };
}


export { h, createApp };