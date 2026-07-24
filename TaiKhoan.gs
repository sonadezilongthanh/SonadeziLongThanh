/***********************************************************************
 * TaiKhoan.js — MODULE XÁC THỰC THEO TÀI KHOẢN (V4.0)
 * Hệ thống tra cứu & bản đồ KCN Long Thành
 * Phòng Kinh doanh Tổng hợp — Sonadezi Long Thành
 *
 * NGUYÊN TẮC:
 *  • Mỗi người dùng 01 tài khoản riêng (Email + mật khẩu cá nhân).
 *  • Mật khẩu KHÔNG lưu dạng chữ thường: chỉ lưu SHA-256 + muối riêng.
 *  • Đăng ký mở tự do → trạng thái "ChoDuyet" → quản trị cấp vai trò.
 *  • Vai trò quyết định quyền sửa (đã bỏ cơ chế "Mã khoá chỉnh sửa").
 *  • Token tự chứa: đổi vai trò / khoá tài khoản / đổi mật khẩu đều
 *    làm token cũ mất hiệu lực ngay, không cần lưu trạng thái phiên.
 *
 * PHỤ THUỘC (khai báo sẵn trong Mã.js): ID_SHEET, ghiNhatKy_()
 ***********************************************************************/

// ===== CẤU HÌNH MODULE =====
const SHEET_TK       = 'DM_PhanQuyen';
const MUOI_TK        = 'SZL-KCNLT-TK-2026';  // ⚠ Đổi = vô hiệu mọi token
const TK_SAI_TOI_DA  = 8;                    // Số lần sai trước khi khoá tạm
const TK_KHOA_GIAY   = 600;                  // Khoá tạm 10 phút
const TK_EMAIL_BAO   = 'sonadezilongthanh@gmail.com'; // Nhận mail báo đăng ký mới

const COT_TK = {
  EMAIL     : 'Email',
  HOTEN     : 'HoTen',
  VAITRO    : 'VaiTro',
  HASH      : 'MatKhauHash',
  MUOI      : 'Muoi',
  TRANGTHAI : 'TrangThai',
  NGAY_DK   : 'NgayDangKy',
  NGUOI_DUYET: 'NguoiDuyet',
  NGAY_DUYET: 'NgayDuyet',
  DN_CUOI   : 'LanDangNhapCuoi',
  DOI_MK    : 'BuocDoiMatKhau',
  GHICHU    : 'GhiChu'
};

const COT_TK_CHUAN = [
  COT_TK.EMAIL, COT_TK.HOTEN, COT_TK.VAITRO, COT_TK.HASH, COT_TK.MUOI,
  COT_TK.TRANGTHAI, COT_TK.NGAY_DK, COT_TK.NGUOI_DUYET, COT_TK.NGAY_DUYET,
  COT_TK.DN_CUOI, COT_TK.DOI_MK, COT_TK.GHICHU
];

const VAI_TRO_HOP_LE   = ['QuanTri', 'NhapLieu', 'ChiXem'];
const TRANG_THAI_HOP_LE = ['ChoDuyet', 'HoatDong', 'Khoa'];


/***********************************************************************
 * 1. TIỆN ÍCH NỀN
 ***********************************************************************/

function shTaiKhoan_() {
  const sh = SpreadsheetApp.openById(ID_SHEET).getSheetByName(SHEET_TK);
  if (!sh) throw new Error('Không tìm thấy sheet ' + SHEET_TK + '.');
  return sh;
}

/**
 * Đọc trực tiếp bảng tài khoản (KHÔNG dùng cache như docSheet_,
 * vì dữ liệu phân quyền phải luôn tức thời).
 * Cột trùng tên: giữ cột xuất hiện đầu tiên, không để cột sau ghi đè.
 */
function docBangTK_() {
  const sh   = shTaiKhoan_();
  const vung = sh.getDataRange().getValues();
  if (vung.length === 0) throw new Error('Sheet ' + SHEET_TK + ' đang trống.');

  const idx = {};
  vung[0].forEach(function (t, i) {
    const ten = String(t).trim();
    if (ten && !(ten in idx)) idx[ten] = i;
  });

  COT_TK_CHUAN.forEach(function (c) {
    if (!(c in idx)) {
      throw new Error('Sheet ' + SHEET_TK + ' thiếu cột "' + c
        + '". Vui lòng chạy hàm khoiTaoSheetPhanQuyen() một lần.');
    }
  });

  return { sh: sh, vung: vung, idx: idx };
}

function chuanHoaEmail_(v) {
  return String(v || '').trim().toLowerCase();
}

function hopLeEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function taoMuoi_() {
  return Utilities.getUuid().replace(/-/g, '');
}

/** Băm mật khẩu: SHA-256 (mật khẩu + muối riêng của tài khoản + muối hệ thống) */
function bamMatKhau_(matKhau, muoi) {
  const raw = 'SZL-MK|' + String(matKhau) + '|' + String(muoi) + '|' + MUOI_TK;
  return Utilities.base64Encode(Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8));
}

/** Tìm chỉ số dòng (theo mảng vung) của một email. -1 nếu không có. */
function timDongTK_(b, email) {
  const c = b.idx[COT_TK.EMAIL];
  for (let i = 1; i < b.vung.length; i++) {
    if (chuanHoaEmail_(b.vung[i][c]) === email) return i;
  }
  return -1;
}

/** Ghi 1 ô vào sheet (dòng theo mảng vung, cột theo idx) */
function ghiOTK_(b, iDong, tenCot, giaTri) {
  b.sh.getRange(iDong + 1, b.idx[tenCot] + 1).setValue(giaTri);
}

function nhatKyTK_(nguoi, thaoTac, ghiChu) {
  try {
    ghiNhatKy_([[new Date(), nguoi, '(tài khoản)', thaoTac, '', ghiChu]]);
  } catch (e) { /* không để lỗi log làm hỏng thao tác chính */ }
}


/***********************************************************************
 * 2. TOKEN PHIÊN (tự chứa, không lưu trạng thái phía server)
 *    Cấu trúc: base64WebSafe(email) + "." + chữ ký SHA-256
 ***********************************************************************/

function taoTokenTK_(b, iDong) {
  const d     = b.vung[iDong];
  const email = chuanHoaEmail_(d[b.idx[COT_TK.EMAIL]]);
  const raw   = 'SZL-TK|' + email
              + '|' + String(d[b.idx[COT_TK.HASH]])
              + '|' + String(d[b.idx[COT_TK.VAITRO]]).trim()
              + '|' + String(d[b.idx[COT_TK.TRANGTHAI]]).trim()
              + '|' + MUOI_TK;
  const chuKy = Utilities.base64EncodeWebSafe(Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8));
  return Utilities.base64EncodeWebSafe(email) + '.' + chuKy;
}

/**
 * Giải mã & xác thực token.
 * @return {{hopLe:boolean, email:string, hoTen:string, vaiTro:string}}
 */
function giaiTokenTK_(token) {
  const rong = { hopLe: false, email: '', hoTen: '', vaiTro: 'Khach' };
  token = String(token || '');
  if (token.indexOf('.') < 1) return rong;

  let email = '';
  try {
    email = chuanHoaEmail_(Utilities.newBlob(
      Utilities.base64DecodeWebSafe(token.split('.')[0])).getDataAsString());
  } catch (e) { return rong; }
  if (!email) return rong;

  let b;
  try { b = docBangTK_(); } catch (e) { return rong; }

  const i = timDongTK_(b, email);
  if (i < 0) return rong;
  if (taoTokenTK_(b, i) !== token) return rong;                       // chữ ký sai
  if (String(b.vung[i][b.idx[COT_TK.TRANGTHAI]]).trim() !== 'HoatDong') return rong;

  const vaiTro = String(b.vung[i][b.idx[COT_TK.VAITRO]]).trim();
  if (VAI_TRO_HOP_LE.indexOf(vaiTro) < 0) return rong;

  return {
    hopLe : true,
    email : email,
    hoTen : String(b.vung[i][b.idx[COT_TK.HOTEN]]).trim() || email,
    vaiTro: vaiTro
  };
}

/** Bắt buộc phiên phải là quản trị — dùng cho các hàm quản trị bên dưới */
function batBuocQuanTri_(token) {
  const p = giaiTokenTK_(token);
  if (!p.hopLe || p.vaiTro !== 'QuanTri') {
    throw new Error('Phiên làm việc không có quyền quản trị.');
  }
  return p;
}


/***********************************************************************
 * 3. ĐĂNG KÝ TÀI KHOẢN  (gọi từ giao diện)
 ***********************************************************************/
function dangKyTaiKhoan(email, hoTen, matKhau) {
  email   = chuanHoaEmail_(email);
  hoTen   = String(hoTen || '').trim();
  matKhau = String(matKhau || '');

  if (!hopLeEmail_(email)) throw new Error('Địa chỉ email không hợp lệ.');
  if (hoTen.length < 3)    throw new Error('Vui lòng nhập họ tên (tối thiểu 3 ký tự).');
  if (matKhau.length < 6)  throw new Error('Mật khẩu phải có tối thiểu 6 ký tự.');

  const lock = LockService.getScriptLock();
  try { lock.waitLock(10000); }
  catch (e) { throw new Error('Hệ thống đang bận, vui lòng thử lại sau vài giây.'); }

  try {
    const b = docBangTK_();
    const i = timDongTK_(b, email);

    if (i >= 0) {
      const tt = String(b.vung[i][b.idx[COT_TK.TRANGTHAI]]).trim();
      if (tt === 'ChoDuyet') {
        throw new Error('Email này đã đăng ký và đang chờ Bộ phận KD-TH cấp quyền.');
      }
      throw new Error('Email này đã được đăng ký. Vui lòng đăng nhập '
        + 'hoặc liên hệ quản trị để đặt lại mật khẩu.');
    }

    const muoi   = taoMuoi_();
    const dongMoi = new Array(b.vung[0].length).fill('');
    dongMoi[b.idx[COT_TK.EMAIL]]     = email;
    dongMoi[b.idx[COT_TK.HOTEN]]     = hoTen;
    dongMoi[b.idx[COT_TK.VAITRO]]    = '';            // quản trị điền sau
    dongMoi[b.idx[COT_TK.HASH]]      = bamMatKhau_(matKhau, muoi);
    dongMoi[b.idx[COT_TK.MUOI]]      = muoi;
    dongMoi[b.idx[COT_TK.TRANGTHAI]] = 'ChoDuyet';
    dongMoi[b.idx[COT_TK.NGAY_DK]]   = new Date();
    dongMoi[b.idx[COT_TK.DOI_MK]]    = false;

    b.sh.getRange(b.sh.getLastRow() + 1, 1, 1, dongMoi.length).setValues([dongMoi]);
  } finally {
    lock.releaseLock();
  }

  nhatKyTK_(email, 'DangKyTaiKhoan', 'Họ tên: ' + hoTen + ' — chờ cấp quyền');

  // Thông báo cho quản trị (không để lỗi gửi mail làm hỏng việc đăng ký)
  try {
    if (TK_EMAIL_BAO) {
      MailApp.sendEmail(TK_EMAIL_BAO,
        '[KCN Long Thành] Yêu cầu cấp quyền tài khoản mới',
        'Có tài khoản mới đăng ký vào Hệ thống tra cứu KCN Long Thành:\n\n'
        + '  • Email  : ' + email + '\n'
        + '  • Họ tên : ' + hoTen + '\n'
        + '  • Thời điểm: ' + Utilities.formatDate(new Date(),
            Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm') + '\n\n'
        + 'Vui lòng mở Ứng dụng → mục "Quản lý tài khoản" để cấp vai trò.');
    }
  } catch (e) { /* bỏ qua */ }

  return {
    thanhCong: true,
    thongBao : 'Đã gửi yêu cầu đăng ký. Tài khoản sẽ sử dụng được sau khi '
             + 'Bộ phận Kinh doanh Tổng hợp cấp quyền.'
  };
}


/***********************************************************************
 * 4. ĐĂNG NHẬP  (gọi từ giao diện)
 ***********************************************************************/
function dangNhapTaiKhoan(email, matKhau) {
  email   = chuanHoaEmail_(email);
  matKhau = String(matKhau || '');

  if (!email)   throw new Error('Vui lòng nhập email.');
  if (!matKhau) throw new Error('Vui lòng nhập mật khẩu.');

  const cache  = CacheService.getScriptCache();
  const khoaDem = 'TK_SAI_' + email;
  const soSai  = parseInt(cache.get(khoaDem) || '0', 10);
  if (soSai >= TK_SAI_TOI_DA) {
    throw new Error('Đã nhập sai quá ' + TK_SAI_TOI_DA
      + ' lần. Tài khoản tạm ngưng đăng nhập khoảng 10 phút.');
  }

  const b = docBangTK_();
  const i = timDongTK_(b, email);

  // Không tiết lộ email có tồn tại hay không
  if (i < 0) {
    cache.put(khoaDem, String(soSai + 1), TK_KHOA_GIAY);
    throw new Error('Email hoặc mật khẩu không đúng. Còn '
      + (TK_SAI_TOI_DA - soSai - 1) + ' lần thử.');
  }

  const d    = b.vung[i];
  const muoi = String(d[b.idx[COT_TK.MUOI]]);
  const hash = String(d[b.idx[COT_TK.HASH]]);

  if (!hash || !muoi) {
    throw new Error('Tài khoản chưa được thiết lập mật khẩu. '
      + 'Vui lòng liên hệ Bộ phận Kinh doanh Tổng hợp.');
  }

  if (bamMatKhau_(matKhau, muoi) !== hash) {
    cache.put(khoaDem, String(soSai + 1), TK_KHOA_GIAY);
    nhatKyTK_(email, 'DangNhapThatBai', 'Sai mật khẩu');
    throw new Error('Email hoặc mật khẩu không đúng. Còn '
      + (TK_SAI_TOI_DA - soSai - 1) + ' lần thử.');
  }

  const trangThai = String(d[b.idx[COT_TK.TRANGTHAI]]).trim();
  const vaiTro    = String(d[b.idx[COT_TK.VAITRO]]).trim();

  if (trangThai === 'Khoa') {
    throw new Error('Tài khoản đã bị khoá. Vui lòng liên hệ Bộ phận Kinh doanh Tổng hợp.');
  }
  if (trangThai !== 'HoatDong' || VAI_TRO_HOP_LE.indexOf(vaiTro) < 0) {
    throw new Error('Tài khoản đang chờ Bộ phận Kinh doanh Tổng hợp cấp quyền sử dụng.');
  }

  cache.remove(khoaDem);
  ghiOTK_(b, i, COT_TK.DN_CUOI, new Date());

  const hoTen = String(d[b.idx[COT_TK.HOTEN]]).trim() || email;
  nhatKyTK_(email, 'DangNhap', 'Vai trò: ' + vaiTro);

  return {
    thanhCong     : true,
    token         : taoTokenTK_(b, i),
    email         : email,
    hoTen         : hoTen,
    vaiTro        : vaiTro,
    buocDoiMatKhau: (String(d[b.idx[COT_TK.DOI_MK]]).toUpperCase() === 'TRUE')
  };
}


/***********************************************************************
 * 5. ĐỔI MẬT KHẨU  (người dùng tự thực hiện)
 ***********************************************************************/
function doiMatKhauTaiKhoan(token, mkCu, mkMoi) {
  const p = giaiTokenTK_(token);
  if (!p.hopLe) throw new Error('Phiên làm việc đã hết hiệu lực. Vui lòng đăng nhập lại.');
  if (String(mkMoi || '').length < 6) throw new Error('Mật khẩu mới phải có tối thiểu 6 ký tự.');

  const b = docBangTK_();
  const i = timDongTK_(b, p.email);
  if (i < 0) throw new Error('Không tìm thấy tài khoản.');

  const muoiCu = String(b.vung[i][b.idx[COT_TK.MUOI]]);
  if (bamMatKhau_(mkCu, muoiCu) !== String(b.vung[i][b.idx[COT_TK.HASH]])) {
    throw new Error('Mật khẩu hiện tại không đúng.');
  }

  const muoiMoi = taoMuoi_();
  ghiOTK_(b, i, COT_TK.MUOI, muoiMoi);
  ghiOTK_(b, i, COT_TK.HASH, bamMatKhau_(mkMoi, muoiMoi));
  ghiOTK_(b, i, COT_TK.DOI_MK, false);

  nhatKyTK_(p.email, 'DoiMatKhau', 'Người dùng tự đổi mật khẩu');

  // Hash đổi → token cũ vô hiệu → cấp token mới
  const b2 = docBangTK_();
  return { thanhCong: true, token: taoTokenTK_(b2, timDongTK_(b2, p.email)) };
}


/***********************************************************************
 * 6. CÁC HÀM QUẢN TRỊ (màn hình "Quản lý tài khoản")
 ***********************************************************************/

/** Danh sách tài khoản — KHÔNG trả về mật khẩu băm và muối */
function layDanhSachTaiKhoan(token) {
  batBuocQuanTri_(token);
  const b = docBangTK_();
  const ds = [];

  for (let i = 1; i < b.vung.length; i++) {
    const email = chuanHoaEmail_(b.vung[i][b.idx[COT_TK.EMAIL]]);
    if (!email) continue;
    ds.push({
      email     : email,
      hoTen     : String(b.vung[i][b.idx[COT_TK.HOTEN]]).trim(),
      vaiTro    : String(b.vung[i][b.idx[COT_TK.VAITRO]]).trim(),
      trangThai : String(b.vung[i][b.idx[COT_TK.TRANGTHAI]]).trim() || 'ChoDuyet',
      ngayDangKy: dinhDangNgay_(b.vung[i][b.idx[COT_TK.NGAY_DK]]),
      dangNhapCuoi: dinhDangNgay_(b.vung[i][b.idx[COT_TK.DN_CUOI]]),
      ghiChu    : String(b.vung[i][b.idx[COT_TK.GHICHU]]).trim()
    });
  }

  // Chờ duyệt lên đầu để quản trị xử lý ngay
  ds.sort(function (x, y) {
    if (x.trangThai === 'ChoDuyet' && y.trangThai !== 'ChoDuyet') return -1;
    if (y.trangThai === 'ChoDuyet' && x.trangThai !== 'ChoDuyet') return 1;
    return x.hoTen.localeCompare(y.hoTen, 'vi');
  });
  return ds;
}

function dinhDangNgay_(v) {
  if (!v) return '';
  try {
    return Utilities.formatDate(new Date(v), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
  } catch (e) { return String(v); }
}

/** Cấp / thay đổi vai trò và trạng thái của một tài khoản */
function capNhatTaiKhoan(token, email, vaiTro, trangThai, ghiChu) {
  const p = batBuocQuanTri_(token);
  email     = chuanHoaEmail_(email);
  vaiTro    = String(vaiTro || '').trim();
  trangThai = String(trangThai || '').trim();

  if (VAI_TRO_HOP_LE.indexOf(vaiTro) < 0) {
    throw new Error('Vai trò không hợp lệ (QuanTri / NhapLieu / ChiXem).');
  }
  if (TRANG_THAI_HOP_LE.indexOf(trangThai) < 0) {
    throw new Error('Trạng thái không hợp lệ (ChoDuyet / HoatDong / Khoa).');
  }
  if (email === p.email && (vaiTro !== 'QuanTri' || trangThai !== 'HoatDong')) {
    throw new Error('Không thể tự hạ quyền hoặc tự khoá tài khoản đang đăng nhập.');
  }

  const b = docBangTK_();
  const i = timDongTK_(b, email);
  if (i < 0) throw new Error('Không tìm thấy tài khoản ' + email);

  // Bảo vệ: luôn còn tối thiểu 01 quản trị đang hoạt động
  if (String(b.vung[i][b.idx[COT_TK.VAITRO]]).trim() === 'QuanTri'
      && (vaiTro !== 'QuanTri' || trangThai !== 'HoatDong')
      && demQuanTriHoatDong_(b) <= 1) {
    throw new Error('Hệ thống phải còn tối thiểu 01 tài khoản Quản trị đang hoạt động.');
  }

  ghiOTK_(b, i, COT_TK.VAITRO, vaiTro);
  ghiOTK_(b, i, COT_TK.TRANGTHAI, trangThai);
  ghiOTK_(b, i, COT_TK.NGUOI_DUYET, p.email);
  ghiOTK_(b, i, COT_TK.NGAY_DUYET, new Date());
  if (ghiChu !== undefined && ghiChu !== null) {
    ghiOTK_(b, i, COT_TK.GHICHU, String(ghiChu));
  }

  nhatKyTK_(p.email, 'CapQuyen',
    email + ' → vai trò: ' + vaiTro + ', trạng thái: ' + trangThai);

  return { thanhCong: true };
}

function demQuanTriHoatDong_(b) {
  let n = 0;
  for (let i = 1; i < b.vung.length; i++) {
    if (String(b.vung[i][b.idx[COT_TK.VAITRO]]).trim() === 'QuanTri'
     && String(b.vung[i][b.idx[COT_TK.TRANGTHAI]]).trim() === 'HoatDong') n++;
  }
  return n;
}

/** Đặt lại mật khẩu — trả về mật khẩu tạm để quản trị chuyển cho nhân viên */
function datLaiMatKhauTaiKhoan(token, email) {
  const p = batBuocQuanTri_(token);
  email = chuanHoaEmail_(email);

  const b = docBangTK_();
  const i = timDongTK_(b, email);
  if (i < 0) throw new Error('Không tìm thấy tài khoản ' + email);

  const mkTam = 'SZL' + Math.floor(100000 + Math.random() * 900000);
  const muoi  = taoMuoi_();
  ghiOTK_(b, i, COT_TK.MUOI, muoi);
  ghiOTK_(b, i, COT_TK.HASH, bamMatKhau_(mkTam, muoi));
  ghiOTK_(b, i, COT_TK.DOI_MK, true);

  nhatKyTK_(p.email, 'DatLaiMatKhau', 'Đặt lại mật khẩu cho ' + email);

  return {
    thanhCong: true,
    matKhauTam: mkTam,
    thongBao: 'Mật khẩu tạm: ' + mkTam
            + '. Chuyển cho nhân viên và yêu cầu đổi ngay sau khi đăng nhập.'
  };
}

/** Xoá tài khoản khỏi danh mục phân quyền */
function xoaTaiKhoan(token, email) {
  const p = batBuocQuanTri_(token);
  email = chuanHoaEmail_(email);
  if (email === p.email) throw new Error('Không thể tự xoá tài khoản đang đăng nhập.');

  const b = docBangTK_();
  const i = timDongTK_(b, email);
  if (i < 0) throw new Error('Không tìm thấy tài khoản ' + email);

  b.sh.deleteRow(i + 1);
  nhatKyTK_(p.email, 'XoaTaiKhoan', 'Đã xoá tài khoản ' + email);
  return { thanhCong: true };
}


/***********************************************************************
 * 7. HAI HÀM CHẠY MỘT LẦN TRONG TRÌNH SOẠN THẢO
 ***********************************************************************/

/** Bổ sung các cột còn thiếu vào DM_PhanQuyen — dữ liệu cũ giữ nguyên */
function khoiTaoSheetPhanQuyen() {
  const sh   = shTaiKhoan_();
  const soCot = Math.max(sh.getLastColumn(), 1);
  const tieuDe = sh.getRange(1, 1, 1, soCot).getValues()[0]
                   .map(function (v) { return String(v).trim(); });

  const thieu = COT_TK_CHUAN.filter(function (c) { return tieuDe.indexOf(c) === -1; });
  if (thieu.length > 0) {
    sh.getRange(1, soCot + 1, 1, thieu.length).setValues([thieu]);
  }
  sh.getRange(1, 1, 1, sh.getLastColumn()).setFontWeight('bold');
  sh.setFrozenRows(1);

  const kq = 'Đã bổ sung cột: ' + (thieu.join(', ') || '(không thiếu cột nào)');
  Logger.log(kq);
  return kq;
}

/**
 * Tạo tài khoản QUẢN TRỊ đầu tiên.
 * ⚠ Sửa 3 hằng số bên dưới TRƯỚC KHI chạy, và đổi mật khẩu ngay sau đó.
 */
function taoTaiKhoanQuanTriDauTien() {
  const EMAIL   = 'sonadezilongthanh@gmail.com';
  const HOTEN   = 'Quản trị hệ thống';
  const MATKHAU = 'SZL@KCNLT2026';

  const email = chuanHoaEmail_(EMAIL);
  const b     = docBangTK_();
  const muoi  = taoMuoi_();
  const i     = timDongTK_(b, email);

  if (i >= 0) {
    ghiOTK_(b, i, COT_TK.HOTEN,     HOTEN);
    ghiOTK_(b, i, COT_TK.VAITRO,    'QuanTri');
    ghiOTK_(b, i, COT_TK.MUOI,      muoi);
    ghiOTK_(b, i, COT_TK.HASH,      bamMatKhau_(MATKHAU, muoi));
    ghiOTK_(b, i, COT_TK.TRANGTHAI, 'HoatDong');
    ghiOTK_(b, i, COT_TK.DOI_MK,    true);
  } else {
    const dong = new Array(b.vung[0].length).fill('');
    dong[b.idx[COT_TK.EMAIL]]     = email;
    dong[b.idx[COT_TK.HOTEN]]     = HOTEN;
    dong[b.idx[COT_TK.VAITRO]]    = 'QuanTri';
    dong[b.idx[COT_TK.MUOI]]      = muoi;
    dong[b.idx[COT_TK.HASH]]      = bamMatKhau_(MATKHAU, muoi);
    dong[b.idx[COT_TK.TRANGTHAI]] = 'HoatDong';
    dong[b.idx[COT_TK.NGAY_DK]]   = new Date();
    dong[b.idx[COT_TK.DOI_MK]]    = true;
    b.sh.getRange(b.sh.getLastRow() + 1, 1, 1, dong.length).setValues([dong]);
  }

  Logger.log('Đã tạo/cập nhật tài khoản quản trị: ' + email);
  return 'Đã tạo/cập nhật tài khoản quản trị: ' + email;
}