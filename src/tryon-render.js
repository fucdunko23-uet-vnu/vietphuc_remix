const prepared = $('Chuẩn bị ảnh và trang phục').all().map(i => i.json);
const first = prepared[0];
const incoming = $input.all();
const esc = text => String(text ?? '').slice(0, 2000).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const retry = first.formMode === 'test'
  ? '<p>Để thử ảnh khác, bấm Execute workflow rồi mở lại Test URL.</p>'
  : '<a class="button" href="/form/viet-phuc-thu-do" target="_top">Thử ảnh hoặc trang phục khác ↗</a>';
const safeImage = image => {
  const mime = image?.mimeType || image?.mime_type;
  const data = image?.data;
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(mime) || typeof data !== 'string'
    || data.length > 22 * 1024 * 1024 || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) return null;
  return { url: `data:${mime};base64,${data}`, ext: mime === 'image/jpeg' ? 'jpg' : mime.split('/')[1] };
};
let imageCount = 0;
const errorText = body => {
  const status = Number(body.statusCode || body.error?.statusCode || body.error?.httpCode || body.error?.code || body.status || 0);
  const message = String(body.error?.message || body.error || '');
  if (status === 429 || /quota|resource.exhausted|too many requests/i.test(message)) return 'Google đang giới hạn lượt tạo ảnh hoặc tài khoản chưa có hạn mức tạo ảnh. Hãy kiểm tra Usage & Billing trong Google AI Studio rồi thử lại.';
  if (status === 401 || status === 403 || /permission|api key/i.test(message)) return 'Chưa truy cập được model tạo ảnh Google. Kiểm tra API key và quyền sử dụng model trong credential n8n.';
  if (/timeout|timed.out/i.test(message)) return 'Google xử lý quá lâu. Hãy thử lại với ảnh nhỏ hơn.';
  if (body.promptFeedback?.blockReason || /SAFETY|PROHIBITED|IMAGE_SAFETY/.test(body.candidates?.[0]?.finishReason || '')) return 'Google chưa thể xử lý ảnh này. Hãy dùng ảnh rõ một người, mặc trang phục thông thường.';
  return 'Chưa tạo được ảnh cho phương án này. Hãy thử ảnh rõ một người hoặc kiểm tra hạn mức tạo ảnh Google. Không có ảnh thay thế được dùng để giả lập kết quả.';
};
const cards = first.valid ? prepared.map((prep, index) => {
  const body = incoming[index]?.json?.body ?? incoming[index]?.json ?? {};
  const candidate = body.candidates?.[0];
  const parts = candidate?.content?.parts ?? [];
  const imagePart = candidate?.finishReason === 'STOP' ? parts.find(p => !p.thought && (p.inlineData || p.inline_data)) : null;
  const image = safeImage(imagePart?.inlineData || imagePart?.inline_data);
  if (image) imageCount++;
  const look = prep.look;
  return `<article class="look-card"><div class="card-heading"><span>PHƯƠNG ÁN 0${index + 1}</span><h2>${esc(look.title)}</h2></div>
    ${image ? `<img class="tryon-image" src="${image.url}" alt="Ảnh AI thử ${esc(prep.input.garment)}, phương án ${index + 1}"><a class="download" href="${image.url}" download="viet-phuc-ban-phoi-${index + 1}.${image.ext}">Tải ảnh này ↓</a>` : `<div class="failure" role="status"><h3>Chưa có ảnh thử đồ</h3><p>${esc(errorText(body))}</p></div>`}
    <div class="card-content"><div class="palette">${look.colors.map(c => `<div><span class="swatch" style="background:${/^#[0-9a-f]{6}$/i.test(c.hex) ? c.hex : '#ddd'}"></span><small>${esc(c.name)}</small></div>`).join('')}</div>
    <p>${esc(look.outfit)}</p><p><strong>Giày:</strong> ${esc(look.shoes)}</p><p><strong>Phụ kiện:</strong> ${esc(look.accessories)}</p><p class="reason">${esc(look.reason)}</p></div></article>`;
}).join('') : `<div class="failure" role="alert"><h2>Hãy kiểm tra ảnh tải lên</h2><p>${esc(first.userError)}</p></div>`;
const original = first.valid ? safeImage(first.photo) : null;
const content = `<header><span class="eyebrow">VIỆT PHỤC / THỬ ĐỒ BẰNG ẢNH</span><h1>Ảnh của bạn. Diện mạo mới.</h1><p>Tự chọn Việt phục, phối màu và bối cảnh — xem AI thử trang phục trên ảnh của bạn.</p></header>
${first.valid ? `<section class="summary"><img class="original-image" src="${original.url}" alt="Ảnh bạn đã tải lên"><div><span class="eyebrow">ẢNH GỐC CỦA BẠN</span><h2>${esc(first.input.garment)} · ${esc(first.input.background)}</h2><p>${esc(first.input.style)} · ${esc(first.input.event)} · ${esc(first.photoType)}</p><p class="status">${imageCount}/2 ảnh thử đồ được tạo bởi Google AI</p><p>${first.photoType === 'Ảnh khuôn mặt' ? 'Với ảnh khuôn mặt, cơ thể và tư thế bên dưới được AI dựng thêm.' : 'AI được yêu cầu giữ khuôn mặt, vóc dáng và tư thế theo ảnh toàn thân.'}</p></div></section>` : ''}
<div class="grid">${cards}</div>
${first.valid ? `<section class="heritage"><span class="eyebrow">MỘT CHÚT VĂN HÓA</span><h2>${esc(first.input.garment)}</h2><p>${esc(first.heritage.text)}</p><p>Định hướng giữ đặc trưng: ${esc(first.heritage.keep.replace('Mẫu minh họa này giữ ', ''))}</p><a href="${esc(first.heritage.url)}" target="_blank" rel="noopener noreferrer">Nguồn: ${esc(first.heritage.source)} ↗</a></section><p class="notice">Ảnh thử đồ do AI tạo, có thể khác khuôn mặt hoặc chi tiết áo thật; không dự đoán kích cỡ và độ vừa vặn. Bảng màu và mô tả là bản phối đề xuất, hình AI có thể sai lệch. Phông nền không thể hiện nơi xuất xứ của trang phục.</p>` : ''}
<footer>${retry}</footer>`;
const html = `<style>
body{margin:0!important;padding:0!important;background:#f5f3ee!important}.tryon,.tryon *{box-sizing:border-box}.tryon{max-width:1120px;margin:auto;padding:36px 24px 48px;font-family:'Segoe UI',sans-serif;color:#293e34;line-height:1.65}.eyebrow,.card-heading>span{font-size:11px;letter-spacing:1.6px;font-weight:700;color:#6d7c61}header{padding:16px 0 28px}h1{font:normal clamp(32px,5vw,54px)/1.2 Georgia,serif;margin:12px 0}h2{font-size:21px;line-height:1.35;margin:8px 0}p{margin:10px 0}header>p,.notice{color:#697262}.summary{display:flex;align-items:center;gap:24px;padding:22px;background:#e9ede3;border-radius:14px;margin-bottom:28px}.original-image{width:150px;height:180px;object-fit:contain;border-radius:10px;background:#fff}.summary p{font-size:13px}.status{font-weight:700}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}.look-card{background:white;border:1px solid #dde2d7;border-radius:16px;overflow:hidden}.card-heading,.card-content{padding:22px}.tryon-image{display:block;width:100%;height:auto;background:#e9ede3}.download{display:block;text-align:center;padding:12px;background:#edf1e7;color:#294e3e;font-weight:600;text-decoration:none}.palette{display:flex;gap:12px}.palette>div{flex:1}.swatch{display:block;height:17px;border-radius:4px;border:1px solid #0002}.palette small{font-size:11px}.card-content{font-size:14px}.reason{background:#f3f6ed;padding:14px;border-radius:8px}.heritage{margin-top:30px;border-block:1px solid #d7decf;padding:22px 0}.heritage p,.heritage a,.notice{font-size:13px}.failure{padding:28px;background:#fff4df;min-height:220px}.failure h3{margin-top:0}.button{display:inline-block;padding:12px 18px;border-radius:8px;background:#294e3e;color:white;text-decoration:none}footer{margin-top:24px}a{color:#36583e}@media(max-width:700px){.tryon{padding:18px 14px 32px}.grid{grid-template-columns:1fr}.summary{align-items:flex-start;gap:14px;padding:16px}.original-image{width:85px;height:120px}.summary h2{font-size:17px}.card-heading,.card-content{padding:18px}}
</style><main class="tryon">${content}</main>`;
return [{ json: { html, imageCount, status: !first.valid ? 'invalid-upload' : imageCount === 2 ? 'success' : imageCount ? 'partial' : 'image-generation-failed' } }];
