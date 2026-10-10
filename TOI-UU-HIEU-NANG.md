# Tối ưu hiệu năng Việt phục Remix

Áp dụng vào ứng dụng trong `ai-studio-app`, dùng tại http://127.0.0.1:3000. Gói cập nhật AI Studio: `output/viet-phuc-remix-ai-studio.zip`.

## Thay đổi

- Kiểm tra nội dung khi nhập chỉ đọc các trường cần thiết; không tạo `FormData` của toàn bộ biểu mẫu sau mỗi sự kiện. Việc gửi yêu cầu vẫn thu thập đầy đủ lựa chọn.
- Gộp cập nhật preview vào một `requestAnimationFrame`, bỏ render khi trạng thái không đổi. Kiểm thử 60 sự kiện liên tiếp chỉ tạo một lượt render, vẫn dùng màu cuối cùng.
- Đọc kích thước nút/con dấu trước khi thay đổi giao diện; kéo con dấu cập nhật tối đa một lần mỗi khung hình, lưu đúng vị trí khi thả.
- Tránh xử lý điều hướng hai lần do cả click và `hashchange`. Phòng thử đồ ẩn được trả khỏi luồng bố cục khi chuyển sang trang khác.
- Giữ hiệu ứng rèm đóng/mở, ánh sáng, hoa văn và chuyển trang. Tạm dừng hoạt ảnh rèm khi rèm đã ẩn; chỉ cấp lớp compositor cho tấm rèm trong lúc chuyển cảnh. Lớp mây giữ phần ảnh nhìn thấy và bỏ diện tích trong suốt dư thừa.
- Tách 10 SVG gốc thành tệp riêng, giữ nguyên nội dung vector. Tổng cộng có 22 tệp minh họa SVG, tải theo nhu cầu. DOM ở bộ sưu tập giảm từ 3.212 xuống 2.228 phần tử, khoảng 31%. Sửa chiều cao thẻ ở các breakpoint để hình không bị cắt.
- Logo PNG được chuyển sang WebP **lossless**, cùng kích thước 1.254 × 1.254. So sánh toàn bộ byte RGBA sau giải mã cho kết quả giống hệt. Dung lượng giảm từ 842.940 xuống 499.144 byte (40,8%). Bản PNG gốc vẫn được giữ.
- Tạm ngừng kiểm tra kết nối Flow định kỳ khi tab trình duyệt hoặc phòng thử đồ đang ẩn. Kiểm tra lại ngay khi vào phòng thử đồ; vẫn theo dõi khi đang xử lý ảnh.
- Nén gzip bất đồng bộ cho phản hồi JSON lớn; giữ nguyên byte ảnh khi giải nén, không lưu cache kết quả riêng tư. Các tài nguyên tĩnh tiếp tục dùng gzip, ETag và xác thực lại khi thay đổi.

## Đã kiểm thử

- `node --test ai-studio-app/server.test.cjs ai-studio-app/destinations.test.cjs ai-studio-app/moderation.test.cjs`: 12 bài kiểm thử backend thành công.
- `node test-ui-performance.cjs`: gộp render, bỏ thu thập biểu mẫu thừa, kiểm duyệt tức thời, tạm dừng rèm ẩn, điều hướng cẩm nang.
- `node test-curtain.cjs`: đóng/mở rèm, điều hướng, Back, menu điện thoại, lựa chọn bộ sưu tập, chế độ giảm chuyển động.
- `node test-garment-preview.cjs`: 11 hình dáng trang phục khác nhau, đổi màu và địa điểm, bố cục điện thoại.
- `node test-collection-art.cjs`: 18 thẻ, SVG hợp lệ, tiêu đề và gradient đầy đủ, không cắt khung, bộ lọc và lựa chọn trang phục.
- `node test-guardrails-ui.cjs`: kiểm tra văn bản, từ phủ định, từ chối từ backend và mất kết nối.
- `node test-local-audit.cjs`: sáu trang trên máy tính/điện thoại, tải ảnh, phục hồi lỗi, kết quả ảnh, kéo con dấu và công cụ thẻ ảnh. Sử dụng worker giả lập, không gọi tạo ảnh Google/Flow.

## Phạm vi số đo

`scratch/profile-ui.cjs` lưu số đo Chrome giả lập CPU chậm 4 lần ở `output/perf-before.json` và `output/perf-after.json`. Các lượt đo có dao động lớn, nhất là lúc giải mã/vẽ SVG lần đầu; không coi một lượt đo là cam kết thời gian phản hồi hoặc bằng chứng mọi thao tác đều nhanh hơn.

Các cải thiện có thể kiểm chứng ổn định là số phần tử DOM, số lần render, dung lượng logo và tính toàn vẹn ảnh. Tốc độ sinh ảnh còn phụ thuộc Google Flow và kết nối mạng. Gói ZIP đã được chuẩn bị; thay đổi của đợt tối ưu này chưa được triển khai lên AI Studio.

## Chạy và cập nhật

Ứng dụng local được chạy bằng `node run-local-app.cjs`. Mở http://127.0.0.1:3000 và nhấn **Ctrl + F5** để tải tài nguyên mới.

`optimize-site-assets.cjs` dùng để tách các SVG inline gốc nếu nguồn HTML được tạo lại. `package-destination-rooms.py` đóng gói ứng dụng; không chứa khóa Google hoặc cấu hình worker local. Không chạy lại các bộ tạo giao diện cũ vì chúng có thể ghi đè những thay đổi gần đây.
