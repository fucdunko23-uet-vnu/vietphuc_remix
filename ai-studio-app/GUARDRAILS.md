# Kiểm tra đầu vào thử đồ

Ứng dụng sử dụng Google Gemini để kiểm tra đồng thời ảnh và yêu cầu trước khi đưa công việc vào hàng đợi Google Flow. Không sử dụng OpenAI, NSFW.js hay Cloud Vision trong phiên bản này.

## Luồng xử lý

1. Trình duyệt kiểm tra nhanh các ô màu, yêu cầu thêm và chi tiết phong cảnh; thông báo nhẹ nhàng và khóa nút khi phát hiện một số yêu cầu không phù hợp. Có xử lý dấu tiếng Việt, ký tự ẩn và phủ định thông dụng. Đây là hỗ trợ trải nghiệm, không phải chốt bảo vệ chính.
2. Máy chủ kiểm tra lại văn bản gốc trước khi cắt độ dài, xác thực lựa chọn theo địa điểm, kích thước và chữ ký JPG/PNG/WebP. Gửi API trực tiếp không bỏ qua được bước này.
3. Gemini kiểm tra ảnh, số người/khuôn mặt, ý đồ yêu cầu và yêu cầu cố tình phá cấu trúc trang phục. Chỉ kết quả JSON đủ trường và đạt tất cả tiêu chí mới được chấp nhận.
4. Mỗi lần thử đồ chỉ gọi kiểm tra một lần, thời gian tối đa 12 giây bao gồm đọc phản hồi; không tự gọi lại. Google lỗi, hết hạn mức, trả dữ liệu không hợp lệ hoặc chưa có khóa thì không gửi ảnh sang Flow. Tổng số lượt đang kiểm tra/chờ/chạy tối đa ba.
5. Prompt gửi Flow nhấn mạnh bảo toàn người chụp, cấu trúc trang phục, lớp vải che phủ và ngăn nội dung gây hại. Khi bị từ chối, ảnh và lựa chọn trên biểu mẫu được giữ để người dùng chỉnh sửa.

Ảnh được gửi đến Google Gemini trước Google Flow; thông báo quyền riêng tư và hướng dẫn đã nêu rõ điều này. Ứng dụng không ghi ảnh, prompt hay khóa vào log của bộ kiểm tra. Ảnh bị từ chối không được thêm vào hàng đợi hoặc ghi ra tệp. Điều này không thay thế chính sách lưu trữ dữ liệu của Google.

## Cấu hình

- Máy local: `run-local-app.cjs` lấy khóa đã mã hóa trong credential n8n `vietPhucGoogleGemini`, qua `local-google-key.cjs`. Có thể dùng biến môi trường máy chủ `GEMINI_API_KEY` hoặc `GOOGLE_API_KEY` để thay thế.
- AI Studio / môi trường triển khai: cấu hình **secret phía máy chủ** `GEMINI_API_KEY`, cùng `FLOW_WORKER_TOKEN` hiện có, rồi khởi động lại ứng dụng. Không đưa khóa vào HTML, JS công khai hoặc ZIP. Bộ đọc credential riêng trên máy Windows không nằm trong gói triển khai.
- Model mặc định `gemini-3.5-flash-lite`; có thể thay bằng biến máy chủ `MODERATION_MODEL`. Đã xác minh model mặc định bằng một ảnh người mẫu hư cấu mặc áo phông/quần dài. Model cần hỗ trợ ảnh và JSON có schema. Không tự hạ model hoặc bỏ kiểm tra khi API lỗi.
- Bốn hạng mục Gemini API dùng `BLOCK_LOW_AND_ABOVE`. Đây là cài đặt cho các lời gọi **Gemini API**; không phải cài đặt cho trang Google Flow chạy qua trình duyệt. Flow vẫn áp dụng bộ lọc riêng của Google. `aiBody` chuẩn bị sẵn cho Gemini cũng mang safety settings, nhưng backend hiện tạo ảnh bằng Flow.

## Giới hạn cần hiểu

- Regex chỉ bắt một số mẫu rõ ràng; Gemini là bước kiểm tra ý nghĩa bổ sung. Các bộ phân loại vẫn có thể chặn nhầm hoặc bỏ sót. Không khẳng định bảo vệ tuyệt đối.
- Không suy đoán dân tộc, giới tính hoặc tôn giáo qua ảnh. Hình xăm, khác biệt cơ thể, phụ kiện hiện đại và giao thoa phong cách không tự động bị coi là vi phạm. Thông tin văn hóa và độ chính xác của trang phục vẫn cần biên tập có nguồn.
- Xem trước SVG không gửi ảnh hoặc gọi Google; vẫn kiểm tra văn bản ở máy chủ. Chưa có bước phân loại độc lập ảnh đầu ra Flow. Việc kiểm tra đầu vào và prompt không chứng minh độ chính xác lịch sử của kết quả.
- Khóa đã có không đồng nghĩa API không mất phí. Việc kiểm tra dùng hạn mức Gemini riêng, không dùng tín dụng Flow. Kiểm thử giả lập không gọi Google hoặc tạo ảnh Flow.

## Kiểm thử

Chạy `npm test` trong thư mục ứng dụng. Bao gồm phủ định hợp lệ, từ khóa né dấu/ký tự ẩn, gọi thẳng API, phân loại từ chối, lỗi mạng, phản hồi lỗi schema, timeout và hàng đợi khi nhiều lượt kiểm tra đồng thời.

Tại thư mục dự án: `node test-guardrails-ui.cjs` kiểm tra giao diện máy tính/điện thoại với Google/Flow giả lập; `node test-local-audit.cjs` kiểm tra luồng tạo ảnh giả lập và điều hướng. `node check-google-guardrails.cjs` gọi Google thật trên ảnh hư cấu, không gọi Flow.

Tài liệu Google: [Gemini safety settings](https://ai.google.dev/gemini-api/docs/safety-settings), [Structured outputs](https://ai.google.dev/gemini-api/docs/structured-output).
