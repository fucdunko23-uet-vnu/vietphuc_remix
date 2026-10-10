# Việt phục Remix — thử trang phục trên ảnh của bạn

## Mở bản đã cài

Mở **http://localhost:5678/form/viet-phuc-thu-do**. Workflow đã được import, publish và gắn credential Google hiện có. Không cần import lại trên máy này.

1. Tải một ảnh rõ một người: JPG, PNG hoặc WebP, tối đa 5 MB.
2. Chọn **Ảnh khuôn mặt** hoặc **Ảnh toàn thân**.
3. Chọn áo dài / áo ngũ thân / áo tứ thân, sự kiện, màu sắc, phong cách, phụ kiện và bối cảnh.
4. Bấm **Thử Việt phục trên ảnh của tôi** và giữ tab mở. Hai lời gọi tạo ảnh có thể mất 1–3 phút.
5. Xem ảnh gốc và hai phương án phối đồ; bấm **Tải ảnh này** để lưu ảnh thích nhất.

Ảnh toàn thân giúp AI bám theo tư thế và vóc dáng nhìn thấy. Nếu chỉ tải ảnh mặt, AI phải dựng thêm cơ thể và tư thế. Ảnh AI có thể khác khuôn mặt, tay chân hoặc chi tiết trang phục thật; đây là mô phỏng phối đồ, không đo size hay bảo đảm độ vừa vặn.

## Trạng thái hiện tại — 07/10/2026

**Google chưa cấp hạn mức tạo ảnh cho project của key hiện tại.** Lời gọi thật trả HTTP 429 `RESOURCE_EXHAUSTED`, hạn mức `generate_content_free_tier_requests` bằng 0 cho `gemini-nano-banana-2.1`. Key vẫn dùng được cho phần giải thích văn bản của Studio cũ.

Để tạo ảnh thật, vào [Google AI Studio](https://aistudio.google.com/api-keys), tìm project chứa key đang dùng, kiểm tra **Usage & Billing** và [hạn mức](https://ai.dev/rate-limit). Model tạo ảnh cần project có hạn mức phù hợp; có thể phải bật Billing. Việc bật Billing có thể phát sinh phí — chưa có thay đổi thanh toán nào được thực hiện trên tài khoản của bạn.

Sau khi project được cấp hạn mức tạo ảnh, dùng lại biểu mẫu ở trên. Nếu thay key, cập nhật credential **Google Gemini - Viet phuc Remix** trong n8n; không dán key vào Code node hoặc JSON. Mỗi lượt gửi tạo hai phương án bằng hai yêu cầu Google; workflow không tự động thử lại để tránh nhân số lượt gọi.

Đã kiểm tra:

- Form n8n nhận ảnh tải lên; giữ nguyên dữ liệu ảnh khi gửi trong `inlineData` tới Google.
- Hai prompt riêng cho hai bản phối; chế độ ảnh mặt và toàn thân có hướng dẫn khác nhau.
- Từ chối tệp không hỗ trợ, ảnh lớn hơn 5 MB và nhiều tệp.
- Gửi biểu mẫu thật bằng credential Google: xử lý được lỗi hết hạn mức, không giả lập ảnh thành công.
- Hiển thị ảnh, tải ảnh, bố cục điện thoại và quay lại biểu mẫu: đã thử trong n8n riêng bằng **phản hồi ảnh giả lập**. Ảnh kiểm thử là ảnh chụp hình SVG minh họa, không phải ảnh người thật.
- **Chưa xác nhận Google tạo/chỉnh sửa ảnh thành công, chưa kiểm chứng mức độ giữ khuôn mặt trên ảnh người dùng.** Không dùng ảnh chụp giao diện giả lập làm bằng chứng AI đã thử đồ thành công.

Các báo cáo và ảnh chụp kiểm thử được lưu trong `D:\n8n\workflows\Viet-phuc-Thu-do`.

## Import trên máy khác

File: **Viet-phuc-Thu-do.n8n.json**. Import vào n8n → mở node **Google tạo ảnh thử đồ** → chọn credential **Google Gemini(PaLM) Api**, Host `https://generativelanguage.googleapis.com` và API key có quyền tạo ảnh.

Để thử: **Execute workflow** → Test URL của node đầu → tải ảnh và gửi. Để dùng nhiều lần: **Publish** → Production URL `/form/viet-phuc-thu-do`. JSON không chứa key hoặc ảnh cá nhân.

Model cấu hình trong **Chuẩn bị ảnh và trang phục**, biến `IMAGE_MODEL`, mặc định `gemini-nano-banana-2.1`. Không thay bằng model chỉ trả văn bản. Dùng đúng model hỗ trợ chỉnh ảnh và có hạn mức trong project.

Luồng: **Form tải ảnh → Chuẩn bị ảnh và trang phục → Kiểm tra ảnh → Google tạo ảnh thử đồ → Tạo trang kết quả → Hiển thị ảnh**.

Hai thẻ màu và lời khuyên được tạo bằng quy tắc từ bản phối Studio. Ảnh được Google tạo dựa trên ảnh tải lên và từng bản phối; model có thể lệch so với màu hoặc phụ kiện yêu cầu. Thông tin văn hóa lấy từ nội dung đã biên soạn và nguồn tham khảo, không do model tạo ảnh bịa thêm.

## Xử lý ảnh

Ảnh và lựa chọn được gửi trực tiếp tới Google qua API. Workflow không chủ động tải ảnh lên Drive hay nơi chia sẻ công khai. Dữ liệu executions thành công/lỗi và lần chạy thủ công được đặt không lưu trong lịch sử lâu dài; n8n vẫn có thể giữ dữ liệu execution và tệp binary tạm trên ổ D cho đến khi tác vụ dọn dữ liệu chạy. Đây không phải cơ chế xóa ảnh ngay tức thì. Chính sách xử lý dữ liệu tại Google phụ thuộc dịch vụ và chế độ tài khoản. Chỉ tải ảnh bạn có quyền sử dụng.

Để mở lại sau khi khởi động máy, chạy lối tắt **n8n** trên Desktop. Studio minh họa cũ vẫn ở `/form/viet-phuc-remix-studio`.

Tài liệu: [Google — chỉnh ảnh bằng Gemini](https://ai.google.dev/gemini-api/docs/generate-content/image-generation), [Google — giá và hạn mức miễn phí](https://ai.google.dev/gemini-api/docs/pricing), [Google — giới hạn API](https://ai.google.dev/gemini-api/docs/rate-limits).
