/***********************************************************************
 * MODULE SAO LƯU & KHÔI PHỤC — APP_KCN_LONGTHANH
 * Dùng chung hằng số ID_SHEET, TEN_SHEET, ghiNhatKy_() của Code.gs
 *  ★ Nâng cấp: LƯU GIỮ PHÂN TẦNG (7 ngày / 4 tuần / 12 tháng)
 ***********************************************************************/

// ⚠ Dán ID thư mục 05_SaoLuu vào đây (lấy từ URL thư mục trên Drive)
const ID_FOLDER_SAO_LUU = '19gmydNNOW2TVwAOfO-rFKE4TJARzXHfs';

// ★ LƯU GIỮ PHÂN TẦNG (đơn vị: số ngày tuổi của bản sao)
const GIU_HANG_NGAY  = 7;    // ≤ 7 ngày   : giữ TOÀN BỘ
const GIU_HANG_TUAN  = 35;   // 8–35 ngày  : giữ 1 bản/tuần
const GIU_HANG_THANG = 365;  // 36–365 ngày: giữ 1 bản/tháng; quá 365 ngày → xoá

const TIEN_TO_BAN_SAO = 'BACKUP_DATA_KCN_LT_';


/***********************************************************************
 * 1. SAO LƯU HẰNG NGÀY (chạy tự động qua trigger)
 ***********************************************************************/
function saoLuuHangNgay() {
  try {
    if (ID_FOLDER_SAO_LUU.indexOf('DAN_ID') === 0) {
      throw new Error('Chưa cấu hình ID_FOLDER_SAO_LUU.');
    }

    const fileGoc = DriveApp.getFileById(ID_SHEET);
    const folder  = DriveApp.getFolderById(ID_FOLDER_SAO_LUU);
    const nhan    = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd_HHmm');
    const tenBan  = TIEN_TO_BAN_SAO + nhan;

    fileGoc.makeCopy(tenBan, folder);
    const soDaXoa = donDepBanCu_(folder);

    ghiNhatKy_([[
      new Date(), '(hệ thống)', '(toàn bộ)',
      'SaoLuu', 'Thành công',
      tenBan + (soDaXoa ? ' | đã dọn ' + soDaXoa + ' bản cũ' : '')
    ]]);

  } catch (e) {
    ghiNhatKy_([[
      new Date(), '(hệ thống)', '(toàn bộ)',
      'SaoLuu', 'THẤT BẠI', e.message
    ]]);
    try {
      MailApp.sendEmail(
        Session.getEffectiveUser().getEmail(),
        '[KCN LT] LỖI SAO LƯU DỮ LIỆU',
        'Sao lưu thất bại lúc: ' + new Date() + '\nNguyên nhân: ' + e.message
      );
    } catch (e2) { /* bỏ qua */ }
  }
}

/**
 * ★ Dọn dẹp theo chính sách LƯU GIỮ PHÂN TẦNG:
 *   Tầng 1 (≤7 ngày)     : giữ toàn bộ
 *   Tầng 2 (8–35 ngày)   : giữ 1 bản mới nhất mỗi TUẦN
 *   Tầng 3 (36–365 ngày) : giữ 1 bản mới nhất mỗi THÁNG
 *   >365 ngày            : chuyển vào thùng rác
 *   Trả về số bản đã dọn.
 */
function donDepBanCu_(folder) {
  const MS_NGAY = 24 * 60 * 60 * 1000;
  const now = new Date();

  // Thu thập tất cả bản sao đúng tiền tố
  const ds = [];
  const it = folder.getFiles();
  while (it.hasNext()) {
    const f = it.next();
    if (f.getName().indexOf(TIEN_TO_BAN_SAO) === 0) {
      ds.push({ file: f, ngay: f.getDateCreated() });
    }
  }
  // Mới nhất trước → bản đầu tiên của mỗi tuần/tháng là bản mới nhất
  ds.sort(function (a, b) { return b.ngay - a.ngay; });

  const daGiuTuan  = {};   // key 'yyyy-ww' → đã giữ 1 bản trong tuần đó
  const daGiuThang = {};   // key 'yyyy-MM' → đã giữ 1 bản trong tháng đó
  let dem = 0;

  ds.forEach(function (item) {
    const tuoi = Math.floor((now - item.ngay) / MS_NGAY); // tuổi tính bằng ngày
    let giuLai;

    if (tuoi <= GIU_HANG_NGAY) {
      giuLai = true;                                   // Tầng 1

    } else if (tuoi <= GIU_HANG_TUAN) {                // Tầng 2 — 1 bản/tuần
      const khoa = Utilities.formatDate(item.ngay, 'GMT+7', 'yyyy-ww');
      giuLai = !daGiuTuan[khoa];
      daGiuTuan[khoa] = true;

    } else if (tuoi <= GIU_HANG_THANG) {               // Tầng 3 — 1 bản/tháng
      const khoa = Utilities.formatDate(item.ngay, 'GMT+7', 'yyyy-MM');
      giuLai = !daGiuThang[khoa];
      daGiuThang[khoa] = true;

    } else {
      giuLai = false;                                  // Quá 12 tháng → xoá
    }

    if (!giuLai) {
      item.file.setTrashed(true);
      dem++;
    }
  });

  return dem;
}


/***********************************************************************
 * 2. CÀI ĐẶT TRIGGER — chỉ chạy 1 lần duy nhất
 ***********************************************************************/
function caiDatTriggerSaoLuu() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'saoLuuHangNgay') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('saoLuuHangNgay')
    .timeBased().atHour(23).everyDays(1).create();
  Logger.log('✓ Đã cài trigger sao lưu 23h mỗi ngày.');
}


/***********************************************************************
 * 3. KHÔI PHỤC 1 ĐƠN VỊ VỀ TRẠNG THÁI TRƯỚC MỘT MỐC THỜI GIAN
 *    Đọc ngược sheet NhatKy, hoàn tác các thay đổi sau mốc chỉ định.
 *
 *    Cách dùng: sửa 2 biến bên dưới rồi chạy hàm trong trình soạn thảo.
 ***********************************************************************/
function khoiPhucDonVi() {
  const MA_DON_VI = 'NX24';                                     // ⚠ sửa mã cần khôi phục
  const MOC_THOI_GIAN = new Date('2026-07-19T00:00:00+07:00');  // ⚠ sửa mốc

  const ss     = SpreadsheetApp.openById(ID_SHEET);
  const shLog  = ss.getSheetByName(TEN_SHEET.NHAT_KY);
  const shData = ss.getSheetByName(TEN_SHEET.NHA_XUONG);

  const log    = shLog.getDataRange().getValues();
  const tieuDe = shData.getRange(1, 1, 1, shData.getLastColumn())
                       .getValues()[0].map(String);
  const dsMa   = shData.getRange(2, 1, shData.getLastRow() - 1, 1)
                       .getValues().flat().map(function (v) { return String(v).trim(); });

  const viTri = dsMa.indexOf(String(MA_DON_VI).trim());
  if (viTri < 0) throw new Error('Không tìm thấy mã: ' + MA_DON_VI);
  const dong = viTri + 2;

  // Duyệt NGƯỢC để lùi dần về giá trị cũ nhất sau mốc thời gian
  const daPhucHoi = {};
  for (let i = log.length - 1; i >= 1; i--) {
    const r = log[i];
    if (String(r[2]).trim() !== MA_DON_VI) continue;
    if (!(r[0] instanceof Date) || r[0] < MOC_THOI_GIAN) continue;
    const cot = String(r[3]).trim();
    if (cot === 'SaoLuu' || cot === 'MoKhoaChinhSua') continue;
    daPhucHoi[cot] = r[4];   // GiaTriCu
  }

  const ketQua = [];
  Object.keys(daPhucHoi).forEach(function (cot) {
    const iCot = tieuDe.indexOf(cot);
    if (iCot < 0) return;
    shData.getRange(dong, iCot + 1).setValue(daPhucHoi[cot]);
    ketQua.push(cot + ' → ' + daPhucHoi[cot]);
  });

  CacheService.getScriptCache().remove('DU_LIEU_TONG_HOP');
  Logger.log('✓ Đã khôi phục ' + ketQua.length + ' trường:\n' + ketQua.join('\n'));
  return ketQua;
}


/***********************************************************************
 * 4. TIỆN ÍCH THƯ MỤC SAO LƯU (phục vụ menu ⚙ Hệ thống KCN)
 *    ★ Dựng lại theo giao diện menu đang gọi.
 ***********************************************************************/

/** Lấy đối tượng thư mục sao lưu */
function layFolderSaoLuu_() {
  if (ID_FOLDER_SAO_LUU.indexOf('DAN_ID') === 0) {
    throw new Error('Chưa cấu hình ID_FOLDER_SAO_LUU.');
  }
  return DriveApp.getFolderById(ID_FOLDER_SAO_LUU);
}

/**
 * Đo số lượng & tổng dung lượng các bản sao trong thư mục.
 * @return {{soBan:number, tongMB:string}}
 */
function doDungLuongSaoLuu() {
  const folder = layFolderSaoLuu_();
  const it = folder.getFiles();
  let soBan = 0;
  let tongBytes = 0;
  while (it.hasNext()) {
    const f = it.next();
    if (f.getName().indexOf(TIEN_TO_BAN_SAO) === 0) {
      soBan++;
      tongBytes += f.getSize();
    }
  }
  return { soBan: soBan, tongMB: (tongBytes / (1024 * 1024)).toFixed(1) };
}