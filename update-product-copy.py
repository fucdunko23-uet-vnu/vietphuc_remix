from pathlib import Path
import json
root=Path('.')
replacements={
'Một dự án demo giúp học sinh, sinh viên khám phá và phối trang phục truyền thống Việt Nam theo phong cách cá nhân.':'Ứng dụng giúp bạn khám phá trang phục truyền thống Việt Nam, phối đồ theo phong cách cá nhân và thử trang phục trên ảnh bằng AI.',
'Điều bản demo làm được':'Khám phá Việt phục theo cách của bạn',
'Dự án demo · Ảnh thử đồ tạo bằng AI':'Khám phá Việt phục · Thử trang phục bằng AI',
'Bộ sưu tập mẫu':'Bộ sưu tập',
'Ý tưởng phối đồ · Minh họa mẫu':'Ý tưởng phối đồ · Hình minh họa',
'Tất cả hình dưới đây là minh họa mẫu, chưa sử dụng ảnh của bạn.':'Các hình dưới đây minh họa ý tưởng phối đồ. Vào phòng thử đồ để tạo ảnh với diện mạo của bạn.',
'Danh mục phối đồ demo · chưa phải phục dựng lịch sử':'Việt phục Remix · hướng dẫn phối trang phục',
'MINH HỌA MẪU · KHÔNG PHẢI ẢNH THỬ ĐỒ':'XEM TRƯỚC PHỐI ĐỒ · HÌNH MINH HỌA',
'Đây là hình minh họa mẫu theo lựa chọn, chưa dùng ảnh của bạn.':'Đây là hình xem trước theo lựa chọn của bạn. Tải ảnh và chọn tạo ảnh thử đồ để xem diện mạo của bạn.',
'DỮ LIỆU MẪU':'GỢI Ý PHỐI ĐỒ',
'Dữ liệu mẫu: gợi ý theo quy tắc có sẵn, không gọi AI. Bạn có thể bật AI trong workflow.':'Gợi ý phối đồ theo lựa chọn của bạn, được tổng hợp bằng quy tắc phối màu và trang phục.',
'Bản mẫu chỉ xử lý một số từ khóa như thoáng mát, đi bộ, không cao gót, tiết kiệm.':'Gợi ý hỗ trợ các yêu cầu như thoáng mát, đi bộ, không cao gót và tiết kiệm.',
'Kết quả mẫu':'Gợi ý phối đồ',
'Bản phối minh họa từ thư viện mẫu.':'Bản phối xem trước từ thư viện trang phục.',
'Hình được ghép từ thư viện mẫu của bạn.':'Hình được ghép từ thư viện trang phục.',
'lời gợi ý mẫu.':'gợi ý phối đồ.',
'// DEMO: false = không gọi API. Đổi thành true sau khi chọn credential Google Gemini.':'// Optional Gemini explanations; rule-based styling remains available without API calls.',
'// Original vector mockups for the demo; these are not historical reconstructions.':'// Original styling illustrations; these are not historical reconstructions.',
'// Curated demo choices, not an exhaustive catalogue of each community\'s dress.':'// Curated outfit choices, not an exhaustive catalogue of each community\'s dress.',
'// Stylized outfit diagrams for the demo, not historical reconstructions.':'// Stylized outfit diagrams, not historical reconstructions.'
}
files=[root/'ai-studio-app/public/index.html',root/'ai-studio-app/public/app.js',root/'ai-studio-app/public/destinations.js',root/'ai-studio-app/public/garment-preview.js',root/'ai-studio-app/styling.cjs',root/'Xem-truoc-ket-qua.html',root/'Xem-truoc-ghep-trang-phuc.html',root/'build-full-site.cjs',root/'build-ai-studio.cjs',root/'build.cjs',*list((root/'src').glob('*.js'))]
for p in files:
 if not p.exists():continue
 before=p.read_text(encoding='utf-8');s=before
 for old,new in replacements.items():s=s.replace(old,new)
 if p.name=='app.js':s=s.replace("'demo'","'preview'")
 if p.name=='render.js':s=s.replace("let source = 'demo';","let source = 'preview';")
 s=s.replace('Tập trung ba nhóm trang phục: áo dài, áo ngũ thân và áo tứ thân, với ghi chú về đặc trưng và nguồn tham khảo.','Khám phá áo dài, áo ngũ thân, áo tứ thân, Nhật Bình, giao lĩnh và trang phục các cộng đồng qua tủ đồ của từng địa điểm.')
 s=s.replace('Bước 2: Tải ảnh chân dung hoặc toàn thân để thử đồ','Chọn trang phục, bối cảnh và tải ảnh để thử đồ')
 s=s.replace('<span>03 nhóm Việt phục</span>','<span>11 kiểu trang phục</span>')
 if s!=before:p.write_text(s,encoding='utf-8');print('Updated',p.as_posix())
for p in root.glob('*.n8n.json'):
 d=json.loads(p.read_text(encoding='utf-8'));changed=False
 for node in d.get('nodes',[]):
  params=node.get('parameters',{})
  for key,value in params.items():
   if isinstance(value,str):
    new=value
    for old,replacement in replacements.items():new=new.replace(old,replacement)
    if new!=value:params[key]=new;changed=True
 if changed:p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print('Updated',p.name)
