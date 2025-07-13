// src/index.js

export function h(type, props = {}, ...children) {
  if (typeof type === 'function') {
    return type(props || {});
  }

  const el = document.createElement(type);

  for (const [key, value] of Object.entries(props || {})) {
    if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'ref' && typeof value === 'function') {
      value(el);
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

export function Fragment(_, ...children) {
  const frag = document.createDocumentFragment();
  children.flat().forEach(child => {
    if (typeof child === 'string') {
      frag.appendChild(document.createTextNode(child));
    } else {
      frag.appendChild(child);
    }
  });
  return frag;
}

export function createApp(component) {
  return {
    mount(selector) {
      const root = typeof selector === 'string' ? document.querySelector(selector) : selector;
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

export function Fragment(_, ...children) {
  const frag = document.createDocumentFragment();
  children.flat().forEach(child => {
    if (typeof child === 'string') {
      frag.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      frag.appendChild(child);
    }
  });
  return frag;
}

export { h, createApp, Fragment };
