# Nước xung quanh và giới hạn di chuyển — 09/10/2026

Đã thay các polygon phác tay của Trung Quốc, Lào, Campuchia, Thái Lan và Hải Nam bằng SVG dựng từ Natural Earth 1:50m; thêm phần Myanmar ở mép tây. Nhãn được đặt theo tọa độ địa lý. Lớp này chỉ làm nền, không bắt click. Giữ nguyên hình các tỉnh, vùng chọn và các cụm đảo Việt Nam của ứng dụng.

Nguồn: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_admin_0_countries.geojson — dữ liệu public domain. Đây là hình khái quát phục vụ khám phá văn hóa, không phải bản đồ địa giới pháp lý. Lớp nền được căn theo khung phần đất liền Việt Nam hiện có, có thể có chênh lệch nhỏ do mức độ giản lược giữa hai bộ đường nét.

`update-neighbor-map.py` dựng SVG ngoại tuyến từ `output/ne_50m_admin_0_countries.geojson`. Trình duyệt không tải GeoJSON hoặc gọi dịch vụ bản đồ bên ngoài. Đường biên được cắt theo từng đoạn để không vẽ viền thẳng giả ở mép cắt.

Theo yêu cầu tiếp theo, toàn cảnh được căn theo tỷ lệ màn hình với tâm SVG (260,400), khung cơ sở tối thiểu 700×930. SVG phủ 100% chiều rộng/chiều cao thay vì 98vw/96vh. Khung giới hạn kéo chính là toàn cảnh của màn hình hiện tại: khi ở toàn cảnh không kéo được; phóng to thì kéo trong phần còn lại của khung. Thu nhỏ đến toàn cảnh khóa kéo và phục hồi các điểm chọn vùng. Zoom giữ tỷ lệ màn hình, cạnh ngắn nhất tối thiểu 160 đơn vị. Resize điện thoại/desktop căn lại khung toàn cảnh và giới hạn kéo. Đây là tọa độ giao diện, không phải tọa độ địa lý.

Địa lý nền được mở rộng ra khu vực Đông Nam Á, gồm thêm Malaysia, Indonesia, Philippines, Brunei, Bangladesh, phần Ấn Độ và Đài Loan để màn hình rộng có ngữ cảnh liên tục. Cắt dữ liệu ngoại tuyến ở khung rộng -2200…2700 đơn vị, không tải GeoJSON lúc chạy. Phần biển có nền SVG phủ toàn khung.

Kéo và zoom dùng ma trận SVG thực tế để không lệch dưới khoảng trống do tỷ lệ màn hình. Cập nhật kéo tối đa một lần mỗi frame và chốt vị trí cuối khi thả chuột.

Đã đồng bộ vào `ai-studio-app/public/map.js` và `Xem-truoc-ghep-trang-phuc.html`. `sync-preview-map-controls.py` đồng bộ các hàm điều khiển. Gói AI Studio được dựng lại ở `output/viet-phuc-remix-ai-studio.zip`, chưa publish.

Kiểm chứng: `node test-map-bounds.cjs` kiểm tra zoom hai cực, giữ tỷ lệ, kéo xa bốn phía, năm vùng, trở về toàn cảnh, desktop/mobile và lỗi JavaScript. Bản HTML độc lập và máy chủ cổng 3000 đã được kiểm tra trực tiếp. Ảnh: `output/map-fixed-neighbors-desktop.png`, `output/map-fixed-neighbors-mobile.png`.
