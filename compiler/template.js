const fs = require('fs');
const path = require('path');
let favicon;
const faviconPath = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'))).favicon

if (faviconPath) {
  favicon = `<link rel="icon" type="image/x-icon" href="${faviconPath}">`;
}
else {
  favicon = '';
}

function baseHtml(script) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Neutronium App</title>
  ${favicon}
</head>
<body>
  ${script}
  <script>
    const ws = new WebSocket('ws://' + location.host);
    ws.onmessage = (msg) => {
      if (msg.data === 'reload') {
        console.log('[Neutronium] Reloading...');
        location.reload();
      }
    };
  </script>
</body>
</html>
`.trim();
}

module.exports = { baseHtml };