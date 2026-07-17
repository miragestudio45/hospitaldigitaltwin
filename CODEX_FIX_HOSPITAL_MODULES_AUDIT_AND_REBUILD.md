# CODEX TASK — AUDIT & REBUILD HOSPITAL-SPECIFIC MODULES

## 0. Mục tiêu

Hãy sửa trực tiếp project **Hospital Digital Twin** hiện có trong workspace/repository hiện tại. Không tạo project mới, không chép đè bằng ZIP cũ và không thay đổi route đang dùng.

Mục tiêu của đợt sửa này là loại bỏ tình trạng **mọi phân hệ đều hiển thị cùng một dashboard KPI + biểu đồ đường + danh sách + capacity bar + timeline**, rồi xây lại đúng ngữ nghĩa nghiệp vụ bệnh viện cho từng phân hệ.

Đây là lỗi nghiêm trọng về Information Architecture và Product UX: ví dụ **Campus & Building Map**, **Indoor Wayfinding**, **Clean / Dirty Flow**, **Critical Power**, **CSSD**, **Blood Bank** hoặc **Medical Device Network** không thể cùng hiển thị một dạng báo cáo line chart.

---

## 1. Phạm vi được khóa — KHÔNG sửa UI/logic

Ba nhóm sau hiện đã được người dùng duyệt và phải giữ nguyên cấu trúc, layout, component và hành vi:

1. **Overview — Hospital Command Center**
   - Giữ ảnh và model hiện tại làm dữ liệu tạm.
   - Không thay Overview 2D/3D, hotspot, drawer, data layers hoặc camera.

2. **Facility Operations & EBO**
   - Không thay `FacilityOperationsModule`, `BmsOperationsModule`, BMS/HVAC, Chiller, Floor Plan, CCTV, Access Control, Fire, Water, Lighting, Vertical Transport, EBO alarms/trends.

3. **Energy, Utilities & ESG — YooEnergy**
   - Không thay UI/logic `EnergyUtilityModule` và route `/site/yooenergy`.

Có thể sửa file i18n dùng chung để loại bỏ nội dung sai, nhưng không được làm thay đổi layout/hành vi của ba nhóm trên.

### Các file cần coi là protected về UI/behavior

- `src/app/airport/overview/AirportOverview2D.tsx`
- `src/app/airport/overview/AirportOverview3D.tsx`
- `src/app/airport/overview/airport3DConfig.ts`
- `src/app/airport/modules/FacilityOperationsModule.tsx`
- `src/app/airport/modules/BmsOperationsModule.tsx`
- `src/app/airport/modules/EnergyUtilityModule.tsx`
- `src/app/energy/YooEnergyPage.tsx`

---

## 2. Kết quả audit source hiện tại

### 2.1. Nguyên nhân gốc

Trong `src/app/airport/modules/AirportModuleContent.tsx`, phần lớn section không có renderer riêng mà rơi vào fallback:

```tsx
<HospitalDomainDashboard ... />
```

`HospitalDomainDashboard` luôn dùng cùng công thức:

1. KPI cards.
2. Một `AirportTrendChart` 96 điểm.
3. `Live operational context`.
4. `Capacity and readiness`.
5. `Live events`.
6. `Operational architecture`.
7. `Coordinated workflow`.

Vì vậy tên section thay đổi nhưng trải nghiệm và cấu trúc dữ liệu gần như giống nhau.

### 2.2. Mức độ ảnh hưởng

Không tính ba nhóm đã khóa (Overview, BMS/EBO, YooEnergy), source có:

- **94 section cần kiểm tra**.
- Chỉ **12 section** có renderer chuyên biệt.
- **82/94 section, tương đương khoảng 87,2%**, đang dùng `HospitalDomainDashboard` generic.

Các renderer chuyên biệt hiện có:

- `HospitalBimExplorer`: 2 section.
- `MedicalAssetRegistry`: 1 section.
- `PatientFlowRegistry`: 3 section nhưng đang dùng cùng một bảng cho cả Command Center, Bed Management và ADT.
- `IntegrationHub`: 1 section.
- `HospitalScenarioStudio`: 5 scenario.

### 2.3. Biểu đồ giả được dùng sai ngữ nghĩa

`getHospitalTrend()` trong `src/app/airport/data/airportMockData.ts` sinh một chuỗi số ngẫu nhiên có dạng giống nhau cho gần như tất cả section. Đây không phải dữ liệu nghiệp vụ có đơn vị và ý nghĩa cụ thể.

Không dùng line chart làm primary visualization cho các section sau:

- Map, Floor Plan, Explorer, Wayfinding.
- Clean/Dirty Flow.
- Restricted/Sterile Zones.
- Fire Compartment/Evacuation.
- Medical Gas topology.
- Critical Power single-line.
- CSSD process.
- Blood Bank inventory.
- Integration/Data Architecture.
- Cybersecurity/Privacy governance.

Chỉ dùng time-series chart khi section thật sự theo dõi một đại lượng biến thiên theo thời gian và phải có:

- Tên metric rõ ràng.
- Đơn vị rõ ràng.
- Legend rõ ràng.
- Baseline/threshold/target hợp lý.
- Dữ liệu mock riêng theo domain, không gọi chung `getHospitalTrend()`.

### 2.4. Lỗi dịch và nội dung KCN còn sót

`src/app/airport/i18n/AirportLanguage.tsx` vẫn có `VI_SECTION_DESC` từ bản KCN. Ví dụ:

```ts
"spatial-command": "Hợp nhất BIM-GIS, dữ liệu khảo sát, quy hoạch, hạ tầng và vận hành trên phạm vi 1.128 ha"
```

Đây chính là lý do giao diện Hospital vẫn hiện “1.128 ha”, khảo sát, quy hoạch và các mô tả KCN.

Ngoài ra file i18n còn nhiều từ khóa Airport/KCN cũ như:

- sân bay, khu công nghệ cao, lô đất, doanh nghiệp, investor, tenant.
- runway, gate, stand, boarding, airside.
- UAV, quy hoạch khu công nghiệp, hạ tầng ngầm.

Phải loại khỏi mọi nội dung user-facing của Hospital.

### 2.5. VNI chưa dịch toàn bộ phần nội dung

Khi chọn VNI, label sidebar được dịch nhưng KPI/panel/content vẫn còn nhiều tiếng Anh:

- `MAPPED ROOMS`, `MAPPED BEDS`.
- `Live operational context`.
- `Capacity and readiness`.
- `Operational architecture`.
- Entity/event text.

Mọi user-facing string của các module sửa mới phải đi qua i18n hoặc có bộ dữ liệu song ngữ.

---

## 3. Kiến trúc code bắt buộc sau khi sửa

### 3.1. Không được giữ generic fallback cho section hợp lệ

Thay cơ chế fallback bằng renderer registry rõ ràng:

```tsx
const HOSPITAL_SECTION_RENDERERS: Record<string, React.ComponentType<SectionProps>> = {
  "spatial-command": ClinicalSpatialCommand,
  "campus-building-map": CampusBuildingMap,
  // ... toàn bộ section trong phạm vi
};
```

Nếu section không có renderer:

- Render `UnsupportedSection` trong development.
- Log rõ section ID bị thiếu.
- Không tự động render một dashboard generic để che lỗi.

### 3.2. Tách file theo domain

Không tiếp tục nhồi toàn bộ logic vào `AirportModuleContent.tsx`.

Cấu trúc đề xuất:

```text
src/app/airport/modules/hospital/
├── shared/
│   ├── HospitalMapShell.tsx
│   ├── HospitalFloorPlan.tsx
│   ├── HospitalStatusMatrix.tsx
│   ├── HospitalProcessFlow.tsx
│   ├── HospitalTopology.tsx
│   ├── HospitalKanban.tsx
│   ├── HospitalSchedule.tsx
│   ├── HospitalDependencyGraph.tsx
│   └── HospitalSectionEmptyState.tsx
├── spatial/
├── patient-flow/
├── clinical/
├── experience/
├── medical-assets/
├── critical-utilities/
├── safety/
├── logistics/
├── intelligence/
└── systems/
```

Tên thư mục/file mới có thể điều chỉnh, nhưng phải tách theo domain và dễ bảo trì.

### 3.3. Được tái sử dụng pattern, không được tái sử dụng một màn hình cho mọi nghiệp vụ

Xây một số pattern dùng chung:

- Map/Floor plan.
- Registry/Table.
- Kanban/Dispatch board.
- Timeline/Schedule.
- Process flow/Sankey.
- Topology/Schematic.
- Compliance matrix.
- Dependency/Impact graph.
- Command dashboard.
- Scenario studio.

Mỗi section phải chọn đúng pattern theo bản chất nghiệp vụ và có dataset riêng.

---

# 4. Yêu cầu chi tiết theo từng module

## MODULE 2 — BIM & Clinical Space Twin

### 4.1 `spatial-command` — Clinical Spatial Command

**Primary view:** Spatial Command, không phải line chart.

Layout đề xuất:

- Trái: cây `Campus → Building → Floor → Department → Room`.
- Giữa: 2D/3D spatial canvas dùng ảnh/model tạm hiện có.
- Phải: context drawer của node đang chọn.
- Layer toggles: clinical departments, rooms/beds, medical assets, medical gas, critical power, isolation, fire compartments, alarms.
- KPI chỉ là HUD nhỏ: mapped rooms, mapped beds, linked assets, active spatial alarms.

Interaction:

- Chọn building/floor/department cập nhật canvas và detail.
- Click room mở room data sheet.
- Click alarm định vị đúng phòng/asset.

### 4.2 `campus-building-map` — Campus & Building Map

**Primary view:** Bản đồ campus thật sự.

- Dùng ảnh Overview hiện tại làm basemap tạm.
- Overlay building polygons/hotspots.
- Hiển thị: tòa điều trị, ngoại trú, chẩn đoán, kỹ thuật, oxygen plant, central plant, parking, ambulance bay, logistics dock.
- Vẽ entrance, ambulance route, visitor route, service route.
- Có legend và bộ lọc building type/status.
- Click building mở drawer: floors, departments, beds, alerts, utilities, occupancy.

### 4.3 `floor-department-explorer`

**Primary view:** Floor plan explorer.

- Building selector + floor selector.
- Mặt bằng 2D tạm dạng SVG/CSS zones nếu chưa có CAD/BIM chính thức.
- Zone theo khoa/phòng với trạng thái màu.
- Search room/department.
- Detail drawer: room count, bed count, operating state, environmental status, linked assets.

### 4.4 `clinical-room-classification`

**Primary view:** Room classification matrix/table.

Columns gợi ý:

- Room ID/name.
- Room type.
- Department.
- Pressure relationship.
- Temperature/RH profile.
- Filtration profile.
- Access class.
- Cleaning class.
- Critical utilities required.
- Data completeness.
- Compliance state.

Không hard-code các ngưỡng như một tuyên bố tuân thủ pháp lý. Dùng cấu hình demo `roomRequirementProfile` và ghi rõ “presentation/demo profile”.

### 4.5 `bed-bay-mapping`

**Primary view:** Bed/Bay map.

- Ward/floor selector.
- Các bed card nằm trên floor plan hoặc ward grid.
- Trạng thái: occupied, ready, cleaning, blocked, isolation, maintenance.
- Click bed mở drawer ở mức vận hành, không hiển thị PII bệnh nhân.
- Có legend và summary theo ward.

### 4.6 `clean-dirty-flow`

**Primary view:** Flow diagram hoặc route overlay.

Hiển thị riêng:

- Patient flow.
- Staff flow.
- Sterile supply flow.
- Soiled linen flow.
- Healthcare waste flow.
- Specimen flow.

Có conflict detection demo và danh sách điểm giao cắt cần kiểm soát. Không dùng line chart.

### 4.7 `restricted-sterile-zones`

**Primary view:** Zone access map + access matrix.

- OR suite, CSSD, pharmacy, lab, ICU, isolation.
- Access level by role.
- Current access events/violations.
- Door/interlock status.
- Airlock/ante-room state nếu phù hợp.

### 4.8 `fire-compartment-evacuation`

**Primary view:** Fire compartment and evacuation map.

- Compartment boundaries.
- Smoke/fire zone.
- Horizontal evacuation routes.
- Refuge areas.
- Assisted-patient count.
- Route capacity.
- Lift status/fire mode.
- Action checklist.

### 4.9 `bim-federation`

Renderer hiện tại có thể giữ nền, nhưng cần:

- Dịch đầy đủ VNI.
- Detail theo node đang chọn, không dùng cùng số liệu cho mọi node.
- Có issue list/version/model discipline.
- Không hiện nội dung KCN.

### 4.10 `spatial-data-cde`

**Primary view:** CDE/document governance.

- Model/document versions.
- Coordination issues.
- Approval status.
- Room data sheets.
- O&M documents.
- Naming/data completeness.
- Change history.

Dùng table, issue board và version timeline; không dùng line chart làm view chính.

---

## MODULE 3 — Patient Flow & Capacity

### 4.11 `flow-command`

Không chỉ dùng một patient table.

Primary layout:

- Arrival forecast.
- Flow funnel: arrival → triage → clinician → diagnostics → disposition → bed/discharge.
- Bottleneck cards.
- Bed and ICU capacity.
- Transfer/discharge board.
- Event list.

Bảng episode chỉ là một panel phụ.

### 4.12 `emergency-operations`

**Primary view:** ED operational board.

- Triage distribution by acuity.
- Waiting buckets.
- Door-to-triage / door-to-doctor.
- Ambulances inbound timeline.
- Resus/bay allocation grid.
- Boarding patients.
- Active escalations.

Không hiển thị một trend vô danh 0–100.

### 4.13 `bed-management`

Không dùng lại PatientFlowRegistry làm view chính.

- Bed board theo ward.
- Status tiles: occupied, ready, cleaning, blocked, isolation, maintenance.
- Expected discharge.
- Transfer request.
- Cleaning turnaround.
- Bed demand forecast.
- Click ward/bed để drill down.

### 4.14 `icu-operations`

- ICU bed cards.
- Ventilator readiness.
- Isolation availability.
- Nurse staffing ratio/coverage.
- Transfer in/out queue.
- Critical equipment availability.
- Critical utility state.

### 4.15 `operating-theatre`

**Primary view:** OR schedule/Gantt.

- Mỗi phòng mổ là một row.
- Case timeline: prep, surgery, recovery, cleaning/turnover.
- Delayed case badges.
- PACU capacity.
- Anaesthesia workstation state.
- CSSD tray readiness.
- Environmental status.

### 4.16 `outpatient-operations`

- Clinic schedule.
- Appointments/check-in/no-show/walk-in.
- Queue by specialty.
- Consultation room status.
- Wait time by clinic.
- Demand forecast.

### 4.17 `diagnostics-capacity`

- CT/MRI/X-ray/Ultrasound/Lab capacity cards.
- Worklist and queue.
- Modality status.
- Turnaround time.
- Priority cases.
- Downtime/maintenance impact.

### 4.18 `admission-transfer-discharge`

Thay bảng generic bằng ADT coordination board:

- Admission queue.
- Transfer requested.
- Bed assigned.
- Ready to move.
- Discharge pending.
- Cleaning pending.
- Completed.

Có owner, SLA, blocker và timestamp.

### 4.19 `staffing-capacity`

- Shift coverage heatmap.
- Required vs available by department/role.
- Skill coverage.
- Overtime/on-call.
- Gaps and escalation.
- Không hiển thị PII cá nhân không cần thiết.

---

## MODULE 4 — Clinical Operations Integration

Module này chỉ hiển thị **trạng thái vận hành và integration**, không giả lập chức năng HIS/EMR và không hiển thị bệnh án chi tiết.

### 4.20 `clinical-systems-overview`

- Application/service topology.
- System status matrix.
- Interface queues.
- Clinical workflow impact.
- Downtime readiness.
- Open incidents.

### 4.21 `his-emr-health`

- HIS/EMR service tiles.
- ADT/order/result interface queues.
- Error/retry list.
- Concurrent load.
- Availability/latency trend có đơn vị.
- Downtime mode and last exercise.

### 4.22 `laboratory-operations`

- Specimen journey flow.
- Analyzer status grid.
- TAT by test group.
- Specimen backlog.
- Critical result queue.
- Rejected/recollected samples.

### 4.23 `ris-pacs-imaging`

- Modality worklist by CT/MRI/X-ray/US.
- PACS/VNA availability.
- DICOM transfer queue.
- Reporting backlog.
- Storage headroom.
- Priority studies.

### 4.24 `pharmacy-medication`

- Medication order pipeline: ordered → verified → prepared → dispensed → delivered.
- STAT orders.
- Dispensing queue.
- Cold-chain state.
- Stock-out risk.
- Delivery status.

### 4.25 `nurse-call`

- Active calls by priority.
- Ward/floor map.
- Response time SLA.
- Escalation state.
- Staff presence/system health.

### 4.26 `critical-results`

- Critical result worklist.
- Source: lab/imaging.
- Department.
- Raised time.
- Acknowledgement state.
- Escalation timer.
- Audit timeline.

Không hiển thị nội dung lâm sàng nhận diện cá nhân.

### 4.27 `clinical-device-connectivity`

- Device class inventory.
- Online/offline/data-quality status.
- Network segment.
- Last message.
- Interface mapping.
- Certificate/firmware warning.
- Department impact.

---

## MODULE 5 — Patient & Visitor Experience

### 4.28 `experience-overview`

- Patient journey stages.
- Digital touchpoint adoption.
- Waiting and navigation status.
- Accessibility issues.
- Service recovery cases.
- Satisfaction/sentiment.

### 4.29 `appointments-checkin`

- Appointment schedule.
- Confirmed/no-show/walk-in.
- Pre-registration status.
- Check-in kiosks and desks.
- Identity/check-in exceptions.

### 4.30 `queue-management`

- Queue board by service.
- Current token.
- Waiting count.
- Predicted wait.
- SLA threshold.
- Load balancing/reassignment action.

### 4.31 `indoor-wayfinding`

**Primary view:** Map/route, tuyệt đối không phải report chart.

- From/to selector.
- Accessible route toggle.
- Avoid restricted/isolation/clean-flow zones.
- Route steps.
- ETA/distance.
- Elevator availability.
- Temporary closure alerts.

Dùng floor plan mock nếu chưa có bản đồ thật.

### 4.32 `visitor-management`

- Visitor registry.
- QR pass state.
- Host/department.
- Visiting window.
- Restricted area access.
- Denied/expired pass events.

### 4.33 `patient-transport`

- Dispatch board.
- Requested/assigned/in-progress/completed.
- Wheelchair/stretcher/porter resources.
- Priority and SLA.
- Route and destination.

### 4.34 `parking-access`

- Parking occupancy map.
- Accessible spaces.
- Drop-off lanes.
- Ambulance route protection.
- Queue at entrances.
- EV charging can remain secondary.

### 4.35 `feedback-service-quality`

- Feedback categories.
- Sentiment summary.
- Service recovery cases.
- SLA/owner/status.
- Department ranking.
- Trend only where metric is satisfaction over time.

---

## MODULE 6 — Medical Equipment & Asset Lifecycle

### 4.36 `fm-overview`

- Asset fleet overview by class and department.
- Availability.
- Critical downtime.
- PM/calibration/recall status.
- Work order backlog.
- Service impact.

Không dùng `HospitalDomainDashboard` chung.

### 4.37 `bim-explorer`

Giữ nền custom hiện tại, nhưng dịch đầy đủ và detail phải thay đổi theo node.

### 4.38 `asset-registry`

Giữ bảng custom hiện tại, bổ sung:

- Filters thực sự hoạt động.
- Equipment class.
- Department/location.
- Availability/cleaning/quarantine.
- Calibration and recall state.
- Click row mở digital thread.

### 4.39 `equipment-location-rtls`

- Floor/department map.
- Mobile asset markers.
- Search asset.
- Last seen.
- Battery/signal state.
- Geofence alert.
- Click marker mở asset drawer.

### 4.40 `equipment-availability`

- Fleet availability by equipment class.
- Ready/in-use/cleaning/maintenance/quarantine/missing.
- Demand vs available by department.
- Transfer/reallocation action.

### 4.41 `maintenance-plans`

- Maintenance calendar.
- PM/condition/predictive/statutory plans.
- Due/overdue.
- Assigned vendor/team.
- Asset criticality.
- Completion compliance.

### 4.42 `work-orders`

- Work order table hoặc kanban.
- Priority, asset, room, department, clinical impact, SLA, assignee, state.
- Detail drawer with timeline/evidence/root cause.

### 4.43 `calibration-compliance`

- Calibration due list.
- Certificates.
- Overdue equipment.
- Quarantine state.
- Safety inspection status.
- Compliance by equipment class.

### 4.44 `recall-field-notice`

- Recall/field safety notice list.
- Manufacturer/model/serial scope.
- Affected assets.
- Located/reconciled/quarantined/closed.
- Owner and deadline.
- Evidence trail.

### 4.45 `warranty-contracts`

- Contract/vendor list.
- Coverage and asset count.
- Start/end/expiry.
- SLA response.
- Cost.
- Warranty claims.
- Upcoming renewals.

---

## MODULE 8 — Critical Utilities & Medical Gases

Medical Gas là life-safety utility, không trình bày như fuel gas của YooEnergy.

### 4.46 `critical-utilities-overview`

- Dependency overview: source → distribution → clinical department.
- Current reserve/autonomy.
- Active alarms.
- N+1/N+2 state.
- Clinical impact summary.
- Response actions.

### 4.47 `medical-gas-overview`

**Primary view:** Medical gas schematic/topology.

- Oxygen source/tank/manifold.
- Medical air compressors.
- Vacuum pumps.
- Ring mains.
- Zone valve boxes.
- Area/master alarms.
- Departments/outlet groups.

### 4.48 `oxygen-supply`

- Tank/manifold level.
- Current flow.
- Reserve hours.
- Consumption forecast.
- Delivery schedule.
- Primary/secondary source.
- Low pressure/reserve alarms.

### 4.49 `medical-air-vacuum`

- Compressor and pump staging.
- Duty/standby state.
- Pressure/vacuum.
- Dew point or quality indicator where appropriate as demo.
- Runtime/maintenance.
- Distribution alarms.

### 4.50 `zone-valves-alarms`

- Building/floor/department hierarchy.
- Zone valve state.
- Area alarm state.
- Affected rooms/beds/services.
- Alarm acknowledgement/escalation.

### 4.51 `critical-power`

**Primary view:** Electrical single-line style schematic.

- Grid feeders.
- Switchboard.
- ATS.
- Generators.
- UPS.
- Essential/life-safety branches.
- Priority loads: ICU, OR, ED, imaging, medical gas, data center.
- Runtime/autonomy.
- Test state.
- Load-shedding order.

### 4.52 `critical-water`

- Water source/tank/pump/RO process schematic.
- Quality parameters.
- Tank/autonomy.
- Dialysis/CSSD/lab dependencies.
- Pump redundancy.
- Active alarms.

### 4.53 `utility-impact-analysis`

**Primary view:** Dependency/impact graph.

Input:

- Chọn utility failure/source/feeder/zone.

Output:

- Affected buildings/departments/rooms.
- Affected beds and clinical services ở mức tổng hợp.
- Reserve time.
- Alternative source.
- Transfer/continuity actions.
- Owners/SOP.

---

## MODULE 10 — Infection Prevention, Safety & Emergency

### 4.54 `infection-safety-overview`

- Integrated risk board.
- Isolation/environment/cleaning/waste/security/fire/incident status.
- Priority events.
- Readiness by domain.

### 4.55 `isolation-room-readiness`

**Primary view:** Room status matrix/grid.

- Room ID/location.
- Occupied/available/cleaning/maintenance.
- Negative pressure state.
- Door state.
- Environmental state.
- HEPA/filter state.
- Last verification.

### 4.56 `pressure-environment`

- Room compliance matrix.
- Positive/negative/neutral relationship.
- Temperature, RH, differential pressure.
- Excursion duration.
- Alarm/acknowledgement.
- Relevant trend per selected room only.

### 4.57 `cleaning-terminal-clean`

- Cleaning task queue/kanban.
- Room/bed.
- Standard vs terminal clean.
- Requested/assigned/in-progress/verification/released.
- SLA and turnaround.
- Bed release integration.

### 4.58 `healthcare-waste`

- Waste type inventory.
- QR manifest chain.
- Collection route.
- Storage time.
- Handover/transport/disposal state.
- Exception list.

### 4.59 `security-overview`

- Security zone map.
- CCTV/access/duress/infant protection/patient wandering events.
- Restricted doors.
- Active incidents.
- Response owner.

### 4.60 `fire-life-safety`

- Fire panels/zones/devices.
- Compartment readiness.
- Suppression/water state.
- Smoke control/fire mode.
- Evacuation routes.
- Active faults and tests.

### 4.61 `emergency-command`

- Incident command board.
- Incident type/code.
- SOP checklist.
- Command roles.
- Resources.
- Communications.
- Affected areas.
- Operational log.

### 4.62 `incident-management`

- Incident registry.
- Severity/domain/location.
- Clinical/operational impact.
- Owner/status/SLA.
- Timeline/evidence/actions/root cause/lessons learned.

---

## MODULE 11 — Hospital Logistics & Support Services

### 4.63 `logistics-command`

- Service demand and task status across pharmacy, blood, CSSD, linen, food, specimens and porter/AGV.
- Priority requests.
- SLA breaches.
- Route/elevator constraints.
- Current resource availability.

### 4.64 `pharmacy-logistics`

- Inventory by class.
- Reorder/stock-out risk.
- Expiry.
- Cold-chain state.
- Replenishment tasks.
- Controlled storage access.
- Delivery rounds.

### 4.65 `blood-bank`

- Inventory by blood group and component.
- Reserved/available/expiring.
- Crossmatch/request queue.
- Storage temperature.
- Delivery chain.
- Emergency shortage alert.

### 4.66 `cssd-sterile-supply`

**Primary view:** CSSD process board.

- Dirty receiving.
- Washing/decontamination.
- Inspection/packing.
- Sterilization.
- Release.
- Sterile storage.
- Delivered to OR.

Có sterilizer state, cycle release, tray readiness và OR case coverage.

### 4.67 `linen-laundry`

- Clean/soiled inventory.
- Ward demand.
- Collection/delivery rounds.
- Processing state.
- Route separation.
- Shortage/contamination exception.

### 4.68 `food-services`

- Meal orders.
- Diet/allergen categories.
- Production batches.
- Tray assembly.
- Delivery rounds.
- Temperature exceptions.
- Late/missed meals.

### 4.69 `specimen-transport`

- Pickup queue.
- Chain of custody.
- Origin/destination.
- Priority.
- Pneumatic tube station/network status.
- Delivery/TAT exceptions.

### 4.70 `porter-agv`

- Dispatch map/board.
- Task type: patient, equipment, material, waste.
- Requested/assigned/en route/in progress/completed.
- Porter/AGV availability.
- Priority, SLA and route.

---

## MODULE 12 — AI, Simulation & Optimization

### 4.71 `intelligence-overview`

- Portfolio of AI/simulation use cases.
- Status, owner, confidence, last validation, operational value and guardrail.
- Model health/data readiness.
- Recommendations requiring approval.

### 4.72–4.76 Scenario sections hiện có

Các scenario custom hiện tại là đúng hướng, nhưng phải nâng cấp:

- Có input controls thực sự, không chỉ nút Run.
- Kết quả thay đổi theo input.
- Có visual output phù hợp: capacity gap, affected zones, timeline, dependency impact.
- Có baseline vs scenario.
- Có confidence/assumptions.
- Có owner, approval, audit và rollback.
- Không tự động điều khiển clinical/life-safety systems.

Áp dụng cho:

- `emergency-surge`
- `mass-casualty`
- `infectious-outbreak`
- `utility-outage`
- `fire-evacuation`

### 4.77 `predictive-maintenance`

- Risk-ranked asset table.
- Failure probability.
- Remaining useful life.
- Criticality.
- Clinical impact.
- Recommended intervention.
- Work order state.
- Evidence/features.

### 4.78 `capacity-forecast`

- Forecast riêng cho ED arrivals, inpatient beds, ICU, OR, diagnostics, oxygen and staffing.
- Multi-series selectable chart có unit.
- Forecast horizon selector.
- Confidence band.
- Constraint/capacity line.
- Recommended capacity action.

### 4.79 `human-governed-optimization`

- Recommendation approval queue.
- Recommendation/evidence/expected impact/risk.
- Owner/approver.
- Approve/reject/request changes.
- Manual override.
- Rollback plan.
- Audit history.

---

## MODULE 13 — Systems, Data, Integration & Cybersecurity

### 4.80 `systems-overview`

- Service topology/status matrix.
- Clinical applications, enterprise, OT, medical devices, spatial, security.
- Availability/latency/data freshness.
- Current incidents.
- Dependency impact.

### 4.81 `integration-hub`

Giữ nền table custom, bổ sung:

- Filter by domain/protocol/status.
- Interface queue/error state.
- Message rate.
- Retry/dead-letter.
- Data contract/version.
- Detail drawer and incident history.

### 4.82 `clinical-data-platform`

- Ingestion → raw/validated/curated → data products.
- Source systems.
- Data products by domain.
- Freshness/quality/owner.
- Lineage and access state.

### 4.83 `edge-architecture`

**Primary view:** Architecture diagram.

- Device/sensor/medical device.
- Edge gateway.
- OT/IoT network.
- Integration/event layer.
- Data platform.
- Applications.
- Security boundaries.

### 4.84 `facility-ot`

- EBO/BMS/SCADA/medical gas/power/water system inventory.
- Protocol/gateway/status.
- Alarm/event pipeline.
- OT zone/segment.
- Integration state.

### 4.85 `medical-device-network`

- Connected device inventory.
- Department/device class.
- Network segment.
- Online/offline.
- Certificate/firmware.
- Vulnerability/risk.
- Last communication.
- Clinical service impact.

### 4.86 `his-lis-ris-pacs`

- Application health matrix.
- Interface queues.
- Storage/backup.
- Recovery priority.
- Downtime procedure readiness.
- Current incidents.

### 4.87 `network-wifi`

- Campus/floor coverage visualization.
- AP/controller status.
- Client count.
- Latency/packet loss/roaming.
- Critical SSIDs/segments.
- Capacity and outage list.

### 4.88 `data-center`

- Rack/compute/storage/network overview.
- UPS/environment.
- Capacity/headroom.
- Backup/replication.
- Failover state.
- RTO/RPO readiness.

### 4.89 `bim-gis`

- BIM/spatial platform service health.
- Model versions.
- Layers.
- Room/asset mapping.
- Data freshness.
- Viewer/integration status.
- Issue list.

### 4.90 `cybersecurity`

- Security posture.
- Active incidents.
- Vulnerabilities by severity.
- Segmentation/zone state.
- Medical device risk.
- Identity/access alerts.
- Response workflow.

### 4.91 `privacy-access`

- Roles and access matrix.
- Privileged access.
- Break-glass events.
- Audit log.
- Masking/minimum-necessary policy state.
- Access review due.

### 4.92 `data-quality`

- Quality score by data domain.
- Completeness/freshness/accuracy/validity/uniqueness/lineage.
- Failed rules.
- Data owner/steward.
- Remediation queue.

### 4.93 `iot-devices`

- Device/gateway registry.
- Connectivity/battery/signal/firmware/calibration.
- Last seen.
- Location.
- Data quality.
- Maintenance/replace action.

### 4.94 `downtime-recovery`

- System recovery priority.
- RTO/RPO.
- Backup/replication.
- Downtime runbook.
- Last exercise.
- Recovery gaps.
- Incident drill timeline.

---

# 5. i18n bắt buộc sửa

## 5.1 Viết lại `VI_SECTION_DESC`

Phải có mô tả Hospital đúng cho toàn bộ section hiện có trong `airportRegistry.ts`.

Xóa/không dùng các mô tả KCN cũ, đặc biệt:

- `1.128 ha`.
- đất đai/lô đất/quy hoạch/nhà đầu tư/doanh nghiệp.
- UAV, khu công nghiệp, tải công nghệ cao.
- airport/runway/gate/stand/airside/boarding.

## 5.2 Dịch toàn bộ nội dung mới

Mọi string user-facing phải hỗ trợ ENG/VNI:

- KPI labels/trends.
- Panel titles/subtitles.
- Column labels.
- Filter options.
- Status labels.
- Entity/event text.
- Buttons/toasts/drawers.
- Map legends.
- Empty/loading/error states.

Không dùng partial phrase replacement cho nội dung nghiệp vụ quan trọng. Ưu tiên data song ngữ hoặc key-based translations.

## 5.3 Quy tắc kiểm tra text

Sau khi sửa, chạy tìm kiếm source và loại bỏ khỏi user-facing content:

```text
1.128 ha
High-Tech Park
Khu Công nghệ cao
investor
lô đất
tenant
semiconductor
runway
boarding
stand allocation
airside
UAV corridor
```

Tên kỹ thuật file/class cũ như `AirportModuleContent` có thể giữ tạm để tránh refactor rủi ro, miễn không hiển thị ra UI.

---

# 6. Data model và mock data

Không dùng một dataset chung cho mọi section.

Tạo các dataset có type rõ ràng, ví dụ:

```text
src/app/airport/data/hospital/
├── spatialData.ts
├── patientFlowData.ts
├── clinicalSystemsData.ts
├── experienceData.ts
├── medicalAssetData.ts
├── criticalUtilitiesData.ts
├── safetyData.ts
├── logisticsData.ts
├── intelligenceData.ts
└── systemsData.ts
```

Yêu cầu:

- Deterministic mock data.
- Không có PII thật.
- Có unit đúng.
- Có trạng thái, timestamp, owner và location.
- Các filter phải thật sự lọc data.
- Các button chính phải có demo interaction hợp lý.
- Không tuyên bố đã kết nối thật với HIS/EMR/LIS/PACS, thiết bị, EBO hoặc medical gas.

Hiển thị notice chung:

- “Presentation data / Dữ liệu trình diễn”.
- “No live clinical or life-safety control / Không điều khiển trực tiếp hệ thống lâm sàng hoặc an toàn sự sống”.

---

# 7. Quy tắc UI/UX

- Giữ nguyên dark navy + cyan/turquoise hiện tại.
- Không redesign header, bottom navigation hoặc sidebar.
- Không làm neon quá mức.
- Data dense nhưng phải dễ đọc.
- Primary visualization phải phản ánh đúng tên section.
- Tránh mỗi section đều có 6 KPI giống nhau.
- Map/explorer phải ưu tiên full-height khi cần.
- Table phải có search/filter/pagination và detail drawer.
- Workflow/kanban phải có status/owner/SLA.
- Schematic/topology phải có legend, status và click drill-down.
- Responsive ở 1366×768, 1440×900 và 1920×1080.
- Không để nội dung bị bottom nav che.

---

# 8. Tiêu chí nghiệm thu bắt buộc

## 8.1 Functional acceptance

- Mỗi section trong 10 module thuộc phạm vi có renderer hợp lệ.
- Không section hợp lệ nào rơi vào `HospitalDomainDashboard` generic.
- Không dùng cùng một primary chart cho các section khác bản chất.
- Map section render map/floor plan.
- Flow section render flow/process/route.
- Schedule section render timeline/Gantt.
- Registry section render table/drawer.
- Utility section render schematic/topology/impact.
- Governance section render matrix/table/architecture.
- Scenario section có input và output thay đổi.

## 8.2 Content acceptance

- Không còn “1.128 ha” trong Hospital UI.
- Không còn mô tả KCN/sân bay ở VNI hoặc ENG.
- VNI không còn body content tiếng Anh tràn lan.
- Medical Gas tách biệt Fuel Gas/YooEnergy.
- Không hiển thị PII thật.
- Không tuyên bố kết nối/control thật.

## 8.3 Regression acceptance

Không làm hỏng:

- `/site/hospital`
- `/site/yooenergy`
- Overview 2D/3D.
- Facility Operations & EBO.
- BMS/HVAC full-height.
- YooEnergy và 48 time slots.
- Sidebar, bottom navigation, launcher, ENG/VNI.

## 8.4 Build/test

Chạy:

```bash
npm install
npm run build
npm run dev
```

Kiểm tra thủ công tất cả module/section ở cả ENG và VNI.

Tạo một script hoặc test dev-only để xác nhận:

- Tổng số section trong registry.
- Tất cả section thuộc phạm vi đều có renderer.
- Không renderer mapping trùng/sai ID.
- Không còn banned user-facing terms.

---

# 9. Thứ tự triển khai

## Phase 1 — P0: sửa kiến trúc và lỗi nhìn thấy ngay

1. Loại bỏ generic fallback.
2. Tạo section renderer registry.
3. Sửa toàn bộ `VI_SECTION_DESC` Hospital.
4. Xây đúng bốn nhóm dễ phát hiện sai nhất:
   - Spatial/Map/Explorer.
   - Patient Flow/Bed/ED/OR.
   - Critical Utilities/Medical Gas/Power.
   - Logistics/CSSD/Blood/Specimen.

## Phase 2 — P1: hoàn thiện vận hành

5. Clinical Operations.
6. Experience.
7. Medical Assets.
8. Safety & Infection Prevention.

## Phase 3 — P1/P2: Data/AI governance

9. Intelligence.
10. Systems/Data/Cybersecurity.
11. Full ENG/VNI QA.
12. Build, smoke test, regression test.

Không dừng ở Phase 1 nếu task được yêu cầu hoàn thiện toàn bộ. Phase chỉ là thứ tự làm việc, kết quả bàn giao phải đủ 10 module trong scope.

---

# 10. Các tham chiếu kỹ thuật để định hướng, không dùng để tuyên bố chứng nhận

- HL7 FHIR: chuẩn trao đổi thông tin y tế điện tử. Chỉ dùng làm lớp integration demo; không hard-code một phiên bản khi chưa biết hệ nguồn.
- DICOM/DICOMweb: dùng cho imaging/PACS interoperability.
- ANSI/ASHRAE/ASHE Standard 170: tham chiếu cho yêu cầu môi trường/ventilation khu chăm sóc y tế. Các target trong demo phải configurable.
- ISO 7396-1: tham chiếu cấu trúc hệ thống đường ống khí y tế, nguồn cấp, phân phối, monitoring và alarms.

Ứng dụng demo không được ghi “compliant/certified” nếu chưa có dữ liệu, thiết kế và kiểm định thực tế.

---

# 11. Yêu cầu báo cáo sau khi Codex hoàn thành

Codex phải trả về:

1. Danh sách file đã tạo/sửa.
2. Bảng mapping `section ID → renderer`.
3. Những section nào dùng map, table, kanban, topology, schedule, matrix hoặc scenario.
4. Kết quả `npm run build`.
5. Kết quả kiểm tra hai route.
6. Kết quả grep banned terms.
7. Các phần vẫn là mock/demo.
8. Xác nhận ba nhóm khóa không bị thay đổi UI/logic.

Không báo “đã xong” nếu chưa build và chưa click kiểm tra từng section.
