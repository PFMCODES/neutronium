// src/index.ts

type EffectFunction = () => void;
type StateGetter<T> = () => T;
type StateSetter<T> = (newVal: T) => void;
type StateEntry<T> = [StateGetter<T>, StateSetter<T>];

let globalState: StateEntry<any>[] = [];
let stateIndex = 0;

function resetStateIndex(): void {
  stateIndex = 0;
}

let currentEffect: EffectFunction | null = null;

function useEffect(fn: EffectFunction): void {
  currentEffect = fn;
  fn(); // run once to collect dependencies
  currentEffect = null;
}

function useState<T>(initialValue: T): StateEntry<T> {
  const index = stateIndex;

  if (!globalState[index]) {
    let value = initialValue;
    const subs = new Set<EffectFunction>();

    function get(): T {
      if (currentEffect) subs.add(currentEffect);
      return value;
    }

    function set(newVal: T): void {
      if (value !== newVal) {
        value = newVal;
        subs.forEach(fn => fn()); // re-run effects
        if (typeof (window as any).__NEUTRONIUM_RENDER_FN__ === 'function') {
          (window as any).__NEUTRONIUM_RENDER_FN__();
        }
      }
    }

    globalState[index] = [get, set];
  }

  const result = globalState[index] as StateEntry<T>;
  stateIndex++;
  return result;
}

type VNode = Node;
type Child = VNode | string | number | null | undefined;
type Children = Child | Child[];

interface Props {
  children?: Children;
  ref?: (el: HTMLElement) => void;
  [key: string]: any;
}

type ComponentFunction = (props: Props) => VNode;
type ElementType = string | ComponentFunction;

function h(type: ElementType, props: Props | null = {}, ...children: Child[]): VNode {
  props = props || {};
  props.children = (props.children ? (Array.isArray(props.children) ? props.children : [props.children]) : [])
    .concat(children)
    .flat();

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
      el.setAttribute(key, String(value));
    }
  }

  props.children.forEach((child: Child) => {
    if (typeof child === 'string' || typeof child === 'number') {
      el.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof Node) {
      el.appendChild(child);
    }
  });

  return el;
}

interface App {
  mount(selector: string | HTMLElement): HTMLElement | null;
}

function createApp(component: () => VNode): App {
  return {
    mount(selector: string | HTMLElement): HTMLElement | null {
      const root = typeof selector === 'string' ? document.querySelector<HTMLElement>(selector) : selector;
      if (!root) {
        console.error(`❌ Root element '${selector}' not found`);
        return null;
      }

      (window as any).__NEUTRONIUM_ROOT__ = root;

      function render(): void {
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

  (Array.isArray(children) ? children : [children]).forEach((child: Child) => {
    if (typeof child === 'string' || typeof child === 'number') {
      frag.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof Node) {
      frag.appendChild(child);
    }
  });

  return frag;
}

export { h, createApp, Fragment, useState, useEffect, resetStateIndex };
export type { Props, VNode, Child, Children, ComponentFunction, ElementType, StateEntry, EffectFunction };
