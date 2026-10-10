# Triển khai và kết nối Google — 09/10/2026

Ứng dụng: https://viet-phuc-remix.ai.studio/

Phòng thử đồ: https://viet-phuc-remix.ai.studio/?dia-diem=laocai#thu-do

## Các thành phần đã kết nối

- Website và backend Node.js trên Google AI Studio. Giao diện đồng bộ từ `ai-studio-app/public`.
- Gemini API kiểm tra ảnh và yêu cầu trước khi đưa vào hàng đợi. `GEMINI_API_KEY` được cấu hình trong Secrets phía máy chủ.
- Google Flow tạo hai ảnh thử đồ từ ảnh tham chiếu, trang phục và phong cảnh đã chọn. `FLOW_WORKER_TOKEN` xác thực bộ kết nối; khóa không nằm trong mã giao diện.
- Bản đồ dùng SVG có sẵn; không cần Google Maps API. Bảng gợi ý phối đồ dùng quy tắc của ứng dụng. Phần tạo ảnh thật dùng Flow.

Flow được điều khiển qua Chrome đăng nhập trên máy Windows. Đây là bộ kết nối trình duyệt, không phải API Flow chính thức. Tín dụng Flow và hạn mức Gemini API được quản lý riêng.

## Kết quả kiểm tra

- 12 bài kiểm thử backend vượt qua trên mã nguồn local và bản máy chủ xuất từ AI Studio.
- Kiểm tra 6 trang trên hai kích thước 390 và 1440 px: không lỗi JavaScript, không tràn ngang.
- Đối chiếu toàn bộ tài nguyên giao diện công khai với bản local; kiểm tra Sa Pa và hai thẻ gợi ý.
- Bộ kết nối không có token bị từ chối HTTP 401. Token không xuất hiện trong HTML/JS/CSS công khai.
- Một lượt thực tế đã hoàn tất: biểu mẫu công khai → Gemini kiểm duyệt → Flow tải ảnh → tạo hai ảnh → hiển thị kết quả. Ảnh kiểm thử là nhân vật trưởng thành hư cấu, không phải ảnh cá nhân.
- Hai ảnh kết quả khác nhau, cùng kích thước 896 × 1200, thời gian từ khi gửi khoảng 115 giây; không có lỗi JavaScript. Thời gian thực tế phụ thuộc Google và hàng đợi.
- Lượt đầu dừng trước khi gửi lệnh tạo ảnh do không mở được bộ chọn ảnh. Đã tải lại phiên Flow, kiểm tra tải ảnh riêng và chạy lại thành công. Không tự gửi lại các lệnh tạo đã được gửi.

Minh chứng trong `output`:

- `published-current-flow-1.png`, `published-current-flow-2.png`.
- `published-current-flow-results.png` và `published-current-smoke.png`.
- `flow-success-verification.log`.
- `studio-final-deployed-source.zip`: bản nguồn cuối trong trình biên tập AI Studio; không đóng gói cấu hình worker hay file `.env` chứa khóa.
- `studio-before-current-deploy.zip` và `studio-before-final-sync.zip`: bản sao trước các bước đồng bộ.

## Vận hành trên máy Windows

1. Giữ Chrome chuyên dụng đăng nhập Google Flow mở. Nếu cần mở lại, chạy `D:\n8n\flow-automation\Connect-AI-Studio.cmd`.
2. Chạy `D:\n8n\flow-automation\Start-Viet-Phuc.cmd` để bật bộ kết nối; không cần nhập lại khóa.
3. Mở phòng thử đồ, đợi **Flow đã kết nối**, chọn địa điểm, ảnh và các tùy chỉnh rồi bấm thử đồ.

Máy Windows phải bật và có mạng khi tạo ảnh. Người dùng website không phải mở Flow. Nếu Google yêu cầu đăng nhập/xác minh, chủ ứng dụng xử lý trong Chrome; bộ kết nối không vượt xác minh.

Bộ kết nối giữ một phiên CDP ổn định, chỉ kết nối lại khi Chrome mất kết nối. Nếu Flow báo lỗi kết nối reCAPTCHA, hệ thống hiển thị chưa sẵn sàng; mở tab Flow và tải lại trang. Tránh chạy nhiều công cụ điều khiển cùng tab Flow trong lúc tải ảnh.

Nhật ký: `D:\n8n\flow-automation\worker-current.log` và `worker-current-error.log`.

Kiểm tra tình trạng công khai bằng `/api/status`. `/healthz` được kiểm tra nội bộ trong môi trường AI Studio; đường dẫn này có thể bị cổng công khai Google giữ lại và trả 404.

Hàng đợi hiện nằm trong bộ nhớ một tiến trình, tối đa ba công việc, dữ liệu hết hạn sau 20 phút. Khởi động lại máy chủ sẽ mất công việc đang chờ. Ảnh tải lên có thể vẫn được lưu trong dự án Flow của chủ ứng dụng.
