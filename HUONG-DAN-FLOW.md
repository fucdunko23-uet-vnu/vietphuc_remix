# Việt phục Remix với Google Flow

## Trạng thái

Bộ này chuẩn bị nội dung để dùng trực tiếp trong tài khoản Flow của bạn. **Chưa có kết nối tự động n8n → Flow.** Không có ảnh nào được tải lên Flow, không có tín dụng nào được sử dụng bởi bộ chuẩn bị này.

Hai file `Prompt-ban-phoi-1.txt` và `Prompt-ban-phoi-2.txt` dùng **lựa chọn mẫu**: áo dài, xanh mint, chụp ảnh, phố cổ, phong cách năng động, túi mini. Phương án 1 dùng xanh mint trên áo; phương án 2 chuyển xanh mint sang quần. Chúng được chuẩn bị cho ảnh toàn thân; không chứa ảnh hoặc thông tin nhận diện của bạn.

## Thử trực tiếp bằng tài khoản Flow

1. Mở [Google Flow](https://labs.google/fx/tools/flow), đăng nhập đúng tài khoản đang có 1.050 tín dụng.
2. Tạo hoặc mở một project. Chọn chế độ **Image**, rồi chọn model chỉnh ảnh Nano Banana đang có trong tài khoản. Veo dùng cho video, không cần cho bản thử đồ bằng ảnh tĩnh.
3. Thêm ảnh rõ một người làm ảnh tham chiếu bằng cách tải lên/kéo vào ô nhập yêu cầu.
4. Mở `Prompt-ban-phoi-1.txt`, sao chép nội dung vào Flow. Chọn 1 ảnh đầu ra; bấm **Generate Image**.
5. Kiểm tra khuôn mặt, tay chân, tà áo và phụ kiện. Tải ảnh phù hợp về máy.
6. Dùng lại cùng ảnh gốc với nội dung `Prompt-ban-phoi-2.txt` để tạo phương án thứ hai.

Nếu chỉ có ảnh khuôn mặt, thay câu yêu cầu giữ tư thế và tỷ lệ cơ thể bằng: “Use the reference face and hair faithfully. Create a natural full-length clothed portrait. The body below the supplied portrait is an illustration, not a reconstruction of the real body. Preserve apparent age and use natural proportions.”

Model và số tín dụng cần thiết phụ thuộc lựa chọn hiển thị trong Flow. Kiểm tra ngay trên giao diện trước khi tạo. Không đổi số tín dụng Flow thành hạn mức của API key n8n.

## Ghép với demo n8n

Cách bán tự động cần một bước do người vận hành thực hiện trong Flow: n8n nhận ảnh và lựa chọn → chuẩn bị hai yêu cầu → tạo ảnh trong Flow → tải hai ảnh về và đưa vào trang kết quả n8n. Phần nối biểu mẫu này đang chờ xác nhận vì khác yêu cầu tự động hoàn toàn ban đầu.

Tài liệu Google: [Tạo và chỉnh ảnh trong Flow](https://support.google.com/flow/answer/16729550), [Các model Flow](https://support.google.com/flow/answer/16352836), [Tín dụng Flow](https://support.google.com/flow/answer/16526234).
