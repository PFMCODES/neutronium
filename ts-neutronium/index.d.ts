// @types/netronium/index.d.ts

type StateUpdater<T> = (newValue: T) => void;
type Component<T = any> = (props?: T) => HTMLElement | DocumentFragment;

let globalState: any[] = [];
let stateIndex = 0;

// Reset index before each render
export function resetStateIndex(): void {
  stateIndex = 0;
}

// Custom useState
export function useState<T>(initialValue: T): [T, StateUpdater<T>] {
  const currentIndex = stateIndex;

  if (globalState[currentIndex] === undefined) {
    globalState[currentIndex] = initialValue;
  }

  function setState(newValue: T): void {
    globalState[currentIndex] = newValue;

    // Re-render
    const root = window.__NEUTRONIUM_ROOT__ as HTMLElement | null;
    const renderFn = window.__NEUTRONIUM_RENDER_FN__ as (() => Node) | null;

    if (root && typeof renderFn === 'function') {
      root.innerHTML = '';
      resetStateIndex();
      const newVNode = renderFn();
      root.appendChild(newVNode);
    }
  }

  stateIndex++;
  return [globalState[currentIndex], setState];
}

// JSX-compatible hyperscript function
export function h(
  type: string | Component,
  props: { [key: string]: any } = {},
  ...children: any[]
): HTMLElement | DocumentFragment {
  if (typeof type === 'function') {
    props = props || {};
    props.children = children.flat();
    return type(props);
  }

  const el = document.createElement(type);

  for (const [key, value] of Object.entries(props)) {
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

// Mount app to DOM
export function createApp(component: () => Node) {
  return {
    mount(selector: string | HTMLElement): Node | null {
      const root =
        typeof selector === 'string'
          ? document.querySelector(selector)
          : selector;

      if (!root) {
        console.error(`❌ Root element '${selector}' not found`);
        return null;
      }

      window.__NEUTRONIUM_ROOT__ = root;
      window.__NEUTRONIUM_RENDER_FN__ = component;

      resetStateIndex();
      const vnode = component();
      root.innerHTML = '';
      root.appendChild(vnode);

      return vnode;
    }
  };
}

// Fragment support
export function Fragment(props: { children?: any[] }): DocumentFragment {
  const frag = document.createDocumentFragment();
  const children = props.children ?? [];

  (Array.isArray(children) ? children : [children]).forEach(child => {
    if (typeof child === 'string' || typeof child === 'number') {
      frag.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      frag.appendChild(child);
    }
  });

  return frag;
}