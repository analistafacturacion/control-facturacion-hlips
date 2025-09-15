import { setPergamoCredenciales, getPergamoCredenciales, clearPergamoCredenciales } from '../utils/pergamoSessionStore';
import { pergamoLogin } from '../utils/pergamoLogin';
import { Router, Response } from 'express';
import fetch from 'node-fetch';
import { getRepository, Between } from 'typeorm';
import { FacturacionEvento } from '../entity/FacturacionEvento';
import { Sede } from '../entity/Sede';
import { RipsFactura } from '../entity/RipsFactura';
import { RequestWithIO } from '../types/RequestWithIO';
import ExcelJS from 'exceljs';

const router = Router();

// Endpoint para actualizar el campo periodo de un evento
router.patch('/evento/:id/periodo', async (req, res) => {
  const id = Number(req.params.id);
  const { periodo } = req.body;
  if (!periodo) return res.status(400).json({ error: 'Falta el campo periodo' });
  try {
    const repo = getRepository(FacturacionEvento);
    const evento = await repo.findOne({ where: { id: Number(id) } });
    if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });
    evento.periodo = periodo;
    await repo.save(evento);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error actualizando periodo', details: e });
  }
});


// Endpoint para descargar reportes de Evento y RIPS en Excel
router.get('/reporte', async (req, res) => {
  try {
    const { tipo } = req.query;
    let fechaInicial = req.query.fechaInicial;
    let fechaFinal = req.query.fechaFinal;
    if (!tipo || !fechaInicial || !fechaFinal) {
      return res.status(400).json({ error: 'Faltan parámetros requeridos' });
    }
    // Forzar a string si viene como array o ParsedQs
    if (Array.isArray(fechaInicial)) fechaInicial = fechaInicial[0];
    if (Array.isArray(fechaFinal)) fechaFinal = fechaFinal[0];
    fechaInicial = String(fechaInicial);
    fechaFinal = String(fechaFinal);
    // Declarar tipo explícito para rows
    let rows: Record<string, any>[] = [];
    let columns = [];
    if (tipo === 'evento') {
      const repo = getRepository(FacturacionEvento);
      const eventos = await repo.find({
        where: {
          fecha: Between(fechaInicial, fechaFinal)
        },
        order: { fecha: 'ASC' },
        relations: ['sede']
      });
      // Obtener aseguradoras para mapear nombrePergamo
      const aseguradoraRepo = getRepository(require('../entity/Aseguradora').Aseguradora);
      const aseguradoras = await aseguradoraRepo.find();
      columns = [
        { header: 'Factura', key: 'numeroFactura' },
        { header: 'Fecha', key: 'fecha' },
        { header: 'Tipo Documento', key: 'tipoDocumento' },
        { header: 'Documento', key: 'documento' },
        { header: 'Paciente', key: 'paciente' },
        { header: 'Tipo Atención', key: 'tipoAtencion' },
        { header: 'Convenio', key: 'convenio' },
        { header: 'Portafolio', key: 'portafolio' },
        { header: 'NIT', key: 'nit' },
        { header: 'Aseguradora', key: 'aseguradora' },
        { header: 'Sede', key: 'sede' },
        { header: 'Regional', key: 'regional' },
        { header: 'Programa', key: 'programa' },
        { header: 'Fecha Inicial', key: 'fechaInicial' },
        { header: 'Fecha Final', key: 'fechaFinal' },
        { header: 'Periodo', key: 'periodo' },
        { header: 'Total', key: 'total' },
        { header: 'Copago', key: 'copago' },
        { header: 'Total Facturado', key: 'valor' },
        { header: 'Facturador', key: 'facturador' }
      ];
      rows = eventos.map(e => {
        // Buscar nombrePergamo de la aseguradora
        let nombrePergamo = e.aseguradora;
        const aseg = aseguradoras.find(a => a.nombre === e.aseguradora);
        if (aseg) nombrePergamo = aseg.nombrePergamo;
        // Forzar valores numéricos para formato contable correcto
        const total = e.total !== undefined && e.total !== null ? Number(e.total) : null;
        const copago = e.copago !== undefined && e.copago !== null ? Number(e.copago) : null;
        const valor = e.valor !== undefined && e.valor !== null ? Number(e.valor) : null;
        return {
          numeroFactura: e.numeroFactura,
          fecha: e.fecha,
          tipoDocumento: e.tipoDocumento,
          documento: e.documento,
          paciente: e.paciente,
          tipoAtencion: e.tipoAtencion,
          convenio: e.convenio,
          portafolio: e.portafolio,
          nit: e.nit,
          aseguradora: nombrePergamo,
          sede: e.sede?.nombre || '',
          regional: e.regional,
          programa: e.programa,
          fechaInicial: e.fechaInicial,
          fechaFinal: e.fechaFinal,
          periodo: e.periodo,
          total,
          copago,
          valor,
          facturador: e.facturador
        };
      });
    } else if (tipo === 'rips') {
      const repo = getRepository(RipsFactura);
      const rips = await repo.find({
        where: {
          fechaFactura: Between(fechaInicial, fechaFinal)
        },
        order: { fechaFactura: 'ASC' }
      });
      columns = [
        { header: 'Factura', key: 'factura' },
        { header: 'Fecha Factura', key: 'fechaFactura' },
        { header: 'Tipo Documento', key: 'tipoDocumento' },
        { header: 'Documento', key: 'documento' },
        { header: 'Paciente', key: 'paciente' },
        { header: 'Cod EPS', key: 'codEps' },
        { header: 'Régimen', key: 'regimen' },
        { header: 'Zona', key: 'zonaResidencial' },
        { header: 'CIE10', key: 'cie10' },
        { header: 'Diagnóstico', key: 'diagnostico' },
        { header: 'CUMS/CUPS', key: 'cumsCups' },
        { header: 'Procedimiento', key: 'procedimiento' },
        { header: 'Cantidad', key: 'cantidad' },
        { header: 'Fecha Inicial', key: 'fechaInicial' },
        { header: 'Fecha Final', key: 'fechaFinal' },
        { header: 'Valor Unitario', key: 'valorUnitario' },
        { header: 'Copago', key: 'copago' },
        { header: 'Total', key: 'total' },
        { header: 'Total Pagado', key: 'totalPagado' },
        { header: 'Aseguradora', key: 'aseguradora' },
        { header: 'Ámbito', key: 'ambito' },
        { header: 'Sede', key: 'sede' },
        { header: 'Regional', key: 'regional' }
      ];
    // Crear Excel
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Reporte');
    sheet.columns = columns;
    // Ajustar ancho de todas las columnas a 12.14 unidades de Excel
    sheet.columns.forEach(col => { col.width = 12.14; });
    sheet.addRows(rows);
    // Formato contabilidad sin decimales para columnas P, Q, R, S (valorUnitario, copago, total, totalPagado)
    // P=16, Q=17, R=18, S=19 (1-based)
    if (tipo === 'rips') {
      // Formato contabilidad para Cantidad (N=14) y para P,Q,R,S (16-19)
      const colsContables = [14, 16, 17, 18, 19];
      for (let i of colsContables) {
        const col = sheet.getColumn(i);
        col.numFmt = '_-$* #,##0_-;-$* #,##0_-;_-* "-"??_-;_-@_-';
      }
    }
      rows = rips.map(r => {
        // Concatenar nombre completo: primerNombre, segundoNombre, primerApellido, segundoApellido (en ese orden)
        const nombreParts = [r.primerNombre, r.segundoNombre, r.primerApellido, r.segundoApellido]
          .map(x => (x || '').toString().trim())
          .filter(x => x.length > 0);
        const paciente = nombreParts.join(' ');
        return {
          factura: r.factura,
          fechaFactura: r.fechaFactura,
          tipoDocumento: r.tipoDocumento,
          documento: r.documento,
          paciente,
          codEps: r.codEps,
          regimen: r.regimen,
          zonaResidencial: r.zonaResidencial,
          cie10: r.cie10,
          diagnostico: r.diagnostico,
          cumsCups: r.cumsCups,
          procedimiento: r.procedimiento,
          fechaInicial: r.fechaInicial,
          fechaFinal: r.fechaFinal,
          cantidad: r.cantidad,
          valorUnitario: r.valorUnitario,
          copago: r.copago,
          total: r.total,
          totalPagado: r.totalPagado,
          aseguradora: r.aseguradora,
          ambito: r.ambito,
          sede: r.sede,
          regional: r.regional
        };
      });
    } else if (tipo === 'general') {
      // Para el reporte general, calcular automáticamente el último mes vigente
      // (mes anterior al actual)
      const hoy = new Date();
      const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
      
      const fechaInicialGeneral = mesAnterior.toISOString().slice(0, 10);
      const fechaFinalGeneral = ultimoDiaMesAnterior.toISOString().slice(0, 10);
      
      console.log(`[REPORTE GENERAL] Usando último mes vigente: ${fechaInicialGeneral} a ${fechaFinalGeneral}`);
      
      // Lógica de agrupación para el reporte general
      const repo = getRepository(FacturacionEvento);
      const eventos = await repo.find({
        where: {
          fecha: Between(fechaInicialGeneral, fechaFinalGeneral)
        },
        relations: ['sede']
      });
      // Agrupar por sede y aseguradora
      const agrupacion: Record<string, Record<string, { total: number; corriente: number; remanente: number }>> = {};
      eventos.forEach(ev => {
  // Log para depuración de nombres de sede
  console.log('[DEPURACION] Sede detectada en evento:', ev.sede?.nombre);
        // Normalizar nombre de sede para agrupar correctamente (sin tildes)
        const sede = (ev.sede?.nombre || 'Sin sede')
          .trim()
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .toUpperCase();
        const aseguradora = ev.aseguradora || 'Sin aseguradora';
        const periodo = (ev.periodo || '').trim().toUpperCase();
        // Excluir facturas ANULADAS
        if (periodo === 'ANULADA') return;
        if (!agrupacion[sede]) agrupacion[sede] = {};
        if (!agrupacion[sede][aseguradora]) agrupacion[sede][aseguradora] = { total: 0, corriente: 0, remanente: 0 };
        const valor = Number(ev.valor) || 0;
        agrupacion[sede][aseguradora].total += valor;
        if (periodo === 'CORRIENTE') agrupacion[sede][aseguradora].corriente += valor;
        if (periodo === 'REMANENTE') agrupacion[sede][aseguradora].remanente += valor;
      });
      // Obtener aseguradoras para mapear nombrePergamo
      const aseguradoraRepo = getRepository(require('../entity/Aseguradora').Aseguradora);
      const aseguradoras = await aseguradoraRepo.find();
      // Construir filas y columnas
      const columnsGeneral = [
        { header: 'SEDE / EAPB', key: 'sede' },
        { header: 'Total Facturado', key: 'totalFacturado' },
        { header: 'Corriente', key: 'corriente' },
        { header: 'Remanente', key: 'remanente' }
      ];
      const rowsGeneral: any[] = [];
      let totalGeneral = 0, totalCorriente = 0, totalRemanente = 0;
      const ordenSedes = [
        'SAN FRANCISCO',
        'CUCUTA',
        'VALLEDUPAR',
        'BARRANQUILLA',
        'CABECERA'
      ];
      for (const sede of ordenSedes) {
        const aseguradorasSede = agrupacion[sede];
        if (!aseguradorasSede) continue;
        let totalSede = 0, corrienteSede = 0, remanenteSede = 0;
        Object.values(aseguradorasSede).forEach(val => {
          totalSede += val.total;
          corrienteSede += val.corriente;
          remanenteSede += val.remanente;
        });
        totalGeneral += totalSede;
        totalCorriente += corrienteSede;
        totalRemanente += remanenteSede;
        let nombreMostrar = sede;
        if (sede === 'CUCUTA') nombreMostrar = 'CÚCUTA';
        else if (sede === 'SAN FRANCISCO') nombreMostrar = 'SAN FRANCISCO';
        else if (sede === 'VALLEDUPAR') nombreMostrar = 'VALLEDUPAR';
        else if (sede === 'BARRANQUILLA') nombreMostrar = 'BARRANQUILLA';
        else if (sede === 'CABECERA') nombreMostrar = 'CABECERA';
        rowsGeneral.push({
          sede: nombreMostrar,
          totalFacturado: totalSede,
          corriente: corrienteSede,
          remanente: remanenteSede,
          esSede: true
        });
        // Aseguradoras ordenadas alfabéticamente
        const asegKeys = Object.keys(aseguradorasSede).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
        for (const aseg of asegKeys) {
          const valores = aseguradorasSede[aseg];
          let nombrePergamo = aseg;
          if (Array.isArray(aseguradoras) && aseguradoras.length > 0 && aseguradoras[0].nombrePergamo) {
            const asegObj = aseguradoras.find(a => a.nombre === aseg || a.nombrePergamo === aseg);
            if (asegObj && asegObj.nombrePergamo) nombrePergamo = asegObj.nombrePergamo;
          }
          rowsGeneral.push({
            sede: '   ' + nombrePergamo,
            totalFacturado: valores.total,
            corriente: valores.corriente,
            remanente: valores.remanente,
            esSede: false
          });
        }
      }
      // Fila de total general
      rowsGeneral.push({
        sede: 'Total General',
        totalFacturado: totalGeneral,
        corriente: totalCorriente,
        remanente: totalRemanente
      });
      // Crear Excel
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Reporte General');
      sheet.columns = columnsGeneral;
      // Ajustar ancho de columnas: A=63, B=18, C=18, D=18
      sheet.getColumn(1).width = 63;
      sheet.getColumn(2).width = 18;
      sheet.getColumn(3).width = 18;
      sheet.getColumn(4).width = 18;
      sheet.addRows(rowsGeneral);
      // Formato contable para columnas 2, 3, 4 (Total Facturado, Corriente, Remanente)
      [2, 3, 4].forEach(i => {
        const col = sheet.getColumn(i);
        col.numFmt = '_-$* #,##0_-;-$* #,##0_-;_-* "-"??_-;_-@_-';
      });
      // Encabezado visual
      sheet.getRow(1).height = 25.5;
      const headerRow = sheet.getRow(1);
      headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '1F497D' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = { name: 'Aptos', color: { argb: 'FFFFFF' }, bold: true };
      });
      // Formato de filas de datos
      for (let i = 2; i <= sheet.rowCount; i++) {
        const row = sheet.getRow(i);
        row.height = 15;
        // Fondo blanco para columnas A, B, C, D (1,2,3,4) hasta la penúltima fila
        if (i < sheet.rowCount) {
          for (let col = 1; col <= 4; col++) {
            row.getCell(col).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFFF' }
            };
            row.getCell(col).alignment = { vertical: 'middle', horizontal: col === 4 ? 'center' : 'left' };
          }
          // Negrita y borde inferior solo para filas de sede
          if (rowsGeneral[i-2]?.esSede) {
            for (let col = 1; col <= 4; col++) {
              row.getCell(col).font = { name: 'Aptos', size: 9, bold: true };
              row.getCell(col).border = {
                bottom: { style: 'thin', color: { argb: '1F497D' } }
              };
            }
          } else {
            for (let col = 1; col <= 4; col++) {
              row.getCell(col).font = { name: 'Aptos', size: 9, bold: false };
              row.getCell(col).border = {};
            }
          }
        } else {
          // Última fila (Total General): toda la fila azul, negrita y centrado
          for (let col = 1; col <= 4; col++) {
            row.getCell(col).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: '1F497D' }
            };
            row.getCell(col).alignment = { vertical: 'middle', horizontal: 'center' };
            row.getCell(col).font = { name: 'Aptos', size: 9, bold: true, color: { argb: 'FFFFFF' } };
          }
        }
      }
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Reporte_general_${fechaInicial}_${fechaFinal}.xlsx`);
      await workbook.xlsx.write(res);
      return res.end();
    } else {
      return res.status(400).json({ error: 'Tipo de reporte no soportado' });
    }
    // Crear Excel
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Reporte');
  sheet.columns = columns;
  // Ajustar ancho de todas las columnas a 12.14 unidades de Excel
  sheet.columns.forEach(col => { col.width = 12.14; });
  sheet.addRows(rows);
    // Formato contabilidad sin decimales para columnas P, Q, R, S (valorUnitario, copago, total, totalPagado)
    // P=16, Q=17, R=18, S=19 (1-based)
    if (tipo === 'rips') {
      for (let i = 16; i <= 19; i++) {
        const col = sheet.getColumn(i);
        col.numFmt = '_-$* #,##0_-;-$* #,##0_-;_-* "-"??_-;_-@_-';
      }
    }
    // Ajustar el alto de la primera fila (encabezados) a 25.5 unidades de Excel
    sheet.getRow(1).height = 25.5;
    // Aplicar color de fondo y centrado a la primera fila (A1:T1)
    const headerRow = sheet.getRow(1);
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1F497D' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.font = { name: 'Aptos', color: { argb: 'FFFFFF' }, bold: true };
    });
    // Formato contabilidad sin decimales para columnas Q, R, S (Total, Copago, Total Facturado)
    // Q = 17, R = 18, S = 19 (1-based)
    for (let i = 17; i <= 19; i++) {
      const col = sheet.getColumn(i);
      col.numFmt = '_-$* #,##0_-;-$* #,##0_-;_-* "-"??_-;_-@_-';
    }
    // Cambiar fuente de toda la tabla a Aptos y tamaño 9 desde la fila 2 hacia abajo
    for (let i = 2; i <= sheet.rowCount; i++) {
      const row = sheet.getRow(i);
      row.font = { name: 'Aptos', size: 9 };
      row.height = 15;
      row.alignment = { vertical: 'middle', horizontal: 'left' };
    }
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Reporte_${tipo}_${fechaInicial}_${fechaFinal}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('[REPORTE] Error generando reporte', err);
    res.status(500).json({ error: 'Error generando reporte', details: err });
  }
});

async function safeJson(res: any) {
  try {
    return await res.json();
  } catch (e) {
    return null;
  }
}

// Utilidad para obtener los meses entre dos fechas (YYYY-MM)
function getMonthsBetween(start: string, end: string) {
  // start y end en formato YYYY-MM
  const result = [];
  let [startY, startM] = start.split('-').map(Number);
  let [endY, endM] = end.split('-').map(Number);
  let y = startY, m = startM;
  while (y < endY || (y === endY && m <= endM)) {
    result.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  console.log('[FACTURACION] Meses generados para el rango:', result);
  return result;
}

router.post('/cargar', async (req: RequestWithIO, res: Response) => {
  try {
    const { fechaInicial, fechaFinal, token, userId } = req.body;
    console.log('[CARGAR] INICIO', { fechaInicial, fechaFinal, userId });
    if (!fechaInicial || !fechaFinal || !userId) {
      console.error('[CARGAR] Faltan parámetros', { fechaInicial, fechaFinal, userId });
      return res.status(400).json({ error: 'Faltan parámetros' });
    }
    let tokenPergamo = token;
    if (!tokenPergamo) {
      const cred = getPergamoCredenciales(userId);
      if (!cred || !cred.user || !cred.pass) {
        console.error('[CARGAR] No hay credenciales de Pergamo en memoria', { userId });
        return res.status(401).json({ error: 'No hay credenciales de Pergamo en memoria. Inicie sesión nuevamente.' });
      }
      try {
        const loginRes = await pergamoLogin(cred.user, cred.pass);
        if (!loginRes) {
          console.error('[CARGAR] No se pudo renovar el token de Pergamo', { userId });
          return res.status(401).json({ error: 'No se pudo renovar el token de Pergamo. Revise credenciales.' });
        }
        tokenPergamo = loginRes;
        setPergamoCredenciales(userId, { ...cred, token: tokenPergamo });
      } catch (e) {
        console.error('[CARGAR] Error al renovar token de Pergamo', e);
        return res.status(401).json({ error: 'Error al renovar token de Pergamo', details: e });
      }
    }
    const facturacionRepo = getRepository(FacturacionEvento);
    const ripsFacturaRepo = getRepository(RipsFactura);
    const sedeRepo = getRepository(Sede);
    const aseguradoraRepo = getRepository(require('../entity/Aseguradora').Aseguradora);
    const sedes = await sedeRepo.find();
    const sedesNombres = sedes.map(s => s.nombre.trim().toUpperCase());
    const aseguradoras = await aseguradoraRepo.find();
    const startMonth = fechaInicial.slice(0, 7);
    const endMonth = fechaFinal.slice(0, 7);

    let nuevosEvento: any[] = [];
    let nuevosRips: any[] = [];
    let yaExistentesEvento: any[] = [];
    let yaExistentesRips: any[] = [];

    // Procesamiento por mes con reintentos y logs resumidos
    const meses = getMonthsBetween(startMonth, endMonth);
    console.log(`🗓️ [CARGAR] Procesando meses: ${meses.join(', ')}`);
    for (const mes of meses) {
      const [anio, mesNum] = mes.split('-');
      let primerDia, ultimoDia;
      if (mes === startMonth && mes === endMonth) {
        primerDia = fechaInicial;
        ultimoDia = fechaFinal;
      } else if (mes === startMonth) {
        primerDia = fechaInicial;
        ultimoDia = new Date(Number(anio), parseInt(mesNum, 10), 0).toISOString().slice(0, 10);
      } else if (mes === endMonth) {
        primerDia = `${anio}-${mesNum}-01`;
        ultimoDia = fechaFinal;
      } else {
        primerDia = `${anio}-${mesNum}-01`;
        ultimoDia = new Date(Number(anio), parseInt(mesNum, 10), 0).toISOString().slice(0, 10);
      }
      // --- RIPS ---
      let intentoRips = 0, exitoRips = false, ripsData = null;
      while (intentoRips < 3 && !exitoRips) {
        intentoRips++;
        const inicio = Date.now();
        try {
          const urlRips = `https://backpergamo.hlips.com.co/api/report_ripsGeneral?initial_report=${primerDia}&final_report=${ultimoDia}`;
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 60000); // 60 segundos
          const ripsRes = await fetch(urlRips, { headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${tokenPergamo}` }, signal: controller.signal });
          clearTimeout(timeout);
          ripsData = await safeJson(ripsRes);
          const duracion = ((Date.now() - inicio) / 1000).toFixed(2);
          if (ripsData && ripsData.status && Array.isArray(ripsData.data?.report_rips)) {
            exitoRips = true;
            console.log(`⏱️ [RIPS] ${mes}: Intento ${intentoRips} completado en ${duracion}s.`);
          } else {
            console.log(`🟡 [RIPS] ${mes}: Datos inválidos. Intento ${intentoRips} (${duracion}s)`);
          }
        } catch (err) {
          const duracion = ((Date.now() - inicio) / 1000).toFixed(2);
          console.log(`🔴 [RIPS] ${mes}: Error o timeout. Intento ${intentoRips} (${duracion}s)`);
        }
      }
      let insertadosRipsMes = 0, yaExistentesRipsMes = 0;
      if (exitoRips) {
        const ripsFiltrado = ripsData.data.report_rips.filter((r: any) => {
          const fechaR = r.Fecha_Factura ? r.Fecha_Factura.split(' ')[0] : null;
          return fechaR && fechaR >= primerDia && fechaR <= ultimoDia && sedesNombres.includes((r.Sede || '').trim().toUpperCase());
        });
        const existentesRips = await ripsFacturaRepo.find({ select: ['factura', 'cumsCups'] });
        const existentesSetRips = new Set(existentesRips.map(r => `${r.factura}_${r.cumsCups}`));
        const nuevosRipsMes = [];
        for (const r of ripsFiltrado) {
          const facturaLimpia = (r.Factura || '').replace(/[^a-zA-Z0-9]/g, '');
          const cumsCups = r.Cums_Cups || null;
          if (existentesSetRips.has(`${facturaLimpia}_${cumsCups}`)) { yaExistentesRipsMes++; yaExistentesRips.push(r); continue; }
          nuevosRipsMes.push({
            factura: facturaLimpia,
            tipo: r.Tipo || null,
            fechaFactura: r.Fecha_Factura ? r.Fecha_Factura.split(' ')[0] : null,
            tipoDocumento: r.Tipo_Documento || null,
            documento: r.Documento || null,
            codEps: r.Cod_EPS || null,
            regimen: r.Regimen ?? null,
            primerApellido: r.Primer_Apellido || null,
            segundoApellido: r.Segundo_Apellido || null,
            primerNombre: r['1er_Nombre'] || null,
            segundoNombre: r['2do_Nombre'] || null,
            edad: r.Edad ?? null,
            genero: r.Genero || null,
            departamento: r.Departamento || null,
            municipio: r.Municipio || null,
            zonaResidencial: r.Zona_Residencial || null,
            cie10: r.CIE10 || null,
            diagnostico: r.Diagnostico || null,
            servicioId: r.Servicio_ID ?? null,
            cumsCups: r.Cums_Cups || null,
            procedimiento: r.Procedimiento || null,
            fechaServicio: r.Fecha_Servicio || null,
            fechaInicial: r.Fecha_inicial ? r.Fecha_inicial.split(' ')[0] : null,
            fechaFinal: r.Fecha_final ? r.Fecha_final.split(' ')[0] : null,
            autorizacionId: r.Autorizacion_ID ?? null,
            cantidad: r.Cantidad ?? null,
            valorUnitario: r.Valor_Unitario ?? null,
            copago: r.COPAGO ?? null,
            total: r.Total ?? null,
            totalPagado: r.Total_Pagado ?? null,
            aseguradora: r.Aseguradora || null,
            ruta: r.Ruta || null,
            ambito: r.Ambito || null,
            modalidad: r.Modalidad || null,
            sede: r.Sede || null,
            regional: r.Regional || null
          });
          insertadosRipsMes++;
        }
        if (nuevosRipsMes.length > 0) {
          // Inserción en lotes para evitar error de demasiados parámetros
          const BATCH_SIZE = 500;
          for (let i = 0; i < nuevosRipsMes.length; i += BATCH_SIZE) {
            const batch = nuevosRipsMes.slice(i, i + BATCH_SIZE);
            await ripsFacturaRepo.save(batch);
            nuevosRips.push(...batch);
          }
        }
        console.log(`✅ [RIPS] ${mes}: Insertados: ${insertadosRipsMes}, Existentes: ${yaExistentesRipsMes}`);
      } else {
        console.log(`❌ [RIPS] ${mes}: Falló tras 3 intentos. Se omite este mes.`);
      }

      // --- EVENTO ---
      let intentoEvento = 0, exitoEvento = false, pergamoData = null;
      while (intentoEvento < 3 && !exitoEvento) {
        intentoEvento++;
        const inicio = Date.now();
        try {
          const urlEvento = `https://backpergamo.hlips.com.co/api/report_billingGeneral?billing_type=evento&initial_report=${primerDia}&final_report=${ultimoDia}`;
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 20000);
          const pergamoRes = await fetch(urlEvento, { headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${tokenPergamo}` }, signal: controller.signal });
          clearTimeout(timeout);
          pergamoData = await safeJson(pergamoRes);
          const duracion = ((Date.now() - inicio) / 1000).toFixed(2);
          if (pergamoData && pergamoData.status && Array.isArray(pergamoData.data?.h1)) {
            exitoEvento = true;
            console.log(`⏱️ [EVENTO] ${mes}: Intento ${intentoEvento} completado en ${duracion}s.`);
          } else {
            console.log(`🟡 [EVENTO] ${mes}: Datos inválidos. Intento ${intentoEvento} (${duracion}s)`);
          }
        } catch (err) {
          const duracion = ((Date.now() - inicio) / 1000).toFixed(2);
          console.log(`🔴 [EVENTO] ${mes}: Error o timeout. Intento ${intentoEvento} (${duracion}s)`);
        }
      }
      let insertadosEventoMes = 0, yaExistentesEventoMes = 0;
      if (exitoEvento) {
        const facturas = pergamoData.data.h1.filter((f: any) => {
          const fechaF = f.Fecha_Facturacion ? f.Fecha_Facturacion.split(' ')[0] : null;
          return fechaF && fechaF >= primerDia && fechaF <= ultimoDia && sedesNombres.includes((f.Sede || '').trim().toUpperCase());
        });
        const existentesEvento = await facturacionRepo.find({ select: ['numeroFactura'] });
        const existentesSetEvento = new Set(existentesEvento.map(e => e.numeroFactura));
        const nuevosEventoMes = [];
        for (const f of facturas) {
          const sede = sedes.find(s => s.nombre.trim().toUpperCase() === (f.Sede || '').trim().toUpperCase());
          if (!sede) continue;
          const numeroFacturaLimpio = (f.Factura || '').replace(/[^a-zA-Z0-9]/g, '');
          if (existentesSetEvento.has(numeroFacturaLimpio)) { yaExistentesEventoMes++; yaExistentesEvento.push(f); continue; }
          let nombreAseguradora = f.Aseguradora;
          const aseg = aseguradoras.find(a => a.nombrePergamo.trim().toUpperCase() === (f.Aseguradora || '').trim().toUpperCase());
          if (aseg) nombreAseguradora = aseg.nombre;
          const ripsFactura = await ripsFacturaRepo.findOne({ where: { factura: numeroFacturaLimpio } });
          let fechaInicialR = ripsFactura?.fechaInicial;
          let fechaFinalR = ripsFactura?.fechaFinal;
          let periodo = 'CORRIENTE';
          if (ripsFactura) {
            fechaInicialR = ripsFactura.fechaInicial;
            fechaFinalR = ripsFactura.fechaFinal;
            try {
              const fechaFact = f.Fecha_Facturacion ? new Date(f.Fecha_Facturacion.split(' ')[0]) : null;
              const ini = fechaInicialR ? new Date(fechaInicialR) : null;
              const fin = fechaFinalR ? new Date(fechaFinalR) : null;
              if (fechaFact && ini && fin) {
                const mesFactura = fechaFact.getMonth();
                const anioFactura = fechaFact.getFullYear();
                const mesIni = ini.getMonth();
                const anioIni = ini.getFullYear();
                const mesFin = fin.getMonth();
                const anioFin = fin.getFullYear();
                if (
                  anioIni === anioFin && mesIni === mesFin &&
                  (
                    (anioFactura === anioIni && mesFactura === mesIni + 1) ||
                    (mesIni === 11 && anioFactura === anioIni + 1 && mesFactura === 0)
                  )
                ) {
                  periodo = 'CORRIENTE';
                } else {
                  let mesAnterior = mesFactura - 1;
                  let anioAnterior = anioFactura;
                  if (mesAnterior < 0) {
                    mesAnterior = 11;
                    anioAnterior--;
                  }
                  if (anioIni === anioAnterior && mesIni === mesAnterior) {
                    periodo = 'CORRIENTE';
                  } else if (anioFin === anioAnterior && mesFin === mesAnterior) {
                    periodo = 'CORRIENTE';
                  } else if (
                    (anioIni < anioAnterior || (anioIni === anioAnterior && mesIni < mesAnterior)) &&
                    (anioFin < anioAnterior || (anioFin === anioAnterior && mesFin < mesAnterior))
                  ) {
                    periodo = 'REMANENTE';
                  } else {
                    periodo = 'CORRIENTE';
                  }
                }
              }
            } catch (e) { console.error('[CARGAR] Error calculando periodo evento', e); }
          }
          nuevosEventoMes.push({
            numeroFactura: numeroFacturaLimpio,
            fecha: f.Fecha_Facturacion ? f.Fecha_Facturacion.split(' ')[0] : undefined,
            valor: f.Total_Facturado || 0,
            sede: sede,
            aseguradora: nombreAseguradora,
            paciente: f.Paciente,
            tipoDocumento: f.Tipo_Documento,
            documento: f.Documento,
            ambito: f.Ambito,
            tipoAtencion: f.Tipo_Atencion,
            facturador: f.Facturador,
            programa: f.Programa,
            total: f.Total,
            copago: f.Copago,
            fechaInicial: fechaInicialR,
            fechaFinal: fechaFinalR,
            periodo,
            convenio: f.Convenio,
            portafolio: f.Portafolio,
            nit: f.NIT,
            regional: f.Regional
          });
          insertadosEventoMes++;
        }
        if (nuevosEventoMes.length > 0) {
          // Inserción en lotes para evitar error de demasiados parámetros
          const BATCH_SIZE = 500;
          for (let i = 0; i < nuevosEventoMes.length; i += BATCH_SIZE) {
            const batch = nuevosEventoMes.slice(i, i + BATCH_SIZE);
            await facturacionRepo.save(batch);
            nuevosEvento.push(...batch);
          }
        }
        console.log(`✅ [EVENTO] ${mes}: Insertados: ${insertadosEventoMes}, Existentes: ${yaExistentesEventoMes}`);
      } else {
        console.log(`❌ [EVENTO] ${mes}: Falló tras 3 intentos. Se omite este mes.`);
      }
    }

    const insertadosEvento = nuevosEvento.length;
    const insertadosRips = nuevosRips.length;
    console.log('[CARGAR] Resumen:', {
      insertadosEvento, insertadosRips,
      yaExistentesEvento: yaExistentesEvento.length,
      yaExistentesRips: yaExistentesRips.length
    });

    try {
      const eventosIncompletos = await facturacionRepo
        .createQueryBuilder('evento')
        .where('evento.fecha BETWEEN :ini AND :fin', { ini: fechaInicial, fin: fechaFinal })
        .andWhere('(evento.fechaInicial IS NULL OR evento.fechaFinal IS NULL OR evento.periodo IS NULL)')
        .getMany();
      for (const evento of eventosIncompletos) {
        const ripsFactura = await ripsFacturaRepo.findOne({ where: { factura: evento.numeroFactura } });
        let fechaInicialR = ripsFactura?.fechaInicial;
        let fechaFinalR = ripsFactura?.fechaFinal;
        let periodo = 'CORRIENTE';
        try {
          const fechaFact = evento.fecha ? new Date(evento.fecha) : null;
          const ini = fechaInicialR ? new Date(fechaInicialR) : null;
          const fin = fechaFinalR ? new Date(fechaFinalR) : null;
          if (fechaFact && ini) {
            const mesFactura = fechaFact.getMonth();
            const anioFactura = fechaFact.getFullYear();
            let mesAnterior = mesFactura - 1;
            let anioAnterior = anioFactura;
            if (mesAnterior < 0) {
              mesAnterior = 11;
              anioAnterior--;
            }
            if (ini.getFullYear() === anioAnterior && ini.getMonth() === mesAnterior) {
              periodo = 'CORRIENTE';
            }
            else if (fin && fin.getFullYear() === anioAnterior && fin.getMonth() === mesAnterior) {
              periodo = 'CORRIENTE';
            }
            else if (
              (ini.getFullYear() < anioAnterior || (ini.getFullYear() === anioAnterior && ini.getMonth() < mesAnterior)) &&
              (fin && (fin.getFullYear() < anioAnterior || (fin.getFullYear() === anioAnterior && fin.getMonth() < mesAnterior)))
            ) {
              periodo = 'REMANENTE';
            }
            else {
              periodo = 'CORRIENTE';
            }
          }
        } catch (e) { console.error('[CARGAR] Error calculando periodo evento incompleto', e); }
        await facturacionRepo.update(evento.id, {
          fechaInicial: fechaInicialR,
          fechaFinal: fechaFinalR,
          periodo
        });
      }
    } catch (err) { console.error('[CARGAR] Error actualizando eventos incompletos', err); }

    res.json({
      ok: true,
      resumen: {
        totalEvento: yaExistentesEvento.length + insertadosEvento,
        totalRips: yaExistentesRips.length + insertadosRips,
        insertadosEvento,
        insertadosRips,
        yaExistentesEvento: yaExistentesEvento.length,
        yaExistentesRips: yaExistentesRips.length
      },
      nuevosEvento,
      nuevosRips,
      yaExistentesEvento,
      yaExistentesRips
    });
    console.log('[CARGAR] FIN', { ok: true });
  } catch (err) {
    console.error('[CARGAR] ERROR FATAL', err);
    res.status(500).json({ error: 'Error al cargar facturación', details: err });
  }
});

export default router;
// Endpoint para obtener eventos de facturación
// Función helper para construir filtros SQL reutilizable
function buildFilterSQL(filters: any): { whereClause: string, params: any[] } {
  const { fechaInicial, fechaFinal, sede, aseguradora, search, periodo } = filters;
  let whereClause = '1=1';
  const params: any[] = [];
  let paramIndex = 1;
  
  // Filtro de fechas (obligatorio para rendimiento)
  if (fechaInicial && fechaFinal) {
    whereClause += ` AND e.fecha BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
    params.push(fechaInicial, fechaFinal);
    paramIndex += 2;
  }
  
  // Filtro de sede
  if (sede && sede.trim()) {
    whereClause += ` AND s.nombre = $${paramIndex}`;
    params.push(sede.trim());
    paramIndex++;
  }
  
  // Filtro de aseguradora (exacto para máximo rendimiento)
  if (aseguradora && aseguradora.trim()) {
    whereClause += ` AND e.aseguradora = $${paramIndex}`;
    params.push(aseguradora.trim());
    paramIndex++;
  }
  
  // Filtro de periodo (normalizado)
  if (periodo && periodo.trim()) {
    whereClause += ` AND UPPER(TRIM(COALESCE(e.periodo, ''))) = $${paramIndex}`;
    params.push(periodo.trim().toUpperCase());
    paramIndex++;
  }
  
  // Búsqueda de texto (optimizada)
  if (search && search.trim()) {
    const searchTerm = `%${search.trim().toLowerCase()}%`;
    whereClause += ` AND (
      LOWER(e.numero_factura) LIKE $${paramIndex} OR 
      LOWER(e.documento) LIKE $${paramIndex} OR 
      LOWER(e.paciente) LIKE $${paramIndex} OR
      LOWER(e.aseguradora) LIKE $${paramIndex}
    )`;
    params.push(searchTerm);
    paramIndex++;
  }
  
  return { whereClause, params };
}

router.get('/eventos', async (req: RequestWithIO, res: Response) => {
  try {
    const facturacionRepo = getRepository(FacturacionEvento);
    
    const { fechaInicial, fechaFinal, sede, aseguradora, page, limit, search, periodo } = req.query;
    
    console.log('[EVENTOS] Parámetros recibidos:', req.query);
    
    // Validar fechas obligatorias
    if (!fechaInicial || !fechaFinal) {
      return res.status(400).json({ 
        ok: false, 
        error: 'fechaInicial y fechaFinal son obligatorios para el rendimiento' 
      });
    }
    
    // Parámetros de paginación
    const pageNumber = Math.max(1, parseInt(String(page)) || 1);
    const limitNumber = Math.min(parseInt(String(limit)) || 100, 500);
    const offset = (pageNumber - 1) * limitNumber;
    
    // Construir filtros SQL optimizados
    const { whereClause, params } = buildFilterSQL(req.query);
    
    // Consulta SQL directa para máximo rendimiento
    const sqlCount = `
      SELECT COUNT(*)::int as total
      FROM facturacion_evento e
      LEFT JOIN sede s ON e.sede_id = s.id
      WHERE ${whereClause}
    `;
    
    const sqlData = `
      SELECT 
        e.id, e.numero_factura as "numeroFactura", e.fecha, e.valor,
        e.aseguradora, e.paciente, e.documento, e.periodo, e.ambito,
        s.nombre as sede_nombre, s.id as sede_id
      FROM facturacion_evento e
      LEFT JOIN sede s ON e.sede_id = s.id
      WHERE ${whereClause}
      ORDER BY e.fecha DESC, e.id DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    console.log('[EVENTOS] SQL optimizado:', sqlData);
    console.log('[EVENTOS] Parámetros:', [...params, limitNumber, offset]);
    
    // Ejecutar consultas en paralelo para máxima velocidad
    const [countResult, dataResult] = await Promise.all([
      facturacionRepo.query(sqlCount, params),
      facturacionRepo.query(sqlData, [...params, limitNumber, offset])
    ]);
    
    const total = countResult[0]?.total || 0;
    const eventos = dataResult.map((row: any) => ({
      id: row.id,
      numeroFactura: row.numeroFactura,
      fecha: row.fecha,
      valor: parseFloat(row.valor) || 0,
      aseguradora: row.aseguradora || '',
      paciente: row.paciente || '',
      documento: row.documento || '',
      periodo: row.periodo || '',
      ambito: row.ambito || '',
      sede: row.sede_nombre ? { id: row.sede_id, nombre: row.sede_nombre } : null
    }));
    
    // Metadatos de paginación
    const totalPages = Math.ceil(total / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;
    
    res.json({ 
      ok: true, 
      eventos,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalRecords: total,
        recordsPerPage: limitNumber,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener eventos', details: err });
  }
});

// Endpoint específico para tarjetas - SIN LÍMITE de paginación
router.get('/eventos/resumen', async (req: RequestWithIO, res: Response) => {
  try {
    const facturacionRepo = getRepository(FacturacionEvento);
    
    const { fechaInicial, fechaFinal, sede, aseguradora, search, periodo } = req.query;
    
    console.log('[RESUMEN] Parámetros recibidos:', req.query);
    
    // Validar fechas obligatorias
    if (!fechaInicial || !fechaFinal) {
      return res.status(400).json({ 
        ok: false, 
        error: 'fechaInicial y fechaFinal son obligatorios' 
      });
    }
    
    // Construir filtros SQL usando la misma función helper
    const { whereClause, params } = buildFilterSQL(req.query);
    
    // SQL optimizado para resumen completo sin paginación
    const sqlResumen = `
      SELECT 
        e.id, e.numero_factura as "numeroFactura", e.fecha, e.valor,
        e.aseguradora, e.paciente, e.documento, e.periodo, e.ambito,
        s.nombre as sede_nombre, s.id as sede_id
      FROM facturacion_evento e
      LEFT JOIN sede s ON e.sede_id = s.id
      WHERE ${whereClause}
      ORDER BY e.fecha DESC, e.id DESC
    `;
    
    console.log('[RESUMEN] SQL optimizado:', sqlResumen);
    console.log('[RESUMEN] Parámetros:', params);
    
    const resultado = await facturacionRepo.query(sqlResumen, params);
    
    const eventos = resultado.map((row: any) => ({
      id: row.id,
      numeroFactura: row.numeroFactura,
      fecha: row.fecha,
      valor: parseFloat(row.valor) || 0,
      aseguradora: row.aseguradora || '',
      paciente: row.paciente || '',
      documento: row.documento || '',
      periodo: row.periodo || '',
      ambito: row.ambito || '',
      sede: row.sede_nombre ? { id: row.sede_id, nombre: row.sede_nombre } : null
    }));
    
    console.log(`[RESUMEN] Encontrados ${eventos.length} eventos`);
    
    res.json({ 
      ok: true, 
      eventos,
      total: eventos.length
    });
  } catch (err) {
    const _err: any = err;
    console.error('[RESUMEN] Error:', _err);
    res.status(500).json({ 
      ok: false, 
      error: 'Error al obtener resumen de eventos', 
      details: _err 
    });
  }
});

// Endpoint ULTRA-RÁPIDO para totales de tarjetas (solo cálculos SQL)
router.get('/eventos/totales', async (req: RequestWithIO, res: Response) => {
  try {
    const facturacionRepo = getRepository(FacturacionEvento);
    
    const { fechaInicial, fechaFinal, sede, aseguradora, search, periodo } = req.query;
    
    console.log('[TOTALES] Parámetros recibidos:', req.query);
    
    // Validar fechas obligatorias
    if (!fechaInicial || !fechaFinal) {
      return res.status(400).json({ 
        ok: false, 
        error: 'fechaInicial y fechaFinal son obligatorios' 
      });
    }
    
    // Construir filtros SQL usando la misma función helper
    const { whereClause, params } = buildFilterSQL(req.query);
    
    // SQL optimizado para totales con máximo rendimiento
    const sqlTotales = `
      SELECT 
        COUNT(*)::int as total_facturas,
        SUM(COALESCE(e.valor, 0))::numeric as total_facturado,
        SUM(CASE 
          WHEN UPPER(TRIM(COALESCE(e.periodo, ''))) = 'CORRIENTE' 
          THEN COALESCE(e.valor, 0) 
          ELSE 0 
        END)::numeric as facturado_corriente,
        SUM(CASE 
          WHEN UPPER(TRIM(COALESCE(e.periodo, ''))) = 'REMANENTE' 
          THEN COALESCE(e.valor, 0) 
          ELSE 0 
        END)::numeric as facturado_remanente
      FROM facturacion_evento e
      LEFT JOIN sede s ON e.sede_id = s.id
      WHERE ${whereClause}
    `;
    
    console.log('[TOTALES] SQL optimizado:', sqlTotales);
    console.log('[TOTALES] Parámetros:', params);
    
    const resultado = await facturacionRepo.query(sqlTotales, params);
    const row = resultado[0];
    
    const totales = {
      totalFacturas: parseInt(row.total_facturas) || 0,
      totalFacturado: parseFloat(row.total_facturado) || 0,
      facturadoCorriente: parseFloat(row.facturado_corriente) || 0,
      facturadoRemanente: parseFloat(row.facturado_remanente) || 0
    };
    
    console.log('[TOTALES] Resultado calculado:', totales);
    
    res.json({
      ok: true,
      totales
    });
  } catch (err) {
    const _err: any = err;
    console.error('[TOTALES] Error:', _err);
    res.status(500).json({ 
      ok: false, 
      error: 'Error al calcular totales', 
      details: _err 
    });
  }
});

// Endpoint para guardar/obtener última actualización global
router.get('/ultima-actualizacion', async (req: RequestWithIO, res: Response) => {
  try {
    // Intentar leer desde la base de datos si está disponible
    try {
      const repo = getRepository(require('../entity/UltimaActualizacion').UltimaActualizacion);
      const row = await repo.createQueryBuilder('u').orderBy('u.updatedAt','DESC').getOne();
      if (row) {
        return res.json({ ok: true, ultimaActualizacion: row.fecha });
      }
    } catch (dbErr) {
      const _dbErr: any = dbErr;
      console.log('[ULTIMA-ACTUALIZACION] DB no disponible o error:', _dbErr.message || _dbErr);
      // continuar y usar archivo como fallback
    }

    // Fallback: archivo temporal en el servidor
    const fs = require('fs');
    const path = require('path');
    const configFile = path.join(process.cwd(), 'ultima-actualizacion.json');
    let ultimaActualizacion = '';
    if (fs.existsSync(configFile)) {
      const data = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      ultimaActualizacion = data.fecha || '';
    }
    
    res.json({ ok: true, ultimaActualizacion });
  } catch (err) {
    console.error('[ULTIMA-ACTUALIZACION] Error obteniendo fecha:', err);
    res.json({ ok: true, ultimaActualizacion: '' });
  }
});

router.post('/ultima-actualizacion', async (req: RequestWithIO, res: Response) => {
  try {
    const { fecha } = req.body;
    if (!fecha) return res.status(400).json({ error: 'fecha es requerida' });

    // Intentar persistir en DB
    try {
      const repo = getRepository(require('../entity/UltimaActualizacion').UltimaActualizacion);
      // Asegurar que la tabla exista (defensa en profundidad si no se aplicaron migraciones)
      try {
        await repo.query(`CREATE TABLE IF NOT EXISTS ultima_actualizacion (
          id SERIAL PRIMARY KEY,
          fecha text NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        )`);
      } catch (ensureErr) {
        const _e: any = ensureErr;
        console.log('[ULTIMA-ACTUALIZACION] Advertencia al crear tabla (posible falta de permisos):', _e.message || _e);
      }
      // Upsert: mantener un único registro (id = 1) y actualizarlo en cada petición
      try {
        await repo.query(
          'INSERT INTO ultima_actualizacion (id, fecha) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET fecha = EXCLUDED.fecha, updated_at = now()',
          [fecha]
        );
        console.log('[ULTIMA-ACTUALIZACION] Guardada/actualizada en DB (upsert):', fecha);
        return res.json({ ok: true, mensaje: 'Fecha actualizada en DB' });
      } catch (upsertErr) {
        const _up: any = upsertErr;
        console.log('[ULTIMA-ACTUALIZACION] Error en upsert:', _up && _up.message ? _up.message : _up);
        // continuar al fallback (archivo)
      }
    } catch (dbErr) {
      const _dbErr: any = dbErr;
      console.log('[ULTIMA-ACTUALIZACION] No se pudo guardar en DB, usando archivo. Error:', _dbErr && _dbErr.message ? _dbErr.message : _dbErr);
    }

    // Fallback: guardar en archivo temporal
    const fs = require('fs');
    const path = require('path');
    const configFile = path.join(process.cwd(), 'ultima-actualizacion.json');
    const data = { fecha, timestamp: new Date().toISOString() };
    fs.writeFileSync(configFile, JSON.stringify(data, null, 2));
    console.log(`[ULTIMA-ACTUALIZACION] Guardada en archivo: ${fecha}`);
    res.json({ ok: true, mensaje: 'Fecha actualizada (fallback archivo)' });
  } catch (err) {
    console.error('[ULTIMA-ACTUALIZACION] Error guardando fecha:', err);
    res.status(500).json({ error: 'Error al guardar fecha', details: err });
  }
});

// Endpoint de depuración: contar registros por periodo y rango de fechas
router.get('/eventos/debug/periodo-count', async (req: RequestWithIO, res: Response) => {
  try {
    const facturacionRepo = getRepository(FacturacionEvento);
    const { fechaInicial, fechaFinal, periodo } = req.query;
    if (!fechaInicial || !fechaFinal || !periodo) {
      return res.status(400).json({ error: 'fechaInicial, fechaFinal y periodo son requeridos' });
    }

    // Usar consulta SQL directa para evitar ambigüedades en QueryBuilder
    const sql = `SELECT COUNT(*)::int as count FROM facturacion_evento WHERE UPPER(TRIM(COALESCE(periodo, ''))) = UPPER(TRIM($1)) AND fecha BETWEEN $2 AND $3`;
    console.log('[DEBUG PERIOD0] Ejecutando SQL debug para periodo:', periodo, 'fechas:', fechaInicial, fechaFinal);
    const result = await facturacionRepo.query(sql, [String(periodo), String(fechaInicial), String(fechaFinal)]);
    const count = (result && result[0] && result[0].count) ? parseInt(result[0].count as any, 10) : 0;
    return res.json({ ok: true, periodo: periodo, fechaInicial, fechaFinal, count });
  } catch (err) {
    const _err: any = err;
    console.error('[DEBUG PERIOD0] Error:', _err);
    return res.status(500).json({ error: 'Error en debug periodo', details: _err });
  }
});