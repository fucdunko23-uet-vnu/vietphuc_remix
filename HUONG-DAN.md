# Việt phục Remix Studio — ghép trang phục và bối cảnh

Demo dùng biểu mẫu có sẵn của n8n. Sau khi gửi, bạn xem **đúng hai bản phối cạnh nhau** gồm nhân vật, trang phục, phụ kiện và phông nền; trên điện thoại hai thẻ xếp dọc. Mỗi thẻ có ba ô màu, gợi ý trang phục, giày, phụ kiện và giải thích. Cuối trang có thông tin văn hóa và nguồn tham khảo.

File để import: **Viet-phuc-Remix.n8n.json**, trong thư mục `D:\n8n\workflows\Viet-phuc-Remix-Studio`.

## Bản đã cài trên máy của bạn

Workflow Studio đã được import, publish và kết nối Google Gemini bằng credential riêng. Mở **http://localhost:5678/form/viet-phuc-remix-studio**, điền lựa chọn rồi bấm **Ghép trang phục và bối cảnh**. Không cần import lại hoặc bấm Execute workflow. Kết quả thành công có nhãn **GIẢI THÍCH BẰNG GEMINI**.

Khi tắt/mở máy, chạy lối tắt **n8n** trên Desktop trước rồi mở biểu mẫu. Key được lưu mã hóa trong credential n8n; bản JSON dùng để chia sẻ không chứa key và mặc định tắt AI để có thể chạy ở máy khác.

## Chạy thử sau khi import

1. Mở http://localhost:5678 và đăng nhập n8n.
2. Tạo workflow mới → menu **…** → **Import from File** → chọn `Viet-phuc-Remix.n8n.json`.
3. Lưu workflow **Việt phục Remix Studio · Ghép trang phục và bối cảnh**. Giữ `const USE_AI = false;` trong node **Chuẩn bị dữ liệu** để chạy ngay, không cần API key.
4. Bấm **Execute workflow**, mở node **Form Trigger** ở đầu luồng và mở **Test URL** trong tab trình duyệt. Nếu biểu mẫu tự mở, dùng tab đó.
5. Điền biểu mẫu → bấm **Ghép trang phục và bối cảnh**. Kết quả hiển thị ngay trong tab biểu mẫu.
6. Muốn thử tiếp bằng Test URL, trở lại workspace và bấm **Execute workflow** một lần nữa.

**Import JSON chưa làm biểu mẫu hoạt động liên tục.** Để mở biểu mẫu nhiều lần, bấm **Publish** rồi dùng **Production URL** của Form Trigger: http://localhost:5678/form/viet-phuc-remix-studio. Khi sửa workflow, Publish lại để cập nhật bản đang chạy. Ở kết quả Production có liên kết quay lại biểu mẫu.

Đường dẫn `/form/viet-phuc-remix` thuộc bản cũ, được giữ riêng. Hãy dùng đường dẫn có đuôi **`-studio`** cho bản ghép hình này.

## Chọn gì trong biểu mẫu?

| Trường | Lựa chọn |
|---|---|
| Nhân vật | Tóc ngắn hoặc tóc dài |
| Loại trang phục | Áo dài, áo ngũ thân, áo tứ thân |
| Sự kiện | Chụp ảnh, sự kiện trường, lễ hội, đi chơi |
| Bối cảnh | Sân trường, phố cổ, sân vườn |
| Màu yêu thích | Tên màu phổ biến như xanh mint, đỏ, kem; hoặc mã `#RRGGBB` |
| Phong cách | Thanh lịch, tối giản, năng động |
| Phụ kiện yêu thích | Túi mini, túi tote, khăn, quạt giấy, kẹp tóc hoặc không dùng |
| Mong muốn thêm | Không bắt buộc; ví dụ: “đi bộ nhiều, thoáng mát” |

Ví dụ thử nhanh: **Tóc dài · Áo dài · Chụp ảnh · Sân trường · xanh mint · Năng động · Túi mini · Không cao gót, thoáng mát**. Sau đó đổi sang **Áo tứ thân · Sân vườn · Quạt giấy** để thấy hình và nội dung thay đổi.

**Sự kiện** quyết định lời khuyên sử dụng; **bối cảnh** quyết định phông nền. Một bộ trang phục xuất hiện ở phông phố cổ không có nghĩa đó là nơi xuất xứ của trang phục.

## Hình ảnh và dữ liệu mẫu

- Hình ghép là minh họa vector SVG do dự án dựng sẵn, gồm các lớp phông nền, nhân vật, trang phục và phụ kiện. Toàn bộ nằm trong JSON; không cần tải ảnh ngoài hoặc gọi API để chạy demo.
- Hai cách phối được tạo bằng quy tắc từ lựa chọn của bạn; chế độ mặc định ghi rõ **dữ liệu mẫu**. Đây là bản minh họa cách phối, không phải thử đồ trên ảnh thật hay phục dựng trang phục lịch sử.
- Avatar có tư thế cố định; phụ kiện và màu được giới hạn trong thư viện demo. Màu chưa nhận diện dùng màu dự phòng và có thông báo trên kết quả.
- “Mong muốn thêm” hỗ trợ một số từ khóa về đi bộ, thoáng mát, tiết kiệm; không phải mọi yêu cầu tự do đều thay đổi được hình.
- Thông tin văn hóa được biên soạn sẵn và gắn nguồn. Các chi tiết nên giữ như tà áo, cổ áo, yếm, dây lưng được giải thích theo từng mẫu; không chấm điểm “đúng văn hóa” tuyệt đối.

## Google Gemini — tùy chọn

Gemini chỉ viết **hai đoạn giải thích ngắn cho hai bản phối đã chọn**. Gemini không tạo ảnh, sửa trang phục, đổi các lớp hình hoặc tạo dữ kiện văn hóa.

1. Tạo key tại [Google AI Studio](https://aistudio.google.com/api-keys).
2. Mở node **AI tạo gợi ý** → chọn/tạo credential **Google Gemini(PaLM) Api**. Host: `https://generativelanguage.googleapis.com`. Nhập API key vào credential rồi lưu.
3. Trong **Chuẩn bị dữ liệu**, đổi `const USE_AI = false;` thành `const USE_AI = true;`.
4. Giá trị `MODEL` mặc định trong file là `gemini-3.5-flash-lite`. Nếu tài khoản của bạn không dùng được tên này, thay bằng model Gemini hỗ trợ JSON có trong Google AI Studio của bạn.
5. Lưu, thử lại với Test URL; Publish lại nếu dùng Production URL.

JSON không chứa API key. Chỉ khi bật AI, lựa chọn biểu mẫu và dữ liệu hai bản phối mới được gửi đến Google. Hạn mức và phí phụ thuộc tài khoản Google. Nếu gọi AI thất bại hoặc phản hồi không hợp lệ, demo dùng lời giải thích mẫu và hiển thị trạng thái tương ứng.

Tham khảo: [Hướng dẫn Gemini API key](https://ai.google.dev/gemini-api/docs/api-key).

## Nguồn văn hóa và kiểm tra

- Áo dài: [Vietnam Tourism](https://vietnam.travel/node/1216).
- Áo ngũ thân: [Bảo tàng Lịch sử Quốc gia — tiếp nhận áo dài ngũ thân truyền thống](https://baotanglichsu.vn/vi/Articles/3090/72685/bao-tang-lich-su-quoc-gia-tiep-nhan-ao-dai-ngu-than-truyen-thong.html).
- Áo tứ thân và bối cảnh trang phục phụ nữ: [Bảo tàng Lịch sử Quốc gia — nét đẹp văn hóa trong tà áo dài](https://baotanglichsu.vn/vi/Articles/3096/18397/net-djep-van-hoa-trong-ta-ao-dai-cua-phu-nu-viet.html).

Trạng thái kiểm tra bản Studio: **đã chạy thành công trên n8n 2.41.6**: import, publish, gửi biểu mẫu, hiển thị hai hình ghép và sáu ô màu, bố cục máy tính/điện thoại, liên kết tạo bản phối mới. Đã kiểm tra 18 tổ hợp trang phục × bối cảnh × nhân vật và cơ chế dùng lời mẫu khi AI lỗi. **Đã gọi Google Gemini thật và chạy thành công toàn bộ biểu mẫu với hai lời giải thích từ AI.** Xem `validation-google.json` và ảnh `Ket-qua-tren-may.png` trong cùng thư mục.

Nếu không mở được localhost, chạy lối tắt **n8n** trên Desktop. Nếu Test URL báo chưa đăng ký, bấm Execute workflow rồi mở lại. Nếu Production URL báo chưa đăng ký, kiểm tra đúng workflow Studio đã Publish. Nếu không có kết quả, mở **Executions** và xem node báo lỗi.
