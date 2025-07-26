// src/index.ts

type EffectFn = () => void;
type Setter<T> = (value: T) => void;
type Getter<T> = () => T;
type StateTuple<T> = [Getter<T>, Setter<T>];

let globalState: Array<StateTuple<any>> = [];
let stateIndex = 0;

function resetStateIndex(): void {
  stateIndex = 0;
}

let currentEffect: EffectFn | null = null;

function useEffect(fn: EffectFn): void {
  currentEffect = fn;
  fn(); // run once to collect dependencies
  currentEffect = null;
}

function useState<T>(initialValue: T): StateTuple<T> {
  const index = stateIndex;

  if (!globalState[index]) {
    let value = initialValue;
    const subs = new Set<EffectFn>();

    const get: Getter<T> = () => {
      if (currentEffect) subs.add(currentEffect);
      return value;
    };

    const set: Setter<T> = (newVal: T) => {
      if (value !== newVal) {
        value = newVal;
        subs.forEach(fn => fn()); // re-run effects
        if (typeof (window as any).__NEUTRONIUM_RENDER_FN__ === 'function') {
          (window as any).__NEUTRONIUM_RENDER_FN__();
        }
      }
    };

    globalState[index] = [get, set];
  }

  const result = globalState[index] as StateTuple<T>;
  stateIndex++;
  return result;
}

type Props = {
  [key: string]: any;
  children?: any;
};

function h(type: string | ((props: Props) => Node), props: Props = {}, ...children: any[]): Node {
  props.children = (props.children || []).concat(children).flat();

  if (typeof type === 'function') {
    return type(props);
  }

  const el = document.createElement(type);

  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') continue;
    if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'ref' && typeof value === 'function') {
      value(el);
    } else {
      el.setAttribute(key, value);
    }
  }

  for (const child of props.children) {
    if (typeof child === 'string' || typeof child === 'number') {
      el.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof Node) {
      el.appendChild(child);
    }
  }

  return el;
}

function createApp(component: () => Node) {
  return {
    mount(selector: string | Element): Element | null {
      const root = typeof selector === 'string'
        ? document.querySelector(selector)
        : selector;

      if (!root) {
        console.error(`❌ Root element '${selector}' not found`);
        return null;
      }

      (window as any).__NEUTRONIUM_ROOT__ = root;

      function render() {
        resetStateIndex();
        const vnode = component();
        root.innerHTML = '';
        root.appendChild(vnode);
      }

      (window as any).__NEUTRONIUM_RENDER_FN__ = render;
      render();

      return root;
    }
  };
}

function Fragment(props: Props = {}): DocumentFragment {
  const frag = document.createDocumentFragment();
  const children = props.children || [];

  const childArray = Array.isArray(children) ? children : [children];

  for (const child of childArray) {
    if (typeof child === 'string' || typeof child === 'number') {
      frag.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof Node) {
      frag.appendChild(child);
    }
  }

  return frag;
}

export {
  h,
  createApp,
  Fragment,
  useState,
  useEffect,
  resetStateIndex
};