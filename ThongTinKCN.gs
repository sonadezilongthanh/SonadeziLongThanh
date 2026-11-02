/***********************************************************************
 * MODULE: THÔNG TIN TỔNG QUAN KCN / CCN — 3 NGÔN NGỮ (VI / EN / ZH)
 *  ★ V5.1: thêm cột MaKCN (để trống = 'LT' KCN Long Thành; 'LP' = CCN Long Phước 1)
 *  Nguồn dữ liệu : sheet DM_ThongTinKCN
 *  Dùng cho      : thẻ "Giới thiệu KCN" (Tab_GioiThieu.html)
 *  Đặc điểm      : nạp riêng (lazy load) khi mở thẻ, KHÔNG nằm trong
 *                  DU_LIEU_TONG_HOP nên không ảnh hưởng cache dữ liệu chính.
 * Phòng Kinh doanh Tổng hợp — Sonadezi Long Thành
 ***********************************************************************/

const TEN_SHEET_TT_KCN = 'DM_ThongTinKCN';
const CACHE_TT_KCN     = 'TT_KCN_V2';   // ★ V5.1: thêm trường maKCN
const TTL_TT_KCN       = 600;   // giây

/**
 * Trả về thông tin tổng quan KCN cho giao diện.
 * @param {{token:string}} phien
 * @return {{dong:Array, capNhat:string}}
 */
function layThongTinKCN(phien) {
  phien = phien || {};

  let vaiTro = 'Khach';
  try {
    const p = layPhienTuToken_(phien.token);
    if (p && p.hopLe) vaiTro = String(p.vaiTro || 'Khach').trim();
  } catch (err) { vaiTro = 'Khach'; }

  const cache = CacheService.getScriptCache();
  let goi = null;

  const daCache = cache.get(CACHE_TT_KCN);
  if (daCache) {
    try { goi = JSON.parse(daCache); } catch (e) { goi = null; }
  }

  if (!goi) {
    const ds = docSheet_(TEN_SHEET_TT_KCN, false);

    const dong = ds.map(function (r) {
      return {
        maKCN  : String(r.MaKCN || '').trim().toUpperCase() || 'LT',   // ★ V5.1
        maNhom : String(r.MaNhom || '').trim(),
        nhom   : {
          vi: String(r.Nhom_VI || '').trim(),
          en: String(r.Nhom_EN || '').trim(),
          zh: String(r.Nhom_ZH || '').trim()
        },
        thuTu  : Number(r.ThuTu) || 0,
        muc    : {
          vi: String(r.Muc_VI || '').trim(),
          en: String(r.Muc_EN || '').trim(),
          zh: String(r.Muc_ZH || '').trim()
        },
        giaTri : {
          vi: String(r.GiaTri_VI || '').trim(),
          en: String(r.GiaTri_EN || '').trim(),
          zh: String(r.GiaTri_ZH || '').trim()
        },
        phu    : {
          vi: String(r.PhuChu_VI || '').trim(),
          en: String(r.PhuChu_EN || '').trim(),
          zh: String(r.PhuChu_ZH || '').trim()
        },
        icon        : String(r.Icon || '').trim(),
        kieu        : String(r.KieuHienThi || 'dong').trim() || 'dong',
        maCo        : String(r.MaCo || '').trim().toLowerCase(),
        noiBat      : laCo_(r.NoiBat),
        hienThiKhach: (String(r.HienThiKhach || '').trim() === '') ? true : laCo_(r.HienThiKhach)
      };
    }).filter(function (d) { return d.muc.vi || d.muc.en || d.muc.zh; });

    dong.sort(function (a, b) { return a.thuTu - b.thuTu; });

    goi = { dong: dong, capNhat: Utilities.formatDate(new Date(), 'GMT+7', 'dd/MM/yyyy HH:mm') };

    try { cache.put(CACHE_TT_KCN, JSON.stringify(goi), TTL_TT_KCN); } catch (e) {}
  }

  // Chế độ khách: loại bỏ các dòng không được phép hiển thị
  if (vaiTro === 'Khach') {
    return {
      dong    : goi.dong.filter(function (d) { return d.hienThiKhach; }),
      capNhat : goi.capNhat
    };
  }
  return goi;
}

/***********************************************************************
 * ★ V5.1 — BỔ SUNG THÔNG TIN TỔNG QUAN CCN LONG PHƯỚC 1 (VI / EN / ZH)
 *  Nguồn: "Key features of Long Phuoc 1 Industrial Cluster" (10/2026)
 *         + Bản đồ quy hoạch tổng mặt bằng sử dụng đất CCN Long Phước 1.
 *  Cách dùng: trong GAS Editor chọn hàm themThongTinLongPhuoc → Chạy (01 lần).
 *  • Tự thêm cột MaKCN vào sheet DM_ThongTinKCN nếu chưa có.
 *  • Chỉ xoá & ghi lại các dòng MaKCN = 'LP'; KHÔNG đụng dữ liệu KCN Long Thành.
 *  • Chạy lại nhiều lần vẫn an toàn (không nhân đôi dòng).
 ***********************************************************************/
function themThongTinLongPhuoc() {
  const MA = 'LP';
  const sh = SpreadsheetApp.openById(ID_SHEET).getSheetByName(TEN_SHEET_TT_KCN);
  if (!sh) throw new Error('Không tìm thấy sheet ' + TEN_SHEET_TT_KCN);

  // 1) Bảo đảm có cột MaKCN
  let tieuDe = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0]
                 .map(function (t) { return String(t).trim(); });
  if (tieuDe.indexOf('MaKCN') < 0) {
    sh.getRange(1, tieuDe.length + 1).setValue('MaKCN')
      .setFontWeight('bold').setBackground('#0f3d5c').setFontColor('#ffffff');
    tieuDe.push('MaKCN');
  }
  const viTri = {};
  tieuDe.forEach(function (t, i) { if (t) viTri[t] = i; });
  const can = ['MaNhom', 'Nhom_VI', 'Nhom_EN', 'Nhom_ZH', 'ThuTu', 'Muc_VI', 'Muc_EN', 'Muc_ZH',
               'GiaTri_VI', 'GiaTri_EN', 'GiaTri_ZH', 'Icon', 'NoiBat', 'HienThiKhach', 'MaKCN'];
  can.forEach(function (c) {
    if (!(c in viTri)) throw new Error('Sheet ' + TEN_SHEET_TT_KCN + ' thiếu cột: ' + c);
  });

  // 2) Xoá các dòng Long Phước cũ (duyệt ngược để không lệch chỉ số dòng)
  const soDong = sh.getLastRow();
  if (soDong > 1) {
    const cotMa = sh.getRange(2, viTri.MaKCN + 1, soDong - 1, 1).getValues();
    for (let i = cotMa.length - 1; i >= 0; i--) {
      if (String(cotMa[i][0]).trim().toUpperCase() === MA) sh.deleteRow(i + 2);
    }
  }

  // 3) Dữ liệu — [nhóm, thứ tự, mục VI, EN, ZH, giá trị VI, EN, ZH, icon, nổi bật]
  const N = {
    CDT: ['CHUDAUTU', 'Chủ đầu tư', 'Developer', '开发商'],
    VT : ['VITRI',    'Vị trí & Kết nối giao thông', 'Location & Connectivity', '位置与交通连接'],
    QH : ['QUYHOACH', 'Quy hoạch sử dụng đất', 'Land Use Plan', '土地使用规划'],
    DT : ['DATTHUE',  'Đất cho thuê', 'Land for Lease', '出租土地'],
    HT : ['HATANG',   'Hạ tầng kỹ thuật', 'Utilities & Infrastructure', '公用基础设施'],
    TH : ['DAUTU',    'Thu hút đầu tư', 'Investment Attraction', '招商引资'],
    KH : ['KHAC',     'Thông tin khác', 'Other Information', '其他信息']
  };

  const dl = [
    // ----- CHỦ ĐẦU TƯ -----
    [N.CDT, 10, 'Tên đơn vị', 'Company', '公司名称',
      'Công ty Cổ phần Sonadezi Long Thành', 'Sonadezi Long Thanh Shareholding Company', '索纳德西隆城股份公司', '🏢', ''],
    [N.CDT, 20, 'Địa chỉ', 'Address', '地址',
      'KCN Long Thành, xã An Phước, TP. Đồng Nai, Việt Nam', 'Long Thanh Industrial Zone, An Phuoc commune, Dong Nai city, Vietnam', '越南同奈市安福社隆城工业区', '📍', ''],
    [N.CDT, 30, 'Điện thoại', 'Tel', '电话', '84-251-3514494', '84-251-3514494', '84-251-3514494', '☎️', ''],
    [N.CDT, 40, 'Thư điện tử', 'Email', '电子邮箱', 'longthanhiz@szl.com.vn', 'longthanhiz@szl.com.vn', 'longthanhiz@szl.com.vn', '✉️', ''],
    [N.CDT, 50, 'Trang thông tin', 'Website', '网站', 'www.szl.com.vn', 'www.szl.com.vn', 'www.szl.com.vn', '🌐', ''],
    [N.CDT, 60, 'Ngày thành lập CCN', 'Establishment', '工业集群成立日期',
      '30/09/2016', 'September 30, 2016', '2016年9月30日', '📅', ''],

    // ----- VỊ TRÍ & KẾT NỐI GIAO THÔNG -----
    [N.VT, 110, 'Vị trí', 'Location', '位置',
      'Xã Long Phước, TP. Đồng Nai, Việt Nam', 'Long Phuoc commune, Dong Nai city, Vietnam', '越南同奈市隆福社', '📍', ''],
    [N.VT, 120, 'Trung tâm TP. Hồ Chí Minh', 'Ho Chi Minh City Center', '胡志明市中心', '37 km', '37 km', '37 公里', '🏙️', ''],
    [N.VT, 130, 'TP. Hồ Chí Minh (Khu vực 2 – Bà Rịa – Vũng Tàu cũ)', 'Ho Chi Minh City (Zone 2 – former Ba Ria – Vung Tau)', '胡志明市第二区域（原巴地–头顿省）', '8 km', '8 km', '8 公里', '🏙️', ''],
    [N.VT, 140, 'Phường Trấn Biên', 'Tran Bien ward', '镇边坊（Tran Bien）', '31 km', '31 km', '31 公里', '🏙️', ''],
    [N.VT, 150, 'Quốc lộ 51', 'National Route 51', '51号国道', '2,5 km', '2.5 km', '2.5 公里', '🛣️', 'x'],
    [N.VT, 160, 'Cao tốc TP.HCM – Long Thành – Dầu Giây', 'HCMC – Long Thanh – Dau Giay Expressway', '胡志明市 – Long Thanh – Dau Giay 高速公路', '11 km', '11 km', '11 公里', '🛣️', ''],
    [N.VT, 170, 'Cao tốc Bến Lức – Long Thành', 'Ben Luc – Long Thanh Expressway', 'Ben Luc – Long Thanh 高速公路', '4 km', '4 km', '4 公里', '🛣️', ''],
    [N.VT, 180, 'Cảng nước sâu Phú Mỹ', 'Phu My Deep-water Port', '富美（Phu My）深水港', '14 km', '14 km', '14 公里', '⚓', ''],
    [N.VT, 190, 'Cảng nước sâu Cái Mép – Thị Vải', 'Cai Mep – Thi Vai Deep-water Port', 'Cai Mep – Thi Vai 深水港', '25 km', '25 km', '25 公里', '⚓', ''],
    [N.VT, 200, 'Cảng Cát Lái', 'Cat Lai Port', '吉莱（Cat Lai）港', '32 km', '32 km', '32 公里', '⚓', ''],
    [N.VT, 210, 'Sân bay quốc tế Long Thành', 'Long Thanh International Airport', '隆城国际机场', '14 km', '14 km', '14 公里', '✈️', 'x'],
    [N.VT, 220, 'Sân bay Tân Sơn Nhất', 'Tan Son Nhat Airport', '新山一机场', '45 km', '45 km', '45 公里', '✈️', ''],

    // ----- QUY HOẠCH SỬ DỤNG ĐẤT -----
    [N.QH, 310, 'Tổng diện tích', 'Total area', '总面积', '74,98 ha', '74.98 ha', '74.98 公顷', '📐', 'x'],
    [N.QH, 320, 'Đất công nghiệp', 'Industrial land', '工业用地', '48,67 ha', '48.67 ha', '48.67 公顷', '🏭', 'x'],
    [N.QH, 330, 'Đất dịch vụ', 'Service land', '服务用地', '1,99 ha', '1.99 ha', '1.99 公顷', '🏬', ''],
    [N.QH, 340, 'Cây xanh & công trình công cộng', 'Greenery & public facilities', '绿地与公共设施', '24,32 ha', '24.32 ha', '24.32 公顷', '🌳', ''],
    [N.QH, 350, 'Tải trọng nền đất', 'Ground load capacity', '地基承载力', '9–15 tấn/m²', '9–15 tons/m²', '9–15 吨/平方米', '🧱', ''],
    [N.QH, 360, 'Chỉ tiêu xây dựng lô nhà máy – kho tàng', 'Building indicators for factory – warehouse plots', '厂房–仓储地块建设指标',
      'Mật độ xây dựng tối đa 70%; tầng cao 1–5 tầng', 'Maximum building density 70%; 1–5 storeys', '建筑密度最高70%；层数1–5层', '🏗️', ''],

    // ----- ĐẤT CHO THUÊ -----
    [N.DT, 410, 'Loại hình', 'Product', '产品类型',
      'Đất công nghiệp cho thuê (8 khu đất CN1 – CN8)', 'Industrial land for lease (8 plots CN1 – CN8)', '出租工业用地（CN1–CN8 共8个地块）', '🗺️', ''],
    [N.DT, 420, 'Giá thuê', 'Rental price', '租金',
      'Vui lòng liên hệ Bộ phận Kinh doanh – Tổng hợp', 'Please contact our Sales Department', '请联系我司销售部门', '💵', ''],

    // ----- HẠ TẦNG KỸ THUẬT -----
    [N.HT, 510, 'Cấp điện', 'Power supply', '供电',
      'EVN cấp điện từ lưới điện quốc gia đến ranh lô đất của khách hàng; giá điện theo quy định của EVN',
      'Supplied by EVN from the national grid to the boundary of the customer\'s land plot; electricity prices comply with EVN regulations',
      '由越南电力集团（EVN）从国家电网供电至客户地块边界；电价按EVN规定执行', '⚡', ''],
    [N.HT, 520, 'Giá điện – cấp điện áp từ 110 kV trở lên', 'Electricity price – 110 kV and above', '电价 – 110千伏及以上',
      'Bình thường 1.811 · Thấp điểm 1.146 · Cao điểm 3.266 (đồng/kWh)',
      'Normal 1,811 · Off-peak 1,146 · Peak 3,266 (VND/kWh)',
      '平段 1,811 · 低谷 1,146 · 高峰 3,266（越南盾/千瓦时）', '⚡', ''],
    [N.HT, 530, 'Giá điện – từ 22 kV đến dưới 110 kV', 'Electricity price – 22 kV to under 110 kV', '电价 – 22千伏至110千伏以下',
      'Bình thường 1.833 · Thấp điểm 1.190 · Cao điểm 3.398 (đồng/kWh)',
      'Normal 1,833 · Off-peak 1,190 · Peak 3,398 (VND/kWh)',
      '平段 1,833 · 低谷 1,190 · 高峰 3,398（越南盾/千瓦时）', '⚡', ''],
    [N.HT, 540, 'Giá điện – từ 6 kV đến dưới 22 kV', 'Electricity price – 6 kV to under 22 kV', '电价 – 6千伏至22千伏以下',
      'Bình thường 1.899 · Thấp điểm 1.234 · Cao điểm 3.508 (đồng/kWh)',
      'Normal 1,899 · Off-peak 1,234 · Peak 3,508 (VND/kWh)',
      '平段 1,899 · 低谷 1,234 · 高峰 3,508（越南盾/千瓦时）', '⚡', ''],
    [N.HT, 550, 'Ghi chú giá điện', 'Note on electricity price', '电价说明',
      'Chưa gồm thuế GTGT, thay đổi theo quy định của Nhà nước',
      'Excluding VAT, subject to change under Government regulations',
      '不含增值税，随政府规定调整', 'ℹ️', ''],
    [N.HT, 560, 'Cấp nước sạch', 'Water supply', '供水',
      'Công suất 3.280 m³/ngày đêm; giá 11.500 đồng/m³ (chưa gồm thuế GTGT và phí bảo vệ môi trường)',
      'Capacity 3,280 m³/day-night; price VND 11,500/m³ (excluding VAT and environmental protection fee)',
      '供水能力3,280立方米/昼夜；水价11,500越南盾/立方米（不含增值税及环保费）', '💧', ''],
    [N.HT, 570, 'Xử lý nước thải', 'Wastewater treatment', '污水处理',
      'Công suất 2.500 m³/ngày đêm (nước thải sinh hoạt và công nghiệp); phí 0,32 USD/m³ (chưa gồm thuế GTGT), có thể điều chỉnh tăng tùy nồng độ ô nhiễm; khối lượng tính phí bằng 80% lượng nước cấp',
      'Capacity 2,500 m³/day-night (domestic and industrial wastewater); fee 0.32 USD/m³ (excluding VAT), may be adjusted upward depending on pollutant concentration; chargeable volume equals 80% of water supplied',
      '处理能力2,500立方米/昼夜（生活及工业污水）；处理费0.32美元/立方米（不含增值税），可根据污染物浓度上调；计费水量为供水量的80%', '♻️', ''],
    [N.HT, 580, 'Tiêu chuẩn tiếp nhận nước thải', 'Wastewater acceptance standards', '污水接收标准',
      'pH 5–10; BOD5 ≤ 100 mg/l; COD ≤ 300 mg/l; TSS ≤ 100 mg/l; Tổng N ≤ 40 mg/l; Tổng P ≤ 10 mg/l (chi tiết 34 chỉ tiêu theo phụ lục)',
      'pH 5–10; BOD5 ≤ 100 mg/l; COD ≤ 300 mg/l; TSS ≤ 100 mg/l; Total N ≤ 40 mg/l; Total P ≤ 10 mg/l (34 parameters in full per annex)',
      'pH 5–10；BOD5 ≤ 100 mg/l；COD ≤ 300 mg/l；悬浮物 ≤ 100 mg/l；总氮 ≤ 40 mg/l；总磷 ≤ 10 mg/l（34项指标详见附件）', '🧪', ''],

    // ----- THU HÚT ĐẦU TƯ -----
    [N.TH, 610, 'Lĩnh vực ưu tiên thu hút', 'Priority sectors', '优先引进领域',
      'Logistics, kho bãi và trung tâm phân phối; dịch vụ hỗ trợ sân bay; thương mại phù hợp hệ sinh thái đô thị sân bay Long Thành; công nghiệp hàng không vũ trụ; bán dẫn, chip và trí tuệ nhân tạo; thiết bị tự động hóa; thiết bị công nghệ thông tin',
      'Logistics, warehousing and distribution centers; airport support services; commercial fields compatible with the Long Thanh airport urban ecosystem; aerospace industry; semiconductor, chip and artificial intelligence industries; automation equipment; information technology equipment',
      '物流、仓储及配送中心；机场配套服务；与隆城机场城市生态系统相配套的商业领域；航空航天工业；半导体、芯片及人工智能产业；自动化设备；信息技术设备', '🎯', ''],

    // ----- THÔNG TIN KHÁC -----
    [N.KH, 710, 'Lương tối thiểu vùng', 'Regional minimum wage', '地区最低工资',
      '5.310.000 đồng/người/tháng', 'VND 5,310,000/month', '5,310,000 越南盾/月', '👷', ''],
    [N.KH, 720, 'Đầu mối liên hệ', 'Contact point', '联系方式',
      'Bà Phạm Thị Thanh Mai – 0986 942 589 – longthanhiz@szl.com.vn',
      'Ms. Pham Thi Thanh Mai – (+84) 986 942 589 – longthanhiz@szl.com.vn',
      '范氏青梅女士 – (+84) 986 942 589 – longthanhiz@szl.com.vn', '📞', '']
  ];

  // 4) Ghi theo tên cột, định dạng văn bản để Sheets không tự đổi ngày/số
  const bang = dl.map(function (d) {
    const n = d[0];
    const o = new Array(tieuDe.length).fill('');
    o[viTri.MaNhom] = n[0]; o[viTri.Nhom_VI] = n[1]; o[viTri.Nhom_EN] = n[2]; o[viTri.Nhom_ZH] = n[3];
    o[viTri.ThuTu]  = d[1];
    o[viTri.Muc_VI] = d[2]; o[viTri.Muc_EN] = d[3]; o[viTri.Muc_ZH] = d[4];
    o[viTri.GiaTri_VI] = d[5]; o[viTri.GiaTri_EN] = d[6]; o[viTri.GiaTri_ZH] = d[7];
    o[viTri.Icon] = d[8]; o[viTri.NoiBat] = d[9]; o[viTri.HienThiKhach] = 'x';
    o[viTri.MaKCN] = MA;
    return o;
  });

  const dongDau = sh.getLastRow() + 1;
  const vung = sh.getRange(dongDau, 1, bang.length, tieuDe.length);
  vung.setNumberFormat('@');
  vung.setValues(bang.map(function (r) { return r.map(function (v) { return String(v); }); }));
  sh.getRange(dongDau, viTri.ThuTu + 1, bang.length, 1).setNumberFormat('0')
    .setValues(bang.map(function (r) { return [Number(r[viTri.ThuTu])]; }));
  vung.setVerticalAlignment('top').setWrap(true);

  try { CacheService.getScriptCache().removeAll([CACHE_TT_KCN, 'TT_KCN_V1']); } catch (e) {}

  const tb = '✓ Đã ghi ' + bang.length + ' dòng thông tin CCN Long Phước 1 (MaKCN = LP) vào sheet '
           + TEN_SHEET_TT_KCN + '.\nMở lại App → thẻ "Giới thiệu KCN" → chọn "CCN Long Phước 1".';
  try { SpreadsheetApp.getUi().alert(tb); } catch (e) { console.log(tb); }
  return bang.length;
}

/** Nhận diện giá trị Có/True/1/x */
function laCo_(v) {
  const s = String(v === undefined || v === null ? '' : v).trim().toLowerCase();
  return (s === 'x' || s === 'có' || s === 'co' || s === 'true' || s === '1' || s === 'yes' || s === 'y');
}

/***********************************************************************
 * KHỞI TẠO / CẬP NHẬT SHEET DM_ThongTinKCN
 *  Chạy 01 lần từ bảng chọn "⚙ Hệ thống KCN" hoặc từ trình soạn thảo.
 *  ⚠ Ghi đè toàn bộ nội dung sheet DM_ThongTinKCN bằng dữ liệu gốc
 *    trích từ hồ sơ giới thiệu KCN (bản tiếng Anh 28/7/2026).
 *  ⚠ ★ V5.1: KHÔNG chạy lại hàm này — sheet hiện đã được biên tập thủ công
 *    và có thêm dữ liệu CCN Long Phước 1; chạy lại sẽ XOÁ toàn bộ.
 ***********************************************************************/
function taoSheetThongTinKCN() {
  const ss = SpreadsheetApp.openById(ID_SHEET);
  let sh = ss.getSheetByName(TEN_SHEET_TT_KCN);
  if (!sh) sh = ss.insertSheet(TEN_SHEET_TT_KCN);

  const tieuDe = ['MaNhom', 'Nhom_VI', 'Nhom_EN', 'Nhom_ZH', 'ThuTu',
                  'Muc_VI', 'Muc_EN', 'Muc_ZH',
                  'GiaTri_VI', 'GiaTri_EN', 'GiaTri_ZH',
                  'PhuChu_VI', 'PhuChu_EN', 'PhuChu_ZH',
                  'Icon', 'KieuHienThi', 'MaCo', 'NoiBat', 'HienThiKhach'];

  const N = {
    QM  : ['QUYMO',   'Quy mô dự án', 'Project Scale', '项目规模'],
    VT  : ['VITRI',   'Vị trí chiến lược', 'Strategic Location', '战略位置'],
    GIA : ['GIATHUE', 'Giá thuê', 'Rental Price', '租金'],
    HT  : ['HATANG',  'Hạ tầng kỹ thuật', 'Utilities', '公用基础设施'],
    DT  : ['DAUTU',   'Thu hút đầu tư', 'Investment Attraction', '招商引资'],
    KH  : ['KHAC',    'Thông tin khác', 'Other Information', '其他信息']
  };

  // [nhóm, thứ tự, mục VI, mục EN, mục ZH, giá trị VI, giá trị EN, giá trị ZH, icon, nổi bật, hiện với khách]
  const dl = [
    [N.QM, 10, 'hecta tổng diện tích', 'hectares total area', '公顷 总面积', '486,91', '486.91', '486.91', '', '', '', '', 'soLieu', '', 'x', 'x'],
    [N.QM, 20, 'tỷ lệ lấp đầy', 'occupancy rate', '出租率', '89,4%', '89.4%', '89.4%', '', '', '', '', 'soLieu', '', 'x', 'x'],
    [N.QM, 30, 'dự án đầu tư', 'investment projects', '投资项目', '117', '117', '117', '', '', '', '', 'soLieu', '', 'x', 'x'],
    [N.QM, 40, 'Đất công nghiệp', 'Industrial land', '工业用地', '321,92 ha', '321.92 ha', '321.92 公顷', '', '', '', '', 'chip', '', '', 'x'],
    [N.QM, 50, 'Dịch vụ', 'Service land', '服务用地', '10,13 ha', '10.13 ha', '10.13 公顷', '', '', '', '', 'chip', '', '', 'x'],
    [N.QM, 60, 'Cây xanh', 'Green area', '绿地', '154,86 ha', '154.86 ha', '154.86 公顷', '', '', '', '', 'chip', '', '', 'x'],
    [N.QM, 70, 'Thành lập', 'Establishment', '成立', '13/10/2003', 'October 13, 2003', '2003年10月13日', '', '', '', '📅', 'dong', '', '', 'x'],
    [N.QM, 80, 'Tải trọng nền đất', 'Soil loading', '地基承载力', '25 tấn/m²', '25 tons/m²', '25 吨/平方米', '', '', '', '🧱', 'dong', '', '', 'x'],
    [N.VT, 110, 'Sân bay Long Thành', 'Long Thanh Airport', '隆城国际机场', '11 km', '11 km', '11 公里', '', '', '', '✈️', 'bieuTuong', '', 'x', 'x'],
    [N.VT, 120, 'Cảng Cát Lái', 'Cat Lai Port', '吉莱港', '25 km', '25 km', '25 公里', '', '', '', '⚓', 'bieuTuong', '', '', 'x'],
    [N.VT, 130, 'TP. Hồ Chí Minh', 'Ho Chi Minh City', '胡志明市', '25 km', '25 km', '25 公里', '', '', '', '🏙️', 'bieuTuong', '', '', 'x'],
    [N.VT, 140, 'Cái Mép – Thị Vải', 'Cai Mep – Thi Vai', 'Cai Mep – Thi Vai', '45 km', '45 km', '45 公里', '', '', '', '🚢', 'bieuTuong', '', '', 'x'],
    [N.VT, 150, '', '', '', 'Tiếp giáp Quốc lộ 51 · cách 3 km cao tốc TP.HCM – Long Thành – Dầu Giây · Ga Biên Hòa 15 km', 'Adjacent to National Road 51 · 3 km to HCMC – Long Thanh – Dau Giay Expressway · 15 km to Bien Hoa Station', '毗邻51号国道 · 距高速公路3公里 · 距边和火车站15公里', '', '', '', '', 'phuDe', '', '', 'x'],
    [N.VT, 160, 'Vị trí', 'Location', '位置', 'Km 14+500, Quốc lộ 51, TP. Đồng Nai', 'Km 14+500, National Road 51, Dong Nai city', '同奈市51号国道14+500公里处', '', '', '', '📍', 'dong', '', '', 'x'],
    [N.VT, 170, 'Cảng Phú Mỹ', 'Phu My Port', '富美港', '35 km', '35 km', '35 公里', '', '', '', '⚓', 'dong', '', '', 'x'],
    [N.VT, 180, 'Cảng Vũng Tàu', 'Vung Tau Port', '头顿海港', '75 km', '75 km', '75 公里', '', '', '', '⚓', 'dong', '', '', 'x'],
    [N.VT, 190, 'Ga Sóng Thần', 'Song Than Station', 'Song Than 火车站', '30 km', '30 km', '30 公里', '', '', '', '🚆', 'dong', '', '', 'x'],
    [N.VT, 200, 'Sân bay Tân Sơn Nhất', 'Tan Son Nhat Airport', '新山一机场', '50 km', '50 km', '50 公里', '', '', '', '✈️', 'dong', '', '', 'x'],
    [N.GIA, 210, 'Nhà xưởng xây sẵn', 'Ready-built factory', '现成厂房', '5,2 USD', '5.2 USD', '5.2 美元', 'm²/tháng · xưởng xây mới||Xưởng đã qua sử dụng 5,0 USD · đặt cọc 06 tháng', 'm²/month · brand-new||Renewed workshop 5.0 USD · deposit 6 months', '平方米/月 · 全新厂房||翻新厂房 5.0 美元 · 押金6个月', '🏭', 'theGia', '', 'x', 'x'],
    [N.GIA, 220, 'Đất cho thuê', 'Land for lease', '出租土地', '195 USD', '195 USD', '195 美元', 'm² · trả một lần đến 2053||Phí quản lý 1,0 USD · phí sử dụng đất 0,50 USD /m²/năm', 'm² · one-time payment until 2053||Management fee 1.0 USD · land using fee 0.50 USD /m²/year', '平方米 · 一次性支付至2053年||管理费 1.0 美元 · 土地使用费 0.50 美元/平方米/年', '🗺️', 'theGia', '', 'x', 'x'],
    [N.GIA, 230, '', '', '', 'Giá chưa gồm thuế giá trị gia tăng, áp dụng đến 31/12/2026', 'All charges exclude VAT and are valid until 31 Dec 2026', '以上价格不含增值税，有效期至2026年12月31日', '', '', '', '', 'ghiChu', '', '', 'x'],
    [N.GIA, 240, 'Cách tính tiền thuê xưởng', 'Charged on', '厂房计费依据', 'Diện tích nhà xưởng và văn phòng, thanh toán theo quý', 'Factory and office areas, quarterly payment', '按厂房及办公室面积，按季度支付', '', '', '', 'ℹ️', 'dong', '', '', 'x'],
    [N.GIA, 250, 'Phí quản lý', 'Management fee', '管理费', '1,0 USD/m²/năm', '1.0 USD/m²/year', '1.0 美元/平方米/年', '', '', '', '🧾', 'dong', '', '', 'x'],
    [N.GIA, 260, 'Phí sử dụng đất', 'Land using fee', '土地使用费', '0,50 USD/m²/năm', '0.50 USD/m²/year', '0.50 美元/平方米/年', '', '', '', '🧾', 'dong', '', '', 'x'],
    [N.GIA, 270, 'Tiền đặt cọc', 'Deposit', '押金', 'Bằng 06 tháng tiền thuê', 'Equal to 6-month rental', '相当于6个月租金', '', '', '', '🔒', 'dong', '', '', 'x'],
    [N.HT, 310, '', '', '', '63 MVA', '63 MVA', '63 兆伏安', '02 trạm 22 kV · 1.729 đồng/kWh', 'Two 22 kV stations · VND 1,729/kWh', '2座22千伏变电站 · 1,729越南盾/千瓦时', '⚡', 'bieuTuong', '', '', 'x'],
    [N.HT, 320, '', '', '', '30.000 m³', '30,000 m³', '30,000 立方米', 'mỗi ngày đêm · 11.500 đồng/m³', 'per day-night · VND 11,500/m³', '每昼夜 · 11,500越南盾/立方米', '💧', 'bieuTuong', '', '', 'x'],
    [N.HT, 330, '', '', '', '25.000 m³', '25,000 m³', '25,000 立方米', 'xử lý nước thải · 0,32 USD/m³', 'wastewater treatment · 0.32 USD/m³', '污水处理 · 0.32美元/立方米', '♻️', 'bieuTuong', '', '', 'x'],
    [N.HT, 340, 'Giá điện giờ cao điểm', 'Peak hours price', '高峰电价', '3.194 đồng/kWh', 'VND 3,194/kWh', '3,194 越南盾/千瓦时', '', '', '', '⚡', 'dong', '', '', 'x'],
    [N.HT, 350, 'Giá điện giờ thấp điểm', 'Off-peak hours price', '低谷电价', '1.124 đồng/kWh', 'VND 1,124/kWh', '1,124 越南盾/千瓦时', '', '', '', '⚡', 'dong', '', '', 'x'],
    [N.HT, 360, 'Khối lượng nước thải tính phí', 'Chargeable wastewater volume', '污水计费水量', '80% lượng nước cấp', '80% of water supplied', '供水量的80%', '', '', '', '♻️', 'dong', '', '', 'x'],
    [N.HT, 370, 'Ghi chú giá', 'Note on prices', '价格说明', 'Chưa gồm thuế GTGT, thay đổi theo quy định của Nhà nước', 'Excluding VAT, subject to Government regulations', '不含增值税，随政府规定调整', '', '', '', 'ℹ️', 'dong', '', '', 'x'],
    [N.DT, 410, '', '', '', '117 dự án từ 20 quốc gia · tổng vốn đăng ký 1.328 triệu USD', '117 projects from 20 countries · total registered capital US$ 1,328 million', '来自20个国家的117个项目 · 注册投资总额13.28亿美元', '', '', '', '', 'phuDe', '', '', 'x'],
    [N.DT, 420, 'Hàn Quốc', 'Korea', '韩国', '39', '39', '39', '', '', '', '', 'bieuDo', 'kr', '', 'x'],
    [N.DT, 430, 'Việt Nam', 'Vietnam', '越南', '19', '19', '19', '', '', '', '', 'bieuDo', 'vn', '', 'x'],
    [N.DT, 440, 'Đài Loan', 'Taiwan', '台湾', '13', '13', '13', '', '', '', '', 'bieuDo', 'tw', '', 'x'],
    [N.DT, 450, 'Nhật Bản', 'Japan', '日本', '10', '10', '10', '', '', '', '', 'bieuDo', 'jp', '', 'x'],
    [N.DT, 460, 'Hồng Kông', 'Hong Kong', '香港', '7', '7', '7', '', '', '', '', 'bieuDo', 'hk', '', 'x'],
    [N.DT, 470, 'Singapore', 'Singapore', '新加坡', '7', '7', '7', '', '', '', '', 'bieuDo', 'sg', '', 'x'],
    [N.DT, 480, 'Khác', 'Others', '其他', '22', '22', '22', '', '', '', '', 'bieuDo', '', '', 'x'],
    [N.DT, 490, 'Các quốc gia khác', 'Other countries', '其他国家', 'Trung Quốc 05, Đức 04, Pháp 04, Hoa Kỳ 03, Úc 02, Seychelles 02, Canada 01, Đan Mạch 01, Phần Lan 01, Indonesia 01, Luxembourg 01, Mauritius 01, Tây Ban Nha 01, Thái Lan 01', 'China 05, Germany 04, France 04, USA 03, Australia 02, Seychelles 02, Canada 01, Denmark 01, Finland 01, Indonesia 01, Luxembourg 01, Mauritius 01, Spain 01, Thailand 01', '中国大陆05、德国04、法国04、美国03、澳大利亚02、塞舌尔02、加拿大01、丹麦01、芬兰01、印度尼西亚01、卢森堡01、毛里求斯01、西班牙01、泰国01', '', '', '', '🌏', 'dong', '', '', 'x'],
    [N.KH, 510, '', '', '', 'Lương tối thiểu vùng 5.310.000 đồng/tháng · tải trọng nền 25 tấn/m²', 'Minimum salary VND 5,310,000/month · soil loading 25 tons/m²', '最低工资5,310,000越南盾/月 · 地基承载力25吨/平方米', '', '', '', '', 'phuDe', '', '', 'x'],
    [N.KH, 520, '', '', '', 'Ngành nghề hạn chế tiếp nhận: xi mạ, chế biến thủy sản, thuốc bảo vệ thực vật, phân bón, bột giấy', 'Restricted industries: electroplating, seafood processing, pesticide, fertilizer, pulp production', '限制引进行业：电镀、水产加工、农药、化肥、纸浆生产', '', '', '', '', 'ghiChu', '', '', 'x'],
    [N.KH, 530, 'Chủ đầu tư', 'Developer', '开发商', 'Công ty Cổ phần Sonadezi Long Thành', 'Sonadezi Long Thanh Shareholding Company', '索纳德西隆城股份公司', '', '', '', '🏢', 'dong', '', '', 'x'],
    [N.KH, 540, 'Địa chỉ', 'Address', '地址', 'KCN Long Thành, xã An Phước, TP. Đồng Nai', 'Long Thanh IZ, An Phuoc commune, Dong Nai city', '同奈市安福社隆城工业区', '', '', '', '📍', 'dong', '', '', 'x'],
    [N.KH, 550, 'Đầu mối liên hệ', 'Contact point', '联系方式', 'Bà Phạm Thị Thanh Mai – 0986 942 589', 'Ms. Pham Thi Thanh Mai – (+84) 986 942 589', '范氏青梅女士 – (+84) 986 942 589', '', '', '', '📞', 'dong', '', '', 'x'],
  ];

  const bang = dl.map(function (d) {
    const n = d[0];
    return [n[0], n[1], n[2], n[3], d[1],
            d[2], d[3], d[4],
            d[5], d[6], d[7],
            d[8], d[9], d[10],
            d[11] || '', d[12] || 'dong', d[13] || '', d[14] || '', d[15] || 'x'];
  });

  sh.clear();
  sh.getRange(1, 1, 1, tieuDe.length).setValues([tieuDe])
    .setFontWeight('bold').setBackground('#0f3d5c').setFontColor('#ffffff');
  sh.getRange(2, 1, bang.length, tieuDe.length).setValues(bang);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, bang.length + 1, tieuDe.length).setVerticalAlignment('top').setWrap(true);
  [130, 160, 160, 140, 55, 175, 175, 155, 230, 230, 210, 230, 230, 210, 55, 105, 55, 65, 95]
    .forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });

  try { CacheService.getScriptCache().remove(CACHE_TT_KCN); } catch (e) {}

  try {
    SpreadsheetApp.getUi().alert('✓ Đã tạo/cập nhật sheet ' + TEN_SHEET_TT_KCN +
      ' với ' + bang.length + ' dòng dữ liệu.\n\nMở lại App để xem thẻ "Giới thiệu KCN".');
  } catch (e) { /* chạy từ trình soạn thảo, không có giao diện */ }
}