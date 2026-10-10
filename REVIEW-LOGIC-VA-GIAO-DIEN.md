# Rà soát logic và giao diện website

Ngày cập nhật: 09/10/2026. Phạm vi: ứng dụng đang phục vụ từ `ai-studio-app` tại http://127.0.0.1:3000, gồm bản đồ, trang chủ, bộ sưu tập, phòng thử đồ, hướng dẫn và về dự án.

## Các lỗi đã sửa

| Nhóm | Lỗi trước đây | Hành vi sau khi sửa |
|---|---|---|
| Điều hướng | Back/Forward khôi phục URL Sa Pa nhưng biểu mẫu còn giữ Huế | Đồng bộ địa điểm trong URL, tủ đồ và giao diện khi quay lại; không xóa lựa chọn khi địa điểm vẫn giữ nguyên |
| Tùy chỉnh | Bấm lại thẻ địa điểm đang chọn làm mất bối cảnh, ánh sáng và mô tả | Giữ nguyên tùy chỉnh khi chọn lại cùng địa điểm |
| Màu sắc | Chọn chip màu sau nội dung không phù hợp vẫn để nút bị khóa; màu CSS/mã hex không hợp lệ khác giữa preview và backend | Chip phát sự kiện cập nhật đầy đủ; cùng quy tắc màu tiếng Việt và mã `#RRGGBB`, cùng màu dự phòng |
| Kết quả | Công cụ đóng khung vẫn hiện sau khi đổi địa điểm và ẩn kết quả cũ | Xóa trạng thái và công cụ của lượt cũ cùng lúc |
| Ảnh gốc | Tải ảnh mới rồi mở kết quả cũ khiến ảnh “trước” đổi sang người/ảnh khác | Mỗi kết quả giữ ảnh gốc của chính lượt tạo đó |
| Tải ảnh | Lỗi giải mã từ tệp cũ có thể ghi đè thông báo của tệp vừa chọn | Chỉ lần chọn ảnh mới nhất được cập nhật trạng thái |
| Bản đồ | Toàn cảnh vẫn kéo lệch theo chiều dọc; phạm vi kéo vượt giới hạn | Khóa kéo tại toàn cảnh, giới hạn camera trong khung bản đồ |
| Chọn tỉnh | Chọn tỉnh trong lúc zoom có thể bị callback đổi lại tỉnh mặc định | Ưu tiên tỉnh người dùng vừa chọn; ẩn thẻ cũ khi đổi vùng |
| Bàn phím trên bản đồ | Enter/Space mở drawer cũ, khác thao tác click vào cùng điểm | Dùng cùng luồng zoom/chọn tỉnh và chuyển focus đến danh sách tỉnh |
| Nút bản đồ | Hover đúng mép thẻ có thể làm thẻ nhấp nháy vị trí liên tục, khó bấm nút thử đồ | Giữ vùng bắt chuột tại mép gốc trong khi hiệu ứng nâng thẻ hoạt động |
| Điều hướng bản đồ | Chế độ toàn màn hình che thanh điều hướng; dock bị cắt trên điện thoại | Có menu đến các trang khác; dock nhỏ xếp hai hàng, đầy đủ nút zoom/vùng |
| Responsive | Thanh điều hướng tràn ở tablet/chiều ngang điện thoại; nút Menu và biểu mẫu tràn ở 320 px | Mở menu gọn ở breakpoint phù hợp, cố định kích thước nút Menu và cho cột biểu mẫu co đúng |
| Trạng thái kết nối | Thông báo dài bị cắt khiến khó biết vì sao nút tạo ảnh chưa sẵn sàng | Cho phép xuống dòng và đọc đầy đủ trạng thái |
| Bàn phím | Drawer ẩn còn nhận Tab; cửa sổ đóng khung không giữ focus, Escape không đóng và có thể cuộn nền | Drawer ẩn dùng `inert`; dialog giữ focus, khóa nền, Escape đóng cửa sổ đóng khung và trả focus về nút mở |
| Cửa sổ trên điện thoại | Vùng điều khiển và ảnh bị chia thành các ô cuộn nhỏ, khó xem hết | Cuộn nội dung theo một luồng, giữ tiêu đề/nút đóng nhìn thấy và đặt lại vị trí cuộn khi mở |
| Sao chép/chia sẻ | Lỗi clipboard xảy ra trong callback bất đồng bộ nên không được bắt đúng; thông báo nằm sau dialog | Bắt lỗi đầy đủ và hiển thị ngay trong cửa sổ; hỗ trợ tải PNG khi trình duyệt không chia sẻ trực tiếp được |
| Con dấu | Hai con dấu cùng hiện; vùng kéo khác vị trí trên ảnh xuất; bỏ chọn dấu nhưng vùng kéo vẫn hiện | Canvas vẽ một dấu duy nhất; vùng kéo trong suốt bám đúng dấu ở cả ba bố cục, đồng bộ bật/tắt và hỗ trợ phím mũi tên |
| Ảnh lỗi | Ảnh kết quả không đọc được có thể bị thay bằng ảnh gốc khi đóng khung | Báo lỗi, xóa canvas cũ và khóa xuất ảnh; không thay ảnh sinh lỗi bằng ảnh gốc |
| Hướng dẫn | Nội dung chỉ nói ba nhóm áo trong khi tủ đồ đã có nhiều kiểu theo địa điểm | Cập nhật hướng dẫn theo luồng chọn địa điểm và bối cảnh hiện tại |

Giữ nguyên hình minh họa SVG, logo, bảng màu, rèm đóng/mở, hiệu ứng ánh sáng và hoa văn nút. Không thay đổi thông tin cấu hình tài khoản Google.

## Bằng chứng kiểm thử

- `scratch/audit-all-pages.cjs`: 48 tổ hợp của sáu trang với các viewport 320×844, 390×844, 768×1024, 1024×768, 1101×900, 1280×800, 1440×1000 và 844×390. Kiểm tra tràn ngang, chữ/nút bị cắt, ID trùng, liên kết nội bộ và lỗi JavaScript. Các mục nằm ngoài khung của danh sách cuộn ngang được đánh giá theo vùng cuộn, không coi là tràn trang. Chi tiết ở `output/audit-all-pages.json`.
- Kiểm tra thêm 25 tổ hợp trang/chiều rộng khi tải font Google thật; cả Playfair Display và Plus Jakarta Sans được tải và không gây tràn ngang.
- `test-catalog-ui.cjs`: 24 lượt preview địa điểm, 36 lượt chọn preset và 22 lượt chọn tỉnh từ bản đồ trên máy tính/điện thoại.
- `test-logic-regressions.cjs`: Back/Forward, giữ tùy chỉnh, thống nhất màu, dialog/bàn phím, ảnh gốc theo lượt tạo, ba bố cục đóng khung, tọa độ dấu/di chuyển bằng bàn phím, từ chối clipboard, PNG tải xuống, ảnh kết quả hỏng, xóa kết quả cũ, menu bản đồ và chọn tỉnh trong lúc zoom.
- `test-map-bounds.cjs`: giới hạn zoom/kéo, khung camera, các vùng địa lý, reset và responsive.
- `test-local-audit.cjs`: preview, phục hồi lỗi mạng, tạo ảnh với worker giả lập, kết quả, kéo dấu và sáu trang.
- Các kiểm thử rèm chuyển cảnh, 11 hình dáng trang phục, 18 thẻ bộ sưu tập, chọn phong cảnh, guardrails và cập nhật preview vẫn thành công.
- 12 bài kiểm thử backend thành công, gồm kiểm duyệt, xác thực worker, vòng đời công việc, hàng đợi, timeout, cache và nén ảnh không mất dữ liệu.

Kiểm thử chạy trên Chrome Windows, mô phỏng các kích thước màn hình. Luồng tạo ảnh dùng worker và dữ liệu ảnh kiểm thử giả lập; không tiêu tín dụng Google/Flow và không xác nhận chất lượng sinh ảnh thực tế ở đợt rà soát này.

## Bản cập nhật

Các thay đổi nằm trong `ai-studio-app/public/app.js`, `site.js`, `map.js`, `destinations.js`, `site.css` và `index.html`. Mở http://127.0.0.1:3000 rồi nhấn **Ctrl + F5**.

Gói `output/viet-phuc-remix-ai-studio.zip` được đóng lại từ mã mới. Chưa triển khai đợt sửa này lên Google AI Studio. `Xem-truoc-ghep-trang-phuc.html` là tệp xem trước riêng; kết quả kiểm thử trên áp dụng cho ứng dụng chạy bằng server.
