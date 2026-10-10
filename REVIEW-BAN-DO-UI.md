# Rà soát UI Bản đồ Di sản — 09/10/2026

## Tối ưu chuyển từ tỉnh sang phòng thử đồ

Đã sửa router để không cuộn sau khi thay đổi bố cục, bỏ cuộn tự động đến thông báo cuối biểu mẫu, chuẩn bị bố cục phòng thử đồ trong thời gian trình duyệt rảnh khi đang xem bản đồ, giữ phòng ẩn ở ngoài màn hình và loại khỏi thao tác bàn phím bằng `inert`/`aria-hidden`. Focus chuyển đến tiêu đề tủ đồ. Hiệu ứng SVG zoom kết thúc ngay khi rời bản đồ; animation ở trang ẩn được tạm dừng. Cột workspace dùng `minmax(0, ...)` để tránh ép kích thước theo nội dung.

Đo bằng Chrome mô phỏng CPU chậm 4 lần cho thấy bố cục là phần gây khựng chính. Trong các lần đo trước tối ưu, tác vụ dài nhất khoảng 617–1.245 ms; một lần đo sau tối ưu ghi nhận khoảng 228 ms, với layout khoảng 93 ms. Đây là phép đo trên máy local, có dao động theo tải máy; không phải cam kết thời gian cho mọi thiết bị. Helper: `measure-room-transition.cjs` (tùy chọn `--trace` hoặc `--profile`).

## Cập nhật phòng thử đồ theo địa điểm

Đã triển khai tủ đồ và phong cảnh riêng cho 11 địa điểm, gồm Sa Pa chỉ chọn váy xòe. Có tùy chỉnh ánh sáng và mô tả cảnh; máy chủ kiểm tra theo danh mục dùng chung và gửi đúng dữ liệu sang Flow. Đã nhận hai ảnh Flow thật với ảnh nhân vật mẫu tại cảnh Mường Hoa. Các nút tủ đồ vùng đã được nối lại theo tên trang phục, gồm Nhật Bình → Huế và áo cóm → Mộc Châu. Chi tiết và hướng dẫn: [PHONG-THU-DO-THEO-DIA-DIEM.md](PHONG-THU-DO-THEO-DIA-DIEM.md).

Các mục rà soát cũ bên dưới mô tả thời điểm trước cập nhật này; vấn đề nạp nhầm trang phục đã được xử lý ở các nút tủ đồ vùng và địa điểm. Điều hướng bản đồ, dữ liệu văn hóa/studio và khả năng tiếp cận vẫn cần hoàn thiện riêng.

## Đồng bộ Google AI Studio — 09/10/2026

Đã đồng bộ 7 tệp frontend đúng từng byte với bản local, bổ sung `/map.js` vào máy chủ AI Studio và xuất bản lại tại https://viet-phuc-remix.ai.studio/#ban-do. Kiểm tra trực tiếp bản công khai: toàn bộ tệp trả HTTP 200, SVG hiển thị trên desktop và điện thoại, vùng Huế mở được, áo ngũ thân chuyển đúng sang phòng thử đồ, không có lỗi JavaScript. Kiểm thử vòng đời job và xác thực worker của máy chủ cũng đã qua. Ảnh xác nhận: `D:\n8n\flow-automation\published-map-verified.png`. Có thể chạy lại `node verify-studio-map.cjs` để đối chiếu bản công khai.

Lần đồng bộ này đưa bản mã hiện tại lên AI Studio. Năm đề xuất cải thiện UI bên dưới vẫn là các việc cần triển khai tiếp.

## Đã xử lý lỗi bản đồ trắng ở cổng 3000

Tiến trình Node cũ chưa nạp tuyến phục vụ `/map.js`, trả HTTP 404 dù HTML và CSS mới đã tải được. Đã khởi động lại đúng máy chủ local tại `127.0.0.1:3000`; `/map.js` hiện trả HTTP 200. Kiểm tra trực tiếp trên cổng 3000 xác nhận SVG hiện, mở vùng Huế và chuyển áo ngũ thân sang phòng thử đồ hoạt động, không có lỗi JavaScript. Ảnh xác nhận: `D:\n8n\flow-automation\map-fixed-3000.png`.

Các nhận xét bên dưới thuộc lần rà soát trước trên máy chủ kiểm tra cổng 3002.

Phạm vi: bản mã local hiện tại, kiểm tra trên trình duyệt tại 1440×1000 và 390×844. Không chỉnh mã sản phẩm hay xuất bản lại trong lần rà soát này.

## Những gì đã hoạt động

- SVG bản đồ, dấu vùng và bảng chi tiết được dựng lên.
- Mở vùng Huế bằng bàn phím hiển thị đúng tiêu đề và tủ đồ.
- Chọn áo ngũ thân từ Huế chuyển sang phòng thử đồ và điền đúng loại áo.
- Bảng chi tiết trên điện thoại nằm trong chiều rộng màn hình (362 px trên màn hình 390 px).

## Các điểm cần sửa theo ưu tiên

1. **Trang phục chọn và trang phục thử chưa khớp.** `map.js` hiển thị Nhật Bình nhưng preset dùng áo ngũ thân; Giao Lĩnh dùng áo ngũ thân hoặc áo tứ thân. Phòng thử đồ chỉ hỗ trợ ba nhóm áo. Với mẫu chưa hỗ trợ, nên hiển thị “Xem thông tin” / “Chưa hỗ trợ thử đồ”, hoặc ghi rõ đang thử bản phối lấy cảm hứng; không dùng cùng nhãn “Phối đồ ngay” gây hiểu nhầm.
2. **Bản đồ toàn màn hình làm mất đường điều hướng.** `style.css:3146` cố định trang bản đồ phủ màn hình; bộ lọc vùng và thanh thời gian bị ẩn ở `style.css:3161`. Giữ trải nghiệm toàn màn hình nhưng thêm nút Menu, vào phòng thử đồ, chọn vùng và nút mở dòng thời gian nổi.
3. **Điện thoại khó đọc và khó chọn.** Toàn bộ SVG thu nhỏ để vừa chiều rộng, làm nhãn và điểm chọn quá nhỏ, trong khi phía trên/dưới còn nhiều khoảng trống. Nên có phóng to/thu nhỏ và danh sách vùng dễ chạm. Bảng chi tiết trên điện thoại nên chuyển thành bảng trượt từ dưới, ba tab cuộn ngang có dấu hiệu rõ hoặc bố cục gọn hơn.
4. **Thông tin studio và lịch sử thiếu nguồn tại chỗ.** Danh sách đang có tên, số điện thoại, địa chỉ và nhãn “uy tín”, nhưng chưa có URL nguồn/xác minh trong dữ liệu này. Nếu là dữ liệu mẫu phải gắn nhãn và bỏ thông tin liên hệ giả định. Các thẻ lịch sử và diễn giải biểu tượng nên bổ sung nguồn riêng trước khi trình diễn như kiến thức xác thực.
5. **Chuyển động và bàn phím cần ổn định hơn.** Kiểm thử click vào nhóm SVG Huế bị chờ vì nhóm liên tục chuyển động; mở bằng Enter hoạt động. Nên cố định vùng bấm và chỉ animate phần trang trí. Khi mở bảng chi tiết cần đưa focus vào bảng; khi đóng trả về điểm vừa chọn. Bảng đã ẩn không nên còn phần tử tham gia thứ tự Tab.

## Luồng UI đề xuất

Bản đồ → chọn vùng → xem tủ đồ / câu chuyện / dịp sử dụng → chọn trang phục được hỗ trợ → phòng thử đồ hiển thị rõ vùng và mẫu đã chọn → tải ảnh → xem hai phương án → quay lại bản đồ.

Thanh thời gian nên là lớp khám phá bổ sung, có nút mở rõ ràng. Không nên hứa biến đổi trang phục theo vùng và thời kỳ khi dữ liệu hiện tại chưa kết hợp đầy đủ hai chiều đó.

Ảnh kiểm tra lưu trong `D:\n8n\flow-automation\map-review-desktop.png`, `map-review-mobile.png`, `map-review-mobile-drawer.png`.
