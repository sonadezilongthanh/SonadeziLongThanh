/***********************************************************************
 * ★ MỚI — ĐỐI SOÁT & ĐẶT LẠI CỘT "TrangThaiRaSoat"
 *  Bối cảnh: một số cán bộ nhập liệu trước đây đã chọn "Đã rà soát" khi
 *  hồ sơ CHƯA đủ dữ liệu bắt buộc. File này quét lại toàn bộ DS_NhaXuong,
 *  dùng ĐÚNG tiêu chí "đủ dữ liệu" đang áp dụng để gác nút trên giao diện
 *  (xem hàm _cvTinhDonVi trong Tab_CongViec.html — đã sao chép lại logic
 *  1:1 tại đây), rồi đặt cột TrangThaiRaSoat về rỗng ("— Chưa rà soát —")
 *  đối với các đơn vị chưa đạt, để cán bộ phụ trách bổ sung và rà soát lại.
 *
 *  CÁCH DÙNG (từ Google Sheet):
 *   ⚙ Hệ thống KCN → "🔎 Xem đơn vị 'Đã rà soát' nhưng thiếu dữ liệu"
 *     → chỉ XEM danh sách, KHÔNG ghi gì vào Sheet.
 *   ⚙ Hệ thống KCN → "♻️ Đặt lại trạng thái rà soát (đơn vị thiếu dữ liệu)"
 *     → sau khi xác nhận, THỰC SỰ đặt lại cột và ghi Nhật ký.
 *
 *  ⚠ File .gs thuần — không cần tạo Deployment mới vẫn chạy được (menu
 *    ⚙ Hệ thống KCN gọi trực tiếp, không qua google.script.run của App).
 * Phòng Kinh doanh Tổng hợp — Sonadezi Long Thành
 ***********************************************************************/

// --- Sao chép lại ĐÚNG danh sách trường bắt buộc từ Tab_CongViec.html ---
const RSL_TRUONG_NX = [
  { nhan: 'Khách thuê',           ten: ['KhachThue'] },
  { nhan: 'Quốc tịch',            ten: ['QuocTich'] },
  { nhan: 'Giấy CN đầu tư',       ten: ['GiayCNDT'] },
  { nhan: 'Giấy CN doanh nghiệp', ten: ['GiayCNDN'] },
  { nhan: 'Ngành nghề',           ten: ['NganhNghe_SanPham', 'NganhNghe'] },
  { nhan: 'Tổng vốn ĐT',          ten: ['TongVonDauTu_USD'] },
  { nhan: 'DT nhà xưởng',         ten: ['DienTichXuong_m2'] },
  { nhan: 'Số hợp đồng',          ten: ['SoHopDong'] },
  { nhan: 'Ngày hợp đồng',        ten: ['NgayHopDong'] },
  { nhan: 'Đơn giá thuê',         ten: ['TienThueXuong - DonGia (USD)', 'TienThueXuong - DonGia'] },
  { nhan: 'Phí quản lý',          ten: ['PhiQuanLy (USD)', 'PhiQuanLy'] }
];
const RSL_TRUONG_DAT = [
  { nhan: 'Khách thuê',           ten: ['KhachThue'] },
  { nhan: 'Quốc tịch',            ten: ['QuocTich'] },
  { nhan: 'Giấy CN đầu tư',       ten: ['GiayCNDT'] },
  { nhan: 'Giấy CN doanh nghiệp', ten: ['GiayCNDN'] },
  { nhan: 'Ngành nghề',           ten: ['NganhNghe', 'NganhNghe_SanPham'] },
  { nhan: 'Tổng vốn ĐT',          ten: ['TongVonDauTu_USD'] },
  { nhan: 'DT đất thuê',          ten: ['Tong DienTichDatThue (m2)'] },
  { nhan: 'Số hợp đồng',          ten: ['SoHopDong'] },
  { nhan: 'Ngày hợp đồng',        ten: ['NgayHopDong'] },
  { nhan: 'Đơn giá mặt bằng',     ten: ['TienThueMatBang - DonGia (USD)', 'TienThueMatBang - DonGia'] },
  { nhan: 'Phí quản lý',          ten: ['PhiQuanLy (USD)', 'PhiQuanLy'] },
  { nhan: 'Người đại diện',       ten: ['NguoiDaiDien'] }
];
const RSL_LOAI_HD_BAT_BUOC = [
  'Hợp đồng thuê đất, xưởng', 'Hợp đồng nước cấp', 'Hợp đồng nước thải', 'Hợp đồng'
];

function rslCoGiaTri_(v) {
  return v !== null && v !== undefined && String(v).trim() !== '';
}
function rslLayTruong_(nx, dsTen) {
  for (var i = 0; i < dsTen.length; i++) if (rslCoGiaTri_(nx[dsTen[i]])) return true;
  return false;
}
function rslCoTaiLieuHopDong_(nx, mapTL) {
  var ds = mapTL[nx.MaDonVi] || [];
  for (var i = 0; i < ds.length; i++) {
    if (RSL_LOAI_HD_BAT_BUOC.indexOf(String(ds[i].loai || '').trim()) > -1) return true;
  }
  return false;
}
// Đơn vị "trống, chưa có khách thuê" → không tính, giống hệt _cvDonViBoQua
function rslDonViBoQua_(nx) {
  var tt = (String(nx.TrangThai || '') + ' ' + String(nx.TinhTrangHoatDong || '')).toLowerCase();
  var laTrong = tt.indexOf('trống') > -1 || tt.indexOf('trong') > -1;
  return laTrong && !rslCoGiaTri_(nx.KhachThue);
}
function rslTinhDonVi_(nx, mapTL) {
  var loai = String(nx.LoaiHinh || '');
  var truong = (loai.indexOf('Đất') > -1) ? RSL_TRUONG_DAT : RSL_TRUONG_NX;
  var thieu = [];
  truong.forEach(function (t) {
    if (!rslLayTruong_(nx, t.ten)) thieu.push(t.nhan);
  });
  if (!rslCoTaiLieuHopDong_(nx, mapTL)) {
    thieu.push('📎 Hợp đồng đính kèm');
  }
  return { hoanTat: thieu.length === 0, thieu: thieu };
}

/** Gom tài liệu theo MaDonVi — giống hệt cách Mã.gs đang làm khi tổng hợp DU_LIEU. */
function rslGomTaiLieu_() {
  var ds = docSheet_(TEN_SHEET.TAI_LIEU, false);
  var map = {};
  ds.forEach(function (tl) {
    var ma = String(tl.MaDonVi).trim();
    if (!map[ma]) map[ma] = [];
    map[ma].push({ loai: tl.LoaiTaiLieu });
  });
  return map;
}

/** Quét DS_NhaXuong, trả về các đơn vị đang "Đã rà soát" nhưng CHƯA đủ điều kiện. */
function rslQuetDuLieuThieu_() {
  var mapTL    = rslGomTaiLieu_();
  var nhaXuong = docSheet_(TEN_SHEET.NHA_XUONG, true);
  var ketQua   = [];

  nhaXuong.forEach(function (nx) {
    var daRaSoat = String(nx.TrangThaiRaSoat || '').trim().toLowerCase().indexOf('đã rà') > -1;
    if (!daRaSoat) return;
    if (rslDonViBoQua_(nx)) return;

    var kq = rslTinhDonVi_(nx, mapTL);
    if (!kq.hoanTat) {
      ketQua.push({
        maDonVi       : nx.MaDonVi,
        khachThue     : nx.KhachThue || '(chưa có tên khách thuê)',
        nguoiPhuTrach : nx.NguoiPhuTrach || '(chưa phân công)',
        thieu         : kq.thieu
      });
    }
  });
  return ketQua;
}

/** ★ BƯỚC 1 — CHỈ XEM TRƯỚC. Gắn ở menu ⚙ Hệ thống KCN, KHÔNG ghi gì vào Sheet. */
function menuXemTruocRaSoatLai() {
  var ui = SpreadsheetApp.getUi();
  var ds = rslQuetDuLieuThieu_();

  if (ds.length === 0) {
    ui.alert('✓ Không phát hiện đơn vị nào bị đánh dấu "Đã rà soát" khi còn thiếu dữ liệu.');
    return;
  }

  var dong = ds.map(function (d) {
    return '<tr><td style="padding:4px 8px;border-bottom:1px solid #eee"><b>' + d.maDonVi + '</b><br>'
      + d.khachThue + '</td>'
      + '<td style="padding:4px 8px;border-bottom:1px solid #eee">' + d.nguoiPhuTrach + '</td>'
      + '<td style="padding:4px 8px;border-bottom:1px solid #eee;color:#b45309">' + d.thieu.join(', ') + '</td></tr>';
  }).join('');

  var html = HtmlService.createHtmlOutput(
    '<div style="font-family:Arial,sans-serif;font-size:13px">'
    + '<p><b>' + ds.length + ' đơn vị</b> đang ghi "Đã rà soát" nhưng CHƯA đủ dữ liệu bắt buộc:</p>'
    + '<table style="border-collapse:collapse;width:100%">'
    + '<tr style="background:#f6f8fc"><th style="padding:4px 8px;text-align:left">Đơn vị</th>'
    + '<th style="padding:4px 8px;text-align:left">Phụ trách</th>'
    + '<th style="padding:4px 8px;text-align:left">Còn thiếu</th></tr>'
    + dong + '</table>'
    + '<p style="margin-top:10px;color:#64748b">Vào menu ⚙ Hệ thống KCN → '
    + '"♻️ Đặt lại trạng thái rà soát" nếu muốn đặt lại danh sách này về "Chưa rà soát".</p>'
    + '</div>'
  ).setWidth(650).setHeight(480);

  ui.showModalDialog(html, 'Xem trước — Đơn vị "Đã rà soát" nhưng thiếu dữ liệu');
}

/** ★ BƯỚC 2 — Xác nhận rồi THỰC SỰ đặt lại TrangThaiRaSoat = rỗng, có ghi Nhật ký. */
function menuRaSoatLaiTrangThai() {
  var ui = SpreadsheetApp.getUi();
  var ds = rslQuetDuLieuThieu_();

  if (ds.length === 0) {
    ui.alert('✓ Không có gì cần đặt lại.');
    return;
  }

  var xacNhan = ui.alert(
    'ĐẶT LẠI TRẠNG THÁI RÀ SOÁT',
    'Sẽ đặt lại "Chưa rà soát" cho ' + ds.length + ' đơn vị đang thiếu dữ liệu '
      + '(ví dụ: ' + ds.slice(0, 5).map(function (d) { return d.maDonVi; }).join(', ')
      + (ds.length > 5 ? ', …' : '') + ').\n\n'
      + 'Thao tác này SẼ GHI vào Sheet DS_NhaXuong và Nhật ký. Tiếp tục?',
    ui.ButtonSet.YES_NO
  );
  if (xacNhan !== ui.Button.YES) return;

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (errLock) {
    ui.alert('⚠ Hệ thống đang bận (có người khác đang lưu dữ liệu). Vui lòng thử lại sau.');
    return;
  }

  try {
    var sheet  = SpreadsheetApp.openById(ID_SHEET).getSheetByName(TEN_SHEET.NHA_XUONG);
    var tieuDe = sheet.getRange(1, 1, 1, sheet.getLastColumn())
                       .getValues()[0]
                       .map(function (t) { return String(t).trim(); });
    var mapCot = bandoTieuDe_(tieuDe);
    var dsChiSoRaSoat = mapCot['TrangThaiRaSoat'] || [];
    if (dsChiSoRaSoat.length === 0) {
      ui.alert('⚠ Không tìm thấy cột "TrangThaiRaSoat" trong DS_NhaXuong.');
      return;
    }

    var dsMa = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), 1)
                     .getValues().flat()
                     .map(function (v) { return String(v).trim(); });

    var nguoiThucHien = Session.getActiveUser().getEmail() || '(quản trị - chạy tay)';
    var nhatKy = [];

    ds.forEach(function (d) {
      var viTri = dsMa.indexOf(String(d.maDonVi).trim());
      if (viTri < 0) return;
      var dong = viTri + 2;
      dsChiSoRaSoat.forEach(function (iCot) {
        sheet.getRange(dong, iCot + 1).setValue('');
      });
      nhatKy.push([
        new Date(), nguoiThucHien, d.maDonVi,
        'RaSoatLai [tự động]', 'Đã rà soát → Chưa rà soát',
        'Thiếu: ' + d.thieu.join(', ')
      ]);
    });

    if (nhatKy.length > 0) {
      var shLog = SpreadsheetApp.openById(ID_SHEET).getSheetByName(TEN_SHEET.NHAT_KY);
      if (shLog) shLog.getRange(shLog.getLastRow() + 1, 1, nhatKy.length, 6).setValues(nhatKy);
    }

    CacheService.getScriptCache().remove('DU_LIEU_TONG_HOP');

    ui.alert('✓ Đã đặt lại "Chưa rà soát" cho ' + nhatKy.length + ' đơn vị.\n'
      + 'Cán bộ phụ trách cần bổ sung dữ liệu rồi rà soát lại.');

  } finally {
    lock.releaseLock();
  }
}