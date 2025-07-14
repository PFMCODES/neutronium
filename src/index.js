// src/index.js

let globalState = [];
let stateIndex = 0;

// This will be called before rendering begins
export function resetStateIndex() {
  stateIndex = 0;
}

// Custom useState implementation
function useState(initialValue) {
  const current = stateIndex;

  if (globalState[current] === undefined) {
    globalState[current] = initialValue;
  }

  function setState(newValue) {
    globalState[current] = newValue;

    // Re-render the entire app
    if (window.__NEUTRONIUM_ROOT__ && typeof window.__NEUTRONIUM_RENDER_FN__ === 'function') {
      window.__NEUTRONIUM_ROOT__.innerHTML = '';
      resetStateIndex();
      const newVNode = window.__NEUTRONIUM_RENDER_FN__();
      window.__NEUTRONIUM_ROOT__.appendChild(newVNode);
    }
  }

  stateIndex++;
  return [globalState[current], setState];
}

function h(type, props = {}, ...children) {
  if (typeof type === 'function') {
    // 🔧 Add children to props
    props = props || {};
    props.children = children.flat(); // ✅ critical fix
    return type(props);
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

function createApp(component) {
  return {
    mount(selector) {
      const root = typeof selector === 'string' ? document.querySelector(selector) : selector;
      if (!root) {
        console.error(`❌ Root element '${selector}' not found`);
        return null; // return something explicit
      }
      // Save render function + root globally so useState can use them
      window.__NEUTRONIUM_ROOT__ = root;
      window.__NEUTRONIUM_RENDER_FN__ = component;

      // Reset before first render
      resetStateIndex();
      const vnode = component();
      root.innerHTML = '';
      root.appendChild(vnode);

      return vnode; // ✅ REQUIRED
    }
  };
}

function Fragment(props = {}) {
  const frag = document.createDocumentFragment();
  const children = props.children || [];

  (Array.isArray(children) ? children : [children]).forEach(child => {
    if (typeof child === 'string' || typeof child === 'number') {
      frag.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      frag.appendChild(child);
    }
  });

  return frag;
}

export { h, createApp, Fragment, useState };  