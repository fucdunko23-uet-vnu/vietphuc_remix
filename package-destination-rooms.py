import pathlib, zipfile
root=pathlib.Path(__file__).parent/'ai-studio-app'
server=(root/'server.cjs').read_text(encoding='utf-8')
dest=pathlib.Path('D:/n8n/temp/viet-phuc-destination-rooms.zip')
with zipfile.ZipFile(dest,'w',zipfile.ZIP_DEFLATED) as z:
    for p in (root/'public').rglob('*'):
        if p.is_file(): z.write(p,p.relative_to(root).as_posix())
    for name in ['package.json','styling.cjs','moderation.cjs','caption.cjs','CAPTIONS.md','GUARDRAILS.md','server.test.cjs','destinations.test.cjs','moderation.test.cjs','caption.test.cjs']: z.write(root/name,name)
    z.writestr('server.cjs',server)
pathlib.Path('D:/n8n/temp/destination-server.cjs').write_text(server,encoding='utf-8')
print(dest)
