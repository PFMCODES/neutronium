function baseHtml(script) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Neutronium App</title>
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

export function basehtml(script) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Neutronium App</title>
</head>
<body>
  <script>
    ${script}
  </script>
  </body>
</html>
`.trim();
}

module.exports = { baseHtml };