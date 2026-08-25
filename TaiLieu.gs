/***********************************************************************
 * TaiLieu.gs — MODULE TẢI LÊN & QUẢN LÝ TÀI LIỆU ĐÍNH KÈM (V4.0)
 * Phòng Kinh doanh Tổng hợp — Sonadezi Long Thành
 *
 * ★ V4.0 (SỬA LỖI): Chuyển sang cơ chế xác thực bằng TOKEN TÀI KHOẢN
 *   (giaiTokenTK_ trong TaiKhoan.gs), thống nhất với capNhatNhaXuong().
 *   Bản V3.3b cũ vẫn kiểm tra token theo "mã khoá chỉnh sửa" đã ngừng
 *   sử dụng → mọi lượt tải tài liệu đều bị chặn dù đã đăng nhập QuanTri.
 *
 * ★ Quyền: QuanTri, QuanLy và NhapLieu được tải lên / xoá tài liệu.
 * ★ Người tải / người xoá ghi vào Sheet lấy từ EMAIL trong token
 *   (không lấy tên do trình duyệt khai báo → không thể mạo danh).
 ***********************************************************************/

// ⚠ BẮT BUỘC: dán ID thư mục Drive "03_Brochure".
// Có thể để trống và khai báo tại sheet DM_CauHinh, khoá: IdThuMucTaiLieu
const TL_ID_THU_MUC = '1C3KqfsBB6yuG7Ok3Es_jk9-NabfRLzCh';

// --- Bản sao dự phòng (chỉ dùng khi không thấy khai báo trong Mã.gs) ---
const TL_ID_SHEET_DUPHONG = '1hL3_avZm09wgM3MXrJ4CEjRRHhi-6Q9w_iBHsGVxGwE';

const TL_KICH_THUOC_TOI_DA_MB = 40;
const TL_DUOI_CHO_PHEP = [
  'pdf', 'jpg', 'jpeg', 'png', 'webp', 'gif',
  'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'dwg', 'zip'
];
// ★ MỚI: tách "Hợp đồng" thành 3 loại cụ thể để buộc nhập đủ 3 loại
//   (dùng để tính "Tiến độ nhập liệu" và gác nút "Đã rà soát" — xem Tab_CongViec.html).
const TL_LOAI_CHO_PHEP = [
  'Brochure', 'Bản vẽ', 'Hình ảnh',
  'Hợp đồng thuê đất, xưởng', 'Hợp đồng nước cấp', 'Hợp đồng nước thải',
  'Khác'
];

// Vai trò được phép thao tác tài liệu
const TL_VAI_TRO_DUOC_TAI = ['QuanTri', 'QuanLy', 'NhapLieu'];


/***********************************************************************
 * HÀM CHẨN ĐOÁN — CHẠY TRONG TRÌNH SOẠN THẢO
 ***********************************************************************/
function tlChanDoan() {
  const kq = {
    ID_SHEET          : (typeof ID_SHEET          !== 'undefined'),
    TEN_SHEET         : (typeof TEN_SHEET         !== 'undefined'),
    docSheet_         : (typeof docSheet_         === 'function'),
    ghiNhatKy_        : (typeof ghiNhatKy_        === 'function'),
    giaiTokenTK_      : (typeof giaiTokenTK_      === 'function'),
    layPhienTuToken_  : (typeof layPhienTuToken_  === 'function'),
    TL_ID_THU_MUC_OK  : (TL_ID_THU_MUC.indexOf('DAN_ID') !== 0)
  };
  Logger.log(JSON.stringify(kq, null, 2));
  return kq;
}

function kiemTraThuMucTaiLieu() {
  const tm = DriveApp.getFolderById(tlIdThuMuc_());
  Logger.log('OK — Thư mục gốc: ' + tm.getName() + ' | ' + tm.getUrl());
  return tm.getName();
}


/***********************************************************************
 * LỚP TƯƠNG THÍCH — TỰ DÒ HÀM/HẰNG CỦA Mã.gs
 ***********************************************************************/

function tlIdSheet_() {
  return (typeof ID_SHEET !== 'undefined' && ID_SHEET)
       ? ID_SHEET : TL_ID_SHEET_DUPHONG;
}

function tlTenSheet_(khoa, macDinh) {
  if (typeof TEN_SHEET !== 'undefined' && TEN_SHEET && TEN_SHEET[khoa]) {
    return TEN_SHEET[khoa];
  }
  return macDinh;
}

/** Đọc 1 sheet thành mảng object theo tiêu đề dòng 1 */
function tlDocSheet_(tenSheet) {
  if (typeof docSheet_ === 'function') {
    try { return docSheet_(tenSheet, false); } catch (e) { /* rơi xuống bản nội bộ */ }
  }
  const sh = SpreadsheetApp.openById(tlIdSheet_()).getSheetByName(tenSheet);
  if (!sh) return [];
  const dl = sh.getDataRange().getValues();
  if (dl.length < 2) return [];
  const td = dl[0].map(function (t) { return String(t).trim(); });
  return dl.slice(1).map(function (h) {
    const o = {};
    td.forEach(function (t, i) { if (t && o[t] === undefined) o[t] = h[i]; });
    return o;
  });
}

/** Ghi nhật ký (6 cột) */
function tlGhiNhatKy_(dsDong) {
  if (typeof ghiNhatKy_ === 'function') {
    try { ghiNhatKy_(dsDong); return; } catch (e) { /* rơi xuống bản nội bộ */ }
  }
  try {
    const sh = SpreadsheetApp.openById(tlIdSheet_())
                 .getSheetByName(tlTenSheet_('NHAT_KY', 'NhatKy'));
    if (sh) sh.getRange(sh.getLastRow() + 1, 1, dsDong.length, 6).setValues(dsDong);
  } catch (e) { /* không để lỗi log làm hỏng thao tác chính */ }
}

/** Lấy 1 giá trị trong DM_CauHinh theo khoá */
function tlLayCauHinh_(khoa) {
  const ds = tlDocSheet_(tlTenSheet_('CAU_HINH', 'DM_CauHinh'));
  const r = ds.filter(function (c) {
    return String(c.Khoa).trim() === khoa;
  })[0];
  return r ? String(r.GiaTri).trim() : '';
}

/** ID thư mục gốc lưu tài liệu: hằng số → DM_CauHinh → báo lỗi rõ ràng */
function tlIdThuMuc_() {
  if (TL_ID_THU_MUC && TL_ID_THU_MUC.indexOf('DAN_ID') !== 0) {
    return TL_ID_THU_MUC;
  }
  const idCauHinh = tlLayCauHinh_('IdThuMucTaiLieu');
  if (idCauHinh) return idCauHinh;

  throw new Error('Chưa cấu hình thư mục lưu tài liệu. '
    + 'Dán ID thư mục 03_Brochure vào hằng TL_ID_THU_MUC (file TaiLieu.gs) '
    + 'hoặc thêm dòng IdThuMucTaiLieu vào sheet DM_CauHinh.');
}

/***********************************************************************
 * ★ V4.0 — XÁC THỰC PHIÊN BẰNG TOKEN TÀI KHOẢN
 ***********************************************************************/

/**
 * Giải token tài khoản và bắt buộc vai trò được phép thao tác tài liệu.
 * @return {{hopLe:boolean, email:string, hoTen:string, vaiTro:string}}
 */
function tlLayPhien_(token, hanhDong) {
  let p = { hopLe: false, email: '', hoTen: '', vaiTro: 'Khach' };

  if (typeof layPhienTuToken_ === 'function') {
    try { p = layPhienTuToken_(token); } catch (e) { /* giữ mặc định */ }
  } else if (typeof giaiTokenTK_ === 'function') {
    try { p = giaiTokenTK_(token); } catch (e) { /* giữ mặc định */ }
  } else {
    throw new Error('Chưa cài đặt module TaiKhoan.gs trong dự án Apps Script.');
  }

  if (!p || !p.hopLe) {
    throw new Error('Phiên làm việc đã hết hiệu lực. Vui lòng đăng nhập lại.');
  }
  if (TL_VAI_TRO_DUOC_TAI.indexOf(p.vaiTro) < 0) {
    throw new Error('Tài khoản của bạn (' + p.vaiTro + ') không có quyền '
      + (hanhDong || 'thao tác') + ' tài liệu.');
  }
  return p;
}

function tlXoaCache_() {
  try { CacheService.getScriptCache().remove('DU_LIEU_TONG_HOP'); } catch (e) {}
}


/***********************************************************************
 * TIỆN ÍCH THƯ MỤC & SHEET
 ***********************************************************************/

function tlLamSachTen_(s) {
  return String(s || '')
    .replace(/[\\\/:\*\?"<>\|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 90);
}

function tlLayHoacTaoThuMuc_(cha, ten) {
  ten = tlLamSachTen_(ten);
  const it = cha.getFoldersByName(ten);
  return it.hasNext() ? it.next() : cha.createFolder(ten);
}

function tlTimDonVi_(maDonVi) {
  const ds = tlDocSheet_(tlTenSheet_('NHA_XUONG', 'DS_NhaXuong'));
  return ds.filter(function (r) {
    return String(r.MaDonVi).trim() === String(maDonVi).trim();
  })[0] || null;
}

/** 03_Brochure / MaCum / MaDonVi - Tên / LoaiTaiLieu */
function tlLayThuMucLuu_(maDonVi, loai) {
  const goc = DriveApp.getFolderById(tlIdThuMuc_());
  const nx  = tlTimDonVi_(maDonVi);

  const maCum = (nx && nx.MaCum) ? String(nx.MaCum).trim() : 'KHAC';
  const tenDV = maDonVi + ((nx && nx.TenNhaXuong)
              ? ' - ' + tlLamSachTen_(nx.TenNhaXuong) : '');

  const tmCum   = tlLayHoacTaoThuMuc_(goc, maCum);
  const tmDonVi = tlLayHoacTaoThuMuc_(tmCum, tenDV);
  return tlLayHoacTaoThuMuc_(tmDonVi, loai);
}

/** Ghi 1 dòng vào DS_TaiLieu theo đúng thứ tự tiêu đề hiện có */
function tlThemDong_(banGhi) {
  const lock = LockService.getScriptLock();
  try { lock.waitLock(10000); }
  catch (e) { throw new Error('Hệ thống đang bận, vui lòng thử lại sau vài giây.'); }

  try {
    const ten = tlTenSheet_('TAI_LIEU', 'DS_TaiLieu');
    const sh = SpreadsheetApp.openById(tlIdSheet_()).getSheetByName(ten);
    if (!sh) throw new Error('Không tìm thấy sheet ' + ten + '.');

    const soCot  = Math.max(sh.getLastColumn(), 4);
    const tieuDe = sh.getRange(1, 1, 1, soCot).getValues()[0]
                     .map(function (t) { return String(t).trim(); });

    sh.appendRow(tieuDe.map(function (t) {
      return (t && banGhi.hasOwnProperty(t)) ? banGhi[t] : '';
    }));
  } finally {
    lock.releaseLock();
  }
}

function tlLayIdTuLink_(link) {
  const m = String(link || '').match(/[-\w]{25,}/);
  return m ? m[0] : '';
}


/***********************************************************************
 * ★ HÀM GỌI TỪ GIAO DIỆN — TẢI 1 TỆP LÊN DRIVE
 ***********************************************************************/
function taiLenTaiLieu(tep) {
  tep = tep || {};

  // ★ V4.0 — xác thực bằng token tài khoản
  const p = tlLayPhien_(tep.token, 'tải lên');

  const maDonVi = String(tep.maDonVi || '').trim();
  if (!maDonVi) throw new Error('Thiếu mã đơn vị.');

  const tenFile = String(tep.tenFile || '').trim();
  if (!tenFile) throw new Error('Thiếu tên tệp.');

  const duoi = tenFile.split('.').pop().toLowerCase();
  if (TL_DUOI_CHO_PHEP.indexOf(duoi) === -1) {
    throw new Error('Không nhận định dạng ".' + duoi + '". Chỉ chấp nhận: '
      + TL_DUOI_CHO_PHEP.join(', ') + '.');
  }

  const base64 = String(tep.duLieu || '');
  if (!base64) throw new Error('Tệp rỗng hoặc đọc không thành công.');

  const soByte = Math.round(base64.length * 3 / 4);
  if (soByte > TL_KICH_THUOC_TOI_DA_MB * 1024 * 1024) {
    throw new Error('Tệp nặng ' + (soByte / 1048576).toFixed(1)
      + ' MB, vượt giới hạn ' + TL_KICH_THUOC_TOI_DA_MB + ' MB.');
  }

  const loai = (TL_LOAI_CHO_PHEP.indexOf(tep.loaiTaiLieu) > -1)
             ? tep.loaiTaiLieu : 'Khác';
  const tenHienThi = tlLamSachTen_(tep.tenHienThi)
                  || tenFile.replace(/\.[^.]+$/, '');

  const thuMuc = tlLayThuMucLuu_(maDonVi, loai);
  const blob = Utilities.newBlob(
    Utilities.base64Decode(base64),
    tep.mime || 'application/octet-stream',
    maDonVi + ' - ' + tenHienThi + '.' + duoi
  );
  const file = thuMuc.createFile(blob);

  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) { /* tổ chức chặn chia sẻ ngoài — quản trị chỉnh tay */ }

  // ★ V4.0 — người tải lấy từ email đã xác thực, không lấy từ trình duyệt
  const nguoi = p.email;

  tlThemDong_({
    MaDonVi     : maDonVi,
    TenTaiLieu  : tenHienThi,
    LinkFile    : file.getUrl(),
    LoaiTaiLieu : loai,
    FileId      : file.getId(),
    NgayTai     : new Date(),
    NguoiTai    : nguoi
  });

  tlGhiNhatKy_([[new Date(), nguoi, maDonVi,
                 'TaiLenTaiLieu', '', loai + ' — ' + tenHienThi]]);
  tlXoaCache_();

  return {
    thanhCong : true,
    ten       : tenHienThi,
    loai      : loai,
    link      : file.getUrl(),
    fileId    : file.getId()
  };
}


/***********************************************************************
 * ★ HÀM GỌI TỪ GIAO DIỆN — LẤY / TẠO LIÊN KẾT CHIA SẺ CẢ THƯ MỤC
 *   Dùng cho PA2: gửi khách nguyên thư mục theo loại tài liệu (vd
 *   "Hình ảnh") thay vì nén .zip — khách mở thư mục, xem/tải từng
 *   tệp trực tiếp trên điện thoại, không cần ứng dụng giải nén.
 *
 *   ★ Chỉ cấp quyền xem cho ĐÚNG thư mục loại tài liệu (03_Brochure /
 *     MaCum / MaDonVi / LoaiTaiLieu) — KHÔNG đụng đến thư mục cha
 *     (MaDonVi, MaCum, gốc 03_Brochure), nên khách không có cách nào
 *     điều hướng ngược lên để xem đơn vị khác hoặc loại tài liệu khác
 *     (vd Hợp đồng, Khác) — Drive không cấp quyền lên thư mục cha khi
 *     chỉ thư mục con được chia sẻ.
 ***********************************************************************/
function layLienKetThuMuc(tt) {
  tt = tt || {};

  // ★ Xác thực bằng token tài khoản, dùng chung cơ chế với taiLenTaiLieu()
  const p = tlLayPhien_(tt.token, 'chia sẻ thư mục');

  const maDonVi = String(tt.maDonVi || '').trim();
  if (!maDonVi) throw new Error('Thiếu mã đơn vị.');

  const loai = (TL_LOAI_CHO_PHEP.indexOf(tt.loai) > -1) ? tt.loai : '';
  if (!loai) throw new Error('Loại tài liệu không hợp lệ.');

  const thuMuc = tlLayThuMucLuu_(maDonVi, loai);

  try {
    thuMuc.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {
    throw new Error('Không thể chia sẻ thư mục (tổ chức có thể đã chặn chia sẻ ra ngoài Google Workspace).');
  }

  const soTep = (function () {
    let dem = 0;
    const it = thuMuc.getFiles();
    while (it.hasNext() && dem < 100) { it.next(); dem++; }
    return dem;
  })();

  tlGhiNhatKy_([[new Date(), p.email, maDonVi,
                 'ChiaSeThuMuc', '', loai + ' — ' + thuMuc.getUrl()]]);

  return {
    thanhCong : true,
    ten       : loai,
    link      : thuMuc.getUrl(),
    soTep     : soTep
  };
}


/***********************************************************************
 * ★ HÀM GỌI TỪ GIAO DIỆN — XOÁ 1 TÀI LIỆU
 ***********************************************************************/
function xoaTaiLieu(tt) {
  tt = tt || {};

  // ★ V4.0 — xác thực bằng token tài khoản
  const p = tlLayPhien_(tt.token, 'xoá');

  const fileId  = String(tt.fileId || '').trim();
  const maDonVi = String(tt.maDonVi || '').trim();
  if (!fileId) throw new Error('Thiếu mã tệp cần xoá.');

  const lock = LockService.getScriptLock();
  try { lock.waitLock(10000); }
  catch (e) { throw new Error('Hệ thống đang bận, vui lòng thử lại sau.'); }

  let tenXoa = '';
  try {
    const sh = SpreadsheetApp.openById(tlIdSheet_())
                 .getSheetByName(tlTenSheet_('TAI_LIEU', 'DS_TaiLieu'));
    const dl = sh.getDataRange().getValues();
    const td = dl[0].map(function (t) { return String(t).trim(); });

    const iMa   = td.indexOf('MaDonVi');
    const iTen  = td.indexOf('TenTaiLieu');
    const iLink = td.indexOf('LinkFile');
    const iId   = td.indexOf('FileId');

    for (let i = dl.length - 1; i >= 1; i--) {
      const idDong = (iId > -1 && dl[i][iId])
                   ? String(dl[i][iId]).trim()
                   : tlLayIdTuLink_(dl[i][iLink]);
      if (idDong === fileId
          && (!maDonVi || String(dl[i][iMa]).trim() === maDonVi)) {
        tenXoa = (iTen > -1) ? String(dl[i][iTen]) : '';
        sh.deleteRow(i + 1);
        break;
      }
    }
  } finally {
    lock.releaseLock();
  }

  try { DriveApp.getFileById(fileId).setTrashed(true); } catch (e) {}

  tlGhiNhatKy_([[new Date(), p.email, maDonVi,
                 'XoaTaiLieu', tenXoa, 'Đã chuyển vào Thùng rác Drive']]);
  tlXoaCache_();

  return { thanhCong: true };
}