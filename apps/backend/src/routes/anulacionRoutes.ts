import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';
import { getRepository } from 'typeorm';
import { Anulacion } from '../entity/Anulacion';
import { Sede } from '../entity/Sede';

const router = Router();

// Endpoint para cargar anulaciones de los últimos dos días
router.post('/cargar-ultimos-dias', async (req: Request, res: Response) => {
    try {
        const { token, userId } = req.body;
    const hoy = new Date();
    const cuatroDiasAtras = new Date(hoy);
    cuatroDiasAtras.setDate(hoy.getDate() - 4);
    const fechaFinal = hoy.toISOString().slice(0, 10);
    const fechaInicial = cuatroDiasAtras.toISOString().slice(0, 10);
        if (!fechaInicial || !fechaFinal || !token || !userId) {
            return res.status(400).json({ error: 'Faltan parámetros' });
        }
        const sedeRepo = getRepository(Sede);
        const anulacionRepo = getRepository(Anulacion);
        const sedes = await sedeRepo.find();
        function getMonthlyRanges(start: string, end: string) {
            const ranges: { inicial: string; final: string }[] = [];
            const startDate = new Date(start);
            const endDate = new Date(end);
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate < startDate) return ranges;
            let current = new Date(startDate);
            while (current <= endDate) {
                const year = current.getFullYear();
                const month = current.getMonth();
                const firstDay = new Date(year, month, 1);
                const lastDay = new Date(year, month + 1, 0);
                // Asegurar que el rango generado no sea invertido
                const rangeStart = firstDay < startDate ? startDate : firstDay;
                const rangeEnd = lastDay > endDate ? endDate : lastDay;
                if (rangeStart > rangeEnd) {
                    current = new Date(year, month + 1, 1);
                    continue;
                }
                ranges.push({
                    inicial: rangeStart.toISOString().slice(0, 10),
                    final: rangeEnd.toISOString().slice(0, 10)
                });
                current = new Date(year, month + 1, 1);
            }
            return ranges;
        }
        const monthlyRanges = getMonthlyRanges(fechaInicial, fechaFinal);
        let insertados = 0, yaExistentes = 0, ignoradosSede = 0;
        const existentes = await anulacionRepo.find({ select: ['numeroAnulacion'] });
    const existentesSet = new Set(existentes.map((a: { numeroAnulacion: string }) => a.numeroAnulacion));
    const procesarMes = async (rango: { inicial: string; final: string }) => {
            let intento = 0;
            let pergamoData = null;
            let exito = false;
            const TIMEOUT_MS = 60000;
            while (intento < 3 && !exito) {
                intento++;
                const inicioIntento = Date.now();
                try {
                    const url = `https://backpergamo.hlips.com.co/api/report_billingGeneral?billing_type=evento&initial_report=${rango.inicial}&final_report=${rango.final}`;
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
                    const pergamoRes = await fetch(url, {
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        signal: controller.signal
                    });
                    clearTimeout(timeout);
                    pergamoData = await pergamoRes.json();
                    const duracion = ((Date.now() - inicioIntento) / 1000).toFixed(1);
                    console.log('[DEBUG Pergamo] Respuesta completa:', JSON.stringify(pergamoData));
                    if (Array.isArray(pergamoData?.data?.h3)) {
                        exito = true;
                        console.log(`🟢 [Anulaciones] ${rango.inicial} a ${rango.final}: Pergamo OK en ${duracion}s. Intento ${intento}`);
                    } else {
                        console.log(`🟡 [Anulaciones] ${rango.inicial} a ${rango.final}: Datos inválidos de Pergamo. Intento ${intento} (${duracion}s)`);
                    }
                } catch (err) {
                    const duracion = ((Date.now() - inicioIntento) / 1000).toFixed(1);
                    console.log(`🔴 [Anulaciones] ${rango.inicial} a ${rango.final}: Error o timeout en Pergamo. Intento ${intento} (${duracion}s)`);
                }
            }
            if (!exito) {
                console.log(`❌ [Anulaciones] ${rango.inicial} a ${rango.final}: Falló tras 3 intentos. Se omite este mes.`);
                return { insertados: 0, yaExistentes: 0, ignoradosSede: 0 };
            }
            const anulaciones = pergamoData.data.h3;
            // Procesar solo h2 y clasificar por Observacion
            const anulacionesH2 = pergamoData.data.h2;
            const nuevasAnulaciones = [];
            let insertadosMes = 0, yaExistentesMes = 0, ignoradosSedeMes = 0;
            for (const a of anulacionesH2) {
                const numeroAnulacion = (a.Factura || '').replace(/-/g, '').trim();
                const notaCredito = a.Nota_Credito ? String(a.Nota_Credito).replace(/-/g, '').trim() : undefined;
                const fecha = a.Fecha_Factura ? a.Fecha_Factura.split(' ')[0] : undefined;
                const fechaNotaCredito = a.Fecha_Nota_Credito ? a.Fecha_Nota_Credito.split(' ')[0] : undefined;
                const sedeNombre = (a.Sede || '').trim().toUpperCase();
                const sede = sedes.find((s: { nombre: string }) => s.nombre.trim().toUpperCase() === sedeNombre);
                if (!sede) { ignoradosSedeMes++; continue; }
                if (existentesSet.has(numeroAnulacion)) { yaExistentesMes++; continue; }
                // Si Observacion es null, es ANULACION
                if (a.Observacion === null) {
                    nuevasAnulaciones.push({
                        numeroAnulacion,
                        fecha,
                        notaCredito,
                        fechaNotaCredito,
                        tipoDocumento: a.Tipo_Documento,
                        documento: a.Documento,
                        paciente: a.Paciente,
                        aseguradora: a.Aseguradora,
                        sede,
                        facturador: a.Facturador,
                        totalAnulado: a.Total_Nota_Credito,
                        motivo: 'ANULACION',
                        estado: 'NO FACTURADO',
                        tipoRegistro: 'Anulación',
                        facturaRemplazo: undefined,
                        fechaRemplazo: undefined,
                        valorRemplazo: undefined,
                        sedeRemplazo: undefined
                    });
                } else {
                    // Si Observacion tiene valor, es NOTA CREDITO
                    nuevasAnulaciones.push({
                        numeroAnulacion,
                        fecha,
                        notaCredito,
                        fechaNotaCredito,
                        tipoDocumento: a.Tipo_Documento,
                        documento: a.Documento,
                        paciente: a.Paciente,
                        aseguradora: a.Aseguradora,
                        sede,
                        facturador: a.Facturador,
                        totalAnulado: a.Total_Nota_Credito,
                        motivo: 'ACEPTACIÓN DE GLOSA',
                        estado: 'NO FACTURADO',
                        tipoRegistro: 'Nota Crédito',
                        facturaRemplazo: '-',
                        fechaRemplazo: '-',
                        valorRemplazo: 0,
                        sedeRemplazo: '-'
                    });
                }
                insertadosMes++;
            }
            if (nuevasAnulaciones.length > 0) {
                await anulacionRepo.save(nuevasAnulaciones);
            }
            console.log(`✅ [Anulaciones] ${rango.inicial} a ${rango.final}: Insertados: ${insertadosMes}, Existentes: ${yaExistentesMes}, Ignorados por sede: ${ignoradosSedeMes}`);
            return { insertados: insertadosMes, yaExistentes: yaExistentesMes, ignoradosSede: ignoradosSedeMes };
        };
        const resultados = await Promise.allSettled(monthlyRanges.map(rango => procesarMes(rango)));
        resultados.forEach(r => {
            if (r.status === 'fulfilled') {
                insertados += r.value.insertados;
                yaExistentes += r.value.yaExistentes;
                ignoradosSede += r.value.ignoradosSede;
            }
        });
        console.log(`🏁 [Anulaciones] Resumen total: Insertados: ${insertados}, Existentes: ${yaExistentes}, Ignorados por sede: ${ignoradosSede}`);
        res.json({ ok: true, insertados, yaExistentes, ignoradosSede });
    } catch (err) {
        console.error('[ANULACIONES] Error al cargar anulaciones rápidas:', err);
        res.status(500).json({ error: 'Error al cargar anulaciones rápidas', details: err });
    }
});

// Endpoint para obtener todas las anulaciones
router.get('/', async (req: Request, res: Response) => {
    try {
        const anulacionRepo = getRepository(Anulacion);
        const anulaciones = await anulacionRepo.find({ relations: ['sede'] });
        res.json({ ok: true, anulaciones });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener anulaciones', details: err });
    }
});

// Endpoint para cargar anulaciones desde Pergamo (rango personalizado)
router.post('/cargar', async (req: Request, res: Response) => {
    try {
        const { fechaInicial, fechaFinal, token, userId } = req.body;
        if (!fechaInicial || !fechaFinal || !token || !userId) {
            return res.status(400).json({ error: 'Faltan parámetros' });
        }
        const sedeRepo = getRepository(Sede);
        const anulacionRepo = getRepository(Anulacion);
        const sedes = await sedeRepo.find();
        function getMonthlyRanges(start: string, end: string) {
            const ranges: { inicial: string; final: string }[] = [];
            const startDate = new Date(start);
            const endDate = new Date(end);
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate < startDate) return ranges;
            let current = new Date(startDate);
            while (current <= endDate) {
                const year = current.getFullYear();
                const month = current.getMonth();
                const firstDay = new Date(year, month, 1);
                const lastDay = new Date(year, month + 1, 0);
                // Asegurar que el rango generado no sea invertido
                const rangeStart = firstDay < startDate ? startDate : firstDay;
                const rangeEnd = lastDay > endDate ? endDate : lastDay;
                if (rangeStart > rangeEnd) {
                    current = new Date(year, month + 1, 1);
                    continue;
                }
                ranges.push({
                    inicial: rangeStart.toISOString().slice(0, 10),
                    final: rangeEnd.toISOString().slice(0, 10)
                });
                current = new Date(year, month + 1, 1);
            }
            return ranges;
        }
        const monthlyRanges = getMonthlyRanges(fechaInicial, fechaFinal);
    let insertados = 0, yaExistentes = 0, ignoradosSede = 0;
    let detallesCruce: any[] = [];
    let detallesNotasCredito: any[] = [];
    let detallesIgnorados: any[] = [];
        for (const rango of monthlyRanges) {
            let intento = 0;
            let pergamoData = null;
            let exito = false;
            const TIMEOUT_MS = 60000;
            while (intento < 3 && !exito) {
                intento++;
                const inicioIntento = Date.now();
                try {
                    const url = `https://backpergamo.hlips.com.co/api/report_billingGeneral?billing_type=evento&initial_report=${rango.inicial}&final_report=${rango.final}`;
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
                    const pergamoRes = await fetch(url, {
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        signal: controller.signal
                    });
                    clearTimeout(timeout);
                    pergamoData = await pergamoRes.json();
                    const duracion = ((Date.now() - inicioIntento) / 1000).toFixed(1);
                    // Considerar éxito si viene h2
                    if (Array.isArray(pergamoData?.data?.h2)) {
                        exito = true;
                        console.log(`🟢 [Anulaciones] ${rango.inicial} a ${rango.final}: Pergamo OK en ${duracion}s. Intento ${intento}`);
                    } else {
                        console.log(`🟡 [Anulaciones] ${rango.inicial} a ${rango.final}: Datos inválidos de Pergamo. Intento ${intento} (${duracion}s)`);
                    }
                } catch (err) {
                    const duracion = ((Date.now() - inicioIntento) / 1000).toFixed(1);
                    console.log(`🔴 [Anulaciones] ${rango.inicial} a ${rango.final}: Error o timeout en Pergamo. Intento ${intento} (${duracion}s)`);
                }
            }
            if (!exito) {
                console.log(`❌ [Anulaciones] ${rango.inicial} a ${rango.final}: Falló tras 3 intentos. Se omite este mes.`);
                continue;
            }
            // Procesar solo h2 según nueva regla: Observacion null -> Anulación, distinto -> Nota Crédito
            const h2 = Array.isArray(pergamoData.data?.h2) ? pergamoData.data.h2 : [];
            const existentes = await anulacionRepo.find({ select: ['numeroAnulacion'] });
            const existentesSet = new Set(existentes.map((a: { numeroAnulacion: string }) => a.numeroAnulacion));
            const nuevasAnulaciones: any[] = [];
            let insertadosMes = 0, yaExistentesMes = 0, ignoradosSedeMes = 0;
            for (const a of h2) {
                const numeroAnulacion = (a.Factura || '').replace(/-/g, '').trim();
                const notaCredito = a.Nota_Credito ? String(a.Nota_Credito).replace(/-/g, '').trim() : undefined;
                const fecha = a.Fecha_Factura ? a.Fecha_Factura.split(' ')[0] : undefined;
                const fechaNotaCredito = a.Fecha_Nota_Credito ? a.Fecha_Nota_Credito.split(' ')[0] : undefined;
                const sedeNombre = (a.Sede || '').trim().toUpperCase();
                const sede = sedes.find((s: { nombre: string }) => s.nombre.trim().toUpperCase() === sedeNombre);
                if (!sede) { ignoradosSede++; ignoradosSedeMes++; continue; }
                if (existentesSet.has(numeroAnulacion)) { yaExistentes++; yaExistentesMes++; continue; }
                if (a.Observacion === null) {
                    nuevasAnulaciones.push({
                        numeroAnulacion,
                        fecha,
                        notaCredito,
                        fechaNotaCredito,
                        tipoDocumento: a.Tipo_Documento,
                        documento: a.Documento,
                        paciente: a.Paciente,
                        aseguradora: a.Aseguradora,
                        sede,
                        facturador: a.Facturador,
                        totalAnulado: a.Total_Nota_Credito || a.Total_Anulado,
                        motivo: 'ANULACION',
                        estado: 'NO FACTURADO',
                        tipoRegistro: 'Anulación',
                        facturaRemplazo: undefined,
                        fechaRemplazo: undefined,
                        valorRemplazo: undefined,
                        sedeRemplazo: undefined
                    });
                    detallesCruce.push({ registro: a });
                } else {
                    nuevasAnulaciones.push({
                        numeroAnulacion,
                        fecha,
                        notaCredito,
                        fechaNotaCredito,
                        tipoDocumento: a.Tipo_Documento,
                        documento: a.Documento,
                        paciente: a.Paciente,
                        aseguradora: a.Aseguradora,
                        sede,
                        facturador: a.Facturador,
                        totalAnulado: a.Total_Nota_Credito || a.Total_Anulado,
                        motivo: 'ACEPTACIÓN DE GLOSA',
                        estado: 'NO FACTURADO',
                        tipoRegistro: 'Nota Crédito',
                        facturaRemplazo: '-',
                        fechaRemplazo: '-',
                        valorRemplazo: 0,
                        sedeRemplazo: '-'
                    });
                    detallesNotasCredito.push({ registro: a });
                }
                insertados++; insertadosMes++;
            }
            if (nuevasAnulaciones.length > 0) {
                await anulacionRepo.save(nuevasAnulaciones);
            }
            console.log(`✅ [Anulaciones] ${rango.inicial} a ${rango.final}: Insertados: ${insertadosMes}, Existentes: ${yaExistentesMes}, Ignorados por sede: ${ignoradosSedeMes}`);
        }
        console.log(`🏁 [Anulaciones] Resumen total: Insertados: ${insertados}, Existentes: ${yaExistentes}, Ignorados por sede: ${ignoradosSede}`);
        res.json({
            ok: true,
            insertados,
            yaExistentes,
            ignoradosSede,
            detallesCruce, // Anulaciones cruzadas
            detallesNotasCredito, // Notas crédito
            detallesIgnorados // Registros ignorados/fallidos
        });
    } catch (err) {
        console.error('[ANULACIONES] Error al cargar anulaciones:', err);
        res.status(500).json({ error: 'Error al cargar anulaciones', details: err });
    }
});

// Endpoint para cargar plano de anulaciones con autocompletado
router.post('/cargar-plano', async (req: Request, res: Response) => {
    try {
        const { datos } = req.body;
        
        if (!Array.isArray(datos) || datos.length === 0) {
            return res.status(400).json({ error: 'Datos del plano requeridos' });
        }

        const anulacionRepo = getRepository(Anulacion);
        const sedeRepo = getRepository(Sede);

        // Obtener todas las sedes para mapear por nombre
        const sedes = await sedeRepo.find();
    const sedesMap = new Map(sedes.map((sede: { nombre: string }) => [sede.nombre.trim().toUpperCase(), sede]));

        const anulacionesActualizadas = [];
        const errores = [];
        let rechazados = 0;
        
        for (let i = 0; i < datos.length; i++) {
            const registro = datos[i];
            
            // Validar campos requeridos
            if (!registro.numeroAnulacion || !registro.numeroAnulacion.trim()) {
                errores.push(`Línea ${i + 1}: Número de anulación requerido`);
                rechazados++;
                continue;
            }

            const numeroAnulacion = registro.numeroAnulacion.trim();
            
            // Buscar la anulación existente por número de factura
            const anulacionExistente = await anulacionRepo.findOne({ 
                where: { numeroAnulacion },
                relations: ['sede']
            });

            if (!anulacionExistente) {
                // RECHAZAR si la factura no existe en la base de datos
                errores.push(`Línea ${i + 1}: La factura anulada '${numeroAnulacion}' no existe en la base de datos`);
                rechazados++;
                continue;
            }

            // ACTUALIZAR anulación existente con los nuevos datos del plano
            anulacionExistente.facturaRemplazo = registro.facturaRemplazo || anulacionExistente.facturaRemplazo;
            anulacionExistente.fechaRemplazo = registro.fechaRemplazo || anulacionExistente.fechaRemplazo;
            anulacionExistente.valorRemplazo = registro.valorRemplazo || anulacionExistente.valorRemplazo;
            anulacionExistente.motivo = registro.motivo || anulacionExistente.motivo;
            anulacionExistente.estado = registro.estado || anulacionExistente.estado;
            
            // Marcar que fue actualizada desde plano
            const fechaActualizacion = new Date().toISOString().split('T')[0];
            if (!anulacionExistente.observaciones) {
                anulacionExistente.observaciones = `Actualizada desde plano manual (${fechaActualizacion})`;
            } else if (!anulacionExistente.observaciones.includes('plano manual')) {
                anulacionExistente.observaciones += ` - Actualizada desde plano manual (${fechaActualizacion})`;
            }

            anulacionesActualizadas.push(anulacionExistente);
        }

        // Guardar SOLO las anulaciones actualizadas
        if (anulacionesActualizadas.length > 0) {
            await anulacionRepo.save(anulacionesActualizadas);
        }

        res.json({
            ok: true,
            insertados: anulacionesActualizadas.length,
            actualizadas: anulacionesActualizadas.length,
            rechazados,
            errores,
            mensaje: `Procesadas ${anulacionesActualizadas.length} anulaciones actualizadas${rechazados > 0 ? `, ${rechazados} rechazadas (facturas no encontradas)` : ''}${errores.length > 0 ? ` con ${errores.length} errores` : ''}`
        });

    } catch (err) {
        console.error('[ANULACIONES] Error al cargar plano:', err);
        res.status(500).json({ error: 'Error al cargar plano de anulaciones', details: err });
    }
});

export default router;