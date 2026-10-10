# Việt phục Remix — bản thử đồ Google Flow

Ứng dụng công khai: **https://viet-phuc-remix.ai.studio**

Website gồm năm khu vực: Trang chủ (`#trang-chu`), Khám phá (`#kham-pha`), Phòng thử đồ (`#thu-do`), Hướng dẫn (`#huong-dan`) và Về dự án (`#gioi-thieu`). Bộ sưu tập có sáu bản phối minh họa, lọc theo trang phục. Bấm **Thử bản phối này** để chuyển các lựa chọn sang phòng thử đồ. Menu thu gọn trên điện thoại; nút quay lại của trình duyệt hoạt động giữa các trang.

Ứng dụng trong AI Studio: https://aistudio.google.com/apps/bdc81a72-7107-4a3a-bdff-b35757552c3d

## Chạy demo

1. Chạy `D:\n8n\flow-automation\Connect-AI-Studio.cmd`, đăng nhập Flow trong cửa sổ Chrome chuyên dụng và giữ cửa sổ mở.
2. Chạy `D:\n8n\flow-automation\Start-Viet-Phuc.cmd`. Tệp này bật bộ kết nối, in đường dẫn ứng dụng đã cấu hình. Không cần nhập lại khóa Google.
3. Mở đường dẫn ứng dụng và chọn **Phòng thử đồ**. Khi thấy **Flow đã kết nối**, chọn ảnh một người, loại trang phục, sự kiện, bối cảnh, màu và phụ kiện; bấm **Thử Việt phục trên ảnh của tôi**.
4. Chờ hai ảnh; xem bảng màu, cách phối, câu chuyện văn hóa và tải ảnh. Giữ tab kết quả mở trong lúc tạo.

Nút **Khám phá bản phối minh họa** dùng SVG và quy tắc phối có sẵn, được ghi rõ là minh họa mẫu. Nút này không thử đồ trên ảnh cá nhân và không gọi Flow.

## Phần tự động

Biểu mẫu → kiểm tra ảnh và lựa chọn → chuẩn bị hai câu lệnh → bộ kết nối mở dự án Flow riêng, tải ảnh, chọn Nano Banana / 3:4 / một ảnh mỗi lượt → tạo hai phương án → trả ảnh về ứng dụng.

Ảnh được tạo bằng chế độ ảnh của Google Flow. Không dùng Veo để tạo ảnh tĩnh, không chuyển tín dụng Flow sang Gemini API. Mức tín dụng thực tế do Flow quyết định theo mô hình và tài khoản; không mã hóa cố định giá trong ứng dụng.

Máy Windows, mạng và Chrome đăng nhập Flow phải hoạt động. Người dùng biểu mẫu không phải tự mở Flow. Đây là tự động hóa giao diện trình duyệt; nếu Google đổi nút hoặc yêu cầu đăng nhập/xác minh, chủ ứng dụng cần xử lý trong Chrome. Bộ kết nối không vượt CAPTCHA và không tự gửi lại lượt tạo khi lỗi.

## Ảnh mẫu và giới hạn

`flow-fictional-person.jpg` là ảnh nhân vật trưởng thành hư cấu được Google Flow tạo để kiểm thử, không phải ảnh cá nhân của chủ tài khoản. Các ảnh `flow-tryon-1.png`, `flow-tryon-2.png` là ảnh thử đồ thật do Flow tạo từ nhân vật mẫu.

Ảnh AI có thể thay đổi nét mặt, biểu cảm, tư thế hoặc chi tiết trang phục. Ảnh khuôn mặt chỉ cung cấp tham chiếu phần mặt; cơ thể được AI dựng thêm. Đây không phải đo kích thước hay cam kết quần áo vừa vặn.

Kiểm thử ngày 08/10/2026: biểu mẫu công khai đã nhận ảnh nhân vật mẫu, bộ kết nối tạo hai ảnh thật trong Flow và trả đầy đủ hai thẻ kết quả về trang. Ảnh chụp màn hình `Ket-qua-tren-ai-studio.png` và hai ảnh `published-tryon-1.png`, `published-tryon-2.png` lưu lại lần kiểm thử này. API bộ kết nối từ chối yêu cầu không có khóa (HTTP 401); khóa kết nối không xuất hiện trong HTML/JS/CSS công khai. Giao diện minh họa đã kiểm tra trên màn hình rộng và chiều rộng điện thoại 390 px.

Thông tin văn hóa dùng nội dung ngắn có nguồn trong ứng dụng. Phông phố cổ/sân trường/sân vườn là bối cảnh sáng tạo, không khẳng định nguồn gốc trang phục. Cần rà soát ảnh trước khi dùng trong bài thuyết trình.

## Dữ liệu và vận hành

- Ảnh tải lên được gửi tới tài khoản Google Flow của chủ ứng dụng và có thể còn trong dự án Flow. Chủ ứng dụng quản lý/xóa các dự án theo nhu cầu; ứng dụng không tự xóa chúng.
- Máy chủ giữ công việc trong bộ nhớ tạm, hết hạn sau 20 phút; kết quả được giao diện yêu cầu xóa khỏi hàng đợi sau khi nhận. Khởi động lại máy chủ sẽ mất công việc đang chạy.
- Bản demo dùng hàng đợi trong một tiến trình, tối đa ba công việc chờ/chạy. Khi triển khai nhiều instance hoặc phục vụ đông người cần chuyển hàng đợi sang kho lưu trữ dùng chung. Chưa có kiểm thử tải nhiều người.
- Đã xuất bản bằng Starter của AI Studio. Chưa chỉnh giới hạn instance trong Google Cloud Console vì tài khoản hiện yêu cầu bật MFA để vào phần quản trị Cloud; không bật gói trả phí.
- `FLOW_WORKER_TOKEN` là khóa kết nối riêng, lưu trong Secrets của AI Studio và `D:\n8n\flow-automation\worker-config.json` trên máy. Tệp cấu hình chỉ cấp quyền cho tài khoản Windows hiện tại. Không chia sẻ tệp này, thư mục hồ sơ Chrome hoặc khóa API.
- Dừng kết nối: `Stop-Viet-Phuc.cmd`. Ứng dụng sẽ hiển thị chưa kết nối sau tối đa 45 giây. Xem nhật ký tại `D:\n8n\flow-automation\worker.log`.

Mã web trong `ai-studio-app`; bộ kết nối `flow-worker.cjs`. Các workflow n8n cũ vẫn được giữ riêng. Bản triển khai AI Studio này chạy độc lập với n8n.
