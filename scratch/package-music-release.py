import pathlib, zipfile
root = pathlib.Path(__file__).resolve().parents[1]
source = root / 'ai-studio-app'
server = (source / 'server.cjs').read_text(encoding='utf-8')
# Keep the existing gateway compatibility when updating the cloud backend.
server = server.replace("const files = { '/logo.webp'", "const files = { '/index.html': ['index.html', 'text/html; charset=utf-8'], '/logo.webp'")
server = server.replace("  server.listen(Number(process.env.PORT || 3000), process.env.HOST || '0.0.0.0', () => console.log('Viet phuc Remix listening on port ' + (process.env.PORT || 3000)));", "  const port = process.env.PORT === '8080' ? 3000 : Number(process.env.PORT || 3000);\n  server.listen(port, process.env.HOST || '0.0.0.0', () => console.log('Viet phuc Remix listening on port ' + port));")
assert "req.method === 'HEAD'" in server and "process.env.PORT === '8080'" in server
with zipfile.ZipFile(root / 'output/studio-background-music.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
 archive.writestr('server.cjs', server)
 for name in ['public/music.js', 'public/index.html', 'public/app.js', 'public/site.css', 'public/site.js', 'public/map.js']:
  archive.write(source / name, name)
 for asset in (source / 'public/audio').iterdir():
  if asset.is_file(): archive.write(asset, asset.relative_to(source).as_posix())
print('Prepared music release: controller, page hooks, media backend and original audio assets.')
