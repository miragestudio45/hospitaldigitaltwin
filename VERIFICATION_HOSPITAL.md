# Verification — Hospital Digital Twin

Ngày kiểm tra: 17/07/2026

## Build

```text
npm run build
✓ 2671 modules transformed
✓ production build completed
```

Vite chỉ đưa ra cảnh báo kích thước chunk; không có lỗi TypeScript/esbuild/Rollup chặn build.

## Route smoke test

Production preview được chạy tại `127.0.0.1:4173`:

- `/site/hospital` → HTTP 200
- `/site/yooenergy` → HTTP 200
- `/` → HTTP 200, client router chuyển đến Hospital

## Kiểm tra phạm vi

- 13 module Hospital được đăng ký trong registry.
- Facility Operations & EBO vẫn gọi component gốc `FacilityOperationsModule`.
- YooEnergy vẫn gọi component gốc `EnergyUtilityModule`.
- Overview vẫn dùng ảnh và model tham chiếu hiện tại.
- Medical Gas tách khỏi gas nhiên liệu của YooEnergy.
- Alert setup lưu demo bằng localStorage.
- Dữ liệu tích hợp thật được ghi rõ là dữ liệu trình diễn.

## Lưu ý

- Chưa có kiểm thử kết nối HIS/EMR/LIS/RIS/PACS/EBO/thiết bị thật.
- Model 3D hiện tại vẫn là model tạm từ source được cung cấp.
- Khi có dữ liệu bệnh viện chính thức cần cập nhật spatial hierarchy, hotspot, asset IDs, room data và point list.
