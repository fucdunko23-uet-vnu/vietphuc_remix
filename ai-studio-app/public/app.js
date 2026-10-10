const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

let photo, ready = false, busy = false, photoUrl;

const colorMap = [
  ['xanh reu', 'Xanh rêu', '#647A52'],
  ['xanh mint', 'Xanh mint', '#9DCCBA'],
  ['xanh la', 'Xanh lá', '#638D66'],
  ['xanh duong', 'Xanh dương', '#527AB5'],
  ['xanh navy', 'Xanh navy', '#263A59'],
  ['xanh', 'Xanh dịu', '#88AFBE'],
  ['tim', 'Tím lavender', '#B7A0D3'],
  ['hong', 'Hồng phấn', '#DFA4B8'],
  ['do', 'Đỏ trầm', '#B54B53'],
  ['vang', 'Vàng dịu', '#D5B35F'],
  ['cam', 'Cam đất', '#C8815B'],
  ['nau', 'Nâu', '#8B6B56'],
  ['den', 'Đen', '#303039'],
  ['trang', 'Trắng ngà', '#F6F2E9'],
  ['be', 'Be', '#DDCCB4'],
  ['kem', 'Kem', '#F0E6D6'],
  ['xam', 'Xám', '#A0A2AA']
];

function normalizeColorText(text) {
  return String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();
}

function resolveColor(inputVal) {
  if (!inputVal) return null;
  const raw = String(inputVal).trim();
  if (!raw) return null;
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw;
  
  const norm = normalizeColorText(raw);
  const match = colorMap.find(([key]) => new RegExp('(?:^|[^a-z])' + key + '(?:$|[^a-z])').test(norm));
  if (match) return match[2];
  
  return '#DDCCB4'; // Be trung tính fallback matching backend logic
}

const message = (text, type = 'info') => {
  const msgEl = $('#message');
  if (msgEl) {
    msgEl.textContent = text;
    msgEl.className = text ? (type ? `message-${type}` : '') : '';
  }
};

// Both overlays behave as dialogs: keep keyboard focus inside and prevent background edits.
let activeDialog;
function dialogControls(dialog) {
  return [...dialog.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')]
    .filter(el=>!el.closest('[inert]')&&el.checkVisibility({checkVisibilityCSS:true}));
}
function openDialog(dialog) {
  if(activeDialog?.element===dialog)return;
  if(activeDialog)closeDialog(activeDialog.element,false);
  const previous=document.activeElement;
  dialog.hidden=false;
  dialog.tabIndex=-1;
  window.VietPhucMusic?.setDialog(dialog);
  const siblings=[...document.body.children].filter(el=>!el.contains(dialog)&&!el.matches('script,style,link'));
  activeDialog={element:dialog,previous,siblings:siblings.map(el=>[el,el.inert])};
  siblings.forEach(el=>{el.inert=true;});
  document.body.classList.add('has-ui-dialog');
  (dialogControls(dialog)[0]||dialog).focus({preventScroll:true});
}
function closeDialog(dialog,restoreFocus=true) {
  dialog.hidden=true;
  if(activeDialog?.element!==dialog)return;
  const state=activeDialog;activeDialog=null;
  state.siblings.forEach(([el,inert])=>{el.inert=el.matches('[data-page]')?el.hidden:inert;});
  document.body.classList.remove('has-ui-dialog');
  window.VietPhucMusic?.setDialog(null);
  const restore=()=>{
    if(restoreFocus&&!activeDialog&&state.previous?.isConnected&&!state.previous.disabled&&state.previous.checkVisibility({checkVisibilityCSS:true})&&!state.previous.closest('[inert]'))state.previous.focus({preventScroll:true});
  };
  if(state.previous?.disabled)requestAnimationFrame(()=>{if(document.activeElement===document.body||dialog.contains(document.activeElement))restore();});
  else restore();
}
document.addEventListener('keydown',event=>{
  const dialog=activeDialog?.element;if(!dialog)return;
  if(event.key==='Escape'&&event.target.closest('#music-player')&&!document.querySelector('#music-panel')?.hidden)return;
  if(event.key==='Escape'&&dialog.id==='photobooth-modal'){
    event.preventDefault();event.stopImmediatePropagation();closePhotoboothStudio();return;
  }
  if(event.key!=='Tab')return;
  const controls=dialogControls(dialog),first=controls[0],last=controls.at(-1);
  if(!first){event.preventDefault();dialog.focus();return;}
  if(!dialog.contains(document.activeElement)||(event.shiftKey&&document.activeElement===first)||(!event.shiftKey&&document.activeElement===last)){
    event.preventDefault();(event.shiftKey?last:first).focus();
  }
},true);
document.addEventListener('focusin',()=>{
  const dialog=activeDialog?.element;
  if(dialog&&!dialog.contains(document.activeElement))(dialogControls(dialog)[0]||dialog).focus({preventScroll:true});
});

const selection = () => Object.fromEntries(new FormData($('#styling-form')));
// Checking three free-text fields must not serialize the entire form on every change.
const guardrailSelection = () => {
  const form = $('#styling-form');
  return Object.fromEntries(['Mong muốn thêm', 'Chi tiết phong cảnh', 'Màu yêu thích'].map(name => [name, form?.elements.namedItem(name)?.value || '']));
};

const element = (tag, text, className) => {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (className) e.className = className;
  return e;
};

function updateButton() {
  const issue = window.VietPhucGuardrails?.checkSelection(guardrailSelection());
  const feedback = $('#guardrail-feedback');
  if (feedback) {
    feedback.hidden = !issue;
    feedback.textContent = issue?.message || '';
  }
  const genBtn = $('#generate');
  const prevBtn = $('#preview');
  if (genBtn) {
    genBtn.disabled = !photo || !ready || busy || Boolean(issue);
    genBtn.classList.toggle('is-loading', busy);
    const textSpan = genBtn.querySelector('.btn-text');
    if (textSpan) {
      if (busy) textSpan.textContent = 'Đang dệt gấm thêu hoa...';
      else if (photo) textSpan.textContent = 'Khoác y phục ngay';
      else textSpan.textContent = 'Trao ảnh cho thợ may';
    }
  }
  if (prevBtn) {
    prevBtn.disabled = busy || Boolean(issue);
    prevBtn.classList.toggle('is-loading', busy);
  }
}

async function request(url, data, token, method) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), data?.photo ? 60000 : 15000);
  try {
  const response = await fetch(url, {
    signal: controller.signal,
    method: method || (data ? 'POST' : 'GET'),
    headers: {
      ...(data ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: 'Bearer ' + token } : {})
    },
    body: data ? JSON.stringify(data) : undefined
  });
  let result;
  try { result = await response.json(); }
  catch { throw new Error('Máy chủ chưa trả dữ liệu hợp lệ. Vui lòng thử lại sau.'); }
  if (!response.ok) throw Object.assign(new Error(result.error || 'Chưa xử lý được yêu cầu.'), {status:response.status, code:result.code});
  return result;
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Kết nối quá chậm. Nếu đã gửi ảnh, lượt tạo có thể vẫn đang xử lý; không gửi lại ngay.');
    throw error;
  } finally { clearTimeout(timeout); }
}

let checkingConnection = false;
async function checkConnection() {
  if (checkingConnection || document.hidden || ($('#styling-form')?.closest('[data-page]')?.hidden && !busy)) return;
  checkingConnection = true;
  try {
    const state = await request('/api/status');
    ready = state.ready;
    const connEl = $('#connection');
    if (connEl) {
      connEl.textContent = state.message;
      connEl.classList.toggle('ready', ready);
    }
  } catch {
    ready = false;
    const connEl = $('#connection');
    if (connEl) {
      connEl.textContent = 'Chưa kết nối được máy chủ.';
      connEl.classList.remove('ready');
    }
  }
  checkingConnection = false;
  updateButton();
}

let photoVersion = 0;
async function setPhoto(file) {
  if (!file) return;
  if (busy) return message('Đang xử lý bản phối. Hãy đợi kết quả trước khi đổi ảnh.', 'info');
  const version = ++photoVersion;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
    message('Chọn ảnh JPG, PNG hoặc WebP không quá 5 MB.', 'error');
    return;
  }
  let dataUrl;
  try { dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  } catch { if (version === photoVersion) message('Không đọc được tệp ảnh. Hãy chọn lại.', 'error'); return; }
  const image = new Image();
  image.src = dataUrl;
  try {
    await image.decode();
  } catch {
    if(version===photoVersion)message('Không đọc được ảnh. Hãy chọn tệp khác.', 'error');
    return;
  }
  if (version !== photoVersion) return;
  photo = { mimeType: file.type, data: dataUrl.split(',')[1] };
  if (photoUrl) URL.revokeObjectURL(photoUrl);
  photoUrl = URL.createObjectURL(file);
  
  const previewEl = $('#photo-preview');
  const copyEl = $('#upload-copy');
  const changeBtn = $('#change-photo-btn');
  
  if (previewEl) {
    previewEl.src = photoUrl;
    previewEl.hidden = false;
  }
  if (copyEl) copyEl.hidden = true;
  if (changeBtn) changeBtn.hidden = false;
  
  message('Ảnh đã sẵn sàng. Hãy chọn cách phối rồi bấm Thử Việt phục.', 'info');
  updateButton();
  if (typeof updateLivePreview === 'function') updateLivePreview();
}

const photoInput = $('#photo');
if (photoInput) {
  photoInput.addEventListener('change', event => setPhoto(event.target.files[0]));
}

const changePhotoBtn = $('#change-photo-btn');
if (changePhotoBtn && photoInput) {
  changePhotoBtn.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    photoInput.click();
  });
}

const dropZone = $('#drop-zone');
if (dropZone) {
  let dragCounter = 0;
  dropZone.addEventListener('dragenter', event => {
    event.preventDefault();
    dragCounter++;
    dropZone.classList.add('is-dragover');
  });

  dropZone.addEventListener('dragover', event => {
    event.preventDefault();
  });

  dropZone.addEventListener('dragleave', event => {
    event.preventDefault();
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      dropZone.classList.remove('is-dragover');
    }
  });

  dropZone.addEventListener('drop', event => {
    event.preventDefault();
    dragCounter = 0;
    dropZone.classList.remove('is-dragover');
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      setPhoto(event.dataTransfer.files[0]);
    }
  });
}

// Color Preset Chips interaction
const colorInput = $('#color-input') || $('input[name="Màu yêu thích"]');
const colorDot = $('#color-dot');

function updateColorDot(colorVal) {
  if (!colorDot) return;
  const resolved = resolveColor(colorVal);
  if (resolved) {
    colorDot.style.backgroundColor = resolved;
    colorDot.style.opacity = '1';
  } else {
    colorDot.style.backgroundColor = 'transparent';
    colorDot.style.opacity = '0.35';
  }
}

if (colorInput) {
  colorInput.addEventListener('input', () => {
    const val = colorInput.value.trim();
    updateColorDot(val);
    const norm = normalizeColorText(val);
    const match = colorMap.find(([key]) => new RegExp('(?:^|[^a-z])' + key + '(?:$|[^a-z])').test(norm));
    const matchedName = match ? normalizeColorText(match[1]) : '';
    $$('.color-chip').forEach(chip => {
      const chipColor = chip.dataset.color || '';
      const chipNorm = normalizeColorText(chipColor);
      chip.classList.toggle('active', chipNorm === norm || (matchedName && chipNorm === matchedName));
    });
  });
}

$$('.color-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const color = chip.dataset.color;
    if (colorInput) {
      colorInput.value = color;
      updateColorDot(chip.style.getPropertyValue('--chip-c') || color);
      colorInput.dispatchEvent(new Event('input', {bubbles:true}));
    }
    $$('.color-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
  });
});

function hasGeneratedPhotos() {
  const result = window.currentResultsData;
  return result?.mode === 'flow' && result.data?.images?.length >= 2 &&
    result.data.images.every(image => /^image\/(png|jpeg|webp)$/.test(image.mimeType) && typeof image.data === 'string' && image.data.length > 0);
}

function resetOutfitCards() {
  $('#outfit-card-section').hidden = true;
  $('#outfit-card-looks').replaceChildren();
  closePhotoboothStudio();
  window.currentResultsData = null;
  photoboothImageCache=null;
  renderedSealGeometry=null;
  photoboothRenderVersion++;
  resetPhotoboothCaption();
}
window.clearTryOnResults=()=>{resetOutfitCards();$('#results').hidden=true;$('#cards').replaceChildren();$('#heritage').replaceChildren();};

function showResults(data, mode) {
  resetOutfitCards();
  $('#cards').replaceChildren();
  $('#heritage').replaceChildren();
  $('#result-mode').textContent = mode === 'preview' ? 'XEM TRƯỚC PHỐI ĐỒ · HÌNH MINH HỌA' : 'ẢNH TẠO BỞI GOOGLE FLOW';
  
  // Save current results data for photobooth studio
  window.currentResultsData = { data, mode, timestamp: Date.now(), sourcePhoto: mode==='flow'?photo:null };

  data.looks.forEach((look, index) => {
    const card = element('article', undefined, 'look-card');
    
    // Card header
    const head = element('div', undefined, 'look-card-head');
    head.append(
      element('span', index === 0 ? 'PHƯƠNG ÁN 01 · CHỦ ĐẠO' : 'PHƯƠNG ÁN 02 · BIẾN TẤU', 'look-badge'),
      element('h3', look.title)
    );
    card.append(head);

    const pictureWrap = element('figure', undefined, 'look-picture-wrap');
    if (mode === 'preview') {
      pictureWrap.innerHTML = look.svg;
    } else {
      const image = data.images[index];
      const source = `data:${image.mimeType};base64,${image.data}`;
      const picture = element('img', undefined, 'look-image');
      picture.src = source;
      picture.alt = 'Ảnh thử Việt phục, phương án ' + (index + 1);
      pictureWrap.append(picture);

      const download = element('a', 'Tải ảnh này ↓', 'download');
      download.href = source;
      download.download = `viet-phuc-${index + 1}.${image.mimeType === 'image/jpeg' ? 'jpg' : image.mimeType.split('/')[1]}`;
      card.append(download);
    }
    const captionText = `${data.input?.garment || 'Việt phục'} · ${data.input?.background || 'Di sản'} · ${look.accessory || 'Truyền thống'}`;
    pictureWrap.append(element('figcaption', captionText, 'look-caption'));
    card.append(pictureWrap);

    const body = element('div', undefined, 'look-body');
    const swatches = element('div', undefined, 'swatches');
    look.colors.forEach(color => {
      const item = element('div', undefined, 'swatch-item');
      const swatch = element('span', undefined, 'swatch');
      swatch.style.backgroundColor = color.hex;
      item.append(swatch, element('small', color.name));
      swatches.append(item);
    });

    const dl = element('dl', undefined, 'details');
    const shoeDiv = element('div');
    shoeDiv.append(
      element('dt', 'GIÀY'),
      element('dd', look.shoes || (look.shoe === 'sneakers' ? 'Sneaker trơn màu trắng ngà, đế thấp.' : 'Giày bệt màu nâu đậm, phom gọn.'))
    );
    const accDiv = element('div');
    accDiv.append(
      element('dt', 'PHỤ KIỆN'),
      element('dd', look.accessories || look.accessory || 'Không dùng phụ kiện')
    );
    dl.append(shoeDiv, accDiv);

    const reasonBox = element('div', undefined, 'reason');
    reasonBox.append(
      element('span', 'VÌ SAO HỢP?', 'eyebrow'),
      element('p', look.reason)
    );

    body.append(swatches, element('p', look.outfit, 'look-outfit'), dl, reasonBox);
    card.append(body);
    $('#cards').append(card);
  });

  if (hasGeneratedPhotos()) {
    const lookActions = $('#outfit-card-looks');
    data.looks.forEach((look, index) => {
      const button = element('button', 'Đóng khung phương án ' + (index + 1), 'btn-card-ootd');
      button.type = 'button';
      button.addEventListener('click', () => openPhotoboothStudio('ootd', index));
      lookActions.append(button);
    });
    $('#outfit-card-section').hidden = false;
  }

  const source = element(data.heritage.url ? 'a' : 'span', 'Nguồn: ' + data.heritage.source + (data.heritage.url ? ' ↗' : ''), 'heritage-link');
  if (data.heritage.url) source.href = data.heritage.url;
  source.target = '_blank';
  source.rel = 'noopener noreferrer';

  const leftCol = element('div', undefined, 'heritage-col-aside');
  leftCol.append(
    element('span', 'MỘT CHÚT VĂN HÓA', 'eyebrow'),
    element('h3', data.input?.garment || 'Việt Phục'),
    source
  );

  const rightCol = element('div', undefined, 'heritage-col-content');
  rightCol.append(
    element('p', data.heritage.text),
    element('p', data.heritage.keep, 'heritage-keep'),
    element('p', 'Hình minh họa phối đồ hiện đại, không phải bản phục dựng lịch sử hay mô phỏng độ vừa vặn trên người thật.', 'heritage-disclaimer')
  );

  $('#heritage').append(leftCol, rightCol);

  const resultsEl = $('#results');
  if (resultsEl) {
    resultsEl.hidden = false;
    resultsEl.classList.add('has-spotlight');
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/* ============================================================
   HERITAGE WAITING LOUNGE & STORYTELLING FLASHCARDS SYSTEM
   ============================================================ */
const HERITAGE_FLASHCARDS = [
  {
    topic: 'Ý NGHĨA KHUY ÁO',
    icon: '👘',
    title: 'Vì sao Áo Ngũ Thân lại có 5 hạt khuy?',
    fact: 'Năm khuy cài trên áo Ngũ thân tượng trưng cho Đạo làm người: Nhân, Nghĩa, Lễ, Trí, Tín. Năm thân áo đại diện cho Tứ thân phụ mẫu (cha mẹ ruột, cha mẹ chồng/vợ) ôm trọn lấy thân thứ năm là chính người mặc.',
    quote: 'Áo mặc năm thân, giữ trọn chữ hiếu và đạo nghĩa làm người.'
  },
  {
    topic: 'TÂY BẮC HUYỀN BÍ',
    icon: '🦋',
    title: 'Thông điệp tình yêu từ hàng khuy bướm bạc',
    fact: 'Trên chiếc áo Cóm của phụ nữ Thái, số lượng khuy bướm (hàng mác bén) bằng bạc mang thông điệp tinh tế: Cô gái chưa chồng cài hàng khuy lẻ, còn người đã có gia đình sẽ cài hàng khuy chẵn.',
    quote: 'Món quà đính ước gửi trao tình ý qua từng đường may khéo léo.'
  },
  {
    topic: 'HỘI HÈ KINH BẮC',
    icon: '🌸',
    title: 'Nghệ thuật phối sắc "Mớ ba mớ bảy"',
    fact: 'Khi trẩy hội Lim, phụ nữ Kinh Bắc mặc lồng nhiều lớp áo mỏng (mớ ba hoặc mớ bảy), mỗi lớp mang một sắc màu tương phản: sen hồng, vàng chanh, cánh kiến, đọt chuối. Khi gió thổi tà áo bay, tạo nên dải lụa sắc màu phiêu bồng.',
    quote: 'Gió thổi bay tà áo thắm, nụ cười e ấp vành nón quai thao.'
  },
  {
    topic: 'QUY CHẾ HOÀNG TRIỀU',
    icon: '👑',
    title: 'Cổ áo Nhật Bình - Bản hòa ca Ngũ Hành',
    fact: 'Áo Nhật Bình có phần cổ áo chữ nhật to bản trước ngực, viền các dải ngũ sắc biểu trưng cho Ngũ hành (Kim, Mộc, Thủy, Hỏa, Thổ). Hoàng hậu mặc sắc vàng chính vị, Công chúa mặc đỏ, Quý phi mặc sắc tím quý phái.',
    quote: 'Đỉnh cao mỹ thuật cung đình triều Nguyễn đọng lại nơi viền cổ ngũ hành.'
  },
  {
    topic: 'BẢO TỒN THỔ CẨM',
    icon: '✨',
    title: 'Vẽ sáp ong: Cuốn sử thi không lời của người H\'Mông',
    fact: 'Váy xòe xếp ly của phụ nữ H\'Mông được vẽ họa tiết bằng bút đồng chấm sáp ong rừng nóng chảy trước khi nhuộm chàm sâu. Từng nét vẽ kể lại hành trình vượt sông, ngắm sao và ký ức cội nguồn.',
    quote: 'Nét chàm vẽ sâu vào thớ vải, như ký ức bám chặt vào đá núi non cao.'
  },
  {
    topic: 'LỄ NGHI XƯA',
    icon: '🪭',
    title: 'Áo Tấc - Cốt cách đoan trang người xưa',
    fact: 'Áo Tấc thực chất là áo Ngũ thân tay thụng, tay áo may thụng rộng và dài bằng gấu áo. Khi hai tay chắp trước ngực làm lễ, hai tay áo chụm lại hình chữ V kín đáo, thể hiện phong thái cung kính tuyệt đối.',
    quote: 'Chắp tay buông tà thụng, tỏ lòng thành kính với tổ tiên đất trời.'
  },
  {
    topic: 'HỒN QUÊ MIỀN TÂY',
    icon: '🌾',
    title: 'Vẻ đẹp mộc mạc phóng khoáng của Áo Bà Ba',
    fact: 'Áo Bà Ba xẻ tà ngắn hai bên hông cùng chiếc khăn rằn sọc ca-rô gắn liền với văn hóa khẩn hoang sông nước Nam Bộ. Dáng áo ôm nhẹ khéo léo tôn nét thắt đáy lưng ong duyên dáng của người phụ nữ.',
    quote: 'Gió thổi ngát đồng tràm, tà áo bà ba nghiêng vành nón lá.'
  },
  {
    topic: 'PHỤ KIỆN TRUYỀN THỐNG',
    icon: '🌙',
    title: 'Nón ba tầm quai thao - Chiếc nón che duyên',
    fact: 'Chiếc nón quai thao tròn phẳng như vầng trăng rằm, đường kính 70–80cm, đan bằng lá cọ mỏng khâu chỉ cước tỉ mỉ. Dải quai thao bằng tơ tằm buông dài giúp các liền chị giấu nụ cười thẹn thùng khi hát đối.',
    quote: 'Nón thúng quai thao e ấp che, câu hát người ơi người ở đừng về.'
  },
  {
    topic: 'DÒNG CHẢY LỊCH SỬ',
    icon: '📜',
    title: 'Giao Lĩnh - Chiếc áo ngàn năm văn hiến',
    fact: 'Áo Giao Lĩnh (cổ chéo chữ Y, vạt trái đè sang phải) từng là trang phục phổ biến suốt các triều Lý, Trần, Lê. Người Việt biến tấu độc đáo khi mặc phối cùng váy đụp đen chấm gót và yếm lụa.',
    quote: 'Dáng áo ngàn năm văn hiến, khắc sâu bản lĩnh non sông Đại Việt.'
  },
  {
    topic: 'TINH HOA LÀNG NGHỀ',
    icon: '🪡',
    title: 'Lụa Vạn Phúc - Nắng hè mát rượi, đông về ấm êm',
    fact: 'Lụa tơ tằm truyền thống như Vạn Phúc hay Lãnh Mỹ A dệt từ sợi tơ tằm tự nhiên, có cấu trúc sợi phản quang óng ánh như ngọc trai, mặc mùa hè thì thoáng mát, mùa đông lại giữ ấm cơ thể.',
    quote: 'Nắng Sài Gòn anh đi mà chợt mát, bởi vì em mặc áo lụa Hà Đông.'
  },
  {
    topic: 'MỸ THUẬT CỔ TRUYỀN',
    icon: '🏮',
    title: 'Triện son - Dấu ấn khẳng định phong vị',
    fact: 'Trong mỹ thuật cung đình xưa, con dấu triện son đỏ (chu sa) được đóng lên sắc phong hay thư tịch như lời chứng thực cho tính độc bản. Hôm nay, triện son đóng lên bức ảnh trang phục trong ngày của bạn như lời chúc may mắn.',
    quote: 'Nét mực thơm ngát vần thơ cổ, triện son sáng rực dấu thời gian.'
  },
  {
    topic: 'GIAO THOA VĂN HÓA',
    icon: '🧣',
    title: 'Chiếc khăn rằn - Biểu tượng hòa hợp phương Nam',
    fact: 'Khăn rằn bắt nguồn từ khăn krama của người Khmer, du nhập và trở thành vật bất ly thân của người Việt phương Nam: vừa che nắng gió trên ruộng đồng, vừa trở thành nét thời trang bình dị kiên cường.',
    quote: 'Khăn rằn vắt vai, nụ cười hào sảng của đất phương Nam màu mỡ.'
  }
];

let loadingLoungeInterval = null;
let currentFlashcardIndex = 0;
let loadingStepTimer = null;
let loadingStartTime = 0;

function updateFlashcardUI(index) {
  const fc = HERITAGE_FLASHCARDS[index % HERITAGE_FLASHCARDS.length];
  const topicEl = $('#fc-topic');
  const iconEl = $('#fc-icon');
  const titleEl = $('#fc-title');
  const factEl = $('#fc-fact');
  const quoteEl = $('#fc-quote');
  const counterEl = $('#fc-counter');
  const timerFill = $('#fc-timer-fill');

  if (topicEl) topicEl.textContent = fc.topic;
  if (iconEl) iconEl.textContent = fc.icon;
  if (titleEl) titleEl.textContent = fc.title;
  if (factEl) factEl.textContent = fc.fact;
  if (quoteEl) quoteEl.textContent = fc.quote;
  if (counterEl) counterEl.textContent = `${String((index % HERITAGE_FLASHCARDS.length) + 1).padStart(2, '0')} / ${String(HERITAGE_FLASHCARDS.length).padStart(2, '0')}`;

  // Reset timer animation
  if (timerFill) {
    timerFill.style.transition = 'none';
    timerFill.style.width = '0%';
    setTimeout(() => {
      timerFill.style.transition = 'width 3.8s linear';
      timerFill.style.width = '100%';
    }, 50);
  }
}

function updateLoadingStep(stepNumber, primaryText, iconEmoji) {
  const steps = $$('.step-track-item');
  steps.forEach((el, idx) => {
    const s = idx + 1;
    el.classList.remove('active', 'done');
    if (s < stepNumber) el.classList.add('done');
    else if (s === stepNumber) el.classList.add('active');
  });

  const primEl = $('#loading-primary-status');
  const iconEl = $('#loading-spinner-emoji');
  if (primEl && primaryText) primEl.textContent = primaryText;
  if (iconEl && iconEmoji) iconEl.textContent = iconEmoji;
}

function startLoadingLounge(mode = 'flow') {
  const overlay = $('#heritage-loading-overlay');
  if (!overlay) return;
  openDialog(overlay);
  loadingStartTime = Date.now();

  // Random initial flashcard
  currentFlashcardIndex = Math.floor(Math.random() * HERITAGE_FLASHCARDS.length);
  updateFlashcardUI(currentFlashcardIndex);

  // Leave enough time to read each cultural story before moving to the next.
  if (loadingLoungeInterval) clearInterval(loadingLoungeInterval);
  loadingLoungeInterval = setInterval(() => {
    currentFlashcardIndex = (currentFlashcardIndex + 1) % HERITAGE_FLASHCARDS.length;
    updateFlashcardUI(currentFlashcardIndex);
  }, 12000);

  // Dynamic tailoring steps progression tracker
  updateLoadingStep(1, mode === 'review' ? 'Đang kiểm tra độ phù hợp của ảnh và yêu cầu…' : 'Đang chuẩn bị bản phối Việt phục…', '👤');
  if (loadingStepTimer) clearInterval(loadingStepTimer);

  loadingStepTimer = setInterval(() => {
    if (mode === 'review') return;
    const elapsed = (Date.now() - loadingStartTime) / 1000;
    if (elapsed < 5) {
      updateLoadingStep(1, 'Đang nhận diện dáng vóc và thần thái của bạn…', '👤');
    } else if (elapsed < 13) {
      updateLoadingStep(2, 'Đang ủi phẳng nếp áo và đo cắt phom dáng Việt phục…', '✂️');
    } else if (elapsed < 22) {
      updateLoadingStep(3, 'Đang dệt hoa văn ngũ hành và phối sắc đương đại…', '🎨');
    } else {
      updateLoadingStep(4, 'Đang tinh chỉnh ánh sáng, hài hòa phụ kiện & hoàn tất…', '✨');
    }
  }, 1000);
}

function stopLoadingLounge() {
  const overlay = $('#heritage-loading-overlay');
  if (loadingLoungeInterval) clearInterval(loadingLoungeInterval);
  if (loadingStepTimer) clearInterval(loadingStepTimer);
  
  loadingLoungeInterval = null;
  loadingStepTimer = null;
  if (overlay) closeDialog(overlay);
}

// Flashcard buttons listeners
const btnFcPrev = $('#btn-fc-prev');
if (btnFcPrev) {
  btnFcPrev.addEventListener('click', () => {
    currentFlashcardIndex = (currentFlashcardIndex - 1 + HERITAGE_FLASHCARDS.length) % HERITAGE_FLASHCARDS.length;
    updateFlashcardUI(currentFlashcardIndex);
  });
}
const btnFcNext = $('#btn-fc-next');
if (btnFcNext) {
  btnFcNext.addEventListener('click', () => {
    currentFlashcardIndex = (currentFlashcardIndex + 1) % HERITAGE_FLASHCARDS.length;
    updateFlashcardUI(currentFlashcardIndex);
  });
}

/* ============================================================
   PHOTOBOOTH STUDIO & OOTD CANVAS ENGINE (LIFE4CUTS TREND)
   ============================================================ */
let pbState = {
  layout: 'strip', // 'strip' (Life4Cuts 4-cut), 'ootd' (Story 9:16), 'duo' (Before/After 4:5)
  frameColor: '#F7F4EB',
  seal: true,
  palette: true,
  caption: true,
  selectedLookIndex: 0,
  sealText: 'VIỆT',
  sealPos: null
};

function helperImageFromSrc(src) {
  return new Promise((resolve, reject) => {
    if (!src) return reject(new Error('No src'));
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image failed'));
    img.src = src;
  });
}

function helperSvgToImage(svgStr) {
  return new Promise((resolve, reject) => {
    if (!svgStr) return reject(new Error('No SVG'));
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('SVG failed'));
    };
    img.src = url;
  });
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawCoverImage(ctx, img, x, y, width, height, radius = 0) {
  ctx.save();
  if (radius > 0) {
    drawRoundedRect(ctx, x, y, width, height, radius);
    ctx.clip();
  }
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const boxRatio = width / height;
  let renderW, renderH, offsetX, offsetY;

  if (imgRatio > boxRatio) {
    renderH = height;
    renderW = height * imgRatio;
    offsetX = x - (renderW - width) / 2;
    offsetY = y;
  } else {
    renderW = width;
    renderH = width / imgRatio;
    offsetX = x;
    offsetY = y - (renderH - height) / 2;
  }

  ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
  ctx.restore();
}

function drawSeal(ctx, x, y, size = 90, text = 'VIỆT') {
  // Con dấu triện son đỏ cung đình
  ctx.save();
  ctx.fillStyle = '#B83A3A';
  ctx.strokeStyle = '#DEAB2D';
  ctx.lineWidth = 3.5;
  drawRoundedRect(ctx, x - size / 2, y - size / 2, size, size, 14);
  ctx.fill();
  ctx.stroke();

  // Viền trong son
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 1.8;
  drawRoundedRect(ctx, x - size / 2 + 5, y - size / 2 + 5, size - 10, size - 10, 9);
  ctx.stroke();

  // Chữ triện son cá nhân hóa
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const clean = String(text || 'VIỆT').trim().toUpperCase();
  if (clean.length <= 2) {
    ctx.font = `bold ${Math.round(size * 0.44)}px serif`;
    ctx.fillText(clean, x, y);
  } else if (clean.length === 3) {
    ctx.font = `bold ${Math.round(size * 0.32)}px serif`;
    ctx.fillText(clean, x, y);
  } else if (clean.length === 4) {
    ctx.font = `bold ${Math.round(size * 0.24)}px serif`;
    ctx.fillText(clean.slice(0, 2), x, y - size * 0.18);
    ctx.fillText(clean.slice(2), x, y + size * 0.18);
  } else {
    ctx.font = `bold ${Math.round(size * 0.20)}px serif`;
    ctx.fillText(clean.slice(0, 4), x, y);
  }
  ctx.restore();
}

let photoboothRenderVersion = 0;
let photoboothImageCache;
let renderedSealGeometry;
function syncSealHandle() {
  const handle=$('#draggable-seal-stamp'),canvas=$('#photobooth-canvas'),container=$('#pb-canvas-container');
  if(!handle||!canvas||!container||$('#photobooth-modal').hidden)return;
  handle.hidden=!pbState.seal||!renderedSealGeometry;
  if(handle.hidden)return;
  const frame=container.getBoundingClientRect(),rect=canvas.getBoundingClientRect(),g=renderedSealGeometry;
  const width=Math.max(44,g.size*rect.width/canvas.width),height=Math.max(44,g.size*rect.height/canvas.height);
  handle.style.width=width+'px';handle.style.height=height+'px';
  handle.style.left=(rect.left-frame.left+g.x*rect.width/canvas.width-width/2)+'px';
  handle.style.top=(rect.top-frame.top+g.y*rect.height/canvas.height-height/2)+'px';
}
window.addEventListener('resize',()=>{if(!$('#photobooth-modal')?.hidden)requestAnimationFrame(syncSealHandle);});
async function renderPhotoboothCanvas() {
  const version = ++photoboothRenderVersion;
  const canvas = $('#photobooth-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const res = window.currentResultsData;
  if (!hasGeneratedPhotos()) return;
  const exportButtons = $$('#btn-pb-download, #btn-pb-copy, #btn-pb-share');
  exportButtons.forEach(button => { button.disabled = true; });

  const data = res.data;
  const looks = data.looks || [];
  const look1 = looks[0] || {};
  const look2 = looks[1] || looks[0] || {};
  const currentLook = looks[pbState.selectedLookIndex] || look1;
  let sealGeometry;
  const paintSeal=(x,y,size)=>{sealGeometry={x,y,size};drawSeal(ctx,x,y,size,pbState.sealText);};

  // Decode once per result, in parallel; changing a frame must not decode large photos again.
  if (!photoboothImageCache || photoboothImageCache.result !== res) {
    const loadLook = (look, index) => res.mode === 'flow' && data.images?.[index]
      ? helperImageFromSrc(`data:${data.images[index].mimeType};base64,${data.images[index].data}`)
      : helperSvgToImage(look.svg);
    const sourcePhoto=res.sourcePhoto;
    photoboothImageCache = {result:res, images:Promise.all([
      sourcePhoto ? helperImageFromSrc(`data:${sourcePhoto.mimeType};base64,${sourcePhoto.data}`) : Promise.resolve(null),
      loadLook(look1,0), loadLook(look2,1)
    ].map(p=>p.catch(()=>null)))};
  }
  let [userImg, look1Img, look2Img] = await photoboothImageCache.images;
  if (version !== photoboothRenderVersion) return;
  const sealOverlay=$('#draggable-seal-stamp');if(sealOverlay)sealOverlay.hidden=!pbState.seal;
  if(!look1Img||!look2Img){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    renderedSealGeometry=null;if(sealOverlay)sealOverlay.hidden=true;
    photoboothMessage('Không đọc được ảnh kết quả. Hãy tải lại ảnh từ phần kết quả trước khi đóng khung.','error');
    return;
  }

  // Fallback nếu thiếu ảnh userImg thì dùng look1Img hoặc tạo placeholder
  if (!userImg) userImg = look1Img;
  if (!look1Img) look1Img = userImg;
  if (!look2Img) look2Img = look1Img;

  const frameColor = pbState.frameColor;
  const isDarkFrame = ['#1E2024', '#183B2E', '#962828'].includes(frameColor);
  const textColor = isDarkFrame ? '#FFFDF8' : '#142820';
  const subTextColor = isDarkFrame ? '#D5DECE' : '#5E6F65';
  const goldColor = '#DEAB2D';

  /* ========================================================
     LAYOUT 1: PHOTOBOOTH DẢI 4 Ô (LIFE4CUTS - 800 x 2400 px)
     ======================================================== */
  if (pbState.layout === 'strip') {
    canvas.width = 800;
    canvas.height = 2400;

    // Background khung
    ctx.fillStyle = frameColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Đường chỉ vàng trang trí viền khung
    ctx.strokeStyle = isDarkFrame ? 'rgba(222, 171, 45, 0.4)' : 'rgba(198, 146, 20, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Kích thước 4 ô ảnh
    const boxW = 700;
    const boxH = 480;
    const boxX = (canvas.width - boxW) / 2; // 50px
    const startY = 60;
    const gap = 36;
    const cornerR = 14;

    // Ô 1: Ảnh gốc
    const y1 = startY;
    ctx.fillStyle = isDarkFrame ? '#2A2E33' : '#EBE6DC';
    drawRoundedRect(ctx, boxX, y1, boxW, boxH, cornerR);
    ctx.fill();
    if (userImg) drawCoverImage(ctx, userImg, boxX, y1, boxW, boxH, cornerR);
    // Nhãn Ô 1
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    drawRoundedRect(ctx, boxX + 16, y1 + 16, 170, 36, 8);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('BEFORE · BẢN GỐC', boxX + 30, y1 + 39);

    // Ô 2: Phương án 01
    const y2 = y1 + boxH + gap;
    ctx.fillStyle = isDarkFrame ? '#2A2E33' : '#EBE6DC';
    drawRoundedRect(ctx, boxX, y2, boxW, boxH, cornerR);
    ctx.fill();
    if (look1Img) drawCoverImage(ctx, look1Img, boxX, y2, boxW, boxH, cornerR);
    // Nhãn Ô 2
    ctx.fillStyle = 'rgba(26, 62, 47, 0.85)';
    drawRoundedRect(ctx, boxX + 16, y2 + 16, 195, 36, 8);
    ctx.fill();
    ctx.fillStyle = '#DEAB2D';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('LOOK 01 · CHỦ ĐẠO', boxX + 30, y2 + 39);

    // Ô 3: Phương án 02
    const y3 = y2 + boxH + gap;
    ctx.fillStyle = isDarkFrame ? '#2A2E33' : '#EBE6DC';
    drawRoundedRect(ctx, boxX, y3, boxW, boxH, cornerR);
    ctx.fill();
    if (look2Img) drawCoverImage(ctx, look2Img, boxX, y3, boxW, boxH, cornerR);
    // Nhãn Ô 3
    ctx.fillStyle = 'rgba(184, 58, 58, 0.85)';
    drawRoundedRect(ctx, boxX + 16, y3 + 16, 195, 36, 8);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('LOOK 02 · BIẾN TẤU', boxX + 30, y3 + 39);

    // Ô 4: Bảng màu, Tên trang phục & Triện son
    const y4 = y3 + boxH + gap;
    const cardBg = isDarkFrame ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF';
    ctx.fillStyle = cardBg;
    drawRoundedRect(ctx, boxX, y4, boxW, boxH, cornerR);
    ctx.fill();
    ctx.strokeStyle = isDarkFrame ? 'rgba(222, 171, 45, 0.3)' : 'rgba(20, 40, 32, 0.1)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Nội dung bên trong Ô 4
    if (pbState.caption) {
      ctx.textAlign = 'left';
      ctx.fillStyle = goldColor;
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('DI SẢN ĐƯƠNG ĐẠI · PALETTE', boxX + 36, y4 + 55);

      ctx.fillStyle = textColor;
      ctx.font = 'bold 36px serif';
      ctx.fillText(data.input?.garment || 'Việt Phục', boxX + 36, y4 + 105);

      ctx.fillStyle = subTextColor;
      ctx.font = '20px sans-serif';
      ctx.fillText(`${data.input?.background || 'Việt Nam'} · ${currentLook.accessory || 'Truyền thống'}`, boxX + 36, y4 + 145);
    }

    // Vẽ Color Palette
    if (pbState.palette && currentLook.colors && currentLook.colors.length) {
      const swY = y4 + 235;
      const swR = 34;
      currentLook.colors.forEach((c, idx) => {
        const swX = boxX + 50 + idx * 110;
        // Chấm màu
        ctx.save();
        ctx.fillStyle = c.hex;
        ctx.beginPath();
        ctx.arc(swX, swY, swR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();

        // Tên màu
        ctx.fillStyle = textColor;
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(c.name || c.hex, swX, swY + swR + 24);
      });
    }

    // Vẽ Triện Son
    if (pbState.seal) {
      const sealX = pbState.sealPos ? canvas.width * pbState.sealPos.x : (boxX + boxW - 85);
      const sealY = pbState.sealPos ? canvas.height * pbState.sealPos.y : (y4 + 85);
      paintSeal(sealX, sealY, 100);
    }

    // Footer dải ảnh dưới cùng
    const footerY = y4 + boxH + 50;
    ctx.textAlign = 'center';
    ctx.fillStyle = textColor;
    ctx.font = 'bold 24px serif';
    ctx.fillText('VIỆT PHỤC REMIX', canvas.width / 2, footerY);

    ctx.fillStyle = subTextColor;
    ctx.font = '15px sans-serif';
    ctx.fillText('Đổi Sắc Áo · Giữ Nét Riêng  ·  Heritage Photobooth 2026', canvas.width / 2, footerY + 28);
  }

  /* ========================================================
     LAYOUT 2: THẺ OOTD HERITAGE (STORY 9:16 - 1080 x 1920 px)
     ======================================================== */
  else if (pbState.layout === 'ootd') {
    canvas.width = 1080;
    canvas.height = 1920;

    // Nền
    ctx.fillStyle = frameColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Khung viền chỉ đôi
    ctx.strokeStyle = isDarkFrame ? 'rgba(222, 171, 45, 0.5)' : 'rgba(198, 146, 20, 0.4)';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

    // Ảnh Look chính (kích thước lớn chiếm 65% trên)
    const imgW = 960;
    const imgH = 1180;
    const imgX = 60;
    const imgY = 70;
    const targetImg = pbState.selectedLookIndex === 1 ? look2Img : look1Img;

    ctx.fillStyle = isDarkFrame ? '#2A2E33' : '#EBE6DC';
    drawRoundedRect(ctx, imgX, imgY, imgW, imgH, 24);
    ctx.fill();
    if (targetImg) drawCoverImage(ctx, targetImg, imgX, imgY, imgW, imgH, 24);

    // Huy hiệu trên ảnh
    ctx.fillStyle = 'rgba(18, 43, 32, 0.85)';
    drawRoundedRect(ctx, imgX + 30, imgY + 30, 340, 48, 12);
    ctx.fill();
    ctx.fillStyle = '#DEAB2D';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TRANG PHỤC TRONG NGÀY', imgX + 200, imgY + 60);

    // Khung thông tin OOTD bên dưới
    const infoY = imgY + imgH + 40;
    const infoW = 960;
    const infoH = 500;
    const infoX = 60;

    ctx.fillStyle = isDarkFrame ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF';
    drawRoundedRect(ctx, infoX, infoY, infoW, infoH, 24);
    ctx.fill();
    ctx.strokeStyle = isDarkFrame ? 'rgba(222, 171, 45, 0.3)' : 'rgba(20, 40, 32, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (pbState.caption) {
      ctx.textAlign = 'left';
      ctx.fillStyle = goldColor;
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('BẢN PHỐI DI SẢN MỚI NHẤT', infoX + 45, infoY + 58);

      ctx.fillStyle = textColor;
      ctx.font = 'bold 46px serif';
      ctx.fillText(data.input?.garment || 'Việt Phục', infoX + 45, infoY + 118);

      ctx.fillStyle = subTextColor;
      ctx.font = '22px sans-serif';
      ctx.fillText(`Bối cảnh: ${data.input?.background || 'Việt Nam'}  |  Phụ kiện: ${currentLook.accessory || 'Truyền thống'}`, infoX + 45, infoY + 165);
    }

    // Color Palette
    if (pbState.palette && currentLook.colors && currentLook.colors.length) {
      const pY = infoY + 250;
      const pR = 30;
      currentLook.colors.forEach((c, idx) => {
        const pX = infoX + 60 + idx * 125;
        ctx.save();
        ctx.fillStyle = c.hex;
        ctx.beginPath();
        ctx.arc(pX, pY, pR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = textColor;
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(c.name || c.hex, pX, pY + pR + 24);
      });
    }

    // Quote / Châm ngôn
    ctx.fillStyle = subTextColor;
    ctx.font = 'italic 20px serif';
    ctx.textAlign = 'left';
    ctx.fillText('“Đổi Sắc Áo. Giữ Nét Riêng.”', infoX + 45, infoY + 410);

    // Triện son
    if (pbState.seal) {
      const sealX = pbState.sealPos ? canvas.width * pbState.sealPos.x : (infoX + infoW - 90);
      const sealY = pbState.sealPos ? canvas.height * pbState.sealPos.y : (infoY + 110);
      paintSeal(sealX, sealY, 110);
    }

    // Chân Story
    ctx.textAlign = 'right';
    ctx.fillStyle = textColor;
    ctx.font = 'bold 20px serif';
    ctx.fillText('VIỆT PHỤC REMIX', infoX + infoW - 45, infoY + 410);
  }

  /* ========================================================
     LAYOUT 3: TRƯỚC & SAU (DUO 4:5 - 1200 x 1500 px)
     ======================================================== */
  else if (pbState.layout === 'duo') {
    canvas.width = 1200;
    canvas.height = 1500;

    ctx.fillStyle = frameColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = isDarkFrame ? 'rgba(222, 171, 45, 0.4)' : 'rgba(198, 146, 20, 0.3)';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(25, 25, canvas.width - 50, canvas.height - 50);

    // Header Duo
    ctx.textAlign = 'center';
    ctx.fillStyle = goldColor;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('BIẾN HÓA DI SẢN · BEFORE & AFTER', canvas.width / 2, 80);

    ctx.fillStyle = textColor;
    ctx.font = 'bold 40px serif';
    ctx.fillText(data.input?.garment || 'Việt Phục', canvas.width / 2, 130);

    // 2 khung ảnh song song
    const duoW = 510;
    const duoH = 920;
    const duoY = 175;
    const leftX = 65;
    const rightX = canvas.width - duoW - 65; // 625px

    // Left: Ảnh gốc
    ctx.fillStyle = isDarkFrame ? '#2A2E33' : '#EBE6DC';
    drawRoundedRect(ctx, leftX, duoY, duoW, duoH, 18);
    ctx.fill();
    if (userImg) drawCoverImage(ctx, userImg, leftX, duoY, duoW, duoH, 18);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    drawRoundedRect(ctx, leftX + 20, duoY + 20, 180, 42, 10);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BEFORE · BẢN GỐC', leftX + 110, duoY + 47);

    // Right: Ảnh diện cổ phục
    const afterImg = pbState.selectedLookIndex === 1 ? look2Img : look1Img;
    ctx.fillStyle = isDarkFrame ? '#2A2E33' : '#EBE6DC';
    drawRoundedRect(ctx, rightX, duoY, duoW, duoH, 18);
    ctx.fill();
    if (afterImg) drawCoverImage(ctx, afterImg, rightX, duoY, duoW, duoH, 18);

    ctx.fillStyle = 'rgba(26, 62, 47, 0.88)';
    drawRoundedRect(ctx, rightX + 20, duoY + 20, 200, 42, 10);
    ctx.fill();
    ctx.fillStyle = '#DEAB2D';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AFTER · CỔ PHỤC', rightX + 120, duoY + 47);

    // Bảng màu & Triện son dưới chân Duo
    const btmY = duoY + duoH + 45;

    if (pbState.palette && currentLook.colors) {
      currentLook.colors.forEach((c, idx) => {
        const cX = leftX + 40 + idx * 100;
        ctx.save();
        ctx.fillStyle = c.hex;
        ctx.beginPath();
        ctx.arc(cX, btmY + 25, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      });
    }

    if (pbState.seal) {
      const sealX = pbState.sealPos ? canvas.width * pbState.sealPos.x : (canvas.width / 2);
      const sealY = pbState.sealPos ? canvas.height * pbState.sealPos.y : (btmY + 30);
      paintSeal(sealX, sealY, 85);
    }

    ctx.textAlign = 'right';
    ctx.fillStyle = textColor;
    ctx.font = 'bold 24px serif';
    ctx.fillText('VIỆT PHỤC REMIX', rightX + duoW - 20, btmY + 20);

    ctx.fillStyle = subTextColor;
    ctx.font = '14px sans-serif';
    ctx.fillText('Nét Việt, Theo Cách Của Bạn', rightX + duoW - 20, btmY + 45);
  }
  exportButtons.forEach(button => { button.disabled = false; });
  renderedSealGeometry=sealGeometry;
  syncSealHandle();
  schedulePhotoboothCaption();
}

function openPhotoboothStudio(preferredLayout = 'strip', focusIndex = 0) {
  if (!hasGeneratedPhotos() || busy) return;
  const modal = $('#photobooth-modal');
  if (!modal) return;
  pbState.layout = preferredLayout;
  pbState.selectedLookIndex = focusIndex;

  // Sync active layout buttons
  $$('.pb-layout-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.layout === preferredLayout);
  });

  const feedback=$('#pb-feedback');if(feedback){feedback.textContent='';feedback.hidden=true;}
  openDialog(modal);
  $$('.photobooth-content,.photobooth-controls,.photobooth-preview-area').forEach(el=>{el.scrollTop=0;});
  renderPhotoboothCanvas();
}

function closePhotoboothStudio() {
  const modal = $('#photobooth-modal');
  if(modal&&!modal.hidden){photoboothRenderVersion++;cancelPhotoboothCaption();}
  if (modal) closeDialog(modal);
}

function photoboothMessage(text,type='info') {
  const feedback=$('#pb-feedback');
  if(feedback){feedback.hidden=false;feedback.textContent=text;feedback.className='pb-feedback message-'+type;feedback.scrollIntoView({block:'nearest'});}
  message(text,type);
}
function photoboothBlob() {
  return new Promise((resolve,reject)=>{
    const canvas=$('#photobooth-canvas');
    if(!canvas)return reject(new Error('Chưa có ảnh để xuất.'));
    canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Chưa xuất được ảnh. Hãy thử lại.')),'image/png');
  });
}

const pbCaption = { version: 0, timer: null, typing: null, controller: null, cache: new Map(), key: '', text: '' };
const PB_CAPTION_SIGNATURE = '— Việt Phục Remix · https://viet-phuc-remix.ai.studio #VietPhucRemix #NetVietTheoCachCuaBan';
function cancelPhotoboothCaption() {
  pbCaption.version++;
  clearTimeout(pbCaption.timer); clearTimeout(pbCaption.typing);
  pbCaption.controller?.abort(); pbCaption.controller = null;
  pbCaption.key = '';
}
function resetPhotoboothCaption() {
  cancelPhotoboothCaption(); pbCaption.cache.clear(); pbCaption.text = '';
  const card = $('#pb-caption-card'); if (card) card.hidden = true;
}
function displayPhotoboothCaption(result, version) {
  if (version !== pbCaption.version) return;
  const card = $('#pb-caption-card'), text = $('#pb-caption-text'), status = $('#pb-caption-status');
  card.classList.remove('is-writing');
  pbCaption.text = result.caption;
  status.textContent = result.source === 'vision' ? 'Câu chữ lấy cảm hứng từ ảnh của bạn' : 'Câu gợi ý dự phòng · chưa đọc được ảnh bằng AI';
  $('#btn-pb-copy-caption').disabled = false;
  const chars = Array.from(result.caption); let index = 0;
  const write = () => {
    if (version !== pbCaption.version) return;
    text.textContent = chars.slice(0, ++index).join('');
    if (index < chars.length) pbCaption.typing = setTimeout(write, 26);
  };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) text.textContent = result.caption;
  else { text.textContent = ''; write(); }
}
function schedulePhotoboothCaption() {
  const session = window.currentResultsData?.data?.captionSession;
  if (!session || $('#photobooth-modal')?.hidden) return;
  const key = `${session.id}:${pbState.layout}:${pbState.layout === 'ootd' ? pbState.selectedLookIndex : 'both'}`;
  if (pbCaption.key === key) return;
  cancelPhotoboothCaption(); pbCaption.key = key;
  const version = pbCaption.version, card = $('#pb-caption-card');
  card.hidden = false; pbCaption.text = ''; $('#pb-caption-text').textContent = '';
  $('#btn-pb-copy-caption').disabled = true;
  if (pbCaption.cache.has(key)) return displayPhotoboothCaption(pbCaption.cache.get(key), version);
  card.classList.add('is-writing'); $('#pb-caption-status').textContent = 'Đang ngắm thần thái để xin chữ…';
  pbCaption.timer = setTimeout(async () => {
    const controller = new AbortController(); pbCaption.controller = controller;
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const source = $('#photobooth-canvas'), thumbnail = document.createElement('canvas');
      const ratio = Math.min(1, 1280 / Math.max(source.width, source.height));
      thumbnail.width = Math.round(source.width * ratio); thumbnail.height = Math.round(source.height * ratio);
      thumbnail.getContext('2d').drawImage(source, 0, 0, thumbnail.width, thumbnail.height);
      const data = thumbnail.toDataURL('image/jpeg', 0.85).split(',')[1];
      const response = await fetch(`/api/jobs/${session.id}/caption`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.token },
        body: JSON.stringify({ photo: { mimeType: 'image/jpeg', data } }), signal: controller.signal
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Chưa xin được chữ.');
      if (version !== pbCaption.version) return;
      pbCaption.cache.set(key, result); displayPhotoboothCaption(result, version);
    } catch {
      if (version !== pbCaption.version) return;
      const result = { caption: 'Một chút nét xưa, một phiên bản rất riêng của mình. ✨', source: 'fallback' };
      pbCaption.cache.set(key, result); displayPhotoboothCaption(result, version);
    } finally { clearTimeout(timeout); }
  }, 650);
}
$('#btn-pb-copy-caption')?.addEventListener('click', async () => {
  if (!pbCaption.text) return;
  try {
    await navigator.clipboard.writeText(pbCaption.text + '\n\n' + PB_CAPTION_SIGNATURE);
    $('#pb-caption-status').textContent = 'Đã sao chép caption và chữ ký Việt Phục Remix.';
  } catch { $('#pb-caption-status').textContent = 'Chưa sao chép được. Bạn có thể chọn và sao chép câu chữ trực tiếp.'; }
});

// Photobooth Event Listeners
const btnOpenPb = $('#btn-open-photobooth');
if (btnOpenPb) {
  btnOpenPb.addEventListener('click', () => openPhotoboothStudio('strip', 0));
}

const btnQuickOotd = $('#btn-quick-ootd');
if (btnQuickOotd) {
  btnQuickOotd.addEventListener('click', () => openPhotoboothStudio('ootd', 0));
}

const btnClosePb = $('#btn-close-photobooth');
if (btnClosePb) btnClosePb.addEventListener('click', closePhotoboothStudio);

const pbBackdrop = $('#pb-backdrop');
if (pbBackdrop) pbBackdrop.addEventListener('click', closePhotoboothStudio);

$$('.pb-layout-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.pb-layout-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    pbState.layout = btn.dataset.layout;
    renderPhotoboothCanvas();
  });
});

$$('.pb-color-swatch').forEach(sw => {
  sw.addEventListener('click', () => {
    $$('.pb-color-swatch').forEach(s => s.classList.remove('active'));
    sw.classList.add('active');
    pbState.frameColor = sw.dataset.color;
    renderPhotoboothCanvas();
  });
});

const toggleSeal = $('#pb-toggle-seal');
if (toggleSeal) {
  toggleSeal.addEventListener('change', () => {
    pbState.seal = toggleSeal.checked;
    renderPhotoboothCanvas();
  });
}
const togglePalette = $('#pb-toggle-palette');
if (togglePalette) {
  togglePalette.addEventListener('change', () => {
    pbState.palette = togglePalette.checked;
    renderPhotoboothCanvas();
  });
}
const toggleCaption = $('#pb-toggle-caption');
if (toggleCaption) {
  toggleCaption.addEventListener('change', () => {
    pbState.caption = toggleCaption.checked;
    renderPhotoboothCanvas();
  });
}

// Download Button
const btnPbDownload = $('#btn-pb-download');
if (btnPbDownload) {
  btnPbDownload.addEventListener('click', async () => {
    try {
      const blob=await photoboothBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `viet-phuc-trang-phuc-trong-ngay-${pbState.layout}-${Date.now()}.png`;
      a.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      photoboothMessage('Đã tải ảnh thẻ trang phục trong ngày và dải ảnh sắc nét về thiết bị!', 'info');
    }catch{photoboothMessage('Chưa tải được ảnh. Hãy thử lại sau.','error');}
  });
}

// Copy Image Button
const btnPbCopy = $('#btn-pb-copy');
if (btnPbCopy) {
  btnPbCopy.addEventListener('click', async () => {
    const canvas = $('#photobooth-canvas');
    if (!canvas || !navigator.clipboard || !window.ClipboardItem) {
      photoboothMessage('Trình duyệt chưa hỗ trợ sao chép ảnh trực tiếp. Hãy dùng nút Tải ảnh HD.', 'info');
      return;
    }
    try {
      const blobPromise=photoboothBlob();
      blobPromise.catch(()=>{}); // Also handle encoder failure if clipboard permission is denied immediately.
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blobPromise })]);
      photoboothMessage('Đã sao chép ảnh vào Clipboard! Bạn có thể dán (Ctrl+V) vào tin nhắn hoặc Story.', 'info');
    } catch {
      photoboothMessage('Không thể sao chép tự động. Hãy dùng nút Tải ảnh HD.', 'error');
    }
  });
}

// Share Button
const btnPbShare = $('#btn-pb-share');
if (btnPbShare) {
  btnPbShare.addEventListener('click', async () => {
    const canvas = $('#photobooth-canvas');
    if (!canvas) return;
    try {
      const blob=await photoboothBlob();
      const file = new File([blob], 'viet-phuc-trang-phuc-trong-ngay.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Việt Phục Remix - Thẻ trang phục trong ngày',
            text: 'Bản phối Việt phục của tôi tạo bởi AI Studio! #vietphucremix #trangphuctrongngay #heritage'
          });
          photoboothMessage('Đã chia sẻ ảnh thành công!', 'info');
        } catch(error) {if(error.name!=='AbortError')photoboothMessage('Chưa chia sẻ được ảnh. Bạn có thể tải ảnh HD rồi chia sẻ từ thiết bị.','error');}
      } else {
        // Fallback: Tải về
        btnPbDownload.click();
      }
    }catch{photoboothMessage('Chưa xuất được ảnh để chia sẻ. Hãy thử lại.','error');}
  });
}

/* ============================================================
   FORM ACTIONS & PREVIEW CONNECTORS
   ============================================================ */
const previewBtn = $('#preview');
if (previewBtn) {
  previewBtn.addEventListener('click', async () => {
    if (busy) return;
    const issue = window.VietPhucGuardrails?.checkSelection(selection());
    if (issue) return message(issue.message, 'error');
    if (!$('#styling-form').reportValidity()) return;
    try {
      busy = true;
      updateButton();
      resetOutfitCards();
      startLoadingLounge('preview');
      message('Đang tải bản phối minh họa…', 'loading');
      const result = await request('/api/preview', { selection: selection() });
      stopLoadingLounge();
      showResults(result, 'preview');
      message('Đây là hình xem trước theo lựa chọn của bạn. Tải ảnh và chọn tạo ảnh thử đồ để xem diện mạo của bạn.', 'info');
    } catch (error) {
      stopLoadingLounge();
      message(error.message, 'error');
    } finally {
      busy = false;
      updateButton();
    }
  });
}

const stylingForm = $('#styling-form');
if (stylingForm) {
  stylingForm.addEventListener('input', updateButton);
  stylingForm.addEventListener('change', updateButton);
  stylingForm.addEventListener('submit', async event => {
    event.preventDefault();
    const issue = window.VietPhucGuardrails?.checkSelection(selection());
    if (issue) return message(issue.message, 'error');
    if (!photo || !ready || busy) return;
    let job;
    try {
      busy = true;
      updateButton();
      resetOutfitCards();
      startLoadingLounge('review');
      message('Đang kiểm tra ảnh và yêu cầu trước khi gửi sang Flow…', 'loading');
      $('#results').hidden = true;
      job = await request('/api/jobs', { photo, selection: selection() });
      startLoadingLounge('flow');
      const deadline = Date.now() + 9 * 60000;
      let pollFailures = 0;
      while (Date.now() < deadline) {
        let state;
        try {
          state = await request('/api/jobs/' + job.id, null, job.token);
          pollFailures = 0;
        } catch (error) {
          if (error.status === 404 || ++pollFailures >= 3) throw error;
          message('Kết nối tạm gián đoạn. Đang kiểm tra lại kết quả của lượt hiện tại…', 'loading');
          await new Promise(resolve=>setTimeout(resolve,3000));
          continue;
        }
        if (state.status === 'succeeded') {
          stopLoadingLounge();
          showResults({ ...state, captionSession: { id: job.id, token: job.token } }, 'flow');
          message('Đã nhận hai ảnh từ Flow. Bạn có thể bấm "Đóng khung & ghép dải ảnh" để khoe ngay!', 'info');
          await request('/api/jobs/' + job.id, null, job.token, 'DELETE').catch(() => {});
          return;
        }
        if (state.status === 'failed') {
          stopLoadingLounge();
          throw new Error(state.message);
        }
        message(state.status === 'queued' ? 'Ảnh đang chờ đến lượt xử lý…' : 'Flow đang tạo hai bản phối. Phòng chờ Di sản đang kể chuyện cho bạn nghe…', 'loading');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      stopLoadingLounge();
      throw new Error('Đã hết thời gian chờ. Lượt tạo có thể đã gửi tới Flow; hệ thống không tự tạo lại.');
    } catch (error) {
      stopLoadingLounge();
      message(error.message, 'error');
    } finally {
      busy = false;
      updateButton();
    }
  });
}

window.refreshTryOnConnection = checkConnection;
checkConnection();
setInterval(checkConnection, 10000);
document.addEventListener('visibilitychange', () => {
  document.body.classList.toggle('is-document-hidden', document.hidden);
  if (!document.hidden) checkConnection();
});

// Expose global methods for integrations and testing
window.startLoadingLounge = startLoadingLounge;
window.stopLoadingLounge = stopLoadingLounge;
window.openPhotoboothStudio = openPhotoboothStudio;
window.renderPhotoboothCanvas = renderPhotoboothCanvas;

/* ============================================================
   PILLAR 4: MONOGRAM & DRAGGABLE SEAL STAMP CONTROLS
   ============================================================ */

const pbSealTextInput = $('#pb-seal-text');
if (pbSealTextInput) {
  pbSealTextInput.addEventListener('input', () => {
    const val = pbSealTextInput.value.trim().toUpperCase() || 'VIỆT';
    pbState.sealText = val;
    const innerTextEl = $('#seal-inner-text');
    if (innerTextEl) innerTextEl.textContent = val;
    renderPhotoboothCanvas();
  });
}

const draggableSeal = $('#draggable-seal-stamp');
const pbCanvasContainer = $('#pb-canvas-container');
if (draggableSeal && pbCanvasContainer) {
  let isDraggingSeal = false;
  let startX = 0, startY = 0;
  let elemStartX = 0, elemStartY = 0;
  let sealBounds, sealSize, sealPosition, sealDragFrame = null;
  const paintSealPosition = () => {
    sealDragFrame = null;
    if (!sealPosition) return;
    draggableSeal.style.left = `${sealPosition.x}px`;
    draggableSeal.style.top = `${sealPosition.y}px`;
  };

  draggableSeal.addEventListener('pointerdown', e => {
    e.preventDefault();
    sealBounds = pbCanvasContainer.getBoundingClientRect();
    sealSize = { width: draggableSeal.offsetWidth, height: draggableSeal.offsetHeight };
    elemStartX = draggableSeal.offsetLeft;
    elemStartY = draggableSeal.offsetTop;
    sealPosition = { x: elemStartX, y: elemStartY };
    isDraggingSeal = true;
    draggableSeal.classList.add('is-dragging');
    draggableSeal.setPointerCapture?.(e.pointerId);
    startX = e.clientX;
    startY = e.clientY;
  });

  draggableSeal.addEventListener('pointermove', e => {
    if (!isDraggingSeal) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    sealPosition = {
      x: Math.max(0, Math.min(sealBounds.width - sealSize.width, elemStartX + dx)),
      y: Math.max(0, Math.min(sealBounds.height - sealSize.height, elemStartY + dy)),
    };
    if (sealDragFrame === null) sealDragFrame = requestAnimationFrame(paintSealPosition);
  });

  const finishSealDrag = e => {
    if (!isDraggingSeal) return;
    if (sealDragFrame !== null) cancelAnimationFrame(sealDragFrame);
    paintSealPosition();
    isDraggingSeal = false;
    draggableSeal.classList.remove('is-dragging');
    try { draggableSeal.releasePointerCapture?.(e.pointerId); } catch {}

    const centerX = sealPosition.x + sealSize.width / 2;
    const centerY = sealPosition.y + sealSize.height / 2;
    pbState.sealPos = {
      x: Math.max(0.08, Math.min(0.92, centerX / sealBounds.width)),
      y: Math.max(0.08, Math.min(0.92, centerY / sealBounds.height))
    };
    renderPhotoboothCanvas();
  };

  draggableSeal.addEventListener('pointerup', finishSealDrag);
  draggableSeal.addEventListener('pointercancel', finishSealDrag);
  draggableSeal.setAttribute('aria-label','Di chuyển con dấu bằng cách kéo hoặc dùng phím mũi tên');
  draggableSeal.addEventListener('keydown',event=>{
    const delta={ArrowLeft:[-.02,0],ArrowRight:[.02,0],ArrowUp:[0,-.02],ArrowDown:[0,.02]}[event.key];
    if(!delta||!renderedSealGeometry)return;
    event.preventDefault();
    const canvas=$('#photobooth-canvas'),g=renderedSealGeometry;
    const current=pbState.sealPos||{x:g.x/canvas.width,y:g.y/canvas.height};
    pbState.sealPos={x:Math.max(.08,Math.min(.92,current.x+delta[0])),y:Math.max(.08,Math.min(.92,current.y+delta[1]))};
    $$('.btn-seal-pos').forEach(button=>button.classList.remove('active'));
    renderPhotoboothCanvas();
  });
}

$$('.btn-seal-pos').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.btn-seal-pos').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const pos = btn.dataset.pos;
    if (pos === 'tl') pbState.sealPos = { x: 0.15, y: 0.12 };
    else if (pos === 'tr') pbState.sealPos = { x: 0.85, y: 0.12 };
    else if (pos === 'bl') pbState.sealPos = { x: 0.15, y: 0.88 };
    else if (pos === 'br') pbState.sealPos = { x: 0.85, y: 0.88 };

    if (draggableSeal && pbCanvasContainer) {
      const containerRect = pbCanvasContainer.getBoundingClientRect();
      draggableSeal.style.left = `${pbState.sealPos.x * (containerRect.width - draggableSeal.offsetWidth)}px`;
      draggableSeal.style.top = `${pbState.sealPos.y * (containerRect.height - draggableSeal.offsetHeight)}px`;
    }
    renderPhotoboothCanvas();
  });
});

/* ============================================================
   PILLAR 4: CHẾ ĐỘ SPOTLIGHT CHO KẾT QUẢ AI
   ============================================================ */

const btnToggleSpotlight = $('#btn-toggle-spotlight');
if (btnToggleSpotlight) {
  btnToggleSpotlight.addEventListener('click', () => {
    const resultsEl = $('#results');
    if (!resultsEl) return;
    const isNowSpotlight = resultsEl.classList.toggle('has-spotlight');
    const textEl = btnToggleSpotlight.querySelector('.spot-text');
    if (textEl) {
      textEl.textContent = isNowSpotlight ? 'Tiêu Điểm Spotlight: BẬT' : 'Tiêu Điểm Spotlight: TẮT';
    }
  });
}

/* ============================================================
   PILLAR 1 & 2: STEPPER CONTROLLER & LIVE REACTIVE PREVIEW ENGINE
   ============================================================ */

let isUserNavigating = false;
let userNavTimeout;

function goToStep(stepNum) {
  const targetStep = Math.max(1, Math.min(4, Number(stepNum)));

  isUserNavigating = true;
  clearTimeout(userNavTimeout);
  userNavTimeout = setTimeout(() => { isUserNavigating = false; }, 800);

  // Update knot buttons
  $$('.stepper-knot-btn').forEach(btn => {
    const s = Number(btn.dataset.step);
    btn.classList.toggle('is-active', s === targetStep);
    btn.classList.toggle('is-complete', s < targetStep);
    btn.setAttribute('aria-selected', String(s === targetStep));
  });

  // Update silk progress bar
  const progressEl = $('#stepper-silk-progress');
  if (progressEl) {
    progressEl.style.width = `${(targetStep / 4) * 100}%`;
  }

  // Smooth scroll to panel or highlight
  const targetPanel = $(`#step-panel-${targetStep}`);
  if (targetPanel) {
    $$('.step-panel').forEach(p => p.classList.toggle('is-active', p === targetPanel));
    targetPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  updateLivePreview();
}
window.goToStep = goToStep;

// Knot button click listeners
$$('.stepper-knot-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const step = btn.dataset.step;
    if (step) goToStep(step);
  });
});

// Next and previous buttons in steps
$$('.btn-step-next').forEach(btn => {
  btn.addEventListener('click', () => {
    const next = btn.dataset.nextStep;
    if (next) goToStep(next);
  });
});

$$('.btn-step-prev').forEach(btn => {
  btn.addEventListener('click', () => {
    const prev = btn.dataset.prevStep;
    if (prev) goToStep(prev);
  });
});

// Scenic quick chip tags (Step 3)
$$('.scenic-chip-btn').forEach(chip => {
  chip.addEventListener('click', () => {
    const detailInput = $('#scene-detail');
    if (!detailInput) return;
    const tag = chip.dataset.tag;
    if (detailInput.value) {
      if (!detailInput.value.includes(tag)) {
        detailInput.value = `${detailInput.value.trim()}, ${tag}`;
      }
    } else {
      detailInput.value = tag;
    }
    detailInput.dispatchEvent(new Event('input', { bubbles: true }));
  });
});

// ScrollSpy to keep Stepper knots in sync as user scrolls
if (typeof IntersectionObserver !== 'undefined') {
  const panelObserver = new IntersectionObserver(entries => {
    if (isUserNavigating) return;
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
        const step = entry.target.dataset.step;
        if (step) {
          const s = Number(step);
          $$('.stepper-knot-btn').forEach(btn => {
            const bStep = Number(btn.dataset.step);
            btn.classList.toggle('is-active', bStep === s);
            btn.classList.toggle('is-complete', bStep < s);
            btn.setAttribute('aria-selected',String(bStep===s));
          });
          const progressEl = $('#stepper-silk-progress');
          if (progressEl) progressEl.style.width = `${(s / 4) * 100}%`;
        }
      }
    });
  }, { threshold: [0.25, 0.5] });

  $$('.step-panel').forEach(panel => panelObserver.observe(panel));
}

let livePreviewFrame = null;
let lastLivePreviewState = '';
function updateLivePreview() {
  if (livePreviewFrame !== null) return;
  livePreviewFrame = requestAnimationFrame(() => {
    livePreviewFrame = null;
    renderLivePreview();
  });
}
function renderLivePreview() {
  const form = $('#styling-form');
  if (!form) return;

  const destSelect = form.elements.namedItem('Địa điểm');
  const garmentSelect = form.elements.namedItem('Loại trang phục');
  const bgSelect = form.elements.namedItem('Bối cảnh');
  const lightSelect = form.elements.namedItem('Ánh sáng');
  const styleSelect = form.elements.namedItem('Phong cách');
  const accSelect = form.elements.namedItem('Phụ kiện yêu thích');
  const colorInput = $('#color-input');

  const destVal = destSelect?.value || 'general';
  const garmentVal = garmentSelect?.value || 'Áo dài';
  const bgVal = bgSelect?.value || 'Phố cổ';
  const lightVal = lightSelect?.value || 'Ánh sáng tự nhiên';
  const styleVal = styleSelect?.value || 'Năng động';
  const accVal = accSelect?.value || 'Túi mini';
  const colorVal = colorInput?.value || 'xanh mint';
  const state = JSON.stringify([destVal, garmentVal, bgVal, lightVal, styleVal, accVal, colorVal, photoUrl]);
  if (state === lastLivePreviewState) return;
  lastLivePreviewState = state;

  const placeData = (window.VietPhucDestination?.places && window.VietPhucDestination.places[destVal]) || { name: 'Phối đồ tự do', accent: '#264f40' };

  // Text specs
  const destSpec = $('#pv-dest-spec');
  const garmentSpec = $('#pv-garment-spec');
  const sceneSpec = $('#pv-scene-spec');
  const lightSpec = $('#pv-light-spec');
  const styleSpec = $('#pv-style-spec');
  const accSpec = $('#pv-acc-spec');
  const scenicTag = $('#pv-scenic-tag');

  if (destSpec) destSpec.textContent = placeData.name;
  if (garmentSpec) garmentSpec.textContent = garmentVal;
  if (sceneSpec) sceneSpec.textContent = bgVal;
  if (lightSpec) lightSpec.textContent = lightVal;
  if (styleSpec) styleSpec.textContent = styleVal;
  if (accSpec) accSpec.textContent = accVal;
  if (scenicTag) scenicTag.textContent = placeData.name;

  // Resolve color & robe path fill
  const resolvedHex = resolveColor(colorVal) || '#9DCCBA';
  window.VietPhucGarmentPreview?.render(garmentVal, resolvedHex);

  // Swatch
  const swatchMain = $('#pv-swatch-main');
  if (swatchMain) {
    swatchMain.style.setProperty('--c', resolvedHex);
    swatchMain.title = `Màu bạn chọn: ${colorVal}`;
  }

  // Backdrop gradient
  const stageLayer = $('#pv-backdrop-layer');
  if (stageLayer) {
    const gradients = {
      tthue: 'radial-gradient(ellipse at 50% 25%, #FFFCF6 0%, #EAE0ED 65%, #CCBDD3 100%)',
      laocai: 'radial-gradient(ellipse at 50% 25%, #FCFAEE 0%, #DBEAE3 65%, #AFCAC0 100%)',
      bacninh: 'radial-gradient(ellipse at 50% 25%, #FFFAEF 0%, #EFE2D5 65%, #D3B8A5 100%)',
      hanoi: 'radial-gradient(ellipse at 50% 25%, #FFFBEE 0%, #EAE4D5 65%, #C9BDA2 100%)',
      sonla: 'radial-gradient(ellipse at 50% 25%, #FAFBEF 0%, #DFE9D7 65%, #B6C8A7 100%)',
      hagiang: 'radial-gradient(ellipse at 50% 25%, #FCFAF2 0%, #E4E6DB 65%, #B9C2B0 100%)',
      quangnam: 'radial-gradient(ellipse at 50% 25%, #FFFAE8 0%, #F5E6BB 65%, #D9C18D 100%)',
      daklak: 'radial-gradient(ellipse at 50% 25%, #FFFAF0 0%, #EEDFCD 65%, #CDB493 100%)',
      gialai: 'radial-gradient(ellipse at 50% 25%, #FCFBEF 0%, #E2E8D6 65%, #B6C49F 100%)',
      hcm: 'radial-gradient(ellipse at 50% 25%, #FFFAF0 0%, #F2E0CF 65%, #DAB89D 100%)',
      cantho: 'radial-gradient(ellipse at 50% 25%, #FCFBEF 0%, #DCEDE4 65%, #AECFC0 100%)',
      general: 'radial-gradient(ellipse at 50% 25%, #FFFCF5 0%, #E5EBDF 65%, #BFCFC0 100%)'
    };
    stageLayer.style.background = gradients[destVal] || gradients.general;
  }

  // User Cameo image
  const cameoImg = $('#pv-cameo-img');
  const cameoPlaceholder = $('#pv-cameo-placeholder');
  if (photoUrl && cameoImg) {
    cameoImg.src = photoUrl;
    cameoImg.hidden = false;
    if (cameoPlaceholder) cameoPlaceholder.hidden = true;
  } else if (cameoImg) {
    cameoImg.hidden = true;
    if (cameoPlaceholder) cameoPlaceholder.hidden = false;
  }
}
window.updateLivePreview = updateLivePreview;

// Wire reactive listeners
const formEl = $('#styling-form');
if (formEl) {
  formEl.addEventListener('input', () => updateLivePreview());
  formEl.addEventListener('change', () => updateLivePreview());
}
$$('.color-chip').forEach(c => {
  c.addEventListener('click', () => {
    updateLivePreview();
  });
});

// Initial update on page load
setTimeout(updateLivePreview, 100);

/* ============================================================
   HIỆU ỨNG "ĐÓNG TRIỆN" (STAMP CLICK RIPPLE) TOÀN ỨNG DỤNG
   ============================================================ */
function initStampClickEffect() {
  let pressedButton, pressedRect;
  document.addEventListener('pointerdown', e => {
    pressedButton = e.target.closest('button, .btn-action, .btn-primary, .btn-secondary, .primary, .secondary, .btn-silk, .btn-phap-lam, .btn-step-next, .btn-step-prev, .btn-pb-primary, .callout-try-btn, .wardrobe-try-btn, .dest-card');
    pressedRect = pressedButton?.getBoundingClientRect();
  }, { capture: true, passive: true });
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button, .btn-action, .btn-primary, .btn-secondary, .primary, .secondary, .btn-silk, .btn-phap-lam, .btn-step-next, .btn-step-prev, .btn-pb-primary, .callout-try-btn, .wardrobe-try-btn, .dest-card');
    if (!btn || btn.disabled) return;

    // Measure before adding a class; otherwise this read forces a fresh layout.
    const rect = pressedButton === btn && pressedRect ? pressedRect : btn.getBoundingClientRect();
    pressedButton = pressedRect = null;
    if (!btn.classList.contains('btn-stamp-ripple-host')) {
      btn.classList.add('btn-stamp-ripple-host');
    }

    const x = e.clientX ? (e.clientX - rect.left) : (rect.width / 2);
    const y = e.clientY ? (e.clientY - rect.top) : (rect.height / 2);
    const diameter = Math.max(rect.width, rect.height) * 1.8;

    const ink = document.createElement('span');
    ink.className = 'stamp-ripple-ink';
    ink.style.width = `${diameter}px`;
    ink.style.height = `${diameter}px`;
    ink.style.left = `${x}px`;
    ink.style.top = `${y}px`;

    btn.appendChild(ink);
    ink.addEventListener('animationend', () => ink.remove());
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStampClickEffect);
  } else {
    initStampClickEffect();
  }
}



