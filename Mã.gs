/***********************************************************************
 * HỆ THỐNG TRA CỨU & BẢN ĐỒ KCN LONG THÀNH — PHIÊN BẢN 4.0
 *  ★ V3.0–3.3: xem lịch sử trong bản sao lưu.
 *  ★ V4.0 (23/07/2026) — XÁC THỰC THEO TÀI KHOẢN CÁ NHÂN:
 *     • Mỗi người dùng 01 tài khoản riêng (Email + mật khẩu cá nhân),
 *       lưu tại sheet DM_PhanQuyen, mật khẩu chỉ lưu dạng băm SHA-256.
 *     • ĐÃ GỠ BỎ hoàn toàn cơ chế "Mã khoá chỉnh sửa" và "Mật khẩu xem"
 *       dùng chung. Quyền thao tác do VAI TRÒ quyết định:
 *         QuanTri  — xem tất cả + sửa + quản lý tài khoản
 *         NhapLieu — xem tất cả + sửa
 *         ChiXem   — xem tất cả, không sửa
 *         Khach    — không đăng nhập; thông tin nội bộ bị lọc TỪ SERVER
 *     • Nhật ký NhatKy ghi EMAIL lấy từ token đã xác thực → truy vết
 *       chính xác, không thể khai tên người khác như trước.
 *  ⚠ PHỤ THUỘC: bắt buộc phải có file TaiKhoan.js trong cùng dự án.
 * Phòng Kinh doanh Tổng hợp — Sonadezi Long Thành
 ***********************************************************************/

// ===== CẤU HÌNH =====
const ID_SHEET = '1hL3_avZm09wgM3MXrJ4CEjRRHhi-6Q9w_iBHsGVxGwE';

const TEN_SHEET = {
  NHA_XUONG : 'DS_NhaXuong',
  CUM       : 'DS_Cum',
  TAI_LIEU  : 'DS_TaiLieu',
  TRANG_THAI: 'DM_TrangThai',
  PHAN_QUYEN: 'DM_PhanQuyen',
  CAU_HINH  : 'DM_CauHinh',
  NHAT_KY   : 'NhatKy'
};

const THOI_GIAN_CACHE = 300; // giây

/***********************************************************************
 * ★ V4.0 — CÁC KHOÁ CẤU HÌNH CŨ (đã ngừng sử dụng)
 *  Giữ tên hằng số để tiếp tục XOÁ 2 dòng này khỏi dữ liệu gửi về trình
 *  duyệt, phòng trường hợp sheet DM_CauHinh vẫn còn lưu mật khẩu cũ.
 *  → Nên xoá hẳn 2 dòng "MaKhoaChinhSua" và "MatKhauXem" trong DM_CauHinh.
 ***********************************************************************/
const KHOA_CAU_HINH_MA_SUA = 'MaKhoaChinhSua';
const KHOA_CAU_HINH_MK_XEM = 'MatKhauXem';

/***********************************************************************
 * DANH SÁCH CỘT NỘI BỘ BỊ ẨN VỚI CHẾ ĐỘ KHÁCH
 *  Cấu trúc bám theo 2 biểu mẫu "KHÁCH HÀNG THUÊ XƯỞNG" và
 *  "KHÁCH HÀNG THUÊ ĐẤT" do Phòng KD-TH ban hành.
 *  Các tên có/không hậu tố "(USD)" đều liệt kê để phòng đổi tiêu đề Sheet.
 ***********************************************************************/
const COT_AN_KHACH_CHUNG = [
  'QuocTich',
  'NganhNghe_SanPham',
  'NganhNghe',
  'TongVonDauTu_USD',
  'SoHopDong',
  'NgayHopDong',
  'BanThoaThuan - So',
  'BanThoaThuan - Ngay',
  'BanThoaThuan - NgayHetHan',
  'PhiQuanLy (USD)',
  'PhiQuanLy',
  'ThoiHanThue',
  'ThoiHanThue_ChiTiet',
  'TinhTrangHoatDong',
  'GiayCNDT',
  'GiayCNDN',
  'NguoiDaiDien',
  'GhiChu',
  'Ghi chú'
];

const COT_AN_KHACH_RIENG_NHA_XUONG = [
  'NhaXuongSo',
  'DienTichXuong_m2',
  'DienTichKhuDat_m2',
  'TienThueXuong - DonGia (USD)',
  'TienThueXuong - DonGia',
  'TienThueXuong - PTThanhToan'
];

const COT_AN_KHACH_RIENG_DAT = [
  'LoDatThue',
  'Tong DienTichDatThue (m2)',
  'DienTichDatThueThem (m2)',
  'TienThueMatBang - DonGia (USD)',
  'TienThueMatBang - DonGia',
  'TienThueMatBang - PTThanhToan',
  'TienDatTho - DonGia (USD)',
  'TienDatTho - DonGia',
  'TienDatTho - PTThanhToan'
];

const COT_AN_KHACH_NHA_XUONG = COT_AN_KHACH_CHUNG.concat(COT_AN_KHACH_RIENG_NHA_XUONG);
const COT_AN_KHACH_DAT       = COT_AN_KHACH_CHUNG.concat(COT_AN_KHACH_RIENG_DAT);

/***********************************************************************
 * ★★★ CỜ CHẾ ĐỘ THỬ NGHIỆM
 *  ⚠ PHẢI để false — nếu bật true, mọi người (kể cả khách) được đánh dấu
 *    "xem đầy đủ". Chỉ bật tạm khi cần gỡ lỗi.
 ***********************************************************************/
const CHE_DO_THU_NGHIEM = false;


/***********************************************************************
 * ĐIỂM VÀO WEB APP
 ***********************************************************************/
function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('KCN Long Thành')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .addMetaTag('apple-mobile-web-app-capable', 'yes')
    .addMetaTag('mobile-web-app-capable', 'yes')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(tenFile) {
  return HtmlService.createHtmlOutputFromFile(tenFile).getContent();
}


/***********************************************************************
 * TIỆN ÍCH
 ***********************************************************************/
function docSheet_(tenSheet, batBuoc) {
  const sheet = SpreadsheetApp.openById(ID_SHEET).getSheetByName(tenSheet);
  if (!sheet) {
    if (batBuoc) throw new Error('Không tìm thấy sheet: ' + tenSheet);
    return [];
  }

  const vung = sheet.getDataRange().getValues();
  if (vung.length < 2) return [];

  const tieuDe = vung.shift().map(function (t) { return String(t).trim(); });

  return vung
    .filter(function (d) { return String(d[0]).trim() !== ''; })
    .map(function (dong) {
      const obj = {};
      tieuDe.forEach(function (cot, i) {
        if (!cot) return;
        let v = dong[i];
        if (v instanceof Date) v = Utilities.formatDate(v, 'GMT+7', 'dd/MM/yyyy');
        // Nếu 2 cột trùng tên tiêu đề, KHÔNG cho giá trị rỗng của cột sau
        // ghi đè lên giá trị đã có của cột trước.
        if ((v === '' || v === null || v === undefined) && obj[cot] !== undefined && obj[cot] !== '') {
          return;
        }
        obj[cot] = v;
      });
      return obj;
    });
}

/** Trích ID file từ link Google Drive bất kỳ */
function layIdDrive_(link) {
  if (!link) return '';
  const m = String(link).match(/[-\w]{25,}/);
  return m ? m[0] : '';
}

/** Chuyển link Drive -> URL ảnh nhúng được vào <img> */
function chuanHoaAnhDrive_(link) {
  if (!link) return '';
  const s = String(link).trim();
  if (s.indexOf('drive.google.com') < 0) return s;   // link ảnh ngoài, giữ nguyên
  const id = layIdDrive_(s);
  return id ? ('https://drive.google.com/thumbnail?id=' + id + '&sz=w2400') : s;
}

/** Chuyển link Drive -> URL xem tài liệu */
function chuanHoaLinkDrive_(link) {
  if (!link) return '';
  const s = String(link).trim();
  const id = layIdDrive_(s);
  if (s.indexOf('drive.google.com') > -1 && id) {
    return 'https://drive.google.com/file/d/' + id + '/view';
  }
  return s;
}

/***********************************************************************
 * BẢN ĐỒ TIÊU ĐỀ → DANH SÁCH CHỈ SỐ CỘT
 *  Khác với indexOf() (chỉ trả về cột đầu tiên), hàm này trả về MỌI vị trí
 *  của một tên tiêu đề. Nhờ đó khi Sheet còn cột trùng tên, dữ liệu được
 *  ghi đồng bộ ở tất cả các vị trí.
 ***********************************************************************/
function bandoTieuDe_(tieuDe) {
  const map = {};
  tieuDe.forEach(function (t, i) {
    const ten = String(t).trim();
    if (!ten) return;
    if (!map[ten]) map[ten] = [];
    map[ten].push(i);
  });
  return map;
}


/***********************************************************************
 * ★ V4.0 — PHIÊN LÀM VIỆC LẤY TỪ TOKEN TÀI KHOẢN
 ***********************************************************************/

/**
 * Giải mã token do trình duyệt gửi lên thành phiên đã xác thực.
 * Uỷ quyền cho giaiTokenTK_() trong TaiKhoan.js.
 * @return {{hopLe:boolean, email:string, hoTen:string, vaiTro:string}}
 */
function layPhienTuToken_(token) {
  if (typeof giaiTokenTK_ !== 'function') {
    throw new Error('Chưa cài đặt module TaiKhoan.js trong dự án Apps Script.');
  }
  return giaiTokenTK_(token);
}

/** Dựng object nguoiDung gửi về giao diện, theo phiên đã xác thực */
function layNguoiDungTuPhien_(p) {
  p = p || {};
  const vaiTro  = p.hopLe ? String(p.vaiTro || '').trim() : 'Khach';
  const duocSua = (vaiTro === 'QuanTri' || vaiTro === 'NhapLieu');

  return {
    email       : p.hopLe ? p.email : '',
    hoTen       : p.hopLe ? (p.hoTen || p.email) : 'Khách',
    vaiTro      : vaiTro,
    nhanDienDuoc: (vaiTro !== 'Khach'),
    duocSua     : duocSua,
    xemDayDu    : CHE_DO_THU_NGHIEM || (vaiTro !== 'Khach'),
    laQuanTri   : (vaiTro === 'QuanTri')
  };
}


/***********************************************************************
 * ★ TẢI TOÀN BỘ DỮ LIỆU — DÙNG CHUNG CHO CẢ 2 TAB
 *   - Cache luôn lưu BẢN ĐẦY ĐỦ; việc lọc cho khách thực hiện SAU khi
 *     đọc cache, theo từng lượt gọi.
 *   - Chế độ khách: các cột nội bộ bị XOÁ TRẮNG trước khi trả về.
 ***********************************************************************/
function layDuLieuTongHop(phien) {
  phien = phien || {};

  let p;
  try { p = layPhienTuToken_(phien.token); }
  catch (err) { p = { hopLe: false, email: '', hoTen: '', vaiTro: 'Khach' }; }

  const vaiTro = p.hopLe ? p.vaiTro : 'Khach';

  const cache = CacheService.getScriptCache();
  const daCache = cache.get('DU_LIEU_TONG_HOP');
  if (daCache) {
    let kq = JSON.parse(daCache);
    if (vaiTro === 'Khach') kq = locDuLieuChoKhach_(kq);
    kq.nguoiDung = layNguoiDungTuPhien_(p);
    return kq;
  }

  const nhaXuong  = docSheet_(TEN_SHEET.NHA_XUONG, true);
  const cum       = docSheet_(TEN_SHEET.CUM, true);
  const trangThai = docSheet_(TEN_SHEET.TRANG_THAI, true);
  const taiLieu   = docSheet_(TEN_SHEET.TAI_LIEU, false);
  const cauHinhDS = docSheet_(TEN_SHEET.CAU_HINH, false);

  // --- Cấu hình chung: chuyển thành object { Khoa: GiaTri } ---
  const cauHinh = {};
  cauHinhDS.forEach(function (c) {
    cauHinh[String(c.Khoa).trim()] = c.GiaTri;
  });
  cauHinh.AnhMasterKCN = chuanHoaAnhDrive_(cauHinh.AnhMasterKCN);

  // ★★★ TUYỆT ĐỐI KHÔNG GỬI MẬT KHẨU VỀ TRÌNH DUYỆT ★★★
  // (Hai khoá dưới đây đã ngừng dùng từ V4.0 nhưng vẫn xoá để phòng ngừa.)
  delete cauHinh[KHOA_CAU_HINH_MA_SUA];
  delete cauHinh[KHOA_CAU_HINH_MK_XEM];

  // --- Gom tài liệu theo mã đơn vị ---
  const mapTL = {};
  taiLieu.forEach(function (tl) {
    const ma = String(tl.MaDonVi).trim();
    if (!mapTL[ma]) mapTL[ma] = [];
    mapTL[ma].push({
      ten  : tl.TenTaiLieu,
      link : chuanHoaLinkDrive_(tl.LinkFile),
      loai : tl.LoaiTaiLieu
    });
  });

  // --- Chuẩn hoá nhà xưởng ---
  nhaXuong.forEach(function (nx) {
    nx.MaDonVi = String(nx.MaDonVi).trim();
    nx.MaCum   = String(nx.MaCum).trim();
    nx.DanhSachTaiLieu = mapTL[nx.MaDonVi] || [];
    nx.Lat = parseFloat(nx.Lat) || null;
    nx.Lng = parseFloat(nx.Lng) || null;
    nx.ToaDoSVG = String(nx.ToaDoSVG || '').trim();
    nx.LinkBrochure = chuanHoaLinkDrive_(nx.LinkBrochure);
    nx.LinkAnh      = chuanHoaLinkDrive_(nx.LinkAnh);
  });

  // --- Chuẩn hoá cụm ---
  cum.forEach(function (c) {
    c.MaCum      = String(c.MaCum).trim();
    c.ToaDoSVG   = String(c.ToaDoSVG || '').trim();
    c.ViewBox    = String(c.ViewBox  || '').trim();
    c.AnhMatBang = chuanHoaAnhDrive_(c.AnhMatBang);
  });

  const ketQua = {
    nhaXuong  : nhaXuong,
    cum       : cum,
    trangThai : trangThai,
    cauHinh   : cauHinh
  };

  try {
    cache.put('DU_LIEU_TONG_HOP', JSON.stringify(ketQua), THOI_GIAN_CACHE);
  } catch (err) { /* vượt giới hạn cache, bỏ qua */ }

  // Lọc cho khách SAU khi đã cache bản đầy đủ
  let ketQuaTra = (vaiTro === 'Khach') ? locDuLieuChoKhach_(ketQua) : ketQua;
  ketQuaTra.nguoiDung = layNguoiDungTuPhien_(p);
  return ketQuaTra;
}

/**
 * Xoá trắng cột nội bộ trước khi gửi cho chế độ khách.
 * Danh sách cột áp dụng theo LoaiHinh của từng dòng.
 */
function locDuLieuChoKhach_(ketQua) {
  const banSao = JSON.parse(JSON.stringify(ketQua));
  (banSao.nhaXuong || []).forEach(function (nx) {
    const dsCot = (String(nx.LoaiHinh).trim() === 'Đất cho thuê')
      ? COT_AN_KHACH_DAT
      : COT_AN_KHACH_NHA_XUONG;
    dsCot.forEach(function (cot) {
      if (cot in nx) nx[cot] = '';
    });
  });
  return banSao;
}


/***********************************************************************
 * GHI NHẬT KÝ
 *  ★ LockService: ngăn 2 lần ghi đồng thời chèn đè nhau.
 ***********************************************************************/
function ghiNhatKy_(dsDong) {
  if (!dsDong || dsDong.length === 0) return;

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);
  } catch (errLock) {
    console.warn('ghiNhatKy_: không lấy được LockService, bỏ qua ghi log.', errLock);
    return;
  }

  try {
    const shLog = SpreadsheetApp.openById(ID_SHEET).getSheetByName(TEN_SHEET.NHAT_KY);
    if (shLog) {
      shLog.getRange(shLog.getLastRow() + 1, 1, dsDong.length, 6).setValues(dsDong);
    }
  } catch (err) {
    /* không để lỗi ghi log làm hỏng thao tác chính */
  } finally {
    lock.releaseLock();
  }
}


/***********************************************************************
 * CẬP NHẬT DỮ LIỆU
 ***********************************************************************/
/**
 * @param {string} maDonVi
 * @param {Object} duLieuMoi
 * @param {Object|string} [phien]  { token, hoTen } — hoặc chuỗi token (kiểu cũ)
 * @param {string} [hoTenPhu]      Chỉ dùng khi tham số thứ 3 là chuỗi token
 *
 * ★ V4.0: chỉ tài khoản có vai trò QuanTri hoặc NhapLieu mới được lưu.
 *   Người ghi nhật ký lấy từ EMAIL trong token — không lấy tên do trình
 *   duyệt khai báo, nên không thể mạo danh người khác.
 * ★ V3.3: ghi vào MỌI cột trùng tên tiêu đề; trả về cotKhongTonTai.
 * ★ LockService: ngăn 2 người cùng ghi vào cùng 1 dòng Sheet đồng thời.
 */
function capNhatNhaXuong(maDonVi, duLieuMoi, phien, hoTenPhu) {
  // --- Tương thích ngược: (ma, duLieu, token, hoTen) ---
  if (typeof phien === 'string') {
    phien = { token: phien, hoTen: hoTenPhu || '' };
  }
  phien = phien || {};

  const p = layPhienTuToken_(phien.token);

  if (!p.hopLe) {
    throw new Error('Phiên làm việc đã hết hiệu lực. Vui lòng đăng nhập lại.');
  }
  if (p.vaiTro !== 'QuanTri' && p.vaiTro !== 'NhapLieu') {
    throw new Error('Tài khoản của bạn (' + p.vaiTro
      + ') không có quyền chỉnh sửa dữ liệu.');
  }

  // ★ V4.0 — người ghi nhật ký = email đã xác thực
  const nguoiGhiLog = p.email;

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (errLock) {
    throw new Error('Hệ thống đang bận (người khác đang lưu dữ liệu). '
      + 'Vui lòng thử lại sau vài giây.');
  }

  try {
    const ss    = SpreadsheetApp.openById(ID_SHEET);
    const sheet = ss.getSheetByName(TEN_SHEET.NHA_XUONG);

    const tieuDe = sheet.getRange(1, 1, 1, sheet.getLastColumn())
                        .getValues()[0]
                        .map(function (t) { return String(t).trim(); });

    const mapCot = bandoTieuDe_(tieuDe);

    const dsMa = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), 1)
                      .getValues().flat()
                      .map(function (v) { return String(v).trim(); });

    const viTri = dsMa.indexOf(String(maDonVi).trim());
    if (viTri < 0) throw new Error('Không tìm thấy mã đơn vị: ' + maDonVi);
    const dong = viTri + 2;

    const nhatKy = [];
    const cotKhongTonTai = [];

    Object.keys(duLieuMoi).forEach(function (cot) {
      if (cot === 'MaDonVi') return;

      const dsChiSo = mapCot[String(cot).trim()];
      if (!dsChiSo || dsChiSo.length === 0) {
        cotKhongTonTai.push(cot);
        return;
      }

      const giaTriMoi = duLieuMoi[cot];

      dsChiSo.forEach(function (iCot) {
        const o        = sheet.getRange(dong, iCot + 1);
        const giaTriCu = o.getValue();
        if (String(giaTriCu) !== String(giaTriMoi)) {
          o.setValue(giaTriMoi);
          nhatKy.push([new Date(), nguoiGhiLog, maDonVi,
                       cot + ' [cột ' + tenCotTuChiSo_(iCot) + ']',
                       giaTriCu, giaTriMoi]);
        }
      });
    });

    const dsNguoi    = mapCot['NguoiCapNhat']    || [];
    const dsThoiGian = mapCot['ThoiGianCapNhat'] || [];
    dsNguoi.forEach(function (i) {
      sheet.getRange(dong, i + 1).setValue(nguoiGhiLog);
    });
    dsThoiGian.forEach(function (i) {
      sheet.getRange(dong, i + 1).setValue(new Date());
    });

    if (nhatKy.length > 0) {
      const shLog = SpreadsheetApp.openById(ID_SHEET).getSheetByName(TEN_SHEET.NHAT_KY);
      if (shLog) {
        shLog.getRange(shLog.getLastRow() + 1, 1, nhatKy.length, 6).setValues(nhatKy);
      }
    }

    CacheService.getScriptCache().remove('DU_LIEU_TONG_HOP');
    return {
      thanhCong      : true,
      soTruongDaSua  : nhatKy.length,
      cotKhongTonTai : cotKhongTonTai,
      nguoiCapNhat   : nguoiGhiLog
    };

  } finally {
    lock.releaseLock();
  }
}

/** Đổi chỉ số cột (bắt đầu từ 0) sang ký hiệu chữ: 0 → A, 26 → AA */
function tenCotTuChiSo_(i) {
  let s = '';
  let n = i + 1;
  while (n > 0) {
    const du = (n - 1) % 26;
    s = String.fromCharCode(65 + du) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}


/***********************************************************************
 * TIỆN ÍCH TRONG SHEETS
 ***********************************************************************/
function xoaCache() {
  CacheService.getScriptCache().remove('DU_LIEU_TONG_HOP');
  SpreadsheetApp.getUi().alert('✓ Đã làm mới. Tải lại trang App để thấy dữ liệu mới nhất.');
}

/***********************************************************************
 * ★ V4.0 — GỠ KHOÁ ĐĂNG NHẬP CHO MỘT TÀI KHOẢN
 *  Dùng khi nhân viên nhập sai mật khẩu quá số lần cho phép.
 ***********************************************************************/
function moKhoaTamThoi() {
  const ui = SpreadsheetApp.getUi();
  const tl = ui.prompt('GỠ KHOÁ ĐĂNG NHẬP',
    'Nhập email của tài khoản cần gỡ khoá:', ui.ButtonSet.OK_CANCEL);
  if (tl.getSelectedButton() !== ui.Button.OK) return;

  const email = String(tl.getResponseText() || '').trim().toLowerCase();
  if (!email) { ui.alert('Chưa nhập email.'); return; }

  const cache = CacheService.getScriptCache();
  cache.remove('TK_SAI_' + email);

  // Dọn thêm khoá cũ của phiên bản 3.x (nếu còn)
  cache.remove('SO_LAN_SAI_MA_KHOA');
  cache.remove('SO_LAN_SAI_DANG_NHAP');

  ui.alert('✓ Đã gỡ khoá cho tài khoản:\n' + email
    + '\n\nNgười dùng có thể đăng nhập lại ngay.');
}

/** Chẩn đoán — kiểm tra module TaiKhoan.js đã cài đặt đầy đủ chưa */
function kiemTraQuyen() {
  const ui = SpreadsheetApp.getUi();
  const thieu = [];
  ['giaiTokenTK_', 'dangNhapTaiKhoan', 'dangKyTaiKhoan',
   'layDanhSachTaiKhoan', 'capNhatTaiKhoan'].forEach(function (h) {
    if (typeof this[h] !== 'function' && typeof globalThis[h] !== 'function') {
      thieu.push(h);
    }
  }, this);

  if (thieu.length > 0) {
    ui.alert('⚠ CHƯA CÀI ĐỦ MODULE TaiKhoan.js\n\nThiếu hàm:\n• '
      + thieu.join('\n• '));
    return;
  }

  let soTK = 0;
  try {
    soTK = Math.max(SpreadsheetApp.openById(ID_SHEET)
      .getSheetByName(TEN_SHEET.PHAN_QUYEN).getLastRow() - 1, 0);
  } catch (e) { /* bỏ qua */ }

  ui.alert('✓ MODULE TaiKhoan.js ĐÃ SẴN SÀNG\n\n'
    + 'Số dòng tài khoản trong ' + TEN_SHEET.PHAN_QUYEN + ': ' + soTK);
}

/***********************************************************************
 * CHẨN ĐOÁN: LIỆT KÊ CÁC CỘT TRÙNG TÊN TIÊU ĐỀ
 ***********************************************************************/
function menuKiemTraCotTrung() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.openById(ID_SHEET).getSheetByName(TEN_SHEET.NHA_XUONG);
  const tieuDe = sheet.getRange(1, 1, 1, sheet.getLastColumn())
                      .getValues()[0]
                      .map(function (t) { return String(t).trim(); });

  const mapCot = bandoTieuDe_(tieuDe);
  const dsTrung = [];
  Object.keys(mapCot).forEach(function (ten) {
    if (mapCot[ten].length > 1) {
      dsTrung.push('• ' + ten + '  →  cột '
        + mapCot[ten].map(tenCotTuChiSo_).join(', '));
    }
  });

  if (dsTrung.length === 0) {
    ui.alert('✓ KHÔNG CÓ CỘT TRÙNG TÊN\n\n'
      + 'Sheet ' + TEN_SHEET.NHA_XUONG + ' hiện có ' + tieuDe.length + ' cột, '
      + 'tất cả đều có tiêu đề khác nhau.');
    return;
  }

  ui.alert('⚠ PHÁT HIỆN ' + dsTrung.length + ' TÊN CỘT BỊ TRÙNG\n\n'
    + dsTrung.join('\n')
    + '\n\nHệ thống ghi dữ liệu vào TẤT CẢ các cột trùng tên nên không '
    + 'lệch dữ liệu. Tuy vậy vẫn nên gộp lại để Sheet gọn hơn.');
}

/***********************************************************************
 * DỌN DỮ LIỆU BỊ GHI LỆCH TRƯỚC ĐÂY
 ***********************************************************************/
function menuDonDuLieuLechCot() {
  const ui = SpreadsheetApp.getUi();
  const tl = ui.alert('DỌN DỮ LIỆU LỆCH CỘT',
      'Thao tác này sẽ sao chép dữ liệu Nhà xưởng đang nằm nhầm ở cột '
    + '"NganhNghe" và "ThoiHanThue_ChiTiet" về đúng cột "NganhNghe_SanPham" '
    + 'và "ThoiHanThue".\n\n'
    + 'Chỉ ghi khi cột đích đang trống. Không xoá dữ liệu gốc.\n\n'
    + 'Đã sao lưu file chưa? Tiếp tục?', ui.ButtonSet.YES_NO);
  if (tl !== ui.Button.YES) return;

  const sheet = SpreadsheetApp.openById(ID_SHEET).getSheetByName(TEN_SHEET.NHA_XUONG);
  const vung  = sheet.getDataRange().getValues();
  if (vung.length < 2) { ui.alert('Sheet không có dữ liệu.'); return; }

  const tieuDe = vung[0].map(function (t) { return String(t).trim(); });
  const mapCot = bandoTieuDe_(tieuDe);

  const iLoaiHinh = (mapCot['LoaiHinh'] || [])[0];
  if (iLoaiHinh === undefined) { ui.alert('Không tìm thấy cột LoaiHinh.'); return; }

  const capChuyen = [
    { nguon: 'NganhNghe',           dich: 'NganhNghe_SanPham' },
    { nguon: 'ThoiHanThue_ChiTiet', dich: 'ThoiHanThue' }
  ];

  let soO = 0;
  const baoCao = [];

  capChuyen.forEach(function (c) {
    const iNguon = (mapCot[c.nguon] || [])[0];
    const iDich  = (mapCot[c.dich]  || [])[0];
    if (iNguon === undefined || iDich === undefined) {
      baoCao.push('• Bỏ qua ' + c.nguon + ' → ' + c.dich + ' (thiếu cột)');
      return;
    }

    let dem = 0;
    for (let r = 1; r < vung.length; r++) {
      if (String(vung[r][iLoaiHinh]).trim() !== 'Nhà xưởng') continue;
      const vNguon = String(vung[r][iNguon] || '').trim();
      const vDich  = String(vung[r][iDich]  || '').trim();
      if (vNguon && !vDich) {
        sheet.getRange(r + 1, iDich + 1).setValue(vung[r][iNguon]);
        dem++;
      }
    }
    soO += dem;
    baoCao.push('• ' + c.nguon + ' → ' + c.dich + ': ' + dem + ' ô');
  });

  CacheService.getScriptCache().remove('DU_LIEU_TONG_HOP');
  ui.alert('✓ HOÀN TẤT — đã chuyển ' + soO + ' ô\n\n' + baoCao.join('\n')
    + '\n\nKiểm tra lại dữ liệu, nếu đúng thì có thể xoá nội dung ở cột nguồn '
    + 'đối với các dòng Nhà xưởng.');
}


/***********************************************************************
 * MENU & CÁC HÀM BỌC CHO MODULE SAO LƯU (Backup.gs)
 ***********************************************************************/
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('⚙ Hệ thống KCN')
    .addItem('🔄 Làm mới dữ liệu App', 'xoaCache')
    .addSeparator()
    .addItem('🔧 Khởi tạo sheet phân quyền', 'khoiTaoSheetPhanQuyen')
    .addItem('👤 Tạo tài khoản quản trị đầu tiên', 'taoTaiKhoanQuanTriDauTien')
    .addItem('🔓 Gỡ khoá đăng nhập tài khoản', 'moKhoaTamThoi')
    .addItem('🩺 Kiểm tra module tài khoản', 'kiemTraQuyen')
    .addSeparator()
    .addItem('🔍 Kiểm tra cột trùng tên', 'menuKiemTraCotTrung')
    .addItem('🧹 Dọn dữ liệu lệch cột', 'menuDonDuLieuLechCot')
    .addSeparator()
    .addItem('💾 Sao lưu ngay', 'saoLuuThuCong')
    .addItem('📁 Kiểm tra thư mục sao lưu', 'menuKiemTraFolder')
    .addItem('📊 Đo dung lượng sao lưu', 'menuDoDungLuong')
    .addToUi();
}

/** Sao lưu thủ công có thông báo kết quả */
function saoLuuThuCong() {
  const ui = SpreadsheetApp.getUi();
  if (typeof saoLuuHangNgay !== 'function') {
    ui.alert('⚠ Chưa cài module sao lưu.\n\nVui lòng tạo file Backup.gs trong dự án Apps Script.');
    return;
  }
  saoLuuHangNgay();
  ui.alert('✓ Đã thực hiện lệnh sao lưu.\n\n'
    + 'Mở sheet NhatKy để xem kết quả:\n'
    + '• "Thành công" — đã tạo bản sao mới\n'
    + '• "Bỏ qua"     — 24h qua không có thay đổi dữ liệu\n'
    + '• "THẤT BẠI"   — xem mô tả lỗi ở cột cuối');
}

/** Hiển thị thông tin thư mục sao lưu */
function menuKiemTraFolder() {
  const ui = SpreadsheetApp.getUi();
  if (typeof layFolderSaoLuu_ !== 'function') {
    ui.alert('⚠ Chưa cài module sao lưu (Backup.gs).');
    return;
  }
  try {
    const f = layFolderSaoLuu_();
    ui.alert('📁 THƯ MỤC SAO LƯU\n\n'
      + 'Tên : ' + f.getName() + '\n'
      + 'ID  : ' + f.getId()   + '\n\n'
      + 'Đường dẫn:\n' + f.getUrl());
  } catch (e) {
    ui.alert('❌ Lỗi: ' + e.message);
  }
}

/** Hiển thị dung lượng đang chiếm dụng của thư mục sao lưu */
function menuDoDungLuong() {
  const ui = SpreadsheetApp.getUi();
  if (typeof doDungLuongSaoLuu !== 'function') {
    ui.alert('⚠ Chưa cài module sao lưu (Backup.gs).');
    return;
  }
  try {
    const kq = doDungLuongSaoLuu();
    ui.alert('📊 DUNG LƯỢNG SAO LƯU\n\n'
      + 'Số bản sao      : ' + kq.soBan + '\n'
      + 'Tổng dung lượng : ' + kq.tongMB + ' MB\n\n'
      + 'Hạn mức Drive miễn phí: 15.360 MB');
  } catch (e) {
    ui.alert('❌ Lỗi: ' + e.message);
  }
}


/***********************************************************************
 * XUẤT EXCEL KẾT QUẢ TRA CỨU
 ***********************************************************************/
function xuatExcelTraCuu(tieuDe, duLieu) {
  const thoiDiem = Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMdd_HHmmss');
  const ss = SpreadsheetApp.create('TraCuu_KCN_LongThanh_' + thoiDiem);
  const sheet = ss.getSheets()[0];
  sheet.setName('KetQuaLoc');

  const bang = [tieuDe].concat(duLieu || []);
  if (bang.length && bang[0].length) {
    sheet.getRange(1, 1, bang.length, bang[0].length).setValues(bang);
    sheet.getRange(1, 1, 1, bang[0].length)
         .setFontWeight('bold').setBackground('#0B4696').setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, bang[0].length);
  }
  SpreadsheetApp.flush();

  const id   = ss.getId();
  const file = DriveApp.getFileById(id);
  try {
    thuMucXuatExcel_().addFile(file);
    DriveApp.getRootFolder().removeFile(file);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {}

  return 'https://docs.google.com/spreadsheets/d/' + id + '/export?format=xlsx';
}

function thuMucXuatExcel_() {
  const ten = '05_Xuat_TraCuu';
  const it  = DriveApp.getFoldersByName(ten);
  const thuMuc = it.hasNext() ? it.next() : DriveApp.createFolder(ten);
  const nguong = new Date().getTime() - 7 * 24 * 60 * 60 * 1000;
  const ff = thuMuc.getFiles();
  while (ff.hasNext()) {
    const f = ff.next();
    if (f.getDateCreated().getTime() < nguong) f.setTrashed(true);
  }
  return thuMuc;
}