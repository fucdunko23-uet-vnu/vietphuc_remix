# Kiểm tra web local — 09/10/2026

Địa chỉ: http://127.0.0.1:3000. Máy chủ đã được khởi động lại để nạp phần backend mới.

## Lỗi đã sửa

- Bấm điểm SVG bị mất click vì bản đồ gọi pointer capture ngay khi nhấn. Chỉ capture sau khi kéo hơn 5 px; vùng pulse có kích thước cố định, chỉ đổi opacity.
- Giữ màn chuyển cảnh theo yêu cầu, chỉnh chậm hơn: rèm đóng 700 ms → chuyển trang, giữ 400 ms → mở 700 ms, tổng khoảng 1,8 giây. Easing tăng/giảm tốc mềm thay vì chuyển nhanh ngay đầu. Hai frame đầu bảo đảm trình duyệt vẽ trạng thái mở trước khi đóng; chặn bấm lặp khi đang chuyển cảnh. Bỏ hiệu ứng khi người dùng chọn giảm chuyển động. Bản tối ưu trước đó đóng/mở trong cùng frame nên gần như mất hiệu ứng; đã sửa lại.
- API có thể treo vô hạn. Thêm timeout 15 giây cho yêu cầu thường, 60 giây cho gửi ảnh; thông báo rõ lỗi phản hồi HTML/JSON không hợp lệ; không tự gửi lại yêu cầu tạo ảnh.
- Kiểm tra kết nối chạy chồng khi mạng chậm. Chỉ có một yêu cầu trạng thái đang chạy; ngừng kiểm tra khi tab ẩn, kiểm tra lại khi quay về.
- Đổi nhanh hai ảnh có thể ghi đè bằng ảnh cũ. Dùng số phiên để chỉ nhận ảnh được chọn mới nhất, bắt lỗi đọc tệp và chặn đổi ảnh khi đang xử lý.
- Phòng chờ báo hoàn tất cả khi API thất bại và timer cũ có thể đóng lượt chờ mới. Dọn interval và đóng ngay khi yêu cầu kết thúc.
- Mất kết nối ngắn trong lúc chờ Flow làm mất luồng nhận kết quả. Thử kiểm tra lại tối đa ba lần liên tiếp trên cùng job; không tạo job mới.
- Photobooth giải mã ảnh lớn lại mỗi lần đổi khung. Cache ảnh theo bộ kết quả, tải song song, bỏ lượt vẽ cũ nếu có lượt mới; khóa xuất ảnh trong lúc vẽ.

## Tối ưu tải và hiển thị

- Backend nén gzip bất đồng bộ và lưu nội dung tĩnh theo thời gian sửa tệp. ETag + revalidation hỗ trợ HTTP 304; sửa tệp local vẫn được nhận biết. API giữ `Cache-Control: no-store`, giữ CSP và xác thực worker/job.
- Dung lượng thực tế: HTML 150.898 → 28.147 byte; map.js 344.586 → 102.398 byte; CSS khoảng 124 KB → 24 KB. CSS có thể thay đổi nhẹ sau sửa cuối.
- Mây chuyển bằng transform thay vì repaint background-position mỗi frame; bỏ blur trên các thẻ lớn của phòng thử đồ, bỏ lớp SVG fractal noise toàn trang, tránh transition kích thước lớp phong cảnh.
- Tạm dừng animation khi tab ẩn; tôn trọng prefers-reduced-motion.

## Kiểm chứng

- `cd ai-studio-app; npm test`: 4 kiểm thử backend, gồm dữ liệu địa điểm, vòng đời job, xác thực, hết hạn, gzip/304/CSP và API không cache.
- `node test-destination-ui.cjs`: map → Sa Pa, giới hạn trang phục/cảnh, preview, tải ảnh, Huế, reload và bố cục điện thoại.
- `node test-curtain.cjs`: xác nhận rèm thực sự hiện, chuyển trang sau khi đóng, mở lại, quay về bản đồ và tôn trọng giảm chuyển động. Hiệu ứng áp dụng cho điều hướng giữa sáu trang, nút Back/Forward trình duyệt, menu điện thoại và nút chọn bản phối từ bộ sưu tập; mỗi lần chỉ chạy một hiệu ứng, tiêu đề màn chuyển theo trang đích. Không chạy khi bấm lại trang hiện tại hoặc lần đầu tải trang.
- `node test-local-audit.cjs`: click thật trên bản đồ, phục hồi preview lỗi 502, Photobooth, gửi ảnh → nhận hai ảnh qua worker mô phỏng, phục hồi một lần lỗi 503 khi polling, sáu trang ở 1440 và 390 px, giảm chuyển động và không có lỗi JavaScript.
- Worker trong kiểm thử là giả lập, không gọi Google và không dùng tín dụng Flow. Hai ảnh trả về là ảnh fixture, không phải ảnh thử đồ thật.
- `measure-room-transition.cjs --trace`: Chrome giả lập CPU chậm 4 lần. Các lần đo tác vụ dài nhất khoảng 207–527 ms, một lần trace khoảng 498 ms; tải CPU/GPU trên máy làm số đo dao động. Vẫn còn tác vụ dài khi vào phòng thử đồ trên cấu hình yếu. Chưa đạt căn cứ để khẳng định tuyệt đối không lag; cần đo lại bản đã triển khai trên thiết bị đích.

## Gói AI Studio và giới hạn

`output/viet-phuc-remix-ai-studio.zip` chứa frontend, backend, package.json và kiểm thử, không chứa khóa API hay worker-config. `package-destination-rooms.py` hiện đóng gói chính server.cjs local, tránh lấy backend cũ từ bản sao lưu. ZIP dùng đường dẫn dấu `/` và đã đối chiếu nội dung với mã local.

Chưa upload hoặc publish thay đổi trong lần này. Khi triển khai cần giữ cấu hình `FLOW_WORKER_TOKEN` của ứng dụng và chạy worker kết nối đúng địa chỉ.

Worker đang kết nối bản công khai `https://viet-phuc-remix.ai.studio`; API local báo chưa có worker. Đã giữ cấu hình đó để bản công khai tiếp tục phục vụ. Chức năng tạo ảnh thật ở local cần worker kết nối local; kiểm thử mô phỏng không chứng minh local đã kết nối Google.

Queue và ảnh kết quả hiện ở RAM, hết hạn sau 20 phút và mất khi server restart; nếu deploy nhiều instance cần queue/storage dùng chung. Thời gian Google Flow tạo ảnh độc lập với độ mượt giao diện.
