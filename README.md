<div style="display: flex; align-items: center; gap: 5px"><img src="https://github.com/PFMCODES/neutronium/raw/main/neutronium.png" style="width: 25px; margin-bottom: 20px"><h1>Neutronium</h1></div>

> Ultra-dense JavaScript framework - maximum performance, minimal overhead

Neutronium is a lightweight, efficient JavaScript framework designed for building modern web applications with the density and stability of neutron star matter.

## Features

* 🚀 **Ultra-fast** - Optimized for performance
* 📦 **Minimal bundle size** - Dense with features, light on complexity
* 🎯 **Simple API** - Easy to learn and use
* 🔧 **Flexible** - Adaptable to your project needs
* 🌟 **Modern** - Built with current JavaScript standards

## Installation and Setup

```bash
npm i neutronium -g && npm i neutronium && neu-cli create-app && neu-cli start --watch
```

### Component with State

```javascript
import { createComponent, render } from 'neutronium';

const TodoList = createComponent({
  template: `
    <div>
      <input type="text" placeholder="Add todo..." />
      <button onclick="addTodo()">Add</button>
      <ul>
        {{#each todos}}
          <li>{{this}}</li>
        {{/each}}
      </ul>
    </div>
  `,
  props: {
    todos: []
  },
  methods: {
    addTodo() {
      const input = this.element.querySelector('input');
      if (input.value.trim()) {
        this.props.todos.push(input.value);
        input.value = '';
      }
    }
  }
});

render(TodoList, document.getElementById('app'));
```

## Browser Support

* Chrome 60+
* Firefox 60+
* Safari 12+
* Edge 79+

## Development

```bash
# Clone the repository
git clone https://github.com/PFMCODES/neutronium.git

# Install dependencies
npm install

# Run tests
npm test

# Build for production
npm run build
```

## Contributing

We welcome contributions!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Why Neutronium?

Just like neutronium is the densest stable matter in the universe, Neutronium framework packs maximum functionality into minimal code. It's designed for developers who want powerful features without the bloat.

---
<div style="display: flex; align-items: center; gap: 5px; font-weight: bolder"><h2>Built with</h2><img src="https://github.com/PFMCODES/neutronium/raw/main/neutronium.png" style="width: 25px"><h2> by PFMCODES </h2></div>
