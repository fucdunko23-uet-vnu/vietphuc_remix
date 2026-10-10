from pathlib import Path
root=Path('ai-studio-app/public')
changes={
'Bộ phối lấy cảm hứng Lô Lô':'Trang phục truyền thống Lô Lô',
'Bộ phối lấy cảm hứng Ê Đê':'Trang phục truyền thống Ê Đê',
'Cảm hứng thổ cẩm Lô Lô':'Trang phục truyền thống Lô Lô',
'Cảm hứng thổ cẩm Ê Đê':'Trang phục truyền thống Ê Đê',
'Bản phối sáng tạo theo mảng ghép hình học, cùng cảnh Hà Giang.':'Phối trang phục truyền thống Lô Lô cùng phong cảnh Hà Giang.',
'Bản phối lấy cảm hứng dệt Ê Đê trong không gian Đắk Lắk.':'Phối trang phục truyền thống Ê Đê cùng phong cảnh Đắk Lắk.',
'Tủ đồ demo Sa Pa: váy xòe xếp ly lấy cảm hứng H’Mông.':'Tủ đồ Sa Pa: váy xòe xếp ly H’Mông.'
}
for name in ['destinations.js','garment-preview.js','index.html']:
 p=root/name;s=p.read_text(encoding='utf-8')
 for old,new in changes.items():s=s.replace(old,new)
 p.write_text(s,encoding='utf-8')
print('Updated Lo Lo and Ede outfit names, destination cards and descriptions.')
