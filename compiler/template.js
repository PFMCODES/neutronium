function baseHtml(appHtml, scriptName) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Neutronium App</title>
</head>
<body>
  ${appHtml}
  <script type="module" src="./${scriptName}"></script>
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