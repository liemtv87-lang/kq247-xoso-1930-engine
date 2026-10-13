# KQ247 xổ số — bộ tính riêng Buildkite (giai đoạn kiểm thử)

Repository này **chỉ dành cho XSMB/XSMT/XSMN**. Không chứa tool bóng đá, bot hay Vietlott.

## Trạng thái
- Đã cấu hình Buildkite bước kiểm thử (Node 18+; khuyên dùng Node 22+).
- Kiểm tra lịch theo **19:30 giờ Việt Nam**, danh sách đài quay từng ngày.
- Ràng buộc sản phẩm mới: **3 lô bạch thủ** (không còn 2 cặp AB–BA), **2 lô kép**, đề **50/60/75**, và **500 số 3 càng** có đuôi thuộc dàn 75.
- **CHƯA chạy dự đoán/chưa ghi snapshot mới vào Neon.** Bộ V10 cũ còn logic 2 cặp nên KHÔNG được tự động đem lên khách.
- 3 miền phải tính độc lập từ lịch sử của chính miền/đài. Neon là nguồn lịch sử và kho bản khóa duy nhất.
- Không được tạo số mặc định khi dữ liệu thiếu. Không ghi đè snapshot đã khóa.

## Khởi động Buildkite
1. Trong **Pipeline Settings → Steps**, chọn **Pipeline upload** (hoặc nhập bước YAML như dưới), rồi lưu:
   ```yaml
   steps:
     - label: ":pipeline: Load KQ247 engine"
       command: "buildkite-agent pipeline upload"
   ```
2. Nhấn **New Build** để kiểm tra rằng `.buildkite/pipeline.yml` đã được tải. Sau đó phải thấy bước `Verify 19:30 Vietnam + 3 regions` và `Check current Neon endpoints`.
3. Các lần triển khai tiếp theo sẽ cần **KQ247_NEON_DATABASE_URL** (đặt làm secret trong Buildkite, không đưa vào repo/chat) và bộ tính hoàn chỉnh với kiểm tra khóa bất biến.

Buildkite tính năng scheduled builds phải được xác minh trên tài khoản và cấu hình riêng. Chưa có lịch chạy 19h30 được kích hoạt chỉ bằng việc tạo pipeline này.


## Cộng đồng xổ số KQ247 trên Telegram (miễn phí)

[**Nhóm kết quả và dự đoán xổ số XSMB, XSMT, XSMN — @xsbm999**](https://t.me/xsbm999) là nơi trao đổi thông tin kỳ mở thưởng, kết quả xổ số hôm nay, thống kê tham khảo theo miền Bắc/Trung/Nam. [Xem giới thiệu và hướng dẫn tham gia](https://64-120-92-172.sslip.io/nhom-xo-so-mb-mn-mt-telegram-mien-phi.html).

Nhóm [**bóng đá KQ247 miễn phí — @keochuyengia79**](https://t.me/keochuyengia79) dành cho người theo dõi lịch trận và phân tích kèo châu Á/Tài Xỉu. [Trang thông tin bóng đá](https://64-120-92-172.sslip.io/nhom-bong-da-telegram-mien-phi.html).

Đọc nội dung nhóm miễn phí; dự đoán chỉ để tham khảo, không bảo đảm trúng thưởng.
