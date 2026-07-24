/***********************************************************************
 * TaiLieu.gs — MODULE TẢI LÊN & QUẢN LÝ TÀI LIỆU ĐÍNH KÈM (V3.3b)
 * Phòng Kinh doanh Tổng hợp — Sonadezi Long Thành
 *
 * ★ V3.3b: Chạy ĐỘC LẬP với Mã.gs.
 *   - Nếu thấy ID_SHEET / TEN_SHEET / docSheet_ / ghiNhatKy_ /
 *     kiemTraTokenSua_ của Mã.gs  → dùng lại.
 *   - Nếu không thấy → dùng bản sao nội bộ bên dưới.
 *   Toàn bộ tên riêng của file này đều bắt đầu bằng TL_ / tl → không
 *   xung đột với bất kỳ khai báo nào trong Mã.gs.
 ***********************************************************************/

// ⚠ BẮT BUỘC: dán ID thư mục Drive "03_Brochure"
const TL_ID_THU_MUC = 'DAN_ID_THU_MUC_03_Brochure_VAO_DAY';

// --- Bản sao dự phòng (chỉ dùng khi không thấy khai báo trong Mã.gs) ---
const TL_ID_SHEET_DUPHONG     = '1hL3_avZm09wgM3MXrJ4CEjRRHhi-6Q9w_iBHsGVxGwE';
const TL_MUOI_DUPHONG         = 'SZL-KCNLT-2026-v3';   // ⚠ phải giống MUOI_BAO_MAT trong Mã.gs
const TL_KHOA_MA_SUA_DUPHONG  = 'MaKhoaChinhSua';

const TL_KICH_THUOC_TOI_DA_MB = 20;
const TL_DUOI_CHO_PHEP = [
  'pdf', 'jpg', 'jpeg', 'png', 'webp', 'gif',
  'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'dwg', 'zip'
];
const TL_LOAI_CHO_PHEP = ['Brochure', 'Bản vẽ', 'Hình ảnh', 'Hợp đồng', 'Khác'];


/***********************************************************************
 * HÀM CHẨN ĐOÁN — CHẠY TRONG TRÌNH SOẠN THẢO
 ***********************************************************************/
function tlChanDoan() {
  const kq = {
    ID_SHEET         : (typeof ID_SHEET         !== 'undefined'),
    TEN_SHEET        : (typeof TEN_SHEET        !== 'undefined'),
    MUOI_BAO_MAT     : (typeof MUOI_BAO_MAT     !== 'undefined'),
    docSheet_        : (typeof docSheet_        === 'function'),
    ghiNhatKy_       : (typeof ghiNhatKy_       === 'function'),
    kiemTraTokenSua_ : (typeof kiemTraTokenSua_ === 'function')
  };
  Logger.log(JSON.stringify(kq, null, 2));
  return kq;
}

function kiemTraThuMucTaiLieu() {
  if (TL_ID_THU_MUC.indexOf('DAN_ID') === 0) {
    throw new Error('Chưa dán ID thư mục 03_Brochure vào TL_ID_THU_MUC.');
  }
  const tm = DriveApp.getFolderById(TL_ID_THU_MUC);
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

function tlMuoi_() {
  return (typeof MUOI_BAO_MAT !== 'undefined' && MUOI_BAO_MAT)
       ? MUOI_BAO_MAT : TL_MUOI_DUPHONG;
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

/** Lấy mã khoá quản trị từ DM_CauHinh */
function tlLayMaKhoa_() {
  const ds = tlDocSheet_(tlTenSheet_('CAU_HINH', 'DM_CauHinh'));
  const khoaCan = (typeof KHOA_CAU_HINH_MA_SUA !== 'undefined')
                ? KHOA_CAU_HINH_MA_SUA : TL_KHOA_MA_SUA_DUPHONG;
  const r = ds.filter(function (c) {
    return String(c.Khoa).trim() === khoaCan;
  })[0];
  return r ? String(r.GiaTri).trim() : '';
}

/** Xác thực token quản trị — ưu tiên hàm gốc của Mã.gs */
function tlKiemTraToken_(token) {
  if (typeof kiemTraTokenSua_ === 'function') {
    try { return kiemTraTokenSua_(token); } catch (e) { /* rơi xuống bản nội bộ */ }
  }
  if (!token) return false;
  const khoa = tlLayMaKhoa_();
  if (!khoa) return false;
  const raw = 'SZL|' + khoa + '|' + tlMuoi_();
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
  return String(token) === Utilities.base64Encode(bytes);
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
  if (TL_ID_THU_MUC.indexOf('DAN_ID') === 0) {
    throw new Error('Chưa cấu hình TL_ID_THU_MUC trong file TaiLieu.gs.');
  }
  const goc = DriveApp.getFolderById(TL_ID_THU_MUC);
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

  if (!tlKiemTraToken_(tep.token)) {
    throw new Error('Phiên làm việc không có quyền tải tài liệu. '
      + 'Vui lòng đăng nhập bằng mật khẩu quản trị.');
  }

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

  const nguoi = String(tep.hoTen || '').trim() || '(khong xac dinh)';
  tlThemDong_({
    MaDonVi     : maDonVi,
    TenTaiLieu  : tenHienThi,
    LinkFile    : file.getUrl(),
    LoaiTaiLieu : loai,
    FileId      : file.getId(),
    NgayTai     : new Date(),
    NguoiTai    : nguoi
  });

  tlGhiNhatKy_([[new Date(), 'TẢI LÊN: ' + nguoi, maDonVi,
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
 * ★ HÀM GỌI TỪ GIAO DIỆN — XOÁ 1 TÀI LIỆU
 ***********************************************************************/
function xoaTaiLieu(tt) {
  tt = tt || {};
  if (!tlKiemTraToken_(tt.token)) {
    throw new Error('Phiên làm việc không có quyền xoá tài liệu.');
  }

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

  tlGhiNhatKy_([[new Date(), 'XOÁ TL: ' + (tt.hoTen || ''), maDonVi,
                 'XoaTaiLieu', tenXoa, 'Đã chuyển vào Thùng rác Drive']]);
  tlXoaCache_();

  return { thanhCong: true };
}