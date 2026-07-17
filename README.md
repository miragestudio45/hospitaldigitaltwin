# Hospital Digital Twin

Bản Hospital Digital Twin được chuyển đổi trực tiếp từ source `dananghitech` do người dùng cung cấp. Dự án giữ nguyên nền tảng UI/UX, kiến trúc React/TypeScript/Vite, Overview 2D/3D, Facility Operations & EBO và YooEnergy; đồng thời thay toàn bộ nghiệp vụ Khu Công nghệ cao bằng nghiệp vụ vận hành bệnh viện.

## Route chính

- Hospital Digital Twin: `http://localhost:5173/site/hospital`
- YooEnergy độc lập: `http://localhost:5173/site/yooenergy`

## 13 nhóm module

1. Hospital Command Center
2. BIM & Clinical Space Twin
3. Patient Flow & Capacity
4. Clinical Operations Integration
5. Patient & Visitor Experience
6. Medical Equipment & Asset Lifecycle
7. Facility Operations & EBO
8. Critical Utilities & Medical Gases
9. Energy, Utilities & ESG — YooEnergy
10. Infection Prevention, Safety & Emergency
11. Hospital Logistics & Support Services
12. AI, Simulation & Optimization
13. Systems, Data, Integration & Cybersecurity

Chi tiết từng phân hệ nằm trong `HOSPITAL_MODULES_AND_SCOPE.md`.

## Các phần được giữ từ bản nguồn

### Overview

Giữ nguyên cấu trúc 2D/3D, panel, hotspot, data layer, hierarchy và interaction của bản nguồn. Ảnh và GLB hiện tại chỉ là tài nguyên tạm thời:

- Ảnh 2D: `src/assets/airport/Overview_HighTechPark.webp`
- Cấu hình model 3D: `src/app/airport/overview/airport3DConfig.ts`
- Mapping tương tác 3D: `src/app/airport/overview/airport3DTargets.ts`

Khi có ảnh/model bệnh viện chính thức, chỉ cần thay file ảnh và `modelUrl`; không cần xây lại giao diện.

### Facility Operations & EBO

Giữ nguyên component vận hành thực của source cũ, gồm BMS/HVAC, Chiller, Electrical, CCTV/VMS, Access Control, Fire & Life Safety, Water, Lighting, Vertical Transport, Alarms, Trends và Reports. Bản Hospital bổ sung:

- Môi trường phòng mổ, ICU và phòng cách ly.
- Áp suất dương/âm.
- Nhiệt độ, độ ẩm và chênh áp.
- HEPA/filter condition.
- Pharmacy/Lab/CSSD environmental compliance.

### YooEnergy

Giữ nguyên nền tảng điện, nước, nước nóng, thermal/BTU, gas nhiên liệu, meter, gateway, reports, AI, budget và alert setup. Logic phân bổ được đổi từ tenant sang tòa nhà, khoa, phòng và cost center bệnh viện.

Medical Gas được quản lý ở module Critical Utilities riêng, không gộp vào gas nhiên liệu của YooEnergy.

## Chạy nhanh trên Windows

Nhấp đúp:

```text
OPEN_HOSPITAL_DIGITAL_TWIN.cmd
```

Lần đầu hệ thống sẽ chạy `npm install`, sau đó mở route `/site/hospital`.

Build production:

```text
BUILD_HOSPITAL_DIGITAL_TWIN.cmd
```

## Chạy bằng terminal

```bash
npm install
npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
```

Build:

```bash
npm run build
```

## Phạm vi dữ liệu

Đây là prototype frontend với dữ liệu mô phỏng. Các kênh HIS/EMR, LIS, RIS/PACS, Pharmacy, RTLS, medical devices, MQTT, Modbus, BACnet, EBO, Email và Zalo OA chưa kết nối thiết bị/dịch vụ thật.

Để triển khai thực tế cần backend, cơ sở dữ liệu, authentication/SSO, permission model, integration engine, asset/room master data, point list, clinical interface specification, audit log server-side và quy trình phê duyệt của bệnh viện.
