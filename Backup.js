/***********************************************************************
 * MODULE SAO LƯU & KHÔI PHỤC — APP_KCN_LONGTHANH
 * Dùng chung hằng số ID_SHEET, TEN_SHEET, ghiNhatKy_() của Code.gs
 ***********************************************************************/

// ⚠ Dán ID thư mục 05_SaoLuu vào đây (lấy từ URL thư mục trên Drive)
const ID_FOLDER_SAO_LUU = '19gmydNNOW2TVwAOfO-rFKE4TJARzXHfs';

const SO_BAN_GIU_LAI    = 30;   // giữ 30 bản gần nhất
const TIEN_TO_BAN_SAO   = 'BACKUP_DATA_KCN_LT_';


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

/** Giữ lại SO_BAN_GIU_LAI bản mới nhất, chuyển các bản cũ hơn vào thùng rác */
function donDepBanCu_(folder) {
  const ds = [];
  const it = folder.getFiles();
  while (it.hasNext()) {
    const f = it.next();
    if (f.getName().indexOf(TIEN_TO_BAN_SAO) === 0) ds.push(f);
  }
  ds.sort(function (a, b) { return b.getDateCreated() - a.getDateCreated(); });

  let dem = 0;
  for (let i = SO_BAN_GIU_LAI; i < ds.length; i++) {
    ds[i].setTrashed(true);
    dem++;
  }
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
  const MA_DON_VI = 'NX24';                    // ⚠ sửa mã cần khôi phục
  const MOC_THOI_GIAN = new Date('2026-07-19T00:00:00+07:00'); // ⚠ sửa mốc

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