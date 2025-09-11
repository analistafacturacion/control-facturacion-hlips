
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export async function exportInformeGeneralExcel(rows: any[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Informe General');

  // Formato de contabilidad sin decimales para columnas B, C y D
  // Aplica a todas las filas de datos y totales
    function aplicarFormatoContabilidad() {
      // Formato contabilidad nativo: símbolo $ alineado a la izquierda, número a la derecha, sin decimales
      const formatoContable = '_($* #,##0_);_($* (#,##0);_($* "-"??_);_(@_)';
    for (let i = 2; i <= sheet.rowCount; i++) {
      for (let col = 2; col <= 4; col++) {
        const cell = sheet.getRow(i).getCell(col);
        cell.numFmt = formatoContable;
      }
    }
  }

  // Definir columnas
  sheet.columns = [
    { header: 'SEDE / EAPB', key: 'sede', width: 74 },
    { header: 'Total Facturado', key: 'total', width: 20 },
    { header: 'Corriente', key: 'corriente', width: 20 },
    { header: 'Remanente', key: 'remanente', width: 20 },
  ];

  // Agregar filas
  rows.forEach(row => {
    // Si existe columna de notas crédito, restar al total facturado
    let total = Number(row['Total Facturado']) || 0;
    if (row['Notas Crédito']) {
      total -= Number(row['Notas Crédito']) || 0;
    }
    sheet.addRow({
      sede: row['SEDE / EAPB'],
      total,
      corriente: Number(row['Corriente']) || 0,
      remanente: Number(row['Remanente']) || 0,
    });
  });

  // Formato de encabezado
  const headerRow = sheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell(cell => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F497D' },
    };
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Formato de filas de datos (blanco, alineado a la izquierda, solo filas de sedes en negrita y con borde inferior)
  const totalRows = sheet.rowCount;
  for (let i = 2; i < totalRows; i++) {
    const row = sheet.getRow(i);
    // Detectar si es fila de sede (no empieza con espacios)
  const cellValue = String(row.getCell(1).value ?? '');
  const isSede = cellValue !== '' && !/^\s/.test(cellValue);
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFFFF' },
      };
      cell.font = { color: { argb: 'FF000000' }, bold: !!isSede };
      cell.alignment = { horizontal: 'left', vertical: 'middle' };
      // Borde inferior solo para filas de sede
      if (isSede && colNumber >= 1 && colNumber <= 4) {
        cell.border = {
          ...cell.border,
          bottom: { style: 'thin', color: { argb: 'FF000000' } }
        };
      }
    });
  }

  // Formato de la última fila (Total General) igual que encabezado
  const lastRow = sheet.getRow(totalRows);
  lastRow.eachCell({ includeEmpty: true }, cell => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F497D' },
    };
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Aplicar formato de contabilidad
  aplicarFormatoContabilidad();
  // Guardar archivo
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'informe_general.xlsx');
}
