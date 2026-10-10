from pathlib import Path
root=Path('ai-studio-app/public')
for name in ['destinations.js','garment-preview.js','index.html']:
    p=root/name
    s=p.read_text(encoding='utf-8').replace('Bộ phối lấy cảm hứng Ba Na','Trang phục truyền thống Ba Na').replace('Cảm hứng dệt Ba Na','Trang phục truyền thống Ba Na').replace('Bản phối lấy cảm hứng dệt Ba Na cùng cảnh Gia Lai.','Phối trang phục truyền thống Ba Na cùng phong cảnh Gia Lai.')
    p.write_text(s,encoding='utf-8')
