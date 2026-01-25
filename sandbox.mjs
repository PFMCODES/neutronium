import * as Babel from "https://esm.sh/@babel/standalone@7.28.6/es2022/standalone.mjs";
import { basehtml } from "./template.js";

export function compile(source) {
  try {
    console.log("⚙️ Babel transforming");

    const result = Babel.transform(source, {
      plugins: [[
        Babel.availablePlugins["transform-react-jsx"],
        {
          pragma: "_neutronium.h",
          pragmaFrag: "_neutronium.Fragment",
          runtime: "classic",
        }
      ]]
    });

    const CDN = "https://esm.sh/neutronium@3.3.8/es2022/neutronium.mjs";
    let compiledCode = result.code
    // import { x } from "neutronium"
    .replace(
      /import\s+\{([^}]+)\}\s+from\s+['"]neutronium['"];/g,
      'import { $1 } from "' + CDN + '";'
    )

    // import * as ns from "neutronium"
    .replace(
      /import\s+\*\s+as\s+([a-zA-Z_$][\w$]*)\s+from\s+['"]neutronium['"];/g,
      'import * as $1 from "' + CDN + '";'
    )

    // import "neutronium"
    .replace(
      /import\s+['"]neutronium['"];/g,
      'import "' + CDN + '";'
    );
    compiledCode = `import * as _neutronium from '${CDN}'` + compiledCode;
    console.log("🛠️ Generating index.html...");

    return basehtml(compiledCode);

  } catch (e) {
    return `
    <h1>Error:<h1>
    <p style="font-size: 16px !important;">${e}</p>
    `;
  }
}