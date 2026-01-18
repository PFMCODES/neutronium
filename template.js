export function basehtml(script) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Neutronium App</title>
</head>
<body>
  <script type="module">
    ${script}
  </script>
  </body>
</html>
`.trim();
}