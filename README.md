# AI Video Crafter

Ứng dụng web giúp tạo bộ nội dung video AI hoàn chỉnh cho Runway, Pika, Sora, Kling.

## Tính năng hiện có

- Tạo prompt video từ form thông số (idea, style, camera, lighting, mood, duration, model).
- Hỗ trợ **đa ngôn ngữ đầu vào/đầu ra** (Tiếng Việt, English).
- Tự sinh bộ nội dung đầy đủ khi bấm tạo:
  - Tiêu đề
  - Hashtag
  - Mô tả video chuẩn SEO
  - Prompt tạo ảnh bìa
  - Prompt tổng
  - Prompt theo từng cảnh
- Tạo prompt bằng OpenAI API (tuỳ chọn nhập API key và model).
- Template có sẵn, bao gồm mẫu **review sản phẩm TikTok**.
- Gợi ý ý tưởng ngẫu nhiên một chạm.
- Lưu lịch sử 10 prompt gần nhất vào `localStorage` + xoá lịch sử nhanh.

## Chạy dự án

```bash
npm install
npm run dev
