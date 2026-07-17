# BMS 3D Model Assets

Thư mục dự phòng để đặt các file `.glb` / `.gltf` cục bộ khi thay asset chính thức cho Khu Công nghệ cao.

| Tên file đề xuất | Thiết bị | URL cục bộ |
|---|---|---|
| `ahu.glb` | Air Handling Unit (AHU) | `/models/bms/ahu.glb` |
| `fcu.glb` | Fan Coil Unit (FCU) | `/models/bms/fcu.glb` |
| `vav.glb` | Variable Air Volume (VAV) | `/models/bms/vav.glb` |
| `chiller.glb` | Chiller | `/models/bms/chiller.glb` |
| `plate-heat-exchanger.glb` | Plate Heat Exchanger | `/models/bms/plate-heat-exchanger.glb` |
| `crah-unit.glb` | CRAH Unit | `/models/bms/crah-unit.glb` |

Bản hiện tại vẫn dùng asset tham chiếu từ cấu hình trong `src/app/airport/modules/bms/bmsEquipmentConfig.ts`. Khi có model chính thức, có thể chuyển `modelUrl` sang các URL cục bộ ở trên.

Nếu dùng `.gltf` với texture hoặc `.bin` tách rời, đặt toàn bộ file phụ trong cùng thư mục. Viewer có fallback khi model chưa sẵn sàng.
