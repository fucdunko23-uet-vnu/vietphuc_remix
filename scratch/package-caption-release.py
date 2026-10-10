import pathlib, zipfile
root = pathlib.Path(__file__).resolve().parents[1]
source = root / 'ai-studio-app'
server = (source / 'server.cjs').read_text(encoding='utf-8')
# Preserve the existing AI Studio gateway adaptations in the reviewed cloud server.
server = server.replace("if (req.method === 'GET') {\n        if (url.pathname === '/favicon.ico')", "if (req.method === 'GET' || req.method === 'HEAD') {\n        if (url.pathname === '/favicon.ico')")
server = server.replace("const files = { '/logo.webp'", "const files = { '/index.html': ['index.html', 'text/html; charset=utf-8'], '/logo.webp'")
server = server.replace('          return res.end(content);', "          if (req.method === 'HEAD') return res.end();\n          return res.end(content);")
server = server.replace("  server.listen(Number(process.env.PORT || 3000), process.env.HOST || '0.0.0.0', () => console.log('Viet phuc Remix listening on port ' + (process.env.PORT || 3000)));", "  const port = process.env.PORT === '8080' ? 3000 : Number(process.env.PORT || 3000);\n  server.listen(port, process.env.HOST || '0.0.0.0', () => console.log('Viet phuc Remix listening on port ' + port));")
assert "req.method === 'HEAD'" in server and "process.env.PORT === '8080'" in server
with zipfile.ZipFile(root / 'output/studio-photobooth-captions.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
 archive.writestr('server.cjs', server)
 for name in ['caption.cjs', 'public/index.html', 'public/app.js', 'public/site.css']:
  archive.write(source / name, name)
print('Prepared caption release; retained AI Studio HEAD, index alias and port adaptations.')
