const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const read = name => fs.readFileSync(path.join(__dirname, 'src', name), 'utf8');
const node = (name, type, typeVersion, position, parameters, extra = {}) => ({ id: randomUUID(), name, type, typeVersion, position, parameters, ...extra });
const dropdown = (fieldLabel, choices) => ({ fieldLabel, fieldType: 'dropdown', fieldOptions: { values: choices.map(option => ({ option })) }, requiredField: true });
const trigger = node('Biểu mẫu Việt phục Remix', 'n8n-nodes-base.formTrigger', 2.2, [0, 80], {
  formTitle: 'Việt phục Remix Studio',
  formDescription: 'Chọn áo, phối màu, chọn cảnh. Xem hai hình minh họa Việt phục trên nhân vật đại diện cùng gợi ý phối đồ dành cho bạn.',
  formFields: { values: [
    dropdown('Nhân vật', ['Tóc ngắn', 'Tóc dài']),
    dropdown('Loại trang phục', ['Áo dài', 'Áo ngũ thân', 'Áo tứ thân']),
    dropdown('Sự kiện', ['Chụp ảnh', 'Sự kiện trường', 'Lễ hội', 'Đi chơi']),
    dropdown('Bối cảnh', ['Sân trường', 'Phố cổ', 'Sân vườn']),
    { fieldLabel: 'Màu yêu thích', fieldType: 'text', placeholder: 'Ví dụ: xanh mint, tím, hồng hoặc #9DCCBA', requiredField: true },
    dropdown('Phong cách', ['Thanh lịch', 'Tối giản', 'Năng động']),
    dropdown('Phụ kiện yêu thích', ['Túi mini', 'Túi tote', 'Khăn lụa', 'Quạt giấy', 'Kẹp tóc', 'Không dùng phụ kiện']),
    { fieldLabel: 'Mong muốn thêm', fieldType: 'textarea', placeholder: 'Ví dụ: không cao gót, thoáng mát, tận dụng đồ sẵn có', requiredField: false },
  ] },
  responseMode: 'lastNode',
  options: { path: 'viet-phuc-remix-studio', buttonLabel: 'Ghép trang phục và bối cảnh', appendAttribution: false, customCss: ':root { --color-primary: #294e3e; --color-button: #294e3e; --color-background: #f5f3ee; --color-card-bg: #ffffff; --border-radius-card: 16px; --font-family: "Segoe UI", sans-serif; }' },
}, { webhookId: randomUUID() });
const nodes = [
  trigger,
  node('Chuẩn bị dữ liệu', 'n8n-nodes-base.code', 2, [240, 80], { jsCode: read('prepare.js') }, { notesInFlow: true, notes: 'Mặc định USE_AI = false. Đổi thành true để gọi AI sau khi chọn credential Google Gemini.' }),
  node('Dùng AI?', 'n8n-nodes-base.if', 2.2, [480, 80], { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, conditions: [{ id: randomUUID(), leftValue: '={{ $json.useAI }}', rightValue: '', operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' }, options: {} }),
  node('AI tạo gợi ý', 'n8n-nodes-base.httpRequest', 4.2, [740, -40], { method: 'POST', url: '={{ $json.aiUrl }}', authentication: 'predefinedCredentialType', nodeCredentialType: 'googlePalmApi', sendBody: true, specifyBody: 'json', jsonBody: '={{ $json.aiBody }}', options: { timeout: 45000, response: { response: { responseFormat: 'json' } } } }, { onError: 'continueRegularOutput', notes: 'Chọn credential Google Gemini(PaLM) Api tại node này. Nếu gọi AI lỗi, kết quả sẽ ghi rõ chuyển sang dữ liệu mẫu.' }),
  node('Gợi ý mẫu · không gọi AI', 'n8n-nodes-base.code', 2, [740, 220], { jsCode: 'return [{ json: $input.first().json.sampleResult }];' }),
  node('Tạo thẻ kết quả', 'n8n-nodes-base.code', 2, [1020, 80], { jsCode: read('illustrations.js') + '\n' + read('render.js') }, { notesInFlow: true, notes: 'Ghép SVG: phông nền → nhân vật → Việt phục → giày → phụ kiện. Hai hình dùng cùng các lựa chọn với hai cách phối màu.' }),
  node('Hiển thị kết quả', 'n8n-nodes-base.form', 2.3, [1260, 80], { operation: 'completion', respondWith: 'showText', responseText: '={{ $json.html }}', options: {} }, { webhookId: randomUUID() }),
  node('Hướng dẫn demo', 'n8n-nodes-base.stickyNote', 1, [0, -300], { width: 680, height: 240, color: 5, content: '## Studio: ghép trang phục + bối cảnh\n1. Import JSON và lưu workflow. Giữ USE_AI = false.\n2. Execute workflow → mở Test URL của Form Trigger.\n3. Chọn nhân vật, áo, màu, phụ kiện, phông → Ghép trang phục và bối cảnh.\n4. Xem hai hình ghép và thẻ thông tin văn hóa.\n\nPublish để dùng nhiều lần: /form/viet-phuc-remix-studio. Hình SVG đã nằm trong JSON, không cần tải thư viện ảnh.' }),
  node('Hướng dẫn bật AI', 'n8n-nodes-base.stickyNote', 1, [740, -340], { width: 680, height: 240, color: 4, content: '## Google Gemini (tùy chọn)\n1. AI tạo gợi ý → tạo credential Google Gemini(PaLM) Api, nhập API key Google.\n2. Chuẩn bị dữ liệu → USE_AI = true. Model: gemini-3.5-flash-lite.\n3. Lưu và Publish lại.\n\nGemini chỉ viết lời giải thích cho hai bản phối cố định. Hình và thông tin văn hóa dùng thư viện đã chuẩn bị. Nếu lỗi, vẫn hiển thị hình và lời mẫu.' }),
];
const edge = name => ({ node: name, type: 'main', index: 0 });
const connections = {
  'Biểu mẫu Việt phục Remix': { main: [[edge('Chuẩn bị dữ liệu')]] },
  'Chuẩn bị dữ liệu': { main: [[edge('Dùng AI?')]] },
  'Dùng AI?': { main: [[edge('AI tạo gợi ý')], [edge('Gợi ý mẫu · không gọi AI')]] },
  'AI tạo gợi ý': { main: [[edge('Tạo thẻ kết quả')]] },
  'Gợi ý mẫu · không gọi AI': { main: [[edge('Tạo thẻ kết quả')]] },
  'Tạo thẻ kết quả': { main: [[edge('Hiển thị kết quả')]] },
};
const workflow = { name: 'Việt phục Remix Studio · Ghép trang phục và bối cảnh', nodes, connections, active: false, settings: { executionOrder: 'v1', timezone: 'Asia/Ho_Chi_Minh' }, pinData: {}, tags: [] };
fs.writeFileSync(path.join(__dirname, 'Viet-phuc-Remix.n8n.json'), JSON.stringify(workflow, null, 2) + '\n');
fs.writeFileSync(path.join(__dirname, 'demo-input.json'), JSON.stringify({ 'Nhân vật': 'Tóc dài', 'Loại trang phục': 'Áo dài', 'Sự kiện': 'Chụp ảnh', 'Bối cảnh': 'Phố cổ', 'Màu yêu thích': 'xanh mint', 'Phong cách': 'Năng động', 'Phụ kiện yêu thích': 'Túi mini', 'Mong muốn thêm': 'Không cao gót, thoáng mát' }, null, 2) + '\n');
console.log('Created Viet-phuc-Remix.n8n.json and demo-input.json');
