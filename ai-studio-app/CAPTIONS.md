# Caption từ ảnh photobooth

Sau khi dựng photobooth thành công, khung **Xin chữ** tự gợi ý một câu tiếng Việt dựa trên ảnh đang xem. Nút xuất ảnh không phải chờ caption.

- Gửi bản JPEG thu nhỏ tối đa 1280px cạnh dài, chất lượng 0.85; ảnh xuất PNG giữ nguyên chất lượng.
- Google Gemini đọc ảnh qua `generateContent` và `inlineData`: https://ai.google.dev/gemini-api/docs/generate-content/image-understanding
- Dùng model `CAPTION_MODEL`, mặc định `gemini-3.5-flash-lite` cùng hệ model đã cấu hình kiểm duyệt. Không dùng model 1.5 trong ví dụ cũ. Khóa lấy từ `GEMINI_API_KEY` hoặc `GOOGLE_API_KEY`, chỉ có ở backend.
- Câu ngắn tối đa 19 từ (không tính emoji), không hashtag; dựa vào đặc điểm nhìn thấy, tránh suy đoán danh tính hoặc khẳng định lịch sử. Thời gian chờ Google tối đa 15 giây, không cam kết 2–4 giây.
- Nếu Google lỗi hoặc trả nội dung không hợp lệ, hiển thị câu dự phòng và ghi rõ chưa đọc được ảnh bằng AI.
- Hiệu ứng bút viết và gõ chữ tôn trọng thiết lập giảm chuyển động.
- Nút **Sao chép caption & chữ ký** chép câu đầy đủ, dòng nguồn và hashtag Việt Phục Remix; chữ ký được hiển thị trước cho người dùng biết. Không tự đăng lên mạng xã hội.
- Mỗi bố cục/lựa chọn ảnh được ghi nhớ trong phiên UI. Đổi màu khung, kéo dấu triện không gọi AI lại.
- Endpoint yêu cầu token của lượt Flow đã thành công. Sau khi frontend xóa ảnh khỏi job, server chỉ giữ quyền xin chữ và ngữ cảnh đến hết 20 phút tính từ lúc tạo job, không giữ lại ảnh gốc/ảnh Flow trong phiên caption. JPEG gửi lên được dùng cho lần gọi Google, không lưu vào phiên.
- Tối đa 6 ảnh caption khác nhau mỗi lượt, 2 yêu cầu Gemini đồng thời. Request trùng ảnh chia sẻ kết quả đang xử lý.

Kiểm tra: `npm.cmd test`, `node scratch/check-caption-ui.cjs` (chạy từ thư mục gốc dự án). Đã thử gọi Google thực tế bằng ảnh Flow có sẵn, không phát sinh lượt tạo ảnh Flow mới.
