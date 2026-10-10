# Nhạc nền Việt Phục Remix

Các bản nhạc không lời trong thư mục này được sáng tác và tổng hợp mới bằng mã nguồn của dự án. Không sử dụng bản thu, mẫu âm thanh hay bài hát tải từ bên ngoài; không gọi dịch vụ tạo nhạc.

Nhạc gợi không khí của từng vùng và từng trang. Đây **không phải bản thu âm nhạc dân gian xác thực**, không mô phỏng một làn điệu hay nghi lễ cụ thể và không nên giới thiệu như tư liệu âm nhạc truyền thống.

| Tệp | Không khí |
| --- | --- |
| `overview.mp3` | Toàn cảnh bản đồ: giai điệu nhẹ, thoáng với tiếng sáo tổng hợp |
| `bac-bo.mp3` | Bắc Bộ: dây gảy mềm, nhịp chậm và khoảng vang dịu |
| `tay-bac.mp3` | Tây Bắc: tiếng sáo thoáng và giai điệu ngũ cung |
| `hue-trung-bo.mp3` | Huế, miền Trung: dây gảy chậm và thanh nhã |
| `tay-nguyen.mp3` | Tây Nguyên: âm sắc gỗ trầm, nhịp nền nhẹ |
| `nam-bo.mp3` | Nam Bộ: dây gảy ấm và giai điệu uyển chuyển |
| `thu-do.mp3` | Phòng thử đồ: piano mềm, nốt thưa và nền thư giãn |
| `trang-chu.mp3` | Trang chủ: piano ấm và sáng |
| `kham-pha.mp3` | Bộ sưu tập: âm sắc gỗ với nhịp bước nhẹ |
| `huong-dan.mp3` | Hướng dẫn: piano rất thưa, phù hợp đọc nội dung |
| `gioi-thieu.mp3` | Về dự án: sáo mềm, nền trang nhã |

## Tạo lại tài nguyên

Từ thư mục gốc `viet-phuc-remix`:

```powershell
python -m pip install numpy scipy imageio-ffmpeg
python tools/generate-background-music.py
```

Có thể dùng FFmpeg có sẵn trên `PATH` hoặc đặt `FFMPEG_BINARY` trỏ đến tệp thực thi, thay cho `imageio-ffmpeg`. Tạo lại riêng một bản:

```powershell
python tools/generate-background-music.py --track thu-do
```

Mỗi bản gồm 12 ô nhịp, dài khoảng 34–44 giây, stereo 44.1 kHz, MP3 96 kbit/s. Âm vang được xử lý tuần hoàn để giữ đuôi âm khi lặp lại; metadata MP3 lưu độ trễ mã hóa giúp giải mã đúng chiều dài. Trình phát nên dùng `AudioBufferSourceNode.loop` trên dữ liệu đã giải mã để lặp liên tục.

Mức RMS mục tiêu của tài nguyên là −22 dBFS và chừa khoảng đỉnh an toàn. Bộ tạo kiểm tra lại tệp MP3 sau mã hóa để phát hiện clipping, dữ liệu không hợp lệ hoặc thay đổi chiều dài. `manifest.json` lưu thời lượng, kích thước và các số đo. Mức âm lượng phát thực tế được điều khiển riêng ở giao diện; người dùng nên luôn có nút tắt nhạc.
