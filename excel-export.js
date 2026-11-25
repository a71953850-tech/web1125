'use strict';

const TravelExcel = (() => {
  const encoder = new TextEncoder();
  const xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const spreadsheetNs = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const officeRelNs = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const packageRelNs = 'http://schemas.openxmlformats.org/package/2006/relationships';
  const workbookMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  function escapeXml(value) {
    return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  }

  function cell(row, column, value, style) {
    const attributes = `r="${column}${row}" s="${style}"`;
    return typeof value === 'number'
      ? `<c ${attributes}><v>${value}</v></c>`
      : `<c ${attributes} t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
  }

  function worksheet({ result, startDate, endDate }) {
    const rows = [
      ['국내 출장여비 계산 결과', undefined, 1],
      ['출장 시작일', startDate],
      ['복귀일', endDate],
      ['출장 정보', result.context],
      ['예상 지급액 (원)', result.total, 1, 3],
      [],
      ['지급 항목', '금액 (원)', 1, 1],
      ...result.items,
    ];
    if (result.notes.length) {
      rows.push([], ['비고', undefined, 1], ...result.notes.map((note) => [note, undefined, 4]));
    }
    const data = rows.map(([label, value, labelStyle = 0, valueStyle = typeof value === 'number' ? 2 : 0], index) => {
      const row = index + 1;
      if (label === undefined) return '';
      const attributes = labelStyle === 4 ? ' ht="32" customHeight="1"' : '';
      const secondCell = value === undefined ? '' : cell(row, 'B', value, valueStyle);
      return `<row r="${row}"${attributes}>${cell(row, 'A', label, labelStyle)}${secondCell}</row>`;
    }).join('');
    return `${xml}<worksheet xmlns="${spreadsheetNs}">
      <cols><col min="1" max="1" width="62" customWidth="1"/>
      <col min="2" max="2" width="43" customWidth="1"/></cols>
      <sheetData>${data}</sheetData>
    </worksheet>`;
  }

  function styles() {
    return `${xml}<styleSheet xmlns="${spreadsheetNs}">
      <fonts count="2"><font><sz val="11"/><name val="맑은 고딕"/></font>
      <font><b/><sz val="11"/><name val="맑은 고딕"/></font></fonts>
      <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
      <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
      <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
      <cellXfs count="5">
        <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
        <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
        <xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
        <xf numFmtId="3" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>
        <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
      </cellXfs>
      <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
    </styleSheet>`;
  }

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  // An XLSX package is a ZIP archive. Stored entries work without browser compression or external libraries.
  function makeZip(files) {
    const entries = [];
    const directory = [];
    let offset = 0;
    let directorySize = 0;
    for (const [path, content] of Object.entries(files)) {
      const name = encoder.encode(path);
      const bytes = encoder.encode(content);
      const checksum = crc32(bytes);

      const local = new DataView(new ArrayBuffer(30));
      local.setUint32(0, 0x04034b50, true);
      local.setUint16(4, 20, true);
      local.setUint16(12, 0x0021, true); // 1980-01-01, the earliest DOS date.
      local.setUint32(14, checksum, true);
      local.setUint32(18, bytes.length, true);
      local.setUint32(22, bytes.length, true);
      local.setUint16(26, name.length, true);
      entries.push(local.buffer, name, bytes);

      const central = new DataView(new ArrayBuffer(46));
      central.setUint32(0, 0x02014b50, true);
      central.setUint16(4, 20, true);
      central.setUint16(6, 20, true);
      central.setUint16(14, 0x0021, true);
      central.setUint32(16, checksum, true);
      central.setUint32(20, bytes.length, true);
      central.setUint32(24, bytes.length, true);
      central.setUint16(28, name.length, true);
      central.setUint32(42, offset, true);
      directory.push(central.buffer, name);
      directorySize += central.byteLength + name.length;
      offset += local.byteLength + name.length + bytes.length;
    }
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, directory.length / 2, true);
    end.setUint16(10, directory.length / 2, true);
    end.setUint32(12, directorySize, true);
    end.setUint32(16, offset, true);
    return new Blob([...entries, ...directory, end.buffer], { type: workbookMime });
  }

  function download(snapshot) {
    const workbook = makeZip({
      '[Content_Types].xml': `${xml}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
        <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
        <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
        <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
        <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
      </Types>`,
      '_rels/.rels': `${xml}<Relationships xmlns="${packageRelNs}">
        <Relationship Id="rId1" Type="${officeRelNs}/officeDocument" Target="xl/workbook.xml"/>
      </Relationships>`,
      'xl/workbook.xml': `${xml}<workbook xmlns="${spreadsheetNs}" xmlns:r="${officeRelNs}">
        <sheets><sheet name="출장여비" sheetId="1" r:id="rId1"/></sheets>
      </workbook>`,
      'xl/_rels/workbook.xml.rels': `${xml}<Relationships xmlns="${packageRelNs}">
        <Relationship Id="rId1" Type="${officeRelNs}/worksheet" Target="worksheets/sheet1.xml"/>
        <Relationship Id="rId2" Type="${officeRelNs}/styles" Target="styles.xml"/>
      </Relationships>`,
      'xl/worksheets/sheet1.xml': worksheet(snapshot),
      'xl/styles.xml': styles(),
    });
    const url = URL.createObjectURL(workbook);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `출장여비_${snapshot.startDate}_${snapshot.endDate}.xlsx`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }

  return { download };
})();
