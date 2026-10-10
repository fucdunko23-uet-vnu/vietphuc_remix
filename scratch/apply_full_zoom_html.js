const fs = require('fs');

const targetFile = 'c:/Users/lequa/Desktop/Gehihi/viet-phuc-remix/Xem-truoc-ghep-trang-phuc.html';
let content = fs.readFileSync(targetFile, 'utf8');

// 1. ADD SVG DEFS & LAYERS IN renderSvgMap()
// Look for </svg> in renderSvgMap
const defsMarker = `
        <defs>
          <filter id="p-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="b"/>
            <feComposite in="SourceGraphic" in2="b" operator="over"/>
          </filter>
          <marker id="callout-arrowhead" markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto">
            <polygon points="0 0, 8 3.5, 0 7, 2 3.5" fill="#C69214" stroke="#FFFBF2" stroke-width="0.8"/>
          </marker>
        </defs>
`;

content = content.replace(/<defs>[\s\S]*?<\/defs>/, defsMarker);

// Add arrows layer and beacons layer before </svg>
const svgLayers = `
        <!-- DYNAMIC HORIZONTAL LEADER ARROWS LAYER -->
        <g id="hud-arrows-layer"></g>

        <!-- DYNAMIC CULTURE PROVINCES BEACONS LAYER (NÚT SÁNG LÊN KHI ZOOM VÀO VÙNG) -->
        <g id="culture-beacons-layer"></g>
      </svg>
`;
content = content.replace('      </svg>', svgLayers);

// 2. ADD HUD ZOOM CONTROLS & INFOGRAPHIC CALLOUT DECK IN HTML
const newStageHtml = `
    <!-- Floating Zoom HUD Controls (Xuất hiện khi Zoom vào từng Vùng) -->
    <div class="hud-zoom-controls" id="hud-zoom-controls" style="display:none;">
      <button type="button" class="btn-back-overview" id="btn-back-overview">
        <span>←</span>
        <span>Toàn cảnh Việt Nam</span>
      </button>
      <div class="zoom-region-pill">
        <span class="zoom-pulse-beacon">✦</span>
        <strong id="zoom-region-name">Vùng Bắc Bộ</strong>
        <span id="zoom-region-sub">Đồng bằng sông Hồng</span>
      </div>
      <div class="zoom-province-chips" id="zoom-province-chips"></div>
    </div>

    <!-- Infographic Callout Deck (Các Hộp Thông Tin Có Mũi Tên Ngang Chỉ Vào) -->
    <aside class="infographic-callout-deck" id="infographic-callout-deck" style="display:none;" aria-label="Chi tiết di sản tỉnh thành">
      <div class="callout-deck-header">
        <div class="callout-header-titles">
          <span class="callout-badge" id="callout-badge">TỈNH CÓ DI SẢN ĐẶC SẮC</span>
          <h3 class="callout-prov-title" id="callout-prov-title">Bắc Ninh · Đất Quan Họ</h3>
          <p class="callout-prov-sub" id="callout-prov-sub">Vùng đất Quan họ Kinh Bắc</p>
        </div>
        <button type="button" class="callout-close-btn" id="callout-close-btn" title="Thu gọn thông tin">✕</button>
      </div>

      <div class="callout-boxes-container">
        <!-- HỘP 1: TỦ ĐỒ ĐẶC TRƯNG -->
        <article class="callout-box box-wardrobe">
          <div class="box-head">
            <span class="box-arrow-indicator">⟶</span>
            <span class="box-icon">👘</span>
            <h4 class="box-title" id="box-wardrobe-name">Áo Tứ Thân & Mớ Ba Mớ Bảy</h4>
            <span class="box-era-pill" id="box-wardrobe-era">Dân gian Kinh Bắc</span>
          </div>
          <div class="box-body">
            <p><strong class="box-pieces-label">Thành phần:</strong> <span id="box-wardrobe-pieces">Áo gồm 4 thân, yếm đào, nón quai thao, dải lụa, guốc mộc.</span></p>
          </div>
          <div class="box-footer">
            <button type="button" class="callout-try-btn" id="callout-try-btn">
              <span>✦</span> Phối đồ ngay ↗
            </button>
          </div>
        </article>

        <!-- HỘP 2: CÂU CHUYỆN VĂN HÓA -->
        <article class="callout-box box-story" style="background:#FFFDF8;border-color:rgba(198,146,20,0.35);">
          <div class="box-head">
            <span class="box-arrow-indicator">⟶</span>
            <span class="box-icon">📜</span>
            <h4 class="box-title">Câu chuyện văn hóa</h4>
          </div>
          <div class="box-body">
            <p id="box-story-text">Bốn thân áo tượng trưng cho tứ thân phụ mẫu...</p>
          </div>
        </article>

        <!-- HỘP 3: DỊP MẶC & TIỆM THUÊ GỢI Ý -->
        <article class="callout-box box-where" style="background:#F7FBF8;border-color:rgba(45,106,79,0.25);">
          <div class="box-head">
            <span class="box-arrow-indicator">⟶</span>
            <span class="box-icon">📍</span>
            <h4 class="box-title">Dịp sử dụng & Tiệm thuê tại địa phương</h4>
          </div>
          <div class="box-body">
            <p><strong style="color:var(--jade-800)">Dịp mặc:</strong> <span id="box-occasions">Lễ hội Lim, chụp ảnh Tết...</span></p>
            <div class="box-studios-list" id="box-studios-list"></div>
          </div>
        </article>
      </div>
    </aside>
`;

// Insert newStageHtml before </section> of map-fullscreen-stage
content = content.replace('    <!-- Sliding Heritage Drawer (Overlay, Closed by Default) -->', newStageHtml + '\n    <!-- Sliding Heritage Drawer (Overlay, Closed by Default) -->');

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully injected HTML structure!');

