# Phòng thử đồ theo địa điểm

Bản cập nhật ngày 09/10/2026.

Mở Sa Pa: https://viet-phuc-remix.ai.studio/?dia-diem=laocai#thu-do

Từ bản đồ, chọn vùng → chọn địa điểm → bấm phối đồ. Phòng thử đồ giữ địa điểm trong URL; tải lại trang vẫn mở đúng tủ đồ. Có thể đổi địa điểm trực tiếp trong phòng thử đồ.

## Các tủ đồ demo

| Địa điểm | Trang phục có thể chọn | Ví dụ phong cảnh |
| --- | --- | --- |
| Sa Pa | Váy xòe | Mường Hoa, Cát Cát, Fansipan |
| Bắc Ninh | Áo tứ thân | Làng Diềm, không gian hội Lim |
| Hà Nội | Áo giao lĩnh, ngũ thân, áo dài | Hoàng thành, phố cổ, Hồ Hoàn Kiếm |
| Mộc Châu | Áo cóm và váy dài | Đồi chè, Nà Ka, Bản Áng |
| Hà Giang | Bộ phối lấy cảm hứng Lô Lô | Đồng Văn, Mã Pí Lèng, hoa tam giác mạch |
| Huế | Nhật Bình, ngũ thân, áo dài | Đại Nội, sông Hương, nhà vườn |
| Hội An | Ngũ thân, áo dài | Phố cổ, sông Hoài, góc đèn lồng |
| Buôn Ma Thuột | Bộ phối lấy cảm hứng Ê Đê | Ako Dhông, Dray Nur, đồi cà phê |
| Pleiku | Bộ phối lấy cảm hứng Ba Na | Biển Hồ, hàng thông, không gian nhà rông |
| Sài Gòn | Bà ba, áo dài | Bưu điện, Nguyễn Huệ, góc phố |
| Cần Thơ | Bà ba, áo dài | Ninh Kiều, Cái Răng, vườn cây |

Danh mục giới hạn theo thiết kế demo; không khẳng định đây là mọi trang phục hoặc trang phục độc quyền của từng địa điểm. Các mẫu lấy cảm hứng không phải phục dựng lịch sử. Xem thông tin điểm đến [Sa Pa](https://www.vietnam.travel/places-to-go/northern-vietnam/sapa) và [Huế](https://vietnam.travel/vi/places-to-go/central-vietnam/hue) từ Vietnam Tourism.

## Tùy chỉnh và tạo ảnh

1. Chọn phong cảnh trong địa điểm đang mở.
2. Chọn ánh sáng tự nhiên, sáng sớm, hoàng hôn hoặc trời nhiều mây.
3. Mô tả thêm thời tiết, mùa, góc chụp hoặc mật độ người, tối đa 300 ký tự.
4. Chọn ảnh, màu, phong cách và phụ kiện; bấm thử đồ để tạo hai ảnh qua Flow.

“Xem thẻ gợi ý” chỉ tạo thẻ bảng màu và mô tả, không giả lập ảnh thử đồ bằng một mẫu áo khác. Ở chế độ phối tự do vẫn giữ ba nhóm áo và các hình SVG cũ.

Danh mục dùng chung: `ai-studio-app/public/destinations.js`. Máy chủ kiểm tra loại trang phục, phong cảnh và phụ kiện theo địa điểm; yêu cầu tạo ảnh có tên địa điểm, cảnh, ánh sáng và mô tả tùy chỉnh. Flow cần Chrome đăng nhập và worker đang chạy. Phong cảnh AI là minh họa, không xác nhận địa điểm chụp thực tế.

## Kiểm tra đã thực hiện

- `node --test ai-studio-app/server.test.cjs ai-studio-app/destinations.test.cjs`: vòng đời công việc, xác thực worker, mọi tổ hợp trang phục/phong cảnh hợp lệ và từ chối phối sai địa điểm.
- `node test-destination-ui.cjs`: luồng bản đồ → Sa Pa, chỉ có váy xòe, đổi cảnh, xem thẻ, tải lại URL, Nhật Bình → Huế, tải ảnh và bố cục điện thoại.
- Kiểm thử trực tiếp trên tên miền AI Studio bằng `VPR_TEST_URL`.
- Một lượt Flow thật với ảnh người trưởng thành hư cấu: nhận hai ảnh váy xòe với cảnh ruộng bậc thang có sương; không sử dụng ảnh cá nhân của người dùng. Kết quả: `D:\n8n\flow-automation\sapa-tryon-1.png` và `sapa-tryon-2.png`.

`test-flow-sapa.cjs` tạo một lượt ảnh thật; chỉ chạy lại khi cần kiểm tra vì có thể dùng tín dụng Flow.
