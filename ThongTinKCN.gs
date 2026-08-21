/***********************************************************************
 * MODULE: THÔNG TIN TỔNG QUAN KCN LONG THÀNH — 3 NGÔN NGỮ (VI / EN / ZH)
 *  Nguồn dữ liệu : sheet DM_ThongTinKCN
 *  Dùng cho      : thẻ "Giới thiệu KCN" (Tab_GioiThieu.html)
 *  Đặc điểm      : nạp riêng (lazy load) khi mở thẻ, KHÔNG nằm trong
 *                  DU_LIEU_TONG_HOP nên không ảnh hưởng cache dữ liệu chính.
 * Phòng Kinh doanh Tổng hợp — Sonadezi Long Thành
 ***********************************************************************/

const TEN_SHEET_TT_KCN = 'DM_ThongTinKCN';
const CACHE_TT_KCN     = 'TT_KCN_V1';
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
        icon        : String(r.Icon || '').trim(),
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
 ***********************************************************************/
function taoSheetThongTinKCN() {
  const ss = SpreadsheetApp.openById(ID_SHEET);
  let sh = ss.getSheetByName(TEN_SHEET_TT_KCN);
  if (!sh) sh = ss.insertSheet(TEN_SHEET_TT_KCN);

  const tieuDe = ['MaNhom', 'Nhom_VI', 'Nhom_EN', 'Nhom_ZH', 'ThuTu',
                  'Muc_VI', 'Muc_EN', 'Muc_ZH',
                  'GiaTri_VI', 'GiaTri_EN', 'GiaTri_ZH',
                  'Icon', 'NoiBat', 'HienThiKhach'];

  const N = {
    CDT : ['CHUDAUTU', 'Chủ đầu tư', 'Developer', '开发商'],
    VT  : ['VITRI',    'Vị trí & Kết nối giao thông', 'Location & Connectivity', '位置与交通连接'],
    QH  : ['QUYHOACH', 'Quy hoạch sử dụng đất', 'Land Use Plan', '土地使用规划'],
    NX  : ['NHAXUONG', 'Nhà xưởng xây sẵn', 'Ready-built Factory', '现成厂房'],
    DAT : ['DATTHUE',  'Đất cho thuê', 'Land for Lease', '出租土地'],
    HT  : ['HATANG',   'Hạ tầng kỹ thuật', 'Utilities & Infrastructure', '公用基础设施'],
    DT  : ['DAUTU',    'Thu hút đầu tư', 'Investment Attraction', '招商引资'],
    KH  : ['KHAC',     'Thông tin khác', 'Other Information', '其他信息']
  };

  // [nhóm, thứ tự, mục VI, mục EN, mục ZH, giá trị VI, giá trị EN, giá trị ZH, icon, nổi bật, hiện với khách]
  const dl = [
    [N.CDT, 10, 'Tên đơn vị', 'Company', '公司名称',
      'Công ty Cổ phần Sonadezi Long Thành', 'Sonadezi Long Thanh Shareholding Company', '索纳德西隆城股份公司', '🏢', '', 'x'],
    [N.CDT, 20, 'Địa chỉ', 'Address', '地址',
      'KCN Long Thành, xã An Phước, TP. Đồng Nai, Việt Nam', 'Long Thanh IZ, An Phuoc commune, Dong Nai city, Vietnam', '越南同奈市安福社隆城工业区', '📍', '', 'x'],
    [N.CDT, 30, 'Điện thoại', 'Tel', '电话', '84-251-3514494', '84-251-3514494', '84-251-3514494', '☎️', '', 'x'],
    [N.CDT, 40, 'Thư điện tử', 'Email', '电子邮箱', 'longthanhiz@szl.com.vn', 'longthanhiz@szl.com.vn', 'longthanhiz@szl.com.vn', '✉️', '', 'x'],
    [N.CDT, 50, 'Trang thông tin', 'Website', '网站', 'www.szl.com.vn', 'www.szl.com.vn', 'www.szl.com.vn', '🌐', '', 'x'],
    [N.CDT, 60, 'Ngày thành lập KCN', 'Establishment', '工业区成立日期',
      '13/10/2003', 'October 13, 2003', '2003年10月13日', '📅', '', 'x'],

    [N.VT, 110, 'Vị trí', 'Location', '位置',
      'Km 14+500, Quốc lộ 51, TP. Đồng Nai, Việt Nam', 'Km 14+500, National Road 51, Dong Nai city, Vietnam', '越南同奈市51号国道14+500公里处', '📍', '', 'x'],
    [N.VT, 120, 'TP. Hồ Chí Minh', 'Ho Chi Minh City', '胡志明市', '25 km', '25 km', '25 公里', '🏙️', '', 'x'],
    [N.VT, 130, 'Phường Trấn Biên', 'Tran Bien ward', '镇边坊（Tran Bien）', '15 km', '15 km', '15 公里', '🏙️', '', 'x'],
    [N.VT, 140, 'Phường Vũng Tàu', 'Vung Tau ward', '头顿坊（Vung Tau）', '50 km', '50 km', '50 公里', '🏙️', '', 'x'],
    [N.VT, 150, 'Quốc lộ – Cao tốc', 'Highway / Expressway', '国道与高速公路',
      'Tiếp giáp Quốc lộ 51; cách 3 km đến cao tốc TP.HCM – Long Thành – Dầu Giây',
      'Adjacent to National Road 51; 3 km to HCMC – Long Thanh – Dau Giay Expressway',
      '毗邻51号国道；距胡志明市 – Long Thanh – Dau Giay 高速公路 3 公里', '🛣️', '', 'x'],
    [N.VT, 160, 'Cảng Phú Mỹ', 'Phu My Deep Water Port', '富美（Phu My）深水港', '35 km', '35 km', '35 公里', '⚓', '', 'x'],
    [N.VT, 170, 'Cảng Cái Mép – Thị Vải', 'Cai Mep – Thi Vai Deep Water Port', 'Cai Mep – Thi Vai 深水港', '45 km', '45 km', '45 公里', '⚓', '', 'x'],
    [N.VT, 180, 'Cảng Cát Lái (Tân Cảng Sài Gòn)', 'Saigon New Port, Cat Lai', '西贡新港（Cat Lai）', '25 km', '25 km', '25 公里', '⚓', '', 'x'],
    [N.VT, 190, 'Cảng Vũng Tàu', 'Vung Tau Sea Port', '头顿海港', '75 km', '75 km', '75 公里', '⚓', '', 'x'],
    [N.VT, 200, 'Ga Biên Hòa', 'Bien Hoa Railway Station', '边和火车站', '15 km', '15 km', '15 公里', '🚆', '', 'x'],
    [N.VT, 210, 'Ga Sóng Thần', 'Song Than Railway Station', 'Song Than 火车站', '30 km', '30 km', '30 公里', '🚆', '', 'x'],
    [N.VT, 220, 'Sân bay quốc tế Long Thành', 'Long Thanh Int’l Airport', '隆城国际机场', '11 km', '11 km', '11 公里', '✈️', 'x', 'x'],
    [N.VT, 230, 'Sân bay Tân Sơn Nhất', 'Tan Son Nhat Airport', '新山一机场', '50 km', '50 km', '50 公里', '✈️', '', 'x'],

    [N.QH, 310, 'Tổng diện tích', 'Total area', '总面积', '486,91 ha', '486.91 ha', '486.91 公顷', '📐', 'x', 'x'],
    [N.QH, 320, 'Đất công nghiệp', 'Industrial land', '工业用地', '321,92 ha', '321.92 ha', '321.92 公顷', '🏭', 'x', 'x'],
    [N.QH, 330, 'Đất dịch vụ', 'Service land', '服务用地', '10,13 ha', '10.13 ha', '10.13 公顷', '🏬', '', 'x'],
    [N.QH, 340, 'Cây xanh & công trình công cộng', 'Green & public facilities', '绿地与公共设施', '154,86 ha', '154.86 ha', '154.86 公顷', '🌳', '', 'x'],
    [N.QH, 350, 'Tải trọng nền đất', 'Soil loading', '地基承载力', '25 tấn/m²', '25 tons/m²', '25 吨/平方米', '🧱', '', 'x'],

    [N.NX, 410, 'Giá thuê xưởng xây mới', 'Brand-new workshop rental', '全新厂房租金',
      '5,2 USD/m²/tháng', '5.2 USD/m²/month', '5.2 美元/平方米/月', '💵', 'x', 'x'],
    [N.NX, 420, 'Giá thuê xưởng đã qua sử dụng', 'Renew workshop rental', '翻新厂房租金',
      '5,0 USD/m²/tháng', '5.0 USD/m²/month', '5.0 美元/平方米/月', '💵', '', 'x'],
    [N.NX, 430, 'Cách tính tiền thuê', 'Charged on', '计费依据',
      'Tính trên diện tích nhà xưởng và văn phòng; thanh toán theo quý',
      'Charged on factory and office areas; quarterly payment',
      '按厂房及办公室面积计算，按季度支付', 'ℹ️', '', 'x'],
    [N.NX, 440, 'Phí quản lý', 'Management fee', '管理费',
      '1,0 USD/m²/năm (tính trên diện tích đất), thanh toán hằng năm',
      '1.0 USD/m²/year (charged on land area), annual payment',
      '1.0 美元/平方米/年（按土地面积计），按年支付', '🧾', '', 'x'],
    [N.NX, 450, 'Tiền đặt cọc', 'Deposit', '押金',
      'Bằng 06 tháng tiền thuê', 'Equal to 6-month rental', '相当于6个月租金', '🔒', '', 'x'],
    [N.NX, 460, 'Hiệu lực giá', 'Validity', '价格有效期',
      'Giá chưa bao gồm thuế GTGT, áp dụng đến 31/12/2026',
      'All charges exclude VAT and are valid until 31 Dec 2026',
      '以上价格不含增值税，有效期至2026年12月31日', '⏳', '', 'x'],

    [N.DAT, 510, 'Giá thuê lại đất', 'Business space rental', '土地租金',
      '195 USD/m² đến năm 2053, thanh toán một lần', '195 USD/m² until 2053, one-time payment', '195 美元/平方米，租期至2053年，一次性支付', '💵', 'x', 'x'],
    [N.DAT, 520, 'Phí quản lý', 'Management fee', '管理费',
      '1,0 USD/m²/năm, thanh toán hằng năm', '1.0 USD/m²/year, annual payment', '1.0 美元/平方米/年，按年支付', '🧾', '', 'x'],
    [N.DAT, 530, 'Phí sử dụng đất', 'Land using fee', '土地使用费',
      '0,50 USD/m²/năm, thanh toán hằng năm', '0.50 USD/m²/year, annual payment', '0.50 美元/平方米/年，按年支付', '🧾', '', 'x'],
    [N.DAT, 540, 'Hiệu lực giá', 'Validity', '价格有效期',
      'Giá chưa bao gồm thuế GTGT, áp dụng đến 31/12/2026',
      'All charges exclude VAT and are valid until 31 Dec 2026',
      '以上价格不含增值税，有效期至2026年12月31日', '⏳', '', 'x'],

    [N.HT, 610, 'Cấp điện', 'Electricity', '供电',
      '02 trạm biến áp 22 kV, tổng công suất 63 MVA', 'Two 22 kV transformer stations, total capacity 63 MVA', '2座22千伏变电站，总容量63兆伏安', '⚡', '', 'x'],
    [N.HT, 620, 'Giá điện giờ bình thường', 'Normal hours price', '平段电价',
      '1.729 đồng/kWh', 'VND 1,729/kWh', '1,729 越南盾/千瓦时', '⚡', '', 'x'],
    [N.HT, 630, 'Giá điện giờ cao điểm', 'Peak hours price', '高峰电价',
      '3.194 đồng/kWh', 'VND 3,194/kWh', '3,194 越南盾/千瓦时', '⚡', '', 'x'],
    [N.HT, 640, 'Giá điện giờ thấp điểm', 'Off-peak hours price', '低谷电价',
      '1.124 đồng/kWh', 'VND 1,124/kWh', '1,124 越南盾/千瓦时', '⚡', '', 'x'],
    [N.HT, 650, 'Ghi chú giá điện', 'Note on electricity price', '电价说明',
      'Chưa gồm thuế GTGT, cấp điện áp 6–22 kV, áp dụng từ 08/11/2023, thay đổi theo quy định của Nhà nước',
      'Excluding VAT, voltage level 6–22 kV, applied from 08 Nov 2023, subject to Government regulations',
      '不含增值税，电压等级6–22千伏，自2023年11月8日起适用，随政府规定调整', 'ℹ️', '', 'x'],
    [N.HT, 660, 'Cấp nước sạch', 'Water supply', '供水',
      'Công suất 30.000 m³/ngày đêm; giá 11.500 đồng/m³ (chưa gồm thuế GTGT và phí bảo vệ môi trường)',
      'Capacity 30,000 m³/day-night; price VND 11,500/m³ (excluding VAT and environmental protection fee)',
      '供水能力30,000立方米/昼夜；水价11,500越南盾/立方米（不含增值税及环保费）', '💧', '', 'x'],
    [N.HT, 670, 'Xử lý nước thải', 'Wastewater treatment', '污水处理',
      'Công suất 25.000 m³/ngày đêm; phí 0,32 USD/m³ (chưa gồm thuế GTGT); khối lượng tính bằng 80% lượng nước cấp',
      'Capacity 25,000 m³/day-night; fee 0.32 USD/m³ (excluding VAT); chargeable volume equals 80% of water supplied',
      '处理能力25,000立方米/昼夜；处理费0.32美元/立方米（不含增值税）；计费水量为供水量的80%', '♻️', '', 'x'],

    [N.DT, 710, 'Tổng số dự án', 'Total projects', '项目总数', '117 dự án', '117 projects', '117 个项目', '📊', 'x', 'x'],
    [N.DT, 720, 'Tỷ lệ lấp đầy', 'Occupancy', '出租率', '287,86 ha ~ 89,4%', '287.86 ha ~ 89.4%', '287.86 公顷，约 89.4%', '📈', 'x', 'x'],
    [N.DT, 730, 'Tổng vốn đầu tư đăng ký', 'Total registered investment capital', '注册投资总额',
      '1.328 triệu USD', 'US$ 1,328 million', '13.28 亿美元', '💰', 'x', 'x'],
    [N.DT, 740, 'Quốc tịch nhà đầu tư', 'Investor nationalities', '投资者国别',
      'Hàn Quốc 39, Việt Nam 19, Đài Loan 13, Nhật Bản 10, Hồng Kông 07, Singapore 07, Trung Quốc 05, Đức 04, Pháp 04, Hoa Kỳ 03, Seychelles 02, Úc 02, Canada 01, Đan Mạch 01, Phần Lan 01, Indonesia 01, Luxembourg 01, Mauritius 01, Tây Ban Nha 01, Thái Lan 01',
      'Korea 39, Vietnam 19, Taiwan 13, Japan 10, Hong Kong 07, Singapore 07, China 05, Germany 04, France 04, USA 03, Seychelles 02, Australia 02, Canada 01, Denmark 01, Finland 01, Indonesia 01, Luxembourg 01, Mauritius 01, Spain 01, Thailand 01',
      '韩国39、越南19、台湾13、日本10、香港07、新加坡07、中国大陆05、德国04、法国04、美国03、塞舌尔02、澳大利亚02、加拿大01、丹麦01、芬兰01、印度尼西亚01、卢森堡01、毛里求斯01、西班牙01、泰国01', '🌏', '', 'x'],

    [N.KH, 810, 'Lương tối thiểu vùng', 'Minimum salary', '最低工资',
      '5.310.000 đồng/người/tháng', 'VND 5,310,000/month', '5,310,000 越南盾/月', '👷', '', 'x'],
    [N.KH, 820, 'Ngành nghề hạn chế tiếp nhận', 'Restricted industries', '限制引进行业',
      'Xi mạ, chế biến thủy sản, thuốc bảo vệ thực vật, phân bón, sản xuất bột giấy',
      'Electroplating, seafood processing, pesticide, fertilizer, pulp production',
      '电镀、水产加工、农药、化肥、纸浆生产', '🚫', '', 'x'],
    [N.KH, 830, 'Đầu mối liên hệ', 'Contact point', '联系方式',
      'Bà Phạm Thị Thanh Mai – 0986 942 589 – longthanhiz@szl.com.vn',
      'Ms. Pham Thi Thanh Mai – (+84) 986 942 589 – longthanhiz@szl.com.vn',
      '范氏青梅女士 – (+84) 986 942 589 – longthanhiz@szl.com.vn', '📞', '', 'x']
  ];

  const bang = dl.map(function (d) {
    const n = d[0];
    return [n[0], n[1], n[2], n[3], d[1], d[2], d[3], d[4], d[5], d[6], d[7], d[8], d[9], d[10]];
  });

  sh.clear();
  sh.getRange(1, 1, 1, tieuDe.length).setValues([tieuDe])
    .setFontWeight('bold').setBackground('#0f3d5c').setFontColor('#ffffff');
  sh.getRange(2, 1, bang.length, tieuDe.length).setValues(bang);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, bang.length + 1, tieuDe.length).setVerticalAlignment('top').setWrap(true);
  [140, 170, 170, 150, 60, 180, 180, 160, 260, 260, 240, 60, 70, 100]
    .forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });

  try { CacheService.getScriptCache().remove(CACHE_TT_KCN); } catch (e) {}

  try {
    SpreadsheetApp.getUi().alert('✓ Đã tạo/cập nhật sheet ' + TEN_SHEET_TT_KCN +
      ' với ' + bang.length + ' dòng dữ liệu.\n\nMở lại App để xem thẻ "Giới thiệu KCN".');
  } catch (e) { /* chạy từ trình soạn thảo, không có giao diện */ }
}