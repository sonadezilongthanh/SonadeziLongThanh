/***********************************************************************
 * HỆ THỐNG TRA CỨU & BẢN ĐỒ KCN LONG THÀNH — PHIÊN BẢN 3.2
 *  ★ V3.0: Mở quyền chỉnh sửa bằng MÃ KHOÁ lưu trong sheet DM_CauHinh
 *  ★ V3.1: Bổ sung menu tiện ích Sao lưu (liên kết với module Backup.gs)
 *  ★ V3.2: MÀN HÌNH ĐĂNG NHẬP 3 CHẾ ĐỘ khi mở web:
 *          • Mật khẩu QUẢN TRỊ  (khoá "MaKhoaChinhSua") → xem tất cả + chỉnh sửa
 *          • Mật khẩu XEM       (khoá "MatKhauXem")     → xem tất cả, không sửa
 *          • Nút "Xem ở chế độ khách"                   → không thấy thông tin
 *            nội bộ, không sửa. DỮ LIỆU NỘI BỘ BỊ LỌC NGAY TỪ SERVER,
 *            không gửi xuống trình duyệt (an toàn cả khi mở DevTools).
 *          Bỏ phân quyền theo email (DM_PhanQuyen không còn dùng cho web).
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
 * ★ V3.0 — CẤU HÌNH MÃ KHOÁ CHỈNH SỬA
 *
 *  KHOA_CAU_HINH_MA_SUA : tên khoá trong sheet DM_CauHinh chứa mã khoá
 *  MUOI_BAO_MAT         : chuỗi bí mật dùng để băm token.
 *                         ⚠ Đổi chuỗi này = vô hiệu hoá toàn bộ token đã cấp.
 *  SO_LAN_SAI_TOI_DA    : số lần nhập sai trước khi khoá tạm
 *  THOI_GIAN_KHOA       : thời gian khoá tạm (giây)
 ***********************************************************************/
const KHOA_CAU_HINH_MA_SUA = 'MaKhoaChinhSua';
const MUOI_BAO_MAT         = 'SZL-KCNLT-2026-v3';
const SO_LAN_SAI_TOI_DA    = 8;
const THOI_GIAN_KHOA       = 600;   // 10 phút

/***********************************************************************
 * ★ V3.2 — MẬT KHẨU TÀI KHOẢN "XEM NỘI BỘ"
 *  Thêm 1 dòng vào sheet DM_CauHinh:
 *    Khoa = MatKhauXem | GiaTri = <mật khẩu xem do quản trị đặt>
 *  (Mật khẩu QUẢN TRỊ dùng chính khoá "MaKhoaChinhSua" sẵn có.)
 ***********************************************************************/
const KHOA_CAU_HINH_MK_XEM = 'MatKhauXem';

/***********************************************************************
 * ★ V3.2 — DANH SÁCH CỘT NỘI BỘ BỊ ẨN VỚI CHẾ ĐỘ KHÁCH
 *  (đã chốt theo 2 ảnh chụp màn hình ngày 21/07/2026)
 *  Ghi chú: một số tên cột có cả biến thể có/không hậu tố "(USD)" —
 *  liệt kê cả hai để phòng khi đổi tên tiêu đề trong Sheet.
 ***********************************************************************/
const COT_AN_KHACH_NHA_XUONG = [
  'QuocTich',
  'NganhNghe_SanPham',
  'TongVonDauTu_USD',
  'SoHopDong',
  'NgayHopDong',
  'TienThueXuong - DonGia (USD)',
  'TienThueXuong - DonGia',
  'TienThueXuong - PTThanhToan',
  'PhiQuanLy (USD)',
  'PhiQuanLy',
  'ThoiHanThue',
  'GhiChu',
  'Ghi chú'
];

const COT_AN_KHACH_DAT = [
  'QuocTich',
  'NganhNghe',
  'TongVonDauTu_USD',
  'SoHopDong',
  'NgayHopDong',
  'TienThueMatBang - DonGia (USD)',
  'TienThueMatBang - DonGia',
  'TienThueMatBang - PTThanhToan',
  'TienDatTho - DonGia (USD)',
  'TienDatTho - DonGia',
  'TienDatTho - PTThanhToan',
  'PhiQuanLy (USD)',
  'PhiQuanLy',
  'GiayCNDT',
  'NguoiDaiDien',
  'ThoiHanThue_ChiTiet',
  'GhiChu',
  'Ghi chú'
];

/***********************************************************************
 * ★★★ CỜ CHẾ ĐỘ THỬ NGHIỆM
 *  ⚠ V3.2: PHẢI để false — nếu bật true, mọi người (kể cả khách)
 *    được đánh dấu "xem đầy đủ". Chỉ bật tạm khi cần gỡ lỗi.
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

  const tieuDe = vung.shift().map(String);

  return vung
    .filter(function (d) { return String(d[0]).trim() !== ''; })
    .map(function (dong) {
      const obj = {};
      tieuDe.forEach(function (cot, i) {
        let v = dong[i];
        if (v instanceof Date) v = Utilities.formatDate(v, 'GMT+7', 'dd/MM/yyyy');
        // ★ Nếu 2 cột trùng tên tiêu đề, KHÔNG cho giá trị rỗng của cột sau
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
 * ★ TẢI TOÀN BỘ DỮ LIỆU — DÙNG CHUNG CHO CẢ 2 TAB
 * ★ V3.2: nhận thêm tham số phien = { token, hoTen } từ trình duyệt.
 *   - Cache luôn lưu BẢN ĐẦY ĐỦ; việc lọc cho khách thực hiện SAU khi
 *     đọc cache, theo từng lượt gọi.
 *   - Chế độ khách: các cột nội bộ bị XOÁ TRẮNG trước khi trả về.
 ***********************************************************************/
function layDuLieuTongHop(phien) {
  phien = phien || {};
  const vaiTro = layVaiTroTuToken_(phien.token);

  const cache = CacheService.getScriptCache();
  const daCache = cache.get('DU_LIEU_TONG_HOP');
  if (daCache) {
    let kq = JSON.parse(daCache);
    if (vaiTro === 'Khach') kq = locDuLieuChoKhach_(kq);
    kq.nguoiDung = layNguoiDungTuVaiTro_(vaiTro, phien.hoTen);
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
  // Nếu quên các dòng này, người dùng chỉ cần mở DevTools là đọc được.
  delete cauHinh[KHOA_CAU_HINH_MA_SUA];
  delete cauHinh[KHOA_CAU_HINH_MK_XEM];   // ★ V3.2
  cauHinh.CoMaKhoaChinhSua = true;   // chỉ báo "đã cấu hình", không lộ giá trị

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

  // ★ V3.2 — lọc cho khách SAU khi đã cache bản đầy đủ
  let ketQuaTra = (vaiTro === 'Khach') ? locDuLieuChoKhach_(ketQua) : ketQua;
  ketQuaTra.nguoiDung = layNguoiDungTuVaiTro_(vaiTro, phien.hoTen);
  return ketQuaTra;
}

/**
 * ★ V3.2 — Xoá trắng cột nội bộ trước khi gửi cho chế độ khách.
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
 * ★ V3.2 — ĐĂNG NHẬP WEB BẰNG MẬT KHẨU (3 CHẾ ĐỘ)
 ***********************************************************************/

/** Đọc mật khẩu XEM từ sheet DM_CauHinh (chỉ chạy phía server) */
function layMatKhauXem_() {
  try {
    const ds = docSheet_(TEN_SHEET.CAU_HINH, false);
    const r = ds.filter(function (c) {
      return String(c.Khoa).trim() === KHOA_CAU_HINH_MK_XEM;
    })[0];
    return r ? String(r.GiaTri).trim() : '';
  } catch (err) {
    return '';
  }
}

/** Token XEM: băm SHA-256 riêng, khác tiền tố với token SỬA */
function taoTokenXem_(matKhau) {
  const raw = 'SZL-XEM|' + matKhau + '|' + MUOI_BAO_MAT;
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
  return Utilities.base64Encode(bytes);
}

function kiemTraTokenXem_(token) {
  if (!token) return false;
  const mk = layMatKhauXem_();
  if (!mk) return false;
  return String(token) === taoTokenXem_(mk);
}

/** Suy ra vai trò từ token do trình duyệt gửi lên */
function layVaiTroTuToken_(token) {
  if (kiemTraTokenSua_(token)) return 'QuanTri';
  if (kiemTraTokenXem_(token)) return 'ChiXem';
  return 'Khach';
}

/** Dựng object nguoiDung gửi về giao diện, theo vai trò đã xác thực */
function layNguoiDungTuVaiTro_(vaiTro, hoTen) {
  return {
    email       : '',
    hoTen       : String(hoTen || '').trim() || (vaiTro === 'Khach' ? 'Khách' : ''),
    vaiTro      : vaiTro,
    nhanDienDuoc: (vaiTro !== 'Khach'),
    duocSua     : (vaiTro === 'QuanTri'),
    coMaKhoa    : (layMaKhoaChinhSua_() !== ''),
    xemDayDu    : CHE_DO_THU_NGHIEM || (vaiTro === 'QuanTri') || (vaiTro === 'ChiXem'),
    laQuanTri   : (vaiTro === 'QuanTri')
  };
}

/**
 * ★ Hàm gọi từ màn hình đăng nhập.
 * @param {string} matKhau  Mật khẩu người dùng nhập
 * @param {string} hoTen    Họ tên người thao tác (bắt buộc, phục vụ truy vết)
 * @return {{thanhCong:boolean, vaiTro:string, token:string, hoTen:string}}
 */
function dangNhapWeb(matKhau, hoTen) {
  const cache = CacheService.getScriptCache();

  // --- Chống dò mật khẩu: khoá tạm sau N lần sai ---
  const soLanSai = parseInt(cache.get('SO_LAN_SAI_DANG_NHAP') || '0', 10);
  if (soLanSai >= SO_LAN_SAI_TOI_DA) {
    throw new Error('Đã nhập sai quá ' + SO_LAN_SAI_TOI_DA
      + ' lần. Đăng nhập tạm ngưng khoảng 10 phút.');
  }

  hoTen = String(hoTen || '').trim();
  if (hoTen.length < 3) {
    throw new Error('Vui lòng nhập họ tên người sử dụng (tối thiểu 3 ký tự).');
  }

  matKhau = String(matKhau || '').trim();
  const mkQuanTri = layMaKhoaChinhSua_();
  const mkXem     = layMatKhauXem_();

  if (!mkQuanTri && !mkXem) {
    throw new Error('Chưa cấu hình mật khẩu. Bổ sung khoá "'
      + KHOA_CAU_HINH_MA_SUA + '" và "' + KHOA_CAU_HINH_MK_XEM
      + '" trong sheet ' + TEN_SHEET.CAU_HINH + '.');
  }

  if (mkQuanTri && matKhau === mkQuanTri) {
    cache.remove('SO_LAN_SAI_DANG_NHAP');
    ghiNhatKy_([[new Date(), 'ĐĂNG NHẬP: ' + hoTen, '(hệ thống)',
                 'DangNhapWeb', '', 'Vai trò: Quản trị (chỉnh sửa)']]);
    return { thanhCong: true, vaiTro: 'QuanTri',
             token: taoTokenSua_(mkQuanTri), hoTen: hoTen };
  }

  if (mkXem && matKhau === mkXem) {
    cache.remove('SO_LAN_SAI_DANG_NHAP');
    ghiNhatKy_([[new Date(), 'ĐĂNG NHẬP: ' + hoTen, '(hệ thống)',
                 'DangNhapWeb', '', 'Vai trò: Xem nội bộ']]);
    return { thanhCong: true, vaiTro: 'ChiXem',
             token: taoTokenXem_(mkXem), hoTen: hoTen };
  }

  cache.put('SO_LAN_SAI_DANG_NHAP', String(soLanSai + 1), THOI_GIAN_KHOA);
  throw new Error('Mật khẩu không đúng. Còn '
    + (SO_LAN_SAI_TOI_DA - soLanSai - 1) + ' lần thử.');
}


/***********************************************************************
 * PHÂN QUYỀN THEO EMAIL (CŨ)
 *  ★ V3.2: web không còn dùng — giữ lại để capNhatNhaXuong tương thích
 *  khi triển khai ở chế độ nhận diện email (nếu sau này chuyển Workspace).
 ***********************************************************************/
function layThongTinNguoiDung() {
  let email = '';
  try { email = String(Session.getActiveUser().getEmail() || '').trim(); }
  catch (err) { email = ''; }

  const nhanDienDuoc = (email !== '');

  let vaiTro = 'ChiXem';
  let hoTen  = email || 'Khách';

  if (nhanDienDuoc) {
    try {
      const ds = docSheet_(TEN_SHEET.PHAN_QUYEN, false);
      const found = ds.filter(function (r) {
        return String(r.Email).trim().toLowerCase() === email.toLowerCase();
      })[0];
      if (found) {
        vaiTro = String(found.VaiTro).trim();
        hoTen  = found.HoTen || email;
      }
    } catch (err) { /* bỏ qua */ }
  }
  
  /***********************************************************************
 * ★ HƯỚNG C — DANH SÁCH HỌ TÊN CHO MÀN HÌNH ĐĂNG NHẬP
 *  Trả về danh sách họ tên (KHÔNG kèm email/vai trò) để đổ vào ô chọn.
 *  Chạy đồng nhất mọi trình duyệt (kể cả Safari/iPad, vốn không giữ được
 *  localStorage trong iframe GAS). Nguồn: cột họ tên trong DM_PhanQuyen.
 ***********************************************************************/
function layDanhSachTenNguoiDung() {
  try {
    const ds = docSheet_(TEN_SHEET.PHAN_QUYEN, false);
    if (!ds || ds.length === 0) return [];

    // Dò tên cột chứa họ tên (phòng khi tiêu đề đổi)
    const cotUuTien = ['HoTen', 'Họ tên', 'HoVaTen', 'TenNhanVien', 'Ten'];
    const cacCot = Object.keys(ds[0]);
    let cotTen = '';
    for (let i = 0; i < cotUuTien.length; i++) {
      if (cacCot.indexOf(cotUuTien[i]) > -1) { cotTen = cotUuTien[i]; break; }
    }
    if (!cotTen) return [];

    const tap = {};
    ds.forEach(function (r) {
      const t = String(r[cotTen] || '').trim();
      if (t) tap[t] = true;
    });

    return Object.keys(tap).sort(function (a, b) {
      return a.localeCompare(b, 'vi');
    });
  } catch (err) {
    return [];
  }
}

  const suaTheoVaiTro = (vaiTro === 'QuanTri' || vaiTro === 'NhapLieu');

  return {
    email       : email,
    hoTen       : hoTen,
    vaiTro      : vaiTro,
    nhanDienDuoc: nhanDienDuoc,
    duocSua     : suaTheoVaiTro,
    coMaKhoa    : (layMaKhoaChinhSua_() !== ''),
    xemDayDu    : CHE_DO_THU_NGHIEM || suaTheoVaiTro || (vaiTro === 'QuanLy'),
    laQuanTri   : (vaiTro === 'QuanTri')
  };
}
/***********************************************************************
 * ★ HƯỚNG C — DANH SÁCH HỌ TÊN CHO MÀN HÌNH ĐĂNG NHẬP
 *  Trả về danh sách họ tên (KHÔNG kèm email/vai trò) để đổ vào ô chọn.
 *  Chạy đồng nhất mọi trình duyệt (kể cả Safari/iPad, vốn không giữ được
 *  localStorage trong iframe GAS). Nguồn: cột họ tên trong DM_PhanQuyen.
 ***********************************************************************/
function layDanhSachTenNguoiDung() {
  try {
    const ds = docSheet_(TEN_SHEET.PHAN_QUYEN, false);
    if (!ds || ds.length === 0) return [];

    // Dò tên cột chứa họ tên (phòng khi tiêu đề đổi)
    const cotUuTien = ['HoTen', 'Họ tên', 'HoVaTen', 'TenNhanVien', 'Ten'];
    const cacCot = Object.keys(ds[0]);
    let cotTen = '';
    for (let i = 0; i < cotUuTien.length; i++) {
      if (cacCot.indexOf(cotUuTien[i]) > -1) { cotTen = cotUuTien[i]; break; }
    }
    if (!cotTen) return [];

    const tap = {};
    ds.forEach(function (r) {
      const t = String(r[cotTen] || '').trim();
      if (t) tap[t] = true;
    });

    return Object.keys(tap).sort(function (a, b) {
      return a.localeCompare(b, 'vi');
    });
  } catch (err) {
    return [];
  }
}
/** Hàm chẩn đoán — chạy trong trình soạn thảo Apps Script, xem Execution log */
function kiemTraQuyen() {
  const nd = layThongTinNguoiDung();
  Logger.log(JSON.stringify(nd, null, 2));
  return nd;
}


/***********************************************************************
 * ★ V3.0 — MỞ QUYỀN CHỈNH SỬA BẰNG MÃ KHOÁ
 *  (V3.2 vẫn giữ: người vào bằng mật khẩu XEM hoặc quên đăng nhập
 *   quản trị có thể mở khoá chỉnh sửa ngay giữa phiên.)
 ***********************************************************************/

/** Đọc mã khoá từ sheet DM_CauHinh (chỉ chạy phía server) */
function layMaKhoaChinhSua_() {
  try {
    const ds = docSheet_(TEN_SHEET.CAU_HINH, false);
    const r = ds.filter(function (c) {
      return String(c.Khoa).trim() === KHOA_CAU_HINH_MA_SUA;
    })[0];
    return r ? String(r.GiaTri).trim() : '';
  } catch (err) {
    return '';
  }
}

/** Sinh token băm SHA-256 từ mã khoá + muối bảo mật (không lưu trạng thái) */
function taoTokenSua_(maKhoa) {
  const raw = 'SZL|' + maKhoa + '|' + MUOI_BAO_MAT;
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
  return Utilities.base64Encode(bytes);
}

/** Kiểm tra token do client gửi lên có hợp lệ không */
function kiemTraTokenSua_(token) {
  if (!token) return false;
  const khoa = layMaKhoaChinhSua_();
  if (!khoa) return false;
  return String(token) === taoTokenSua_(khoa);
}

/**
 * ★ Hàm gọi từ giao diện: xác thực mã khoá người dùng nhập.
 * @param {string} maNhap  Mã khoá người dùng gõ
 * @param {string} hoTen   Họ tên người thao tác (bắt buộc, phục vụ truy vết)
 * @return {{thanhCong:boolean, token:string, hoTen:string}}
 */
function xacThucMaKhoa(maNhap, hoTen) {
  const cache = CacheService.getScriptCache();

  // --- Chống dò mã: khoá tạm sau N lần sai ---
  const soLanSai = parseInt(cache.get('SO_LAN_SAI_MA_KHOA') || '0', 10);
  if (soLanSai >= SO_LAN_SAI_TOI_DA) {
    throw new Error('Đã nhập sai quá ' + SO_LAN_SAI_TOI_DA
      + ' lần. Chức năng mở khoá tạm ngưng khoảng 10 phút.');
  }

  hoTen = String(hoTen || '').trim();
  if (hoTen.length < 3) {
    throw new Error('Vui lòng nhập họ tên người thao tác (tối thiểu 3 ký tự).');
  }

  const khoa = layMaKhoaChinhSua_();
  if (!khoa) {
    throw new Error('Chưa cấu hình mã khoá. Bổ sung dòng "'
      + KHOA_CAU_HINH_MA_SUA + '" trong sheet ' + TEN_SHEET.CAU_HINH + '.');
  }

  if (String(maNhap || '').trim() !== khoa) {
    cache.put('SO_LAN_SAI_MA_KHOA', String(soLanSai + 1), THOI_GIAN_KHOA);
    throw new Error('Mã khoá không đúng. Còn '
      + (SO_LAN_SAI_TOI_DA - soLanSai - 1) + ' lần thử.');
  }

  cache.remove('SO_LAN_SAI_MA_KHOA');
  ghiNhatKy_([[new Date(), 'MÃ KHOÁ: ' + hoTen, '(hệ thống)',
               'MoKhoaChinhSua', '', 'Mở khoá thành công']]);

  return { thanhCong: true, token: taoTokenSua_(khoa), hoTen: hoTen };
}

/**
 * Ghi nhiều dòng vào sheet NhatKy (mỗi dòng 6 cột).
 * ★ LockService: ngăn 2 lần ghi đồng thời chèn đè nhau.
 *   - Chờ tối đa 5 giây để lấy khoá.
 *   - Nếu không lấy được khoá (hiếm), bỏ qua — không để lỗi log làm hỏng thao tác chính.
 */
function ghiNhatKy_(dsDong) {
  if (!dsDong || dsDong.length === 0) return;

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000); // chờ tối đa 5 giây
  } catch (errLock) {
    // Không lấy được khoá sau 5 giây (cực kỳ hiếm với nhóm nhỏ) → bỏ qua ghi log
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
 * @param {Object} [phien]  { token: string, hoTen: string }
 *
 * ★ V3.2: chỉ token QUẢN TRỊ (kiemTraTokenSua_) mới được lưu.
 *   Token XEM và chế độ khách bị chặn ngay từ server.
 * ★ LockService: ngăn 2 người cùng ghi vào cùng 1 dòng Sheet đồng thời.
 */
function capNhatNhaXuong(maDonVi, duLieuMoi, phien) {
  const nd = layThongTinNguoiDung();
  phien = phien || {};

  const moBangMaKhoa = kiemTraTokenSua_(phien.token);

  if (!nd.duocSua && !moBangMaKhoa) {
    throw new Error('Phiên làm việc không có quyền chỉnh sửa. '
      + 'Vui lòng đăng nhập bằng mật khẩu quản trị rồi thử lại.');
  }

  // Người ghi nhật ký: ưu tiên email thật, sau đó tới tên khai khi đăng nhập
  const nguoiGhiLog = nd.email
    || (phien.hoTen ? ('MÃ KHOÁ: ' + String(phien.hoTen).trim()) : '(khong xac dinh)');

  // ★ Lấy khoá trước khi đọc/ghi Sheet
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // chờ tối đa 10 giây
  } catch (errLock) {
    throw new Error('Hệ thống đang bận (người khác đang lưu dữ liệu). '
      + 'Vui lòng thử lại sau vài giây.');
  }

  try {
    const ss    = SpreadsheetApp.openById(ID_SHEET);
    const sheet = ss.getSheetByName(TEN_SHEET.NHA_XUONG);

    const tieuDe = sheet.getRange(1, 1, 1, sheet.getLastColumn())
                        .getValues()[0].map(String);

    const dsMa = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), 1)
                      .getValues().flat()
                      .map(function (v) { return String(v).trim(); });

    const viTri = dsMa.indexOf(String(maDonVi).trim());
    if (viTri < 0) throw new Error('Không tìm thấy mã đơn vị: ' + maDonVi);
    const dong = viTri + 2;

    const nhatKy = [];

    Object.keys(duLieuMoi).forEach(function (cot) {
      if (cot === 'MaDonVi') return;
      const iCot = tieuDe.indexOf(cot);
      if (iCot < 0) return;

      const o         = sheet.getRange(dong, iCot + 1);
      const giaTriCu  = o.getValue();
      const giaTriMoi = duLieuMoi[cot];

      if (String(giaTriCu) !== String(giaTriMoi)) {
        o.setValue(giaTriMoi);
        nhatKy.push([new Date(), nguoiGhiLog, maDonVi, cot, giaTriCu, giaTriMoi]);
      }
    });

    const iNguoi    = tieuDe.indexOf('NguoiCapNhat');
    const iThoiGian = tieuDe.indexOf('ThoiGianCapNhat');
    if (iNguoi >= 0)    sheet.getRange(dong, iNguoi + 1).setValue(nguoiGhiLog);
    if (iThoiGian >= 0) sheet.getRange(dong, iThoiGian + 1).setValue(new Date());

    // ★ Ghi NhatKy TRONG cùng lock để tránh race condition kép
    if (nhatKy.length > 0) {
      const shLog = SpreadsheetApp.openById(ID_SHEET).getSheetByName(TEN_SHEET.NHAT_KY);
      if (shLog) {
        shLog.getRange(shLog.getLastRow() + 1, 1, nhatKy.length, 6).setValues(nhatKy);
      }
    }

    CacheService.getScriptCache().remove('DU_LIEU_TONG_HOP');
    return { thanhCong: true, soTruongDaSua: nhatKy.length };

  } finally {
    lock.releaseLock(); // luôn giải phóng khoá dù có lỗi hay không
  }
}


/***********************************************************************
 * TIỆN ÍCH TRONG SHEETS
 ***********************************************************************/
function xoaCache() {
  CacheService.getScriptCache().remove('DU_LIEU_TONG_HOP');
  SpreadsheetApp.getUi().alert('✓ Đã làm mới. Tải lại trang App để thấy dữ liệu mới nhất.');
}

/** ★ V3.2 — Gỡ khoá tạm khi lỡ nhập sai quá nhiều lần (cả đăng nhập lẫn mã khoá) */
function moKhoaTamThoi() {
  const cache = CacheService.getScriptCache();
  cache.remove('SO_LAN_SAI_MA_KHOA');
  cache.remove('SO_LAN_SAI_DANG_NHAP');
  SpreadsheetApp.getUi().alert('✓ Đã gỡ khoá tạm. Có thể nhập lại mật khẩu / mã khoá.');
}


/***********************************************************************
 * ★ V3.1 — MENU & CÁC HÀM BỌC CHO MODULE SAO LƯU (Backup.gs)
 *  Các hàm dưới đây chỉ là "cầu nối" gọi sang Backup.gs.
 *  Nếu chưa cài Backup.gs, hệ thống báo lỗi rõ ràng thay vì treo.
 ***********************************************************************/
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('⚙ Hệ thống KCN')
    .addItem('🔄 Làm mới dữ liệu App', 'xoaCache')
    .addItem('🔓 Gỡ khoá nhập sai mã', 'moKhoaTamThoi')
    .addSeparator()
    .addItem('💾 Sao lưu ngay', 'saoLuuThuCong')
    .addItem('📁 Kiểm tra thư mục sao lưu', 'menuKiemTraFolder')
    .addItem('📊 Đo dung lượng sao lưu', 'menuDoDungLuong')
    .addToUi();
}

/** Kiểm tra module Backup.gs đã được cài đặt chưa */
function coModuleSaoLuu_(tenHam) {
  return (typeof this[tenHam] === 'function')
      || (typeof globalThis[tenHam] === 'function');
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