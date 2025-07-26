// src/index.js

let globalState = [];
let stateIndex = 0;

function resetStateIndex() {
  stateIndex = 0;
}

let currentEffect = null;

function useEffect(fn) {
  currentEffect = fn;
  fn(); // run once to collect dependencies
  currentEffect = null;
}

function useState(initialValue) {
  const index = stateIndex;

  if (!globalState[index]) {
    let value = initialValue;
    const subs = new Set();

    function get() {
      if (currentEffect) subs.add(currentEffect);
      return value;
    }

    function set(newVal) {
      if (value !== newVal) {
        value = newVal;
        subs.forEach(fn => fn()); // re-run effects
        if (typeof window.__NEUTRONIUM_RENDER_FN__ === 'function') {
          window.__NEUTRONIUM_RENDER_FN__();
        }
      }
    }

    globalState[index] = [get, set];
  }

  const result = globalState[index];
  stateIndex++;
  return result;
}

function h(type, props = {}, ...children) {
  props = props || {};
  props.children = (props.children || []).concat(children).flat();

  if (typeof type === 'function') {
    return type(props);
  }

  const el = document.createElement(type);

  for (const [key, value] of Object.entries(props || {})) {
    if (key === 'children') continue; // skip
    if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'ref' && typeof value === 'function') {
      value(el);
    } else {
      el.setAttribute(key, value);
    }
  }

  props.children.forEach(child => {
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
        return null;
      }

      window.__NEUTRONIUM_ROOT__ = root;

      function render() {
        resetStateIndex();
        const vnode = component();
        root.innerHTML = '';
        root.appendChild(vnode);
      }

      window.__NEUTRONIUM_RENDER_FN__ = render;
      render();

      return root;
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

export { h, createApp, Fragment, useState,useEffect, resetStateIndex };