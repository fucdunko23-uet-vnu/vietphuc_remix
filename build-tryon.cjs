const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const root = __dirname;
const old = JSON.parse(fs.readFileSync(path.join(root, 'Viet-phuc-Remix.n8n.json'), 'utf8'));
const read = file => fs.readFileSync(path.join(root, 'src', file), 'utf8');
const node = (name, type, typeVersion, position, parameters, extra = {}) => ({ id: randomUUID(), name, type, typeVersion, position, parameters, ...extra });
const trigger = structuredClone(old.nodes[0]);
trigger.id = randomUUID(); trigger.webhookId = randomUUID(); trigger.name = 'Tải ảnh và chọn Việt phục';
trigger.parameters.formTitle = 'Việt phục Remix · Thử đồ trên ảnh của bạn';
trigger.parameters.formDescription = 'Tải 1 ảnh rõ một người (JPG, PNG, WebP, tối đa 5 MB). Chọn trang phục và phông nền để nhận hai ảnh thử đồ. Ảnh và lựa chọn được gửi tới Google AI; hãy dùng ảnh của bạn hoặc ảnh được phép sử dụng. Ảnh chỉ có mặt sẽ được AI dựng thêm cơ thể. Quá trình có thể mất 1–3 phút, hãy giữ tab mở.';
trigger.parameters.formFields.values = [
  { fieldLabel: 'Ảnh của bạn', fieldType: 'file', multipleFiles: false, acceptFileTypes: '.jpg,.jpeg,.png,.webp', requiredField: true },
  { fieldLabel: 'Kiểu ảnh', fieldType: 'dropdown', fieldOptions: { values: ['Ảnh toàn thân', 'Ảnh khuôn mặt'].map(option => ({ option })) }, requiredField: true },
  ...trigger.parameters.formFields.values.filter(f => f.fieldLabel !== 'Nhân vật'),
];
trigger.parameters.options.path = 'viet-phuc-thu-do';
trigger.parameters.options.buttonLabel = 'Thử Việt phục trên ảnh của tôi';
const branch = structuredClone(old.nodes.find(n => n.type === 'n8n-nodes-base.if'));
branch.id = randomUUID(); branch.name = 'Ảnh hợp lệ?'; branch.position = [500, 80];
branch.parameters.conditions.conditions[0].leftValue = '={{ $json.valid }}';
const nodes = [trigger,
  node('Chuẩn bị ảnh và trang phục', 'n8n-nodes-base.code', 2, [240, 80], { jsCode: 'function prepareSelections() {\n' + read('prepare.js') + '\n}\n' + read('tryon-prepare.js') }),
  branch,
  node('Google tạo ảnh thử đồ', 'n8n-nodes-base.httpRequest', 4.2, [760, -40], {
    method: 'POST', url: '={{ $json.aiUrl }}', authentication: 'predefinedCredentialType', nodeCredentialType: 'googlePalmApi',
    sendBody: true, specifyBody: 'json', jsonBody: '={{ $json.aiBody }}',
    options: { timeout: 180000, batching: { batch: { batchSize: 1, batchInterval: 1000 } }, response: { response: { responseFormat: 'json', neverError: true } } },
  }, { onError: 'continueRegularOutput', notes: 'Chọn credential Google Gemini. Mỗi lần gửi tạo hai ảnh bằng hai lời gọi Google. Không dùng model chỉ sinh văn bản.' }),
  node('Tạo trang ảnh thử đồ', 'n8n-nodes-base.code', 2, [1020, 80], { jsCode: read('tryon-render.js') }),
  node('Hiển thị ảnh thử đồ', 'n8n-nodes-base.form', 2.3, [1270, 80], { operation: 'completion', respondWith: 'showText', responseText: '={{ $json.html }}', options: {} }, { webhookId: randomUUID() }),
  node('Hướng dẫn', 'n8n-nodes-base.stickyNote', 1, [0, -270], { width: 680, height: 260, content: '## Thử đồ bằng ảnh thật\n1. Google tạo ảnh thử đồ → chọn credential Google Gemini(PaLM) Api.\n2. Execute workflow → Test URL, tải ảnh và gửi.\n3. Publish → /form/viet-phuc-thu-do.\n\nModel: gemini-nano-banana-2.1. Ảnh khuôn mặt sẽ được AI dựng thêm cơ thể. Bản phối là mô phỏng, không đo size. Google có thể yêu cầu hạn mức/billing riêng cho tạo ảnh.\n\nKhông lưu dữ liệu executions thành công/lỗi hoặc lần chạy thủ công để hạn chế lưu ảnh cá nhân. Tệp ảnh có thể tồn tại tạm trong kho binary của n8n.' }),
];
const edge = name => ({ node: name, type: 'main', index: 0 });
const connections = {
  'Tải ảnh và chọn Việt phục': { main: [[edge('Chuẩn bị ảnh và trang phục')]] },
  'Chuẩn bị ảnh và trang phục': { main: [[edge('Ảnh hợp lệ?')]] },
  'Ảnh hợp lệ?': { main: [[edge('Google tạo ảnh thử đồ')], [edge('Tạo trang ảnh thử đồ')]] },
  'Google tạo ảnh thử đồ': { main: [[edge('Tạo trang ảnh thử đồ')]] },
  'Tạo trang ảnh thử đồ': { main: [[edge('Hiển thị ảnh thử đồ')]] },
};
const workflow = { name: 'Việt phục Remix · Thử đồ trên ảnh thật', nodes, connections, active: false, settings: { executionOrder: 'v1', timezone: 'Asia/Ho_Chi_Minh', executionTimeout: 420, saveDataErrorExecution: 'none', saveDataSuccessExecution: 'none', saveManualExecutions: false, saveExecutionProgress: false }, pinData: {}, tags: [] };
fs.writeFileSync(path.join(root, 'Viet-phuc-Thu-do.n8n.json'), JSON.stringify(workflow, null, 2));
const installed = structuredClone(workflow); installed.id = 'vietPhucPhotoTryOn';
installed.nodes.find(n => n.name === 'Google tạo ảnh thử đồ').credentials = { googlePalmApi: { id: 'vietPhucGoogleGemini', name: 'Google Gemini - Viet phuc Remix' } };
fs.writeFileSync('D:/n8n/temp/viet-phuc-tryon-import.json', JSON.stringify(installed));
console.log('Created portable photo try-on workflow and local import file.');
