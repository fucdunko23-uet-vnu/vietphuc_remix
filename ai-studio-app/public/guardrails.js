(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VietPhucGuardrails = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const messages = {
    CONTENT_UNSAFE: 'Google chưa chấp nhận ảnh hoặc yêu cầu này. Hãy chọn ảnh mặc trang phục thông thường và mô tả cách phối khác nhé.',
    TEXT_UNSAFE: 'Yêu cầu này có chi tiết nhạy cảm hoặc gây hại. Hãy thử mô tả màu sắc, chất liệu, phụ kiện và phong cảnh phù hợp hơn nhé.',
    CULTURE_UNSAFE: 'Cách phối này làm thay đổi đặc trưng của trang phục đã chọn. Bạn có thể đổi màu, phụ kiện hoặc phong cảnh và giữ cấu trúc trang phục nhé.',
    IMAGE_UNSAFE: 'Bức ảnh này chưa phù hợp để thử trang phục. Hãy chọn ảnh chân dung hoặc toàn thân mặc trang phục thông thường, không có nội dung nhạy cảm hay bạo lực nhé.',
    SUBJECT_INVALID: 'Hãy chọn ảnh rõ nét của một người, có khuôn mặt nhìn thấy được, để ứng dụng xác định đúng người thử đồ.',
    MODERATION_UNAVAILABLE: 'Chưa kiểm tra được độ phù hợp của ảnh và yêu cầu. Ảnh chưa được gửi sang Flow; bạn vui lòng thử lại sau.',
  };
  const limits = { 'Mong muốn thêm': 600, 'Chi tiết phong cảnh': 300, 'Màu yêu thích': 180 };
  const normalize = value => value.normalize('NFKC').replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, '')
    .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  const unsafe = /\b(?:khoa than|loa the|coi het do|lot het do|ho nguc|lo nguc|lo bo phan sinh duc|khieu dam|tinh duc|porn(?:ography)?|nude|naked|see[- ]through|bloodbath|gore|chat dau|chem giet|tra tan)\b/g;
  const revealing = /\b(?:ao dai|ao tac|ao ngu than|ao tu than|trang phuc|vai|bodice|dress|clothes)\b.{0,28}\b(?:trong suot|xuyen thau|ho het|transparent)\b/g;
  function positiveMatch(text, pattern) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      if (pattern === revealing && /\b(?:khong|tranh|dung|without|avoid|not)\b/.test(match[0])) continue;
      const prefix = text.slice(0, match.index).split(/[,.!?;\n]/).pop().slice(-60);
      // Basic negation support; semantic review on the server remains mandatory.
      if (!/\b(?:khong|tranh|dung|without|avoid|no|not)\s+(?:(?:muon|can|de|co|dung|mac|tao|bi|cho|any|a)\s+){0,3}$/.test(prefix)) return true;
    }
    return false;
  }
  function checkSelection(selection) {
    if (!selection || typeof selection !== 'object' || Array.isArray(selection)) return { code: 'INPUT_INVALID', message: 'Lựa chọn gửi lên chưa hợp lệ.' };
    for (const [field, limit] of Object.entries(limits)) {
      const value = selection[field] ?? '';
      if (typeof value !== 'string' || value.length > limit) return { code: 'INPUT_INVALID', message: `${field}: hãy nhập văn bản tối đa ${limit} ký tự.` };
      const text = normalize(value);
      if (positiveMatch(text, unsafe) || positiveMatch(text, revealing)) return { code: 'TEXT_UNSAFE', message: messages.TEXT_UNSAFE, field };
      if (/\b(?:ignore|override|bypass)\b.{0,35}\b(?:instructions?|rules?|safety|filters?)\b|\bbo qua\b.{0,30}\b(?:chi dan|quy tac|kiem duyet|he thong)\b/.test(text)) return { code: 'TEXT_UNSAFE', message: messages.TEXT_UNSAFE, field };
    }
    return null;
  }
  return { checkSelection, messages };
});
