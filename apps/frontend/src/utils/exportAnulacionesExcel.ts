import * as XLSX from 'xlsx';

// Funciones utilitarias para procesar fechas y valores de reemplazo
// Helper para formatear ISO datetime a YYYY-MM-DD
const formatDateShort = (isoOrPlain?: string): string => {
	if (!isoOrPlain) return '';
	const plain = isoOrPlain.trim();
	const simpleDateMatch = /^\d{4}-\d{2}-\d{2}$/;
	if (simpleDateMatch.test(plain)) return plain;

	const isoWithZone = /T.*(Z|[+-]\d{2}:?\d{2})$/i;
	try {
		const d = new Date(plain);
		if (isNaN(d.getTime())) return plain;
		let y: number, m: string, day: string;
		if (isoWithZone.test(plain)) {
			y = d.getUTCFullYear();
			m = String(d.getUTCMonth() + 1).padStart(2, '0');
			day = String(d.getUTCDate()).padStart(2, '0');
		} else {
			y = d.getFullYear();
			m = String(d.getMonth() + 1).padStart(2, '0');
			day = String(d.getDate()).padStart(2, '0');
		}
		return `${y}-${m}-${day}`;
	} catch (e) {
		return plain;
	}
};

const procesarFechaRemplazo = (fechaRemplazo?: string): string => {
	if (!fechaRemplazo) return '';
	const fechas = fechaRemplazo.split(',').map(f => f.trim()).filter(f => f);
	if (fechas.length === 0) return '';
	const formateadas = fechas.map(f => formatDateShort(f));
	const fechasUnicas = [...new Set(formateadas)];
	return fechasUnicas.length === 1 ? fechasUnicas[0] : formateadas[0];
};

const procesarValorRemplazo = (valorRemplazo?: string): number => {
	if (!valorRemplazo) return 0;
	
	const valores = valorRemplazo.split(',')
		.map(v => v.trim())
		.filter(v => v && !isNaN(Number(v)))
		.map(v => Number(v));
	
	return valores.reduce((suma, valor) => suma + valor, 0);
};

const formatearValorContabilidad = (valor: number): string => {
	if (valor === 0) return '';
	return new Intl.NumberFormat('es-CO', {
		style: 'currency',
		currency: 'COP',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(valor);
};

export interface AnulacionExport {
	id?: number;
	numeroAnulacion?: string;
	fechaNotaCredito?: string;
	tipoDocumento?: string;
	tipoRegistro?: string;
	documento?: string;
	sede?: { nombre?: string };
	aseguradora?: string;
	totalAnulado?: number;
	facturaRemplazo?: string;
	fechaRemplazo?: string;
	valorRemplazo?: string;
	motivo?: string;
	estado?: string;
	sedeRemplazo?: string;
}

export async function exportAnulacionesExcel(anulaciones: AnulacionExport[], filtros?: {
	incluirSinEstado?: boolean;
	soloSinEstado?: boolean;
	tipoRegistro?: string;
}) {
	try {
		// Aplicar filtros específicos si se proporcionan
		let datosParaExportar = [...anulaciones];

		if (filtros?.soloSinEstado) {
			// Solo exportar registros sin estado o con estado vacío
			datosParaExportar = datosParaExportar.filter(a => 
				!a.estado || a.estado.trim() === ''
			);
		}

		if (filtros?.tipoRegistro && filtros.tipoRegistro !== 'Todos') {
			datosParaExportar = datosParaExportar.filter(a => {
				if (filtros.tipoRegistro === 'Anulación') {
					return a.tipoRegistro === 'Anulación' || !a.tipoRegistro;
				}
				return a.tipoRegistro === filtros.tipoRegistro;
			});
		}

		// Preparar datos para Excel
		const datosExcel = datosParaExportar.map(anulacion => ({
			'Registro': (anulacion.tipoRegistro || '').toUpperCase(),
			'Factura': anulacion.numeroAnulacion || '',
			'Fecha Anulación': anulacion.fechaNotaCredito || '',
			'Tipo Documento': anulacion.tipoDocumento || '',
			'Documento': anulacion.documento || '',
			'Sede': anulacion.sede?.nombre || '',
			'Aseguradora': anulacion.aseguradora || '',
			'Valor': anulacion.totalAnulado || 0,
			'Factura (R)': anulacion.facturaRemplazo || '',
			'Fecha (R)': procesarFechaRemplazo(anulacion.fechaRemplazo),
			'Valor (R)': formatearValorContabilidad(procesarValorRemplazo(anulacion.valorRemplazo)),
			'Motivo Anulación': anulacion.motivo || '',
			'Estado': anulacion.estado || '',
			'S': anulacion.sedeRemplazo || ''
		}));

		// Crear el libro de trabajo
		const workbook = XLSX.utils.book_new();
		const worksheet = XLSX.utils.json_to_sheet(datosExcel);

		// Configurar anchos de columnas
		const columnWidths = [
			{ wch: 15 }, // Registro
			{ wch: 15 }, // Factura
			{ wch: 15 }, // Fecha Anulación
			{ wch: 12 }, // Tipo Documento
			{ wch: 15 }, // Documento
			{ wch: 20 }, // Sede
			{ wch: 25 }, // Aseguradora
			{ wch: 12 }, // Valor
			{ wch: 15 }, // Factura (R)
			{ wch: 15 }, // Fecha (R)
			{ wch: 12 }, // Valor (R)
			{ wch: 30 }, // Motivo Anulación
			{ wch: 15 }, // Estado
			{ wch: 5 }   // S
		];
		worksheet['!cols'] = columnWidths;

		// Agregar la hoja al libro
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Anulaciones');

		// Generar nombre del archivo con timestamp
		const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
		let nombreArchivo = `anulaciones_${timestamp}.xlsx`;
		
		if (filtros?.soloSinEstado) {
			nombreArchivo = `anulaciones_sin_estado_${timestamp}.xlsx`;
		}

		// Descargar el archivo
		XLSX.writeFile(workbook, nombreArchivo);

		return {
			success: true,
			message: `Archivo ${nombreArchivo} descargado exitosamente`,
			recordsExported: datosExcel.length
		};

	} catch (error) {
		console.error('Error al exportar anulaciones:', error);
		return {
			success: false,
			message: 'Error al generar el archivo Excel',
			error: error
		};
	}
}

// Función específica para exportar solo anulaciones sin estado
export async function exportAnulacionesSinEstado(anulaciones: AnulacionExport[], tipoRegistro?: string) {
	return await exportAnulacionesExcel(anulaciones, {
		soloSinEstado: true,
		tipoRegistro: tipoRegistro
	});
}
