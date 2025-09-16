import * as XLSX from 'xlsx';
import { exportAnulacionesExcel, exportAnulacionesSinEstado } from '../utils/exportAnulacionesExcel';
import API_CONFIG from '../config/api';

// Función para descargar archivo estático
const descargarArchivoEstatico = (filename: string, displayName: string) => {
	// Construir la URL directa al archivo estático
	const isGitHubPages = window.location.hostname.includes('github.io');
	const url = isGitHubPages 
		? `${window.location.origin}/control-facturacion-hlips/${filename}`
		: `${window.location.origin}/${filename}`;
	
	// Crear enlace de descarga directo
	const link = document.createElement('a');
	link.href = url;
	link.download = displayName;
	link.target = '_blank';
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
};

// Formateador contable para valores
const formatearValor = (valor?: number) => {
	if (valor === undefined || valor === null) return '';
	// Formato contable colombiano: $ 1.234.567
	return `$ ${Math.round(valor).toLocaleString('es-CO')}`;
};
import React, { useState, useEffect, useMemo } from 'react';
import OpuMessage from '../ui/OpuMessage';

type Anulacion = {
	id: number;
	numeroAnulacion: string;
	fecha: string;
	sede?: { nombre: string };
	usuario?: string;
	motivo?: string;
	estado?: string;
	factura?: string;
	aseguradora?: string;
	paciente?: string;
	fechaNotaCredito?: string;
	tipoDocumento?: string;
	documento?: string;
 totalAnulado?: number;
 tipoRegistro?: string; // 'Anulación' o 'Nota Crédito'
 // Campos de reemplazo
 facturaRemplazo?: string;
 fechaRemplazo?: string;
 valorRemplazo?: string;
 sedeRemplazo?: string;
};

// Funciones utilitarias para procesar fechas y valores de reemplazo
// Formatea una fecha ISO (ej. 2025-09-03T00:00:00.000Z) a YYYY-MM-DD
const formatDateShort = (isoOrPlain?: string): string => {
	if (!isoOrPlain) return '';
	const plain = isoOrPlain.trim();
	const simpleDateMatch = /^\d{4}-\d{2}-\d{2}$/;
	if (simpleDateMatch.test(plain)) return plain;

	// Detectar ISO completo con zona (ej. 2025-09-03T00:00:00.000Z o con offset +01:00)
	const isoWithZone = /T.*(Z|[+-]\d{2}:?\d{2})$/i;
	try {
		const d = new Date(plain);
		if (isNaN(d.getTime())) return plain;
		let y: number, m: string, day: string;
		if (isoWithZone.test(plain)) {
			// Usar componentes UTC para evitar desfase por zona local
			y = d.getUTCFullYear();
			m = String(d.getUTCMonth() + 1).padStart(2, '0');
			day = String(d.getUTCDate()).padStart(2, '0');
		} else {
			// Fecha sin información de zona: usar componentes locales
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

	// Normalizar y formatear cada fecha
	const formateadas = fechas.map(f => formatDateShort(f));
	// Si todas las fechas son iguales, devolver solo una
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
	// Mostrar explícitamente $ 0 cuando el valor es cero (antes devolvía cadena vacía)
	if (valor === 0) return `$ ${Math.round(valor).toLocaleString('es-CO')}`;
	return new Intl.NumberFormat('es-CO', {
		style: 'currency',
		currency: 'COP',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(valor);
};

export default function Anulaciones() {
// Controlador para abortar peticiones en curso
let abortController: AbortController | null = null;
const [validarPlano, setValidarPlano] = useState(false);
// Estado para resultados de validación
const [resultadosValidacionPlano, setResultadosValidacionPlano] = useState<any[]>([]);

// Función para reiniciar el estado del archivo plano
const handleCancelarArchivoPlano = () => {
	setArchivoPlano(null);
	setDatosPlano([]);
	setResultadosValidacionPlano([]);
	setMensajePlano('');
	setLoadingPlano(false);
	// Reset del input file
	const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
	if (fileInput) {
		fileInput.value = '';
	}
};

// Estado para facturas de eventos (para validar segunda columna)
const [facturasEvento, setFacturasEvento] = useState<string[]>([]);
// Estado para guardar el array completo de eventos
const [eventosFull, setEventosFull] = useState<any[]>([]);
	const [anulaciones, setAnulaciones] = useState<Anulacion[]>([]);
	const [ultimaActualizacionFull, setUltimaActualizacionFull] = useState<string>(() => {
		return localStorage.getItem('ultimaActualizacionAnulaciones') || '';
	});
	const [filtroBusqueda, setFiltroBusqueda] = useState('');
	// Inicializar fechas: inicio = primer día del mes actual, final = día actual
	const hoy = new Date();
	const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
	const formatoFecha = (d: Date) => d.toISOString().slice(0, 10);
	// Fechas para filtros de la tabla
	const [fechaFiltroInicial, setFechaFiltroInicial] = useState<string>(formatoFecha(primerDiaMes));
	const [fechaFiltroFinal, setFechaFiltroFinal] = useState<string>(formatoFecha(hoy));
	// Fechas para carga de base de datos
	const [fechaCargaInicial, setFechaCargaInicial] = useState<string>(formatoFecha(primerDiaMes));
	const [fechaCargaFinal, setFechaCargaFinal] = useState<string>(formatoFecha(hoy));
	const [sedeFiltro, setSedeFiltro] = useState('');
	const [aseguradoraFiltro, setAseguradoraFiltro] = useState('');
	const [usuarioFiltro, setUsuarioFiltro] = useState('');
	const [tipoRegistroFiltro, setTipoRegistroFiltro] = useState('Anulación'); // Por defecto mostrar solo anulaciones
	const [paginaActual, setPaginaActual] = useState(1);
	const registrosPorPagina = 100;
	const [mensaje, setMensaje] = useState<string|null>(null);
	const [showOpu, setShowOpu] = useState(false);
	const [showOpuSuccess, setShowOpuSuccess] = useState(false);
	const [loadingCargar, setLoadingCargar] = useState(false);
	const [loadingUltimosDias, setLoadingUltimosDias] = useState(false);
	// Estado para controlar filas bloqueadas
	const [filasBloquedas, setFilasBloqueadas] = useState<Set<number>>(() => {
		const saved = localStorage.getItem('anulaciones_filas_bloqueadas');
		return saved ? new Set(JSON.parse(saved)) : new Set();
	});
	// Simulación de sedes, motivos y usuarios
	const [sedes, setSedes] = useState<{id:number, nombre:string}[]>([]);
	const [motivos, setMotivos] = useState<string[]>([]);
	const [usuarios, setUsuarios] = useState<string[]>([]);
	// Aseguradoras
	const [aseguradoras, setAseguradoras] = useState<{nombrePergamo:string, nombre:string}[]>([]);

	// Funciones para manejar bloqueo/desbloqueo de filas
	const toggleBloqueoFila = (anulacionId: number) => {
		setFilasBloqueadas(prev => {
			const nuevasFilas = new Set(prev);
			if (nuevasFilas.has(anulacionId)) {
				nuevasFilas.delete(anulacionId);
			} else {
				nuevasFilas.add(anulacionId);
			}
			// Guardar en localStorage
			localStorage.setItem('anulaciones_filas_bloqueadas', JSON.stringify([...nuevasFilas]));
			return nuevasFilas;
		});
	};

	const tieneInformacionPlano = (anulacion: Anulacion): boolean => {
		return !!(anulacion.facturaRemplazo || anulacion.fechaRemplazo || anulacion.valorRemplazo);
	};

	const estaFilaBloqueada = (anulacionId: number): boolean => {
		return filasBloquedas.has(anulacionId);
	};

	// Efecto para resetear paginación cuando cambien los filtros o el estado de candados
	useEffect(() => {
		setPaginaActual(1);
	}, [filtroBusqueda, fechaFiltroInicial, fechaFiltroFinal, sedeFiltro, aseguradoraFiltro, usuarioFiltro, tipoRegistroFiltro, filasBloquedas]);


	 // Cargar aseguradoras y facturas de eventos al montar
	 useEffect(() => {
		 fetch(`${API_CONFIG.BASE_URL}/aseguradoras`)
			 .then(res => res.json())
			 .then(data => {
				 setAseguradoras(Array.isArray(data) ? data : []);
			 });
		 // Obtener facturas de eventos para validación segunda columna
			 // Usar endpoint resumen y pasar rango de fechas (obligatorio en backend)
			 const params = new URLSearchParams({ fechaInicial: fechaFiltroInicial, fechaFinal: fechaFiltroFinal });
			 fetch(`${API_CONFIG.BASE_URL}/facturacion/eventos/resumen?${params.toString()}`)
				 .then(res => res.json())
				 .then(data => {
					 console.log('[DEBUG][FacturasEvento] Respuesta del backend:', data);
					 if (data && Array.isArray(data.eventos)) {
						 const facturas = data.eventos.map((ev: any) => String(ev.numeroFactura).trim());
						 console.log('[DEBUG][FacturasEvento] Array de facturas extraído:', facturas);
						 setFacturasEvento(facturas);
						 setEventosFull(data.eventos);
					 } else if (data && Array.isArray(data)) {
						 // Compatibilidad por si el backend devolviera el arreglo directamente
						 const facturas = data.map((ev: any) => String(ev.numeroFactura).trim());
						 setFacturasEvento(facturas);
						 setEventosFull(data);
					 } else {
						 setFacturasEvento([]);
						 setEventosFull([]);
					 }
				 })
				 .catch((err) => { console.error('[DEBUG][FacturasEvento] fetch error:', err); setFacturasEvento([]); setEventosFull([]); });
	 }, []);

	useEffect(() => {
		// Simulación de carga de datos
		setSedes([{id:1,nombre:'Sede Norte'},{id:2,nombre:'Sede Sur'}]);
		setMotivos(['Error administrativo','Duplicado','Solicitud paciente']);
		setUsuarios(['admin','usuario1','usuario2']);
		// Cargar anulaciones desde API
		fetch(`${API_CONFIG.BASE_URL}/anulaciones`)
			.then(res => res.json())
			.then(data => {
				const anulacionesCargadas = Array.isArray(data.anulaciones) ? data.anulaciones : [];
				setAnulaciones(anulacionesCargadas);
				
				// Bloquear automáticamente filas que tienen información de archivo plano
				const filasConPlano = new Set<number>();
				anulacionesCargadas.forEach((anulacion: Anulacion) => {
					if (tieneInformacionPlano(anulacion) && anulacion.id) {
						filasConPlano.add(anulacion.id);
					}
				});
				
				// Combinar con las filas ya bloqueadas manualmente
				setFilasBloqueadas(prev => {
					const nuevasFilas = new Set([...prev, ...filasConPlano]);
					localStorage.setItem('anulaciones_filas_bloqueadas', JSON.stringify([...nuevasFilas]));
					return nuevasFilas;
				});
			})
			.catch(() => {
				setAnulaciones([]);
			});
	}, []);

	// Filtros con ordenamiento reactivo por estado de candado
	const anulacionesFiltradas = useMemo(() => {
		return anulaciones
			.filter(a => {
				const filtro = filtroBusqueda.trim().toLowerCase();
				const normalize = (s?: any) => (s === null || s === undefined) ? '' : String(s).replace(/\s+/g, ' ').trim().toLowerCase();
				// Buscar por Factura, Documento o Paciente
				const coincideTexto = !filtro
					|| (a.factura && a.factura.toLowerCase().includes(filtro))
					|| (a.numeroAnulacion && a.numeroAnulacion.toLowerCase().includes(filtro))
					|| (a.documento && a.documento.toLowerCase().includes(filtro))
					|| (a.paciente && a.paciente.toLowerCase().includes(filtro));
				// Filtrar por fechaNotaCredito en vez de fecha
				const fechaFiltro = a.fechaNotaCredito || '';
				const enRango = (!fechaFiltroInicial || fechaFiltro >= fechaFiltroInicial) && (!fechaFiltroFinal || fechaFiltro <= fechaFiltroFinal);
				const coincideSede = !sedeFiltro || normalize(a.sede?.nombre || a.sede) === normalize(sedeFiltro);
				const aseguradoraDisplay = getAseguradoraDisplay(a);
				const coincideAseg = !aseguradoraFiltro || (!!aseguradoraDisplay && (
					normalize(aseguradoraDisplay) === normalize(aseguradoraFiltro) ||
					normalize(aseguradoraDisplay).includes(normalize(aseguradoraFiltro)) ||
					normalize(aseguradoraFiltro).includes(normalize(aseguradoraDisplay))
				));
				const coincideUsuario = !usuarioFiltro || (a.usuario === usuarioFiltro);
				
				// Filtro de tipo de registro
				const coincideTipoRegistro = tipoRegistroFiltro === 'Todos' || 
					(tipoRegistroFiltro === 'Anulación' && (a.tipoRegistro === 'Anulación' || !a.tipoRegistro)) ||
					(tipoRegistroFiltro === 'Nota Crédito' && a.tipoRegistro === 'Nota Crédito');
				
				return coincideTexto && enRango && coincideSede && coincideAseg && coincideUsuario && coincideTipoRegistro;
			})
			.sort((a, b) => {
				// Función para obtener la prioridad del candado
				const getPrioridadCandado = (anulacion: Anulacion) => {
					if (!tieneInformacionPlano(anulacion)) return 0; // Sin candado - primera prioridad
					if (estaFilaBloqueada(anulacion.id || 0)) return 2; // Candado cerrado - última prioridad
					return 1; // Candado abierto - segunda prioridad
				};

				// Ordenar primero por prioridad del candado
				const prioridadA = getPrioridadCandado(a);
				const prioridadB = getPrioridadCandado(b);
				
				if (prioridadA !== prioridadB) {
					return prioridadA - prioridadB;
				}
				
				// Si tienen la misma prioridad, ordenar por fechaNotaCredito (más nueva primero)
				const fechaA = a.fechaNotaCredito || '';
				const fechaB = b.fechaNotaCredito || '';
				return fechaB.localeCompare(fechaA);
			});
	}, [anulaciones, filtroBusqueda, fechaFiltroInicial, fechaFiltroFinal, sedeFiltro, aseguradoraFiltro, usuarioFiltro, tipoRegistroFiltro, filasBloquedas]);
	// Calcular totales para tarjetas (solo afectadas por filtros de fechas, sede y aseguradora)
	const anulacionesParaTarjetas = anulaciones.filter(a => {
		const fechaFiltro = a.fechaNotaCredito || '';
		const enRango = (!fechaFiltroInicial || fechaFiltro >= fechaFiltroInicial) && (!fechaFiltroFinal || fechaFiltro <= fechaFiltroFinal);
		const normalize = (s?: any) => (s === null || s === undefined) ? '' : String(s).replace(/\s+/g, ' ').trim().toLowerCase();
		const coincideSede = !sedeFiltro || normalize(a.sede?.nombre || a.sede) === normalize(sedeFiltro);
		const aseguradoraDisplay = getAseguradoraDisplay(a);
		const coincideAseg = !aseguradoraFiltro || (!!aseguradoraDisplay && (
			normalize(aseguradoraDisplay) === normalize(aseguradoraFiltro) ||
			normalize(aseguradoraDisplay).includes(normalize(aseguradoraFiltro)) ||
			normalize(aseguradoraFiltro).includes(normalize(aseguradoraDisplay))
		));
		return enRango && coincideSede && coincideAseg;
	});
	
	const cantidadAnulaciones = anulacionesParaTarjetas.filter(a => a.tipoRegistro === 'Anulación' || !a.tipoRegistro).length;
	const cantidadNotasCredito = anulacionesParaTarjetas.filter(a => a.tipoRegistro === 'Nota Crédito').length;
	const totalAnuladoFiltrado = anulacionesParaTarjetas.filter(a => a.tipoRegistro === 'Anulación' || !a.tipoRegistro).reduce((acc: number, a: Anulacion) => acc + (Number(a.totalAnulado) || 0), 0);
	const totalNotaCreditoFiltrado = anulacionesParaTarjetas.filter(a => a.tipoRegistro === 'Nota Crédito').reduce((acc: number, a: Anulacion) => acc + (Number(a.totalAnulado) || 0), 0);
	
	// Tarjetas informativas (según filtros activos EN LA TABLA - solo para mostrar info de tabla filtrada)
	const totalAnulaciones = anulacionesFiltradas.length;

	const availableSedes = useMemo(() => {
		const s = new Set<string>();
		const normalizeName = (n?: any) => (n === null || n === undefined) ? '' : String(n).replace(/\s+/g, ' ').trim();
		anulaciones.forEach(a => {
			const fechaFiltroVal = a.fechaNotaCredito || '';
			const enRango = (!fechaFiltroInicial || fechaFiltroVal >= fechaFiltroInicial) && (!fechaFiltroFinal || fechaFiltroVal <= fechaFiltroFinal);
			if (!enRango) return;
			const nombre = normalizeName(a.sede?.nombre || a.sede);
			if (nombre) s.add(nombre);
		});
		return Array.from(s).sort((x, y) => x.localeCompare(y));
	}, [anulaciones, fechaFiltroInicial, fechaFiltroFinal]);

	// Función utilitaria para obtener el nombre 'mostrado' de la aseguradora de un registro
	function getAseguradoraDisplay(a: Anulacion) {
		const normalizeName = (n?: any) => (n === null || n === undefined) ? '' : String(n).replace(/\s+/g, ' ').trim();
		const raw = a.aseguradora || '';
		const r = normalizeName(raw).toLowerCase();
		const found = aseguradoras.find(x => (String(x.nombrePergamo || '').replace(/\s+/g, ' ').trim().toLowerCase() === r) || (String(x.nombre || '').replace(/\s+/g, ' ').trim().toLowerCase() === r));
		return found ? (String(found.nombre).replace(/\s+/g, ' ').trim()) : normalizeName(raw);
	}

	const availableAseguradoras = useMemo(() => {
		const s = new Set<string>();
		const normalizeName = (n?: any) => (n === null || n === undefined) ? '' : String(n).replace(/\s+/g, ' ').trim();
		// Helper: si tenemos coincidencia con `aseguradoras` (API), preferimos mostrar su `nombre` (DB)
		const mapAseguradoraDisplay = (raw?: string) => {
			if (!raw) return '';
			const r = normalizeName(raw).toLowerCase();
			const found = aseguradoras.find(x => (String(x.nombrePergamo || '').replace(/\s+/g, ' ').trim().toLowerCase() === r) || (String(x.nombre || '').replace(/\s+/g, ' ').trim().toLowerCase() === r));
			return found ? (String(found.nombre).replace(/\s+/g, ' ').trim()) : normalizeName(raw);
		};
		anulaciones.forEach(a => {
			const fechaFiltroVal = a.fechaNotaCredito || '';
			const enRango = (!fechaFiltroInicial || fechaFiltroVal >= fechaFiltroInicial) && (!fechaFiltroFinal || fechaFiltroVal <= fechaFiltroFinal);
			if (!enRango) return;
			const display = mapAseguradoraDisplay(a.aseguradora);
			if (display) s.add(display);
		});
		return Array.from(s).sort((x, y) => x.localeCompare(y));
	}, [anulaciones, fechaFiltroInicial, fechaFiltroFinal]);

	// Nota: getAseguradoraDisplay está definida más arriba como función hoisted para evitar TDZ en el bundle.

	// Estado y lógica para modal de carga/validación de archivo plano
	const [showCargaPlano, setShowCargaPlano] = useState(false);
	const [archivoPlano, setArchivoPlano] = useState<File|null>(null);
	const [datosPlano, setDatosPlano] = useState<any[]>([]);
	const [loadingPlano, setLoadingPlano] = useState(false);
	const [mensajePlano, setMensajePlano] = useState<string|null>(null);
	// Estado para mostrar detalle de validación por fila
	const [detalleVisible, setDetalleVisible] = useState(false);
	const [detalleContenido, setDetalleContenido] = useState<any|null>(null);
	// Formatear fecha y hora para la tarjeta en formato D/M/YYYY, HH:mm:ss
	const ultimaActualizacion = ultimaActualizacionFull
			? (() => {
					const d = new Date(ultimaActualizacionFull);
					const dia = d.getDate();
					const mes = d.getMonth() + 1;
					const anio = d.getFullYear();
					const hora = d.getHours().toString().padStart(2, '0');
					const min = d.getMinutes().toString().padStart(2, '0');
					const seg = d.getSeconds().toString().padStart(2, '0');
					return `${dia}/${mes}/${anio}, ${hora}:${min}:${seg}`;
				})()
			: '';

       // Estado para mostrar/ocultar filtros avanzados
       const [mostrarFiltros, setMostrarFiltros] = useState(false);
			// Estado para progreso de validación (batch + filas)
			const [validacionProgress, setValidacionProgress] = useState<{ inProgress: boolean; stage: string; completed: number; total: number }>({ inProgress: false, stage: '', completed: 0, total: 0 });
       // Estado para menú de reportes y análisis
       const [menuReportesOpen, setMenuReportesOpen] = useState(false);
       const [showAnalisis, setShowAnalisis] = useState(false);
	   const [analisisTipo, setAnalisisTipo] = useState<'grafico'|'sede'|'aseguradora'|'comparativa'|'general'>('grafico');

	   // Debug: mostrar en consola cuando se abre/cierra el modal de análisis
	   useEffect(() => {
		   try { console.log('[ANULACIONES] showAnalisis changed:', showAnalisis); } catch (e) {}
	   }, [showAnalisis]);

       // Obtener credenciales del usuario (simil factura)
       // Si tienes un hook de autenticación, úsalo aquí
       // Ejemplo: import { useAuth } from '../auth';
       let pergamoToken = '';
       let userId = '';
       try {
	       if (window.localStorage) {
		       pergamoToken = window.localStorage.getItem('pergamoToken') || '';
		       const authToken = window.localStorage.getItem('authToken');
		       if (authToken) {
			       const payload = JSON.parse(atob(authToken.split('.')[1]));
			       userId = payload.username || payload.userId || '';
		       }
		       // Respaldo: obtener username del objeto 'user' en localStorage si existe
		       if (!userId) {
			       const userObj = window.localStorage.getItem('user');
			       if (userObj) {
				       const userParsed = JSON.parse(userObj);
				       userId = userParsed.username || '';
			       }
		       }
	       }
       } catch {}

       // Función para cargar anulaciones desde backend
       const handleCargar = async () => {
	// Cancelar cualquier petición anterior
	if (abortController) abortController.abort();
	abortController = new AbortController();
			   setLoadingCargar(true);
			   setMensaje(null);
			console.log('[ANULACIONES] handleCargar llamado', { fechaCargaInicial, fechaCargaFinal, pergamoToken, userId });
			if (!fechaCargaInicial || !fechaCargaFinal) {
				setMensaje('Selecciona ambas fechas.');
				setLoadingCargar(false);
				return;
			}
			if (!pergamoToken || !userId) {
				setMensaje('No hay credenciales de sesión. Inicia sesión nuevamente.');
				setLoadingCargar(false);
				return;
			}
			try {
				const payload = { fechaInicial: fechaCargaInicial, fechaFinal: fechaCargaFinal, token: pergamoToken, userId };
		       console.log('[ANULACIONES] Enviando payload:', payload);
		       const res = await fetch(`${API_CONFIG.BASE_URL}/anulaciones/cargar`, {
				   method: 'POST',
				   headers: { 'Content-Type': 'application/json' },
				   body: JSON.stringify(payload),
				   signal: abortController.signal
			   });
		       console.log('[ANULACIONES] Respuesta status:', res.status);
		       const data = await res.json();
		       console.log('[ANULACIONES] Respuesta data:', data);
		       if (res.ok && data.ok) {
			       setShowOpuSuccess(true);
			       setTimeout(() => setShowOpuSuccess(false), 2000);
			       const mensajeInicial = `Carga exitosa: ${data.insertados} nuevas anulaciones, ${data.yaExistentes} ya existentes, ${data.ignoradosSede} ignoradas por sede.`;
			       setMensaje(mensajeInicial + '\n\nActualizando vista...');
			       
			       // Recargar anulaciones y guardar fecha/hora de actualización
			       try {
				       const resAnulaciones = await fetch(`${API_CONFIG.BASE_URL}/anulaciones`);
				       const dataAnulaciones = await resAnulaciones.json();
				       console.log('[ANULACIONES] Recarga anulaciones:', dataAnulaciones);
				       const anulacionesCargadas = Array.isArray(dataAnulaciones.anulaciones) ? dataAnulaciones.anulaciones : [];
				       setAnulaciones(anulacionesCargadas);
				       
				       // Actualizar fecha de última actualización
				       const fechaAct = new Date().toISOString();
				       setUltimaActualizacionFull(fechaAct);
				       localStorage.setItem('ultimaActualizacionAnulaciones', fechaAct);
				       
				       // Bloquear automáticamente filas que tienen información de archivo plano
				       const filasConPlano = new Set<number>();
				       anulacionesCargadas.forEach((anulacion: Anulacion) => {
					       if (tieneInformacionPlano(anulacion) && anulacion.id) {
						       filasConPlano.add(anulacion.id);
					       }
				       });
				       
				       // Combinar con las filas ya bloqueadas manualmente
				       setFilasBloqueadas(prev => {
					       const nuevasFilas = new Set([...prev, ...filasConPlano]);
					       localStorage.setItem('anulaciones_filas_bloqueadas', JSON.stringify([...nuevasFilas]));
					       return nuevasFilas;
				       });
				       
				       // Resetear a la primera página para mostrar las nuevas anulaciones
				       setPaginaActual(1);
				       
				       // Actualizar mensaje final
				       setMensaje(mensajeInicial + `\n\n✅ Vista actualizada exitosamente. Total: ${anulacionesCargadas.length} anulaciones cargadas.`);
			       } catch (errorRecarga) {
				       console.error('[ANULACIONES] Error recargando anulaciones', errorRecarga);
				       setMensaje(mensajeInicial + '\n\n⚠️ Los datos se actualizaron pero hubo un error al refrescar la vista. Recarga la página manualmente.');
			       }
		       } else {
			       let errorMsg = data.error || 'Error al cargar anulaciones';
			       if (data.details) {
				       errorMsg += `\nDetalles: ${typeof data.details === 'string' ? data.details : JSON.stringify(data.details)}`;
			       }
			       setMensaje(errorMsg);
			       console.error('[ANULACIONES] Error en respuesta:', errorMsg);
		       }
	       } catch (e) {
		       setMensaje('Error de red o servidor');
		       console.error('[ANULACIONES] Error en fetch:', e);
	       }
	       setLoadingCargar(false);
       };
	   // Actualizar anulaciones del mes en curso
	   const handleActualizarUltimoMes = async () => {
   if (abortController) abortController.abort();
   abortController = new AbortController();
	   setLoadingUltimosDias(true);
	   setMensaje(null);
	   let pergamoToken = '';
	   let userId = '';
	   try {
		   if (window.localStorage) {
			   pergamoToken = window.localStorage.getItem('pergamoToken') || '';
			   const authToken = window.localStorage.getItem('authToken');
			   if (authToken) {
				   const payload = JSON.parse(atob(authToken.split('.')[1]));
				   userId = payload.username || payload.userId || '';
			   }
			   if (!userId) {
				   const userObj = window.localStorage.getItem('user');
				   if (userObj) {
					   const userParsed = JSON.parse(userObj);
					   userId = userParsed.username || '';
				   }
			   }
		   }
	   } catch {}
	// Calcular fechas del primer día del mes y hoy
	const hoy = new Date();
	const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
	const fechaInicial = primerDiaMes.toISOString().slice(0, 10);
	const fechaFinal = hoy.toISOString().slice(0, 10);
	   if (!pergamoToken || !userId) {
		   setMensaje('No hay credenciales de sesión. Inicia sesión nuevamente.');
		   setLoadingUltimosDias(false);
		   return;
	   }
	   try {
		   const payload = { fechaInicial, fechaFinal, token: pergamoToken, userId };
		   const res = await fetch(`${API_CONFIG.BASE_URL}/anulaciones/cargar`, {
			   method: 'POST',
			   headers: { 'Content-Type': 'application/json' },
			   body: JSON.stringify(payload),
			   signal: abortController.signal
		   });
		   const data = await res.json();
		   if (res.ok && data.ok) {
			   setShowOpuSuccess(true);
			   const mensajeInicial = `Carga exitosa: ${data.insertados} nuevas anulaciones, ${data.yaExistentes} ya existentes, ${data.ignoradosSede} ignoradas por sede.`;
			   setMensaje(mensajeInicial + '\n\nActualizando vista...');
			   
			   // Recargar anulaciones y guardar fecha/hora de actualización
			   try {
				   const resAnulaciones = await fetch(`${API_CONFIG.BASE_URL}/anulaciones`);
				   const dataAnulaciones = await resAnulaciones.json();
				   const anulacionesCargadas = Array.isArray(dataAnulaciones.anulaciones) ? dataAnulaciones.anulaciones : [];
				   setAnulaciones(anulacionesCargadas);
				   
				   // Actualizar fecha de última actualización
				   const fechaAct = new Date().toISOString();
				   setUltimaActualizacionFull(fechaAct);
				   localStorage.setItem('ultimaActualizacionAnulaciones', fechaAct);
				   
				   // Bloquear automáticamente filas que tienen información de archivo plano
				   const filasConPlano = new Set<number>();
				   anulacionesCargadas.forEach((anulacion: Anulacion) => {
					   if (tieneInformacionPlano(anulacion) && anulacion.id) {
						   filasConPlano.add(anulacion.id);
					   }
				   });
				   
				   // Combinar con las filas ya bloqueadas manualmente
				   setFilasBloqueadas(prev => {
					   const nuevasFilas = new Set([...prev, ...filasConPlano]);
					   localStorage.setItem('anulaciones_filas_bloqueadas', JSON.stringify([...nuevasFilas]));
					   return nuevasFilas;
				   });
				   
				   // Resetear a la primera página para mostrar las nuevas anulaciones
				   setPaginaActual(1);
				   
				   // Actualizar mensaje final
				   setMensaje(mensajeInicial + `\n\n✅ Vista actualizada exitosamente. Total: ${anulacionesCargadas.length} anulaciones cargadas.`);
				   
				   console.log(`[ANULACIONES] Recargadas ${anulacionesCargadas.length} anulaciones después de actualización`);
			   } catch (errorRecarga) {
				   console.error('[ANULACIONES] Error al recargar después de actualización:', errorRecarga);
				   setMensaje(mensajeInicial + '\n\n⚠️ Los datos se actualizaron pero hubo un error al refrescar la vista. Recarga la página manualmente.');
			   }
		   } else {
			   let errorMsg = data.error || 'Error al cargar anulaciones del mes';
			   if (data.details) {
				   errorMsg += `\nDetalles: ${typeof data.details === 'string' ? data.details : JSON.stringify(data.details)}`;
			   }
			   setMensaje(errorMsg);
		   }
	   } catch (e) {
		   setMensaje('Error de red o servidor');
	   }
	   setLoadingUltimosDias(false);
   };
			 // Función simulada para descargar reportes
			 const descargarReporte = async (tipo: string) => {
				 if (tipo === 'rips') {
					 setShowCargaPlano(true);
					 setMenuReportesOpen(false);
					 return;
				 }

				 if (tipo === 'general') {
					 try {
						 setMensaje('Generando archivo Excel...');
						 setShowOpu(true);

						 const resultado = await exportAnulacionesExcel(anulacionesFiltradas, {
							 tipoRegistro: tipoRegistroFiltro
						 });

						 if (resultado.success) {
							 setMensaje(`Archivo descargado exitosamente. ${resultado.recordsExported} registros exportados.`);
						 } else {
							 setMensaje(resultado.message);
						 }

						 setTimeout(() => setShowOpu(false), 3000);
					 } catch (error) {
						 console.error('Error al exportar:', error);
						 setMensaje('Error al generar el archivo Excel');
						 setShowOpu(true);
						 setTimeout(() => setShowOpu(false), 3000);
					 }
				 }

				 if (tipo === 'sin_estado') {
					 try {
						 setMensaje('Generando archivo Excel con registros sin estado...');
						 setShowOpu(true);

						 const resultado = await exportAnulacionesSinEstado(anulaciones, tipoRegistroFiltro);

						 if (resultado.success) {
							 setMensaje(`Archivo descargado exitosamente. ${resultado.recordsExported} registros sin estado exportados.`);
						 } else {
							 setMensaje(resultado.message);
						 }

						 setTimeout(() => setShowOpu(false), 3000);
					 } catch (error) {
						 console.error('Error al exportar sin estado:', error);
						 setMensaje('Error al generar el archivo Excel');
						 setShowOpu(true);
						 setTimeout(() => setShowOpu(false), 3000);
					 }
				 }

				 setMenuReportesOpen(false);
			 };

			 // Procesar archivo plano (Excel o texto)
const handleArchivoPlano = async (file: File) => {
  setLoadingPlano(true);
  setMensajePlano(null);
  setResultadosValidacionPlano([]); // Solo limpiar, no validar aquí
  try {
    let datos: any[] = [];
    if (file.name.endsWith('.xlsx')) {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      datos = json;
    } else {
      const texto = await file.text();
      const lineas = texto.split(/\r?\n/).filter(l => l.trim());
      datos = lineas.map(l => l.split(/\t|,/));
    }
    // Filtrar solo filas activas: primera columna con datos
    const datosFiltrados = datos.filter((fila: any, idx: number) => {
      if (idx === 0) return true; // Mantener encabezado
      const primeraCol = Array.isArray(fila) ? fila[0] : Object.values(fila)[0];
      return primeraCol !== undefined && primeraCol !== null && String(primeraCol).trim() !== '';
    });
		setDatosPlano(datosFiltrados);
		// Al cargar un archivo plano, bloquear automáticamente las filas correspondientes
		try {
			const idsABloquear = new Set<number>();
			// Recorrer filas (omitimos header) y buscar coincidencias en `anulaciones` por numeroAnulacion
			for (let i = 1; i < datosFiltrados.length; i++) {
				const fila = datosFiltrados[i];
				const numero = Array.isArray(fila) ? String(fila[0] || '').trim() : String(Object.values(fila)[0] || '').trim();
				if (!numero) continue;
				const encontrada = anulaciones.find(a => (a.numeroAnulacion || '').toString().trim() === numero || (a.factura || '').toString().trim() === numero);
				if (encontrada && encontrada.id) idsABloquear.add(encontrada.id);
			}
			if (idsABloquear.size > 0) {
				setFilasBloqueadas(prev => {
					const nuevas = new Set([...prev]);
					idsABloquear.forEach(id => nuevas.add(id));
					localStorage.setItem('anulaciones_filas_bloqueadas', JSON.stringify([...nuevas]));
					return nuevas;
				});
			}
		} catch (e) {
			console.warn('No se pudo bloquear filas automáticamente al cargar el plano', e);
		}
		// NO validar aquí contra anulaciones, solo mostrar datos
  } catch (e) {
    setMensajePlano('Error al procesar el archivo.');
    setDatosPlano([]);
    setResultadosValidacionPlano([]);
  }
  setLoadingPlano(false);
};

			 // Guardar datos validados en la base de datos
			 const handleGuardarPlano = async () => {
				 setLoadingPlano(true);
				 setMensajePlano(null);
				 try {
					 // Filtrar solo los registros con validación aprobada (CORRECTO)
					 const registrosAprobados = datosPlano.slice(1).filter((fila, idx) => {
						 const resultadoValidacion = resultadosValidacionPlano[idx];
						 return resultadoValidacion?.resultadoCol6 === 'CORRECTO';
					 });

						// Generar y descargar log de rechazados incluso si no hay aprobados
						try {
							const totalRegistros = datosPlano.length - 1; // Restar el header
							const aprobadosCount = registrosAprobados.length;
							const rechazados = [] as Array<{ filaIndex: number, numero: string, motivo: string }>;
							for (let i = 0; i < datosPlano.slice(1).length; i++) {
								const resultado = resultadosValidacionPlano[i];
								if (!resultado) continue;
								if (resultado.resultadoCol6 !== 'CORRECTO') {
									const fila = datosPlano.slice(1)[i];
									const numero = Array.isArray(fila) ? String(fila[0] || '').trim() : String(Object.values(fila)[0] || '').trim();
									// Construir motivo más amigable y legible para el usuario
									const razones: string[] = [];
									try {
										// Col1: existencia de la factura anulada
										if (resultado.resultadoCol1 && resultado.resultadoCol1 !== 'CORRECTO') {
											razones.push('Factura anulada no encontrada');
										}
										// Col2: facturas de reemplazo / eventos
										if (resultado.resultadoCol2 && resultado.resultadoCol2 !== 'CORRECTO') {
											razones.push('Factura(s) de reemplazo no encontradas o inválidas');
										}
										// Col3: fechas
										if (resultado.resultadoCol3 && resultado.resultadoCol3 !== 'CORRECTO') {
											// Usar mensaje original para detalles (formato/esperado/plano)
											razones.push(`Fecha: ${resultado.mensajeCol3 || 'no coincide o formato inválido'}`);
										}
										// Col4: valores
										if (resultado.resultadoCol4 && resultado.resultadoCol4 !== 'CORRECTO') {
											razones.push(`Valor: ${resultado.mensajeCol4 || 'no coincide'}`);
										}
										// Col5: motivo de anulación
										if (resultado.resultadoCol5 && resultado.resultadoCol5 !== 'CORRECTO') {
											razones.push('Motivo de anulación ausente o inválido');
										}
										// Col6: estado
										if (resultado.resultadoCol6 && resultado.resultadoCol6 !== 'CORRECTO') {
											razones.push(`Estado: ${resultado.mensajeCol6 || 'invalido'}`);
										}
									} catch (e) {
										// Si algo falla, fallback al mensaje bruto
									}

									let motivo = razones.length > 0 ? razones.join('; ') : (resultado.mensajeCol6 || resultado.mensajeCol1 || resultado.mensajeCol2 || resultado.mensajeCol3 || resultado.mensajeCol4 || resultado.mensajeCol5 || 'Rechazado sin motivo específico');
									// Añadir el número de fila y el contenido básico del plano para facilitar el diagnóstico
									rechazados.push({ filaIndex: i + 1, numero, motivo });
								}
							}

							if (rechazados.length > 0) {
								const now = new Date();
								const fechaStr = now.toISOString().slice(0,19).replace('T','_').replace(/:/g,'-');
								const header = [`Resumen de validación - ${now.toISOString()}`];
								header.push(`Total filas procesadas: ${totalRegistros}`);
								header.push(`Aprobados: ${aprobadosCount}`);
								header.push(`Rechazados: ${rechazados.length}`);
								header.push('');
								header.push('Listado de rechazados (solo número y motivo):');
								const lines = header.concat(rechazados.map(r => `${r.numero}\t${r.motivo}`));
								const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
								const url = URL.createObjectURL(blob);
								const a = document.createElement('a');
								a.href = url;
								a.download = `anulaciones_rechazadas_${fechaStr}.txt`;
								document.body.appendChild(a);
								a.click();
								document.body.removeChild(a);
								URL.revokeObjectURL(url);
							}
						} catch (e) {
							console.warn('Error generando log de rechazados:', e);
						}

						if (registrosAprobados.length === 0) {
							setMensajePlano('No hay registros aprobados para procesar. Solo se pueden actualizar facturas anuladas que ya existan en la base de datos.');
							setLoadingPlano(false);
							return;
						}

						// Preparar datos enriquecidos solo con los registros aprobados
						const datosEnriquecidos = registrosAprobados.map((fila, originalIdx) => {
						 // Encontrar el índice original en datosPlano para obtener el resultado correcto
						 const indiceOriginal = datosPlano.slice(1).findIndex(filaOriginal => 
							 filaOriginal[0] === fila[0] && filaOriginal[1] === fila[1]
						 );
						 const resultadoValidacion = resultadosValidacionPlano[indiceOriginal];
						 
						 return {
							 numeroAnulacion: fila[0], // Factura anulada
							 facturaRemplazo: fila[1], // Facturas de reemplazo
							 fechaRemplazo: resultadoValidacion?.fechasAutocompletadas?.join(', ') || undefined,
							 valorRemplazo: resultadoValidacion?.valoresAutocompletados?.join(', ') || undefined,
							 motivo: fila[2], // Motivo
							 estado: fila[3] // Estado
						 };
					 });

                        

					 // Enviar datos enriquecidos al backend
					 const res = await fetch(`${API_CONFIG.BASE_URL}/anulaciones/cargar-plano`, {
						 method: 'POST',
						 headers: { 'Content-Type': 'application/json' },
						 body: JSON.stringify({ datos: datosEnriquecidos })
					 });
					 const data = await res.json();
					 if (res.ok && data.ok) {
						 const totalRegistros = datosPlano.length - 1; // Restar el header
						 const cantidadAprobados = registrosAprobados.length;
						 const registrosActualizados = data.actualizadas || 0;
						 const rechazados = data.rechazados || 0;
						 
						 let mensaje = `Proceso completado. ${registrosActualizados} de ${cantidadAprobados} registros aprobados actualizados`;
						 if (rechazados > 0) {
							 mensaje += ` (${rechazados} rechazadas por no existir en BD)`;
						 }
						 mensaje += ` de ${totalRegistros} total.`;
						 
						 setMensajePlano(mensaje);
						 setShowOpuSuccess(true);
						 setTimeout(() => setShowOpuSuccess(false), 2000);
						 handleCancelarArchivoPlano(); // Usar la función de cancelar para limpiar todo
						 // Recargar anulaciones
						 fetch(`${API_CONFIG.BASE_URL}/anulaciones`)
							 .then(res => res.json())
							 .then(data => setAnulaciones(Array.isArray(data.anulaciones) ? data.anulaciones : []));
					 } else {
						 setMensajePlano(data.error || 'Error al procesar los datos.');
					 }
				 } catch (e) {
					 setMensajePlano('Error de red o servidor.');
				 }
				 setLoadingPlano(false);
			 };

			 // Función para validar el archivo plano contra la entidad Anulacion (solo primera columna)
			 async function handleValidarPlano() {
	// (Eliminado: la validación de columna 6 ya está dentro del mapeo principal)
  setLoadingPlano(true);
  setMensajePlano(null);
  setResultadosValidacionPlano([]);
				try {
					// Normalizar valores para evitar errores por espacios, mayúsculas, etc.
					const normalizar = (v: any) => String(v ?? '').replace(/[^a-zA-Z0-9]/g, '').trim().toLowerCase();
					const facturasEventoNorm = facturasEvento.map(normalizar);
					
					// Función helper para normalizar valores monetarios (eliminar .00)
					const normalizarValor = (valor: any): number => {
						let valorStr = String(valor);
						if (valorStr.endsWith('.00')) {
							valorStr = valorStr.slice(0, -3);
						}
						return Number(valorStr);
					};
					// Log de todos los valores de anulaciones y facturasEvento
					console.log('[VALIDACION] Anulaciones:', anulaciones.map(a => ({ original: a.numeroAnulacion, normalizado: normalizar(a.numeroAnulacion) })));
					console.log('[VALIDACION] FacturasEvento:', facturasEvento.map((f, idx) => ({ original: f, normalizado: facturasEventoNorm[idx] })));
					// Crear una copia de datosPlano para permitir modificaciones
					const datosPlanoModificados = [...datosPlano];

					// --- BATCH PREFETCH: recolectar todas las facturas de la columna 2 y resolver en un solo llamado ---
					const todasFacturasCol2Set = new Set<string>();
					for (const fila of datosPlano.slice(1)) {
						const valorCol2Local = Array.isArray(fila) ? fila[1] : Object.values(fila)[1];
						if (!valorCol2Local) continue;
						const partes = String(valorCol2Local).includes('/') ?
							String(valorCol2Local).split('/').map((f: string) => f.trim()) :
							String(valorCol2Local).includes(',') ?
							String(valorCol2Local).split(',').map((f: string) => f.trim()) :
							[String(valorCol2Local).trim()];
						for (const p of partes) { if (p) todasFacturasCol2Set.add(p); }
					}

					const todasFacturasCol2 = Array.from(todasFacturasCol2Set);
					const batchLookup: Record<string, any> = {};
					if (todasFacturasCol2.length > 0) {
						try {
							// Enviar en chunks de 200 para evitar URL muy largas
							const chunkSize = 200;
							setValidacionProgress({ inProgress: true, stage: 'Batch lookup', completed: 0, total: todasFacturasCol2.length });
							for (let i = 0; i < todasFacturasCol2.length; i += chunkSize) {
								const chunk = todasFacturasCol2.slice(i, i + chunkSize);
								const params = new URLSearchParams({ numeros: chunk.join(',') });
								const resBatch = await fetch(`${API_CONFIG.BASE_URL}/facturacion/eventos/batch?${params.toString()}`);
								const jb = await resBatch.json();
								if (resBatch.ok && jb && Array.isArray(jb.eventos)) {
									for (const ev of jb.eventos) {
										try { batchLookup[normalizar(String(ev.numeroFactura))] = ev; } catch(e) {}
									}
								}
								// actualizar progreso por chunk (sumar tamaño del chunk)
								const done = Math.min(i + chunk.length, todasFacturasCol2.length);
								setValidacionProgress(prev => ({ ...prev, completed: done }));
							}
							console.log('[VALIDACION] Batch lookup completado. Eventos encontrados:', Object.keys(batchLookup).length);
							setValidacionProgress(prev => ({ ...prev, stage: 'Validando filas', completed: 0, total: datosPlano.slice(1).length }));
						} catch (e) {
							console.warn('[VALIDACION] Error en batch lookup:', e);
						}
					}
					
					// Asegurar que el header tenga al menos las columnas básicas
					if (datosPlanoModificados[0] && datosPlanoModificados[0].length < 4) {
						const headersBasicos = ['Col1', 'Col2', 'Fecha', 'Valor', 'Motivo', 'Estado'];
						while (datosPlanoModificados[0].length < 6) {
							const index = datosPlanoModificados[0].length;
							datosPlanoModificados[0].push(headersBasicos[index] || `Col${index + 1}`);
						}
					}
					
					// Procesar secuencialmente para permitir llamadas de fallback a la API cuando no encontremos facturas en eventosFull
					const filas = datosPlano.slice(1);
					const resultados: any[] = [];
					for (let idx = 0; idx < filas.length; idx++) {
						const fila = filas[idx];
						const valorCol1 = Array.isArray(fila) ? fila[0] : Object.values(fila)[0];
						let valorCol2 = Array.isArray(fila) ? fila[1] : Object.values(fila)[1];
						const valorCol3 = Array.isArray(fila) ? fila[2] : Object.values(fila)[2]; // motivo
						const valorCol4 = Array.isArray(fila) ? fila[3] : Object.values(fila)[3]; // estado

						// Las fechas y valores se auto-completan internamente para validación
						let fechasAutoCompletadas: string[] = [];
						let valoresAutoCompletados: any[] = [];

						// Verificar si es una factura múltiple (contiene '/' o ',' como separadores)
						const facturasCol1 = String(valorCol1 || '').includes('/') ?
							String(valorCol1).split('/').map((f: string) => f.trim()) :
							String(valorCol1 || '').includes(',') ?
							String(valorCol1).split(',').map((f: string) => f.trim()) :
							[String(valorCol1 || '').trim()];

						// AUTO-COMPLETADO: Siempre buscar fechas y valores para las facturas de col2
						let facturasCol2: string[] = [];
						let autoCompletado = false;

						if (String(valorCol2 || '').trim()) {
							// Hay datos en col2, parsear facturas
							facturasCol2 = String(valorCol2 || '').includes('/') ?
								String(valorCol2).split('/').map((f: string) => f.trim()) :
								String(valorCol2 || '').includes(',') ?
								String(valorCol2).split(',').map((f: string) => f.trim()) :
								[String(valorCol2 || '').trim()];

							// AUTO-COMPLETADO: Buscar fechas y valores en eventosFull o por fallback a la API
							for (const facturaCol2 of facturasCol2) {
								let eventoEncontrado = eventosFull.find(ev => normalizar(String(ev.numeroFactura)) === normalizar(facturaCol2));
								// Si no está en eventosFull, verificar el batchLookup prefetechado
								if (!eventoEncontrado) {
									eventoEncontrado = batchLookup[normalizar(facturaCol2)];
									if (eventoEncontrado) {
										console.log(`[VALIDACION][Fila ${idx+1}] Col2: factura='${facturaCol2}' -> encontrada via batchLookup`);
									}
								}
								// Si aún no está, hacer fallback puntual (último recurso)
								if (!eventoEncontrado) {
									try {
										const fechaHoy = new Date().toISOString().slice(0, 10);
										const params = new URLSearchParams({ fechaInicial: '2000-01-01', fechaFinal: fechaHoy, search: facturaCol2, page: '1', limit: '1' });
										const resp = await fetch(`${API_CONFIG.BASE_URL}/facturacion/eventos?${params.toString()}`);
										const jd = await resp.json();
										if (resp.ok && jd && Array.isArray(jd.eventos) && jd.eventos.length > 0) {
											eventoEncontrado = jd.eventos[0];
											console.log(`[VALIDACION][Fila ${idx+1}] Col2: factura='${facturaCol2}' -> encontrada via API fallback`);
										} else {
											console.log(`[VALIDACION][Fila ${idx+1}] Col2: factura='${facturaCol2}' -> NO_ENCONTRADA (fallback)`);
										}
									} catch (e) {
										console.warn(`[VALIDACION][Fila ${idx+1}] Error fallback fetch para factura ${facturaCol2}:`, e);
									}
								}

								if (eventoEncontrado) {
									// Formatear la fecha autocompletada a YYYY-MM-DD
									fechasAutoCompletadas.push(formatDateShort(String(eventoEncontrado.fecha).trim()));
									let valor = String(eventoEncontrado.valor ?? '');
									// Eliminar .00 del final para mejor comparación
									if (valor.endsWith('.00')) {
										valor = valor.slice(0, -3);
									}
									valoresAutoCompletados.push(valor);
								} else {
									// Si no se encuentra, agregar placeholder para mantener orden
									fechasAutoCompletadas.push('');
									valoresAutoCompletados.push('');
								}
							}

							if (fechasAutoCompletadas.some(f => f !== '') && valoresAutoCompletados.some(v => v !== '')) {
								autoCompletado = true;
								console.log(`[AUTO-COMPLETADO][Fila ${idx+1}] INTERNO - Col2: ${facturasCol2.join(', ')} | Fechas: ${fechasAutoCompletadas.join(', ')} | Valores: ${valoresAutoCompletados.join(', ')}`);
							}
						}

						// Parsing de fechas y valores (solo para validación interna, no se muestran en tabla)
						const fechasCol3Internal = fechasAutoCompletadas;
						const valoresCol4Internal = valoresAutoCompletados;

						// Validación motivo de anulación (columna 3)
						let colorCol5 = '#FF0000';
						let resultadoCol5 = 'NO VALIDO';
						let mensajeCol5 = 'Debe ingresar motivo de anulación';
						if (valorCol3 && String(valorCol3).trim().length > 0) {
							colorCol5 = '#008000';
							resultadoCol5 = 'CORRECTO';
							mensajeCol5 = 'Motivo presente';
						}

						// Validación columna 1 (anulaciones) - soporte para múltiples facturas
						let existeCol1 = false;
						let mensajeCol1 = '';
						const facturasCol1Validas: string[] = [];
						const facturasCol1Invalidas: string[] = [];

						for (const factura of facturasCol1) {
							const normFactura = normalizar(factura);
							const existe = anulaciones.some(a => normalizar(a.numeroAnulacion) === normFactura);
							if (existe) {
								facturasCol1Validas.push(factura);
								existeCol1 = true;
							} else {
								facturasCol1Invalidas.push(factura);
							}
						}

						if (facturasCol1.length > 1) {
							if (facturasCol1Validas.length === facturasCol1.length) {
								mensajeCol1 = `Todas las facturas válidas: ${facturasCol1Validas.join(', ')}`;
							} else if (facturasCol1Validas.length > 0) {
								mensajeCol1 = `Válidas: ${facturasCol1Validas.join(', ')} | Inválidas: ${facturasCol1Invalidas.join(', ')}`;
								existeCol1 = false; // Requiere que todas sean válidas
							} else {
								mensajeCol1 = `Ninguna factura válida: ${facturasCol1Invalidas.join(', ')}`;
							}
						} else {
							mensajeCol1 = existeCol1 ? `Factura válida: ${facturasCol1[0]}` : `Factura no encontrada: ${facturasCol1[0]}`;
						}

						// Log de cada comparación para columna 1
						console.log(`[VALIDACION][Fila ${idx+1}] Col1: Facturas '${facturasCol1.join(', ')}' | Válidas: ${facturasCol1Validas.length}/${facturasCol1.length}`);

						// Validación columna 2 (eventos) - soporte para múltiples facturas MANTENIENDO ORDEN
						let existeCol2 = false;
						let mensajeCol2 = '';
						const facturasCol2Validas: string[] = [];
						const facturasCol2Invalidas: string[] = [];
						const eventosEncontrados: any[] = [];

						// Mantener el orden exacto de facturasCol2
						for (let i = 0; i < facturasCol2.length; i++) {
							const factura = facturasCol2[i];
							const eventoFactura = eventosFull.find(ev => normalizar(String(ev.numeroFactura)) === normalizar(factura));
							if (eventoFactura) {
								facturasCol2Validas.push(factura);
								eventosEncontrados.push(eventoFactura);
								existeCol2 = true;
								console.log(`[VALIDACION][Fila ${idx+1}] Col2: factura='${factura}' normalizada='${normalizar(factura)}' -> ENCONTRADA`);
							} else {
								// Si no fue encontrada en eventosFull, ya intentamos antes el auto-completado con fallback; verificar si fechasCol3Internal tiene dato en esa posición
								// Decidir validez según auto-completado previo
								const idxAuto = i;
								const fechaAuto = fechasCol3Internal[idxAuto] || '';
								if (fechaAuto) {
									facturasCol2Validas.push(factura);
									eventosEncontrados.push({ numeroFactura: factura, fecha: fechaAuto, valor: valoresCol4Internal[idxAuto] || 0 });
									existeCol2 = true;
									console.log(`[VALIDACION][Fila ${idx+1}] Col2: factura='${factura}' -> considerada válida por auto-completado`);
								} else {
									facturasCol2Invalidas.push(factura);
									eventosEncontrados.push(null);
									console.log(`[VALIDACION][Fila ${idx+1}] Col2: factura='${factura}' normalizada='${normalizar(factura)}' -> NO_ENCONTRADA`);
								}
							}
						}

						if (facturasCol2.length > 1) {
							if (facturasCol2Validas.length === facturasCol2.length) {
								mensajeCol2 = autoCompletado ?
									`🔄 Fechas/Valores AUTO-COMPLETADOS | Todas válidas: ${facturasCol2Validas.join(', ')}` :
									`Todas las facturas válidas: ${facturasCol2Validas.join(', ')}`;
							} else if (facturasCol2Validas.length > 0) {
								mensajeCol2 = `Válidas: ${facturasCol2Validas.join(', ')} | Inválidas: ${facturasCol2Invalidas.join(', ')}`;
								existeCol2 = false; // Requiere que todas sean válidas
							} else {
								mensajeCol2 = `Ninguna factura válida: ${facturasCol2Invalidas.join(', ')}`;
							}
						} else {
							mensajeCol2 = existeCol2 ?
								(autoCompletado ?
									`🔄 Fechas/Valores AUTO-COMPLETADOS | Válida: ${facturasCol2[0]}` :
									`Factura válida: ${facturasCol2[0]}`) :
								`Factura no encontrada: ${facturasCol2[0]}`;
						}

						console.log(`[VALIDACION][Fila ${idx+1}] Col2: Facturas '${facturasCol2.join(', ')}' | Válidas: ${facturasCol2Validas.length}/${facturasCol2.length}`);

						// Actualizar progreso por fila
						setValidacionProgress(prev => ({ ...prev, completed: prev.completed + 1 }));

						// Validación de fechas y valores (columnas 3 y 4) - soporte para múltiples
						let resultadoCol3 = 'NO VALIDADO';
						let colorCol3 = '#AAAAAA';
						let mensajeCol3 = 'No se valida porque no hay facturas válidas';
						let resultadoCol4 = 'NO VALIDADO';
						let colorCol4 = '#AAAAAA';
						let mensajeCol4 = 'No se valida porque no hay facturas válidas';

						if (existeCol2 && eventosEncontrados.length > 0) {
							// Verificar que tengamos el mismo número de fechas y valores que facturas válidas
							const numFacturasValidas = eventosEncontrados.length;
							
							// Si hay múltiples facturas, debe haber múltiples fechas y valores
							if (numFacturasValidas > 1) {
								if (fechasCol3Internal.length !== numFacturasValidas || valoresCol4Internal.length !== numFacturasValidas) {
									resultadoCol3 = 'ERROR FORMATO';
									colorCol3 = '#FF0000';
									mensajeCol3 = `Se esperan ${numFacturasValidas} fechas, se encontraron ${fechasCol3Internal.length}`;
									resultadoCol4 = 'ERROR FORMATO';
									colorCol4 = '#FF0000';
									mensajeCol4 = `Se esperan ${numFacturasValidas} valores, se encontraron ${valoresCol4Internal.length}`;
								} else {
									// Validar cada par fecha-valor con su evento correspondiente MANTENIENDO ORDEN
									const fechasCorrectas = [];
									const fechasIncorrectas = [];
									const valoresCorrectos = [];
									const valoresIncorrectos = [];

									for (let i = 0; i < facturasCol2.length; i++) {
										const eventoFactura = eventosEncontrados[i];
										const facturaCol2 = facturasCol2[i];
										
										// Si no se encontró el evento, saltar
										if (!eventoFactura) {
											fechasIncorrectas.push(`${facturaCol2}:NO_ENCONTRADA`);
											valoresIncorrectos.push(`${facturaCol2}:NO_ENCONTRADA`);
											continue;
										}
										
										// Solo validar si hay fecha y valor en las posiciones correspondientes
										if (i >= fechasCol3Internal.length || i >= valoresCol4Internal.length) {
											fechasIncorrectas.push(`${facturaCol2}:SIN_DATOS`);
											valoresIncorrectos.push(`${facturaCol2}:SIN_DATOS`);
											continue;
										}

										// Formatear la fecha del evento a YYYY-MM-DD para comparar de forma consistente
										const fechaEventoRaw = eventoFactura.fecha ? String(eventoFactura.fecha).trim() : '';
										const fechaEvento = formatDateShort(fechaEventoRaw);
										const valorEvento = eventoFactura.valor ? Number(eventoFactura.valor) : 0;

										// Convertir fecha del plano (manejar formato Excel)
										let fechaPlano = String(fechasCol3Internal[i]).trim();
										if (/^\d{5}$/.test(fechaPlano)) {
											const serial = Number(fechaPlano);
											const excelBase = new Date(Date.UTC(1899, 11, 30));
											excelBase.setUTCDate(excelBase.getUTCDate() + serial);
											fechaPlano = excelBase.toISOString().slice(0, 10);
										}

										const fechaCorrecta = fechaEvento === fechaPlano;
										const valorCorrecto = normalizarValor(eventoFactura.valor) === normalizarValor(valoresCol4Internal[i]);

										if (fechaCorrecta) {
											fechasCorrectas.push(`${facturaCol2}:${fechaPlano}`);
										} else {
											fechasIncorrectas.push(`${facturaCol2}:${fechaPlano}(esp:${fechaEvento})`);
										}

										if (valorCorrecto) {
											valoresCorrectos.push(`${facturaCol2}:${valoresCol4Internal[i]}`);
										} else {
											valoresIncorrectos.push(`${facturaCol2}:${valoresCol4Internal[i]}(esp:${valorEvento})`);
										}
									}

									// Determinar resultado final para fechas
									if (fechasIncorrectas.length === 0) {
										resultadoCol3 = 'CORRECTO';
										colorCol3 = '#008000';
										mensajeCol3 = `Todas las fechas coinciden: ${fechasCorrectas.join(', ')}`;
									} else {
										resultadoCol3 = 'NO COINCIDE';
										colorCol3 = '#FF0000';
										mensajeCol3 = `Incorrectas: ${fechasIncorrectas.join(', ')}`;
									}

									// Determinar resultado final para valores
									if (valoresIncorrectos.length === 0) {
										resultadoCol4 = 'CORRECTO';
										colorCol4 = '#008000';
										mensajeCol4 = `Todos los valores coinciden: ${valoresCorrectos.join(', ')}`;
									} else {
										resultadoCol4 = 'NO COINCIDE';
										colorCol4 = '#FF0000';
										mensajeCol4 = `Incorrectos: ${valoresIncorrectos.join(', ')}`;
									}
								}
							} else {
								// Validación normal para una sola factura
								const eventoFactura = eventosEncontrados[0];
								// Formatear la fecha del evento a YYYY-MM-DD para comparar con la fecha del plano
								const fechaEvento = eventoFactura && eventoFactura.fecha ? formatDateShort(String(eventoFactura.fecha).trim()) : '';
								let fechaPlano = String(fechasCol3Internal[0]).trim();
								
								if (/^\d{5}$/.test(fechaPlano)) {
									const serial = Number(fechaPlano);
									const excelBase = new Date(Date.UTC(1899, 11, 30));
									excelBase.setUTCDate(excelBase.getUTCDate() + serial);
									fechaPlano = excelBase.toISOString().slice(0, 10);
								}
								
								const valorEvento = eventoFactura.valor ? Number(eventoFactura.valor) : 0;
								const fechaCorrecta = fechaEvento === fechaPlano;
								const valorCorrecto = normalizarValor(eventoFactura.valor) === normalizarValor(valoresCol4Internal[0]);
								
								resultadoCol3 = fechaCorrecta ? 'CORRECTO' : 'NO COINCIDE';
								resultadoCol4 = valorCorrecto ? 'CORRECTO' : 'NO COINCIDE';
								colorCol3 = fechaCorrecta ? '#008000' : '#FF0000';
								colorCol4 = valorCorrecto ? '#008000' : '#FF0000';
								mensajeCol3 = fechaCorrecta
									? `Fecha coincide (${fechaPlano})`
									: `Fecha no coincide. Esperado: ${fechaEvento}, Plano: ${fechaPlano}`;
								mensajeCol4 = valorCorrecto
									? `Valor coincide (${valoresCol4Internal[0]})`
									: `Valor no coincide. Esperado: ${valorEvento}, Plano: ${valoresCol4Internal[0]}`;
							}

							console.log(`[VALIDACION][Fila ${idx+1}] Fechas: ${fechasCol3Internal.join(', ')} | Valores: ${valoresCol4Internal.join(', ')}`);
						}

						// Buscar la factura en eventos (usar la primera válida para validaciones de fecha/valor)
						const eventoFactura = eventosEncontrados[0]; // Usar el primer evento encontrado para validar fecha/valor

						// Validación columna 6 (estado)
						let colorCol6 = '#FF0000';
						let resultadoCol6 = 'NO VALIDO';
						let mensajeCol6 = '';
						const esFacturado = valorCol4 && String(valorCol4).trim().toUpperCase() === 'FACTURADO';
						const esNoFacturado = valorCol4 && String(valorCol4).trim().toUpperCase() === 'NO FACTURADO';
						if (esFacturado) {
							// Todas las columnas 1-5 deben estar en verde y ninguna vacía
							const todasVerdes = [
								existeCol1 ? '#008000' : '#FF0000',
								existeCol2 ? '#008000' : '#FF0000',
								colorCol3,
								colorCol4,
								colorCol5
							].every(c => c === '#008000');
							const todasConValor = [valorCol1, valorCol2, valorCol3, valorCol4].every(v => v !== undefined && String(v).trim().length > 0);
							if (todasVerdes && todasConValor) {
								colorCol6 = '#008000';
								resultadoCol6 = 'CORRECTO';
								mensajeCol6 = 'Estado válido: Facturado';
							} else {
								colorCol6 = '#FF0000';
								resultadoCol6 = 'NO VALIDO';
								mensajeCol6 = 'Para Facturado, todas las columnas 1-5 deben estar en verde y con valor';
							}
						} else if (esNoFacturado) {
							// Columna 1 y 5 en verde, columnas 2,3,4 vacías
							const col1Verde = existeCol1 ? '#008000' : '#FF0000';
							const col5Verde = colorCol5;
							const col2Vacia = !valorCol2 || String(valorCol2).trim().length === 0;
							const col3Vacia = !valorCol3 || String(valorCol3).trim().length === 0;
							const col4Vacia = !valorCol4 || String(valorCol4).trim().length === 0;
							if (col1Verde === '#008000' && col5Verde === '#008000' && col2Vacia && col3Vacia && col4Vacia) {
								colorCol6 = '#008000';
								resultadoCol6 = 'CORRECTO';
								mensajeCol6 = 'Estado válido: No Facturado';
							} else {
								colorCol6 = '#FF0000';
								resultadoCol6 = 'NO VALIDO';
								mensajeCol6 = 'Para No Facturado, columna 1 y 5 deben estar en verde y 2,3,4 vacías';
							}
						} else {
							colorCol6 = '#FF0000';
							resultadoCol6 = 'NO VALIDO';
							mensajeCol6 = 'Estado debe ser FACTURADO o NO FACTURADO';
						}

						resultados.push({
							resultadoCol1: existeCol1 ? 'CORRECTO' : 'NO ENCONTRADO',
							colorCol1: existeCol1 ? '#008000' : '#FF0000',
							mensajeCol1: mensajeCol1,
							resultadoCol2: existeCol2 ? 'CORRECTO' : 'NO ENCONTRADO',
							colorCol2: existeCol2 ? '#008000' : '#FF0000',
							mensajeCol2: mensajeCol2,
							resultadoCol3,
							colorCol3,
							mensajeCol3,
							resultadoCol4,
							colorCol4,
							mensajeCol4,
							resultadoCol5,
							colorCol5,
							mensajeCol5,
							resultadoCol6,
							colorCol6,
							mensajeCol6,
							autoCompletado,
							valoresAutoCompletados: autoCompletado ? {
								col2: valorCol2,
								col3: valorCol3,
								col4: valorCol4
							} : null,
							// Agregar las fechas y valores autocompletados para mostrar en la tabla
							fechasAutocompletadas: fechasCol3Internal || [],
							valoresAutocompletados: valoresCol4Internal || []
						});
					}
					setResultadosValidacionPlano(resultados);
					
					// Actualizar datosPlano con los valores auto-completados
					setDatosPlano(datosPlanoModificados);
				} catch (e) {
					setMensajePlano('Error en la validación.');
					setResultadosValidacionPlano([]);
					setValidacionProgress({ inProgress: false, stage: '', completed: 0, total: 0 });
				}
				setLoadingPlano(false);
				// Finalizar progreso si quedó activo
				setValidacionProgress(prev => ({ ...prev, inProgress: false }));
};

			 // Modal de carga y validación de archivo plano
			 const renderModalCargaPlano = () => (
							showCargaPlano && (
								<div className="fixed inset-0 z-50 flex items-center justify-center p-2" style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
						 <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 w-full max-w-6xl min-h-[480px] max-h-[700px] relative animate-fade-in overflow-hidden flex flex-col">
							 <button
								 className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
								 onClick={() => { setShowCargaPlano(false); setArchivoPlano(null); setDatosPlano([]); setMensajePlano(null); }}
								 aria-label="Cerrar"
							 >×</button>
							 <h2 className="text-base font-semibold text-center mb-2" style={{ color: '#002c50' }}>Cargar archivo Plano de Anulaciones</h2>
							 <hr className="border-t mb-4" style={{ borderColor: '#002c50' }} />
							 <div className="flex items-center justify-between mb-4">
								 <label className="inline-flex items-center gap-3">
									 <span 
										 className={`px-4 py-2 rounded text-white cursor-pointer inline-block ${archivoPlano ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
										 style={{ backgroundColor: '#002c50' }}>
										 Seleccionar archivo
									 </span>
									 <input
										 type="file"
										 accept=".txt,.csv,.xlsx"
										 className="hidden"
										 disabled={!!archivoPlano}
										 onChange={e => {
											 const file = e.target.files?.[0] || null;
											 setArchivoPlano(file);
											 if (file) handleArchivoPlano(file);
										 }}
									 />
									 {archivoPlano && <span className="text-sm text-gray-500">{archivoPlano.name}</span>}
								 </label>
								 {archivoPlano && (
									 <button
										 className="px-4 py-2 rounded text-white font-bold ml-4"
										 style={{ backgroundColor: '#002c50' }}
										 disabled={!archivoPlano || datosPlano.length === 0}
										 onClick={handleValidarPlano}
									 >
										 Validar archivo
									 </button>
								 )}
							 </div>

							{/* Modal detalle de validación por fila */}
							{detalleVisible && detalleContenido && (
								<div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-50 p-4">
									<div className="bg-white rounded-lg shadow-lg p-4 max-w-lg w-full">
										<div className="flex justify-between items-center mb-2">
											<strong>Detalle de validación</strong>
											<button className="text-gray-500" onClick={() => { setDetalleVisible(false); setDetalleContenido(null); }}>Cerrar</button>
										</div>
										<div className="text-sm text-gray-700 space-y-2 max-h-64 overflow-auto">
											<div><strong>Col1:</strong> {detalleContenido.mensajeCol1}</div>
											<div><strong>Col2:</strong> {detalleContenido.mensajeCol2}</div>
											<div><strong>Fecha(s) autocompletadas:</strong> {Array.isArray(detalleContenido.fechasAutocompletadas) ? detalleContenido.fechasAutocompletadas.join(', ') : detalleContenido.fechasAutocompletadas}</div>
											<div><strong>Valor(es) autocompletados:</strong> {Array.isArray(detalleContenido.valoresAutocompletados) ? (detalleContenido.valoresAutocompletados.length>0 ? detalleContenido.valoresAutocompletados.map((v:any)=>`$${Number(v).toLocaleString('es-CO')}`).join(', ') : '') : detalleContenido.valoresAutocompletados}</div>
											<div><strong>Col3 (mensaje):</strong> {detalleContenido.mensajeCol3}</div>
											<div><strong>Col4 (mensaje):</strong> {detalleContenido.mensajeCol4}</div>
											<div><strong>Col5 (motivo):</strong> {detalleContenido.mensajeCol5}</div>
											<div><strong>Col6 (estado):</strong> {detalleContenido.mensajeCol6}</div>
										</div>
										<div className="mt-3 text-right">
											<button className="px-3 py-1 rounded bg-gray-200" onClick={() => { setDetalleVisible(false); setDetalleContenido(null); }}>Cerrar</button>
										</div>
									</div>
								</div>
							)}
							 {loadingPlano && <div className="text-center text-sm text-gray-500 mb-2">Procesando archivo...</div>}
							 {/* Barra de progreso para validación batch */}
							 {validacionProgress.inProgress && (
								<div className="w-full p-2 mb-2">
									<div className="text-xs text-gray-700 mb-1">{validacionProgress.stage} — {validacionProgress.completed}/{validacionProgress.total}</div>
									<div className="w-full bg-gray-200 rounded h-3 overflow-hidden">
										<div className="bg-[#002c50] h-3 rounded" style={{ width: `${Math.min(100, Math.round((validacionProgress.completed / Math.max(1, validacionProgress.total)) * 100))}%` }} />
									</div>
								</div>
							 )}
							 {mensajePlano && <div className="text-center text-sm text-red-500 mb-2">{mensajePlano}</div>}
							 
							 {/* Mostrar resumen de validación si hay resultados */}
							 {resultadosValidacionPlano.length > 0 && (
								 <div className="text-center text-sm mb-2 p-2 bg-gray-100 rounded">
									 {(() => {
										 const totalRegistros = datosPlano.length - 1;
										 const registrosAprobados = resultadosValidacionPlano.filter(r => r?.resultadoCol6 === 'CORRECTO').length;
										 const registrosRechazados = totalRegistros - registrosAprobados;
										 
										 return (
											 <div>
												 <span className="font-bold">Resumen de validación: </span>
												 <span className="text-green-600 font-bold">{registrosAprobados} aprobados para actualizar</span>
												 {registrosRechazados > 0 && (
													 <>
														 {' / '}
														 <span className="text-red-600 font-bold">{registrosRechazados} rechazados</span>
													 </>
												 )}
												 <span className="text-gray-600"> (de {totalRegistros} total)</span>
												 {registrosAprobados > 0 && (
													 <span className="block text-sm text-green-700 mt-1">
														 ✓ {registrosAprobados} factura{registrosAprobados !== 1 ? 's' : ''} anulada{registrosAprobados !== 1 ? 's' : ''} existente{registrosAprobados !== 1 ? 's' : ''} se actualizará{registrosAprobados !== 1 ? 'n' : ''} con datos de reemplazo
													 </span>
												 )}
											 </div>
										 );
									 })()}
								 </div>
							 )}
							 
							 {datosPlano.length > 0 && (
								 <div className="overflow-auto max-h-64 border rounded mb-4">
									 <table className="min-w-full text-xs">
										 <tbody>
											 {datosPlano.map((fila, i) => (
												 <tr key={i} className={i === 0 ? "border-b" : "border-b"} style={i === 0 ? { backgroundColor: '#002c50' } : {}}>
													 {i === 0 ? (
														 // Fila de encabezados - agregar las nuevas columnas
														 <>
															 <td className="px-2 py-1 text-white font-bold text-center">{fila[0]}</td> {/* Factura Anulada */}
															 <td className="px-2 py-1 text-white font-bold text-center">{fila[1]}</td> {/* Facturas Reemplazo */}
															 <td className="px-2 py-1 text-white font-bold text-center">Fecha (Reemplazo)</td> {/* Nueva columna */}
															 <td className="px-2 py-1 text-white font-bold text-center">Valor (Reemplazo)</td> {/* Nueva columna */}
															 <td className="px-2 py-1 text-white font-bold text-center">{fila[2]}</td> {/* Motivo */}
															 <td className="px-2 py-1 text-white font-bold text-center">{fila[3]}</td> {/* Estado */}
							 								{/* Encabezado para columna de validación final */}
							 								<td className="px-2 py-1 text-white font-bold text-center">Resultado</td>
							 								{/* Nueva columna para indicar si se puede guardar */}
							 								<td className="px-2 py-1 text-white font-bold text-center">Guardar</td>
							 								{/* Nueva columna Detalle (ojito) */}
							 								<td className="px-2 py-1 text-white font-bold text-center">Detalle</td>
														 </>
													 ) : (
														 // Filas de datos - construir fila con columnas en el orden correcto
														 <>
															 {/* Columna 1: Factura Anulada */}
															 <td className="px-2 py-1 text-center" 
																 style={resultadosValidacionPlano[i-1] ? { color: resultadosValidacionPlano[i-1].colorCol1, fontWeight: 'bold', backgroundColor: 'transparent' } : {}}>
																 {fila[0]}
															 </td>
															 
															 {/* Columna 2: Facturas Reemplazo */}
															 <td className="px-2 py-1 text-center" 
																 style={resultadosValidacionPlano[i-1] ? { color: resultadosValidacionPlano[i-1].colorCol2, fontWeight: 'bold', backgroundColor: 'transparent' } : {}}>
																 {fila[1]}
															 </td>
															 
															 {/* NUEVA COLUMNA 3: Fecha (Reemplazo) - Autocompletada */}
															 <td className="px-2 py-1 text-center font-bold" 
																 style={resultadosValidacionPlano[i-1] ? { color: resultadosValidacionPlano[i-1].colorCol3, backgroundColor: 'transparent' } : {}}
																 title={resultadosValidacionPlano[i-1]?.mensajeCol3}>
																 {resultadosValidacionPlano[i-1]?.fechasAutocompletadas?.join(', ') || ''}
															 </td>
															 
															 {/* NUEVA COLUMNA 4: Valor (Reemplazo) - Autocompletado */}
															 <td className="px-2 py-1 text-center font-bold" 
																 style={resultadosValidacionPlano[i-1] ? { color: resultadosValidacionPlano[i-1].colorCol4, backgroundColor: 'transparent' } : {}}
																 title={resultadosValidacionPlano[i-1]?.mensajeCol4}>
																 {resultadosValidacionPlano[i-1]?.valoresAutocompletados?.length > 0 
																	 ? resultadosValidacionPlano[i-1].valoresAutocompletados.map((v: number) => `$${Number(v).toLocaleString('es-CO')}`).join(', ')
																	 : ''
																 }
															 </td>
															 
															 {/* Columna 5: Motivo */}
															 <td className="px-2 py-1 text-center" 
																 style={resultadosValidacionPlano[i-1] ? { color: resultadosValidacionPlano[i-1].colorCol5, fontWeight: 'bold', backgroundColor: 'transparent' } : {}}
																 title={resultadosValidacionPlano[i-1]?.mensajeCol5}>
																 {fila[2]}
															 </td>
															 
															 {/* Columna 6: Estado */}
															 <td className="px-2 py-1 text-center" 
																 style={resultadosValidacionPlano[i-1] ? { color: resultadosValidacionPlano[i-1].colorCol6 || '#000000', fontWeight: 'bold', backgroundColor: 'transparent' } : {}}>
																 {typeof fila[3] === 'number' ? `$ ${Math.round(fila[3]).toLocaleString('es-CO')}` : fila[3]}
															 </td>
														 </>
													 )}
							 						{/* Columna de validación final única */}
													 {i !== 0 && resultadosValidacionPlano[i-1] && (
														 <>
															 {/* Determinar si está aprobado basado en el resultado de validación */}
															 {(() => {
																 const resultado = resultadosValidacionPlano[i-1];
																 const esAprobado = resultado?.resultadoCol6 === 'CORRECTO'; // Validación correcta
																 return (
																	 <>
																		 {/* Columna Resultado */}
																		 <td className="px-2 py-1 text-center font-bold text-sm" 
																			 style={{ 
																				 color: esAprobado ? '#008000' : '#FF0000', 
																				 backgroundColor: 'transparent',
																				 fontSize: '12px'
																			 }}>
																			 {esAprobado ? 'APROBADO' : 'RECHAZADO'}
																		 </td>
																		 {/* Columna Guardar */}
																		 <td className="px-2 py-1 text-center font-bold text-sm">
																			 {esAprobado ? (
																				 <span className="inline-block w-4 h-4 bg-green-500 rounded-full" title="Se actualizará esta factura anulada existente">✓</span>
																			 ) : (
																				 <span className="inline-block w-4 h-4 bg-red-500 rounded-full" title="No se actualizará - factura no encontrada o validación incorrecta">✗</span>
																			 )}
																		 </td>
							 											{/* Nueva columna: Detalle (ojito) */}
							 											<td className="px-2 py-1 text-center">
							 												<button
							 													className="p-1 rounded hover:bg-gray-100"
							 													onClick={() => { setDetalleContenido(resultadosValidacionPlano[i-1]); setDetalleVisible(true); }}
							 													title="Ver detalle de validación"
							 												>
							 													<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="#002c50" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
							 														<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
							 														<circle cx="12" cy="12" r="3" />
							 													</svg>
							 												</button>
							 											</td>
																	 </>
																 );
															 })()}
														 </>
													 )}
												 </tr>
											 ))}
										 </tbody>
									 </table>
								 </div>
							 )}

			
							 {archivoPlano && (
								 <div className="flex gap-2 justify-end mt-2">
									 <button 
										 className="px-4 py-2 rounded bg-gray-200" 
										 onClick={handleCancelarArchivoPlano}>
										 Cancelar
									 </button>
									 <button 
										 className="px-4 py-2 rounded text-white" 
										 style={{ backgroundColor: '#002c50' }}
										 disabled={loadingPlano || datosPlano.length === 0} 
										 onClick={handleGuardarPlano}>
										 Guardar
									 </button>
								 </div>
							 )}
						 </div>
					 </div>
				 )
			 );

       return (
				 <section className="pt-8">
				{renderModalCargaPlano()}
				{/* Modal de análisis (renderizado en root del componente para evitar stacking/overflow) */}
				{showAnalisis && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-2" style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
						<div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 w-full max-w-[98vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl min-h-[520px] min-w-[700px] max-h-[80vh] max-w-[90vw] h-[520px] md:h-[600px] relative animate-fade-in overflow-hidden flex flex-col">
							<button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold" onClick={() => setShowAnalisis(false)} aria-label="Cerrar">×</button>
							<div className="flex gap-2 justify-center mb-4">
								<button className={`min-w-[160px] flex-1 px-5 py-2 rounded-xl font-semibold text-xs border border-gray-300 transition-all duration-150 focus:outline-none shadow-sm ${analisisTipo === 'grafico' ? 'text-white border-[#002c50]' : 'bg-white text-gray-900 hover:bg-gray-100'}`} style={analisisTipo === 'grafico' ? { backgroundColor: '#002c50', letterSpacing: '.01em' } : { letterSpacing: '.01em' }} onClick={() => setAnalisisTipo('grafico')}>Análisis General</button>
								<button className={`min-w-[160px] flex-1 px-5 py-2 rounded-xl font-semibold text-xs border border-gray-300 transition-all duration-150 focus:outline-none shadow-sm ${analisisTipo === 'sede' ? 'text-white border-[#002c50]' : 'bg-white text-gray-900 hover:bg-gray-100'}`} style={analisisTipo === 'sede' ? { backgroundColor: '#002c50', letterSpacing: '.01em' } : { letterSpacing: '.01em' }} onClick={() => setAnalisisTipo('sede')}>Análisis Sede</button>
								<button className={`min-w-[160px] flex-1 px-5 py-2 rounded-xl font-semibold text-xs border border-gray-300 transition-all duration-150 focus:outline-none shadow-sm ${analisisTipo === 'aseguradora' ? 'text-white border-[#002c50]' : 'bg-white text-gray-900 hover:bg-gray-100'}`} style={analisisTipo === 'aseguradora' ? { backgroundColor: '#002c50', letterSpacing: '.01em' } : { letterSpacing: '.01em' }} onClick={() => setAnalisisTipo('aseguradora')}>Análisis Aseguradora</button>
								<button className={`min-w-[160px] flex-1 px-5 py-2 rounded-xl font-semibold text-xs border border-gray-300 transition-all duration-150 focus:outline-none shadow-sm ${analisisTipo === 'comparativa' ? 'text-white border-[#002c50]' : 'bg-white text-gray-900 hover:bg-gray-100'}`} style={analisisTipo === 'comparativa' ? { backgroundColor: '#002c50', letterSpacing: '.01em' } : { letterSpacing: '.01em' }} onClick={() => setAnalisisTipo('comparativa')}>Comparativo</button>
								<button className={`min-w-[160px] flex-1 px-5 py-2 rounded-xl font-semibold text-xs border border-gray-300 transition-all duration-150 focus:outline-none shadow-sm ${analisisTipo === 'general' ? 'text-white border-[#002c50]' : 'bg-white text-gray-900 hover:bg-gray-100'}`} style={analisisTipo === 'general' ? { backgroundColor: '#002c50', letterSpacing: '.01em' } : { letterSpacing: '.01em' }} onClick={() => setAnalisisTipo('general')}>Informe General</button>
							</div>
							<hr className="border-t border-gray-300 mb-4 w-full" />
							<div className="flex-1 min-h-0 overflow-auto">
								{analisisTipo === 'grafico' && <div className="p-4">(Análisis gráfico placeholder)</div>}
								{analisisTipo === 'sede' && <div className="p-4">(Análisis por sede placeholder)</div>}
								{analisisTipo === 'aseguradora' && <div className="p-4">(Análisis por aseguradora placeholder)</div>}
								{analisisTipo === 'comparativa' && <div className="p-4">(Comparativo placeholder)</div>}
								{analisisTipo === 'general' && <div className="p-4">(Informe general placeholder)</div>}
							</div>
						</div>
					</div>
				)}
		       <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
			       <h1 className="text-3xl font-bold mb-1 whitespace-nowrap" style={{ color: '#002c50' }}>Modulo Anulaciones</h1>
			       <div className="flex gap-2 items-center mt-2 md:mt-0 w-full justify-end">
				       <div className="flex gap-2 items-center">
					       {/* Filtros avanzados y botón cargar solo cuando mostrarFiltros */}
					       {mostrarFiltros && (
						       <>
				       <input
					       type="date"
					       className="border px-2 py-1 w-full text-xs rounded"
					       value={fechaCargaInicial}
					       onChange={e => setFechaCargaInicial(e.target.value)}
					       placeholder="Fecha inicial BD"
					       min="2025-01-01"
				       />
				       <input
					       type="date"
					       className="border px-2 py-1 w-full text-xs rounded"
					       value={fechaCargaFinal}
					       onChange={e => setFechaCargaFinal(e.target.value)}
					       placeholder="Fecha final BD"
					       min="2025-01-01"
				       />
							       <button
								       className={`p-0 m-0 bg-transparent border-none outline-none flex items-center ml-2 group`}
								       title="Cargar o actualizar anulaciones"
								       onClick={handleCargar}
								       disabled={loadingCargar}
								       style={{ boxShadow: 'none', borderRadius: '50%' }}
							       >
								       {loadingCargar ? (
									       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="url(#cargar-gradient)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
										       <defs>
											       <linearGradient id="cargar-gradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
												       <stop stopColor="#2563eb" />
												       <stop offset="1" stopColor="#38bdf8" />
											       </linearGradient>
										       </defs>
										       <circle cx="12" cy="12" r="9" stroke="#e0e7ef" strokeWidth="1.2" fill="none" />
										       <path d="M21 12a9 9 0 1 1-9-9" stroke="url(#cargar-gradient)" strokeWidth="1.2" fill="none" />
									       </svg>
								       ) : (
									       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-all duration-200" viewBox="0 0 24 24" fill="none" stroke="#002c50" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
										       <ellipse className="icon-db" cx="12" cy="6.5" rx="8" ry="3.5" />
										       <path className="icon-db" d="M4 6.5v11c0 1.93 3.58 3.5 8 3.5s8-1.57 8-3.5v-11" />
										       <path className="icon-db" d="M4 12c0 1.93 3.58 3.5 8 3.5s8-1.57 8-3.5" />
									       </svg>
								       )}
								       <style>{`
									       .group:hover .icon-db {
										       stroke: #a21caf !important;
										       filter: drop-shadow(0 0 2px #a21caf88);
									       }
									       .group:active .icon-db {
										       stroke: #6d28d9 !important;
									       }
								       `}</style>
							       </button>
						       </>
					       )}
					       <span className="h-8 w-px bg-gray-300 mx-2 self-center" />
					       {/* Botón flecha para mostrar/ocultar filtros avanzados */}
						   <button
							   className={`p-0 m-0 bg-transparent border-none outline-none flex items-center transition-colors duration-200 group`}
							   title={mostrarFiltros ? 'Ocultar filtros avanzados' : 'Mostrar filtros avanzados'}
							   onClick={() => setMostrarFiltros(f => !f)}
							   style={{ boxShadow: 'none', borderRadius: 0, minWidth: 32 }}
						   >
						       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-all duration-200" viewBox="0 0 32 32" fill="none" stroke="#002c50" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
							       <defs>
								       <linearGradient id="arrow-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
									       <stop stopColor="#2563eb" />
									       <stop offset="1" stopColor="#38bdf8" />
								       </linearGradient>
							       </defs>
							       {mostrarFiltros ? (
								       <path className="icon-arrow" d="M11 8L21 16L11 24" />
							       ) : (
								       <path className="icon-arrow" d="M21 8L11 16L21 24" />
							       )}
						       </svg>
						       <style>{`
							       .group:hover .icon-arrow {
								       stroke: #2563eb !important;
								       filter: drop-shadow(0 0 2px #2563eb88);
							       }
							       .group:active .icon-arrow {
								       stroke: #1d4ed8 !important;
							       }
						       `}</style>
					       </button>
					       {/* Botón actualizar rápido */}
				   <button
					   className={`p-0 m-0 bg-transparent border-none outline-none flex items-center transition-colors duration-200 ${loadingUltimosDias ? 'animate-spin' : ''} group`}
					   title="Actualizar mes en curso"
					   onClick={handleActualizarUltimoMes}
					   disabled={loadingUltimosDias}
					   style={{ boxShadow: 'none', borderRadius: '50%' }}
				   >
						       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-all duration-200" viewBox="0 0 32 32" fill="none" stroke="#002c50" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
							       <defs>
								       <linearGradient id="icon-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
									       <stop stopColor="#2563eb" />
									       <stop offset="1" stopColor="#38bdf8" />
								       </linearGradient>
							       </defs>
							       <path className="icon-curve" d="M27 16a11 11 0 1 1-6.5-10.1" />
							       <path className="icon-arrow" d="M25.5 6v5h-5" />
							       <circle cx="16" cy="16" r="15" stroke="transparent" />
						       </svg>
						       <style>{`
							       .group:hover .icon-curve, .group:hover .icon-arrow {
								       stroke: #2563eb !important;
								       filter: drop-shadow(0 0 2px #2563eb88);
							       }
							       .group:active .icon-curve, .group:active .icon-arrow {
								       stroke: #1d4ed8 !important;
							       }
						       `}</style>
					       </button>
					       {/* Botones de Reportes y Análisis */}
					       <button
						       className="relative p-0 m-0 bg-transparent border-none outline-none flex items-center group ml-2"
						       title="Reportes"
						       style={{ boxShadow: 'none', borderRadius: '50%' }}
						       onClick={e => { e.stopPropagation(); setMenuReportesOpen(v => !v); }}
						       onBlur={() => setTimeout(() => setMenuReportesOpen(false), 150)}
					       >
						       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transition-all duration-200 icon-reportes" viewBox="0 0 28 28" fill="none" stroke="#002c50" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
							       <rect x="6.5" y="5.5" width="15" height="17" rx="2.2" />
							       <line x1="9" y1="13" x2="19" y2="13" />
							       <line x1="9" y1="16" x2="17" y2="16" />
							       <line x1="9" y1="19" x2="15" y2="19" />
						       </svg>
						       <style>{`
							       .group:hover .icon-reportes { stroke: #22c55e !important; filter: drop-shadow(0 0 2px #22c55e88); }
							       .group:active .icon-reportes { stroke: #16a34a !important; }
						       `}</style>
						       {menuReportesOpen && (
							       <div className="absolute z-50 top-8 -left-24 bg-white border border-gray-200 rounded shadow-md min-w-[180px] text-xs animate-fade-in">
									<div role="button" tabIndex={0} className="w-full text-left px-4 py-2 hover:bg-green-100 cursor-pointer" onClick={e => {e.preventDefault(); descargarArchivoEstatico('Archivo_plano_anulaciones.xlsx', 'Archivo_plano_anulaciones.xlsx');}} onKeyDown={e => {if(e.key==='Enter'){descargarArchivoEstatico('Archivo_plano_anulaciones.xlsx', 'Archivo_plano_anulaciones.xlsx');}}}>Descargar archivo Plano</div>
									<div role="button" tabIndex={0} className="w-full text-left px-4 py-2 hover:bg-green-100 cursor-pointer" onClick={e => {e.preventDefault(); descargarReporte('rips');}} onKeyDown={e => {if(e.key==='Enter'){descargarReporte('rips');}}}>Cargar archivo Plano</div>
									<div role="button" tabIndex={0} className="w-full text-left px-4 py-2 hover:bg-green-100 cursor-pointer" onClick={e => {e.preventDefault(); descargarReporte('general');}} onKeyDown={e => {if(e.key==='Enter'){descargarReporte('general');}}}>Descargar reporte Anulaciones</div>
									<div role="button" tabIndex={0} className="w-full text-left px-4 py-2 hover:bg-green-100 cursor-pointer" onClick={e => {e.preventDefault(); descargarReporte('sin_estado');}} onKeyDown={e => {if(e.key==='Enter'){descargarReporte('sin_estado');}}}>Descargar reporte Pendientes</div>
							       </div>
						       )}
					       </button>
	                       <button
						       className="p-0 m-0 bg-transparent border-none outline-none flex items-center group ml-2"
						       title="Análisis"
						       style={{ boxShadow: 'none', borderRadius: '50%' }}
			       onClick={() => { console.log('[ANULACIONES] click abrir analisis'); setShowAnalisis(true); }}
					       >
						       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-all duration-200 icon-analisis" viewBox="0 0 24 24" fill="none" stroke="#002c50" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
							       <rect x="3.5" y="15" width="3.5" height="5.5" rx="1" />
							       <rect x="9.25" y="10" width="3.5" height="10.5" rx="1" />
							       <rect x="15" y="5" width="3.5" height="15.5" rx="1" />
						       </svg>
						       <style>{`
							       .group:hover .icon-analisis { stroke: #eab308 !important; filter: drop-shadow(0 0 2px #eab30888); }
							       .group:active .icon-analisis { stroke: #ca8a04 !important; }
						       `}</style>
					       </button>
				       </div>
			       </div>
		       </div>
			<hr className="border-t mt-4 mb-2 w-full" style={{ borderColor: '#002c50' }} />
			{/* Tarjetas informativas */}
			<div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">
				<div className="relative bg-white rounded-2xl shadow-md flex-1 px-6 py-6 flex flex-col items-center justify-center min-h-[90px]">
					<span className="text-2xl font-bold mb-2 mt-2" style={{ color: '#3f0b0a' }}>{cantidadAnulaciones}</span>
					<span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Anulaciones</span>
				</div>
				<div className="relative bg-white rounded-2xl shadow-md flex-1 px-6 py-6 flex flex-col items-center justify-center min-h-[90px]">
					<span className="text-2xl font-bold mb-2 mt-2" style={{ color: '#3f0b0a' }}>{formatearValor(totalAnuladoFiltrado)}</span>
					<span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Total Anulado</span>
				</div>
				<div className="relative bg-white rounded-2xl shadow-md flex-1 px-6 py-6 flex flex-col items-center justify-center min-h-[90px]">
					<span className="text-2xl font-bold mb-2 mt-2" style={{ color: '#2b2e0b' }}>{cantidadNotasCredito}</span>
					<span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Notas Crédito</span>
				</div>
				<div className="relative bg-white rounded-2xl shadow-md flex-1 px-6 py-6 flex flex-col items-center justify-center min-h-[90px]">
					<span className="text-2xl font-bold mb-2 mt-2" style={{ color: '#2b2e0b' }}>{formatearValor(totalNotaCreditoFiltrado)}</span>
					<span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Total Nota Crédito</span>
				</div>
				<div className="relative bg-white rounded-2xl shadow-md flex-1 px-6 py-6 flex flex-col items-center justify-center min-h-[90px]">
					<span className="text-lg font-bold text-gray-900 mb-2 mt-2">{ultimaActualizacion}</span>
					<span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Última actualización</span>
				</div>
			</div>
			{/* Menú de filtros */}
			<div className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-6 w-full">
				<input className="border px-2 py-1 w-full text-xs" placeholder="Factura, Documento o Paciente" value={filtroBusqueda} onChange={e => setFiltroBusqueda(e.target.value)} />
				<input className="border px-2 py-1 w-full text-xs" type="date" value={fechaFiltroInicial} max={fechaFiltroFinal} onChange={e => setFechaFiltroInicial(e.target.value)} />
				<input className="border px-2 py-1 w-full text-xs" type="date" value={fechaFiltroFinal} min={fechaFiltroInicial} onChange={e => setFechaFiltroFinal(e.target.value)} />
				<select className="border px-2 py-1 w-full text-xs" value={sedeFiltro} onChange={e => setSedeFiltro(e.target.value)}>
					<option value="">Todas las sedes</option>
					{availableSedes.map(s => (<option key={s} value={s}>{s}</option>))}
				</select>
				<select className="border px-2 py-1 w-full text-xs" value={aseguradoraFiltro} onChange={e => setAseguradoraFiltro(e.target.value)}>
					<option value="">Todas las aseguradoras</option>
					{availableAseguradoras.map(a => (<option key={a} value={a}>{a}</option>))}
				</select>
				<select className="border px-2 py-1 w-full text-xs" value={tipoRegistroFiltro} onChange={e => setTipoRegistroFiltro(e.target.value)}>
					<option value="Todos">Todos los registros</option>
					<option value="Anulación">Solo Anulaciones</option>
					<option value="Nota Crédito">Solo Notas Crédito</option>
				</select>
			</div>
			{/* Tabla principal */}
			<div className="border-0 rounded-none bg-white shadow overflow-x-auto p-0 m-0 w-full">
				<table className="min-w-full text-[10px] md:text-xs table-fixed">
					<thead>
						<tr style={{ backgroundColor: '#002c50' }}>
							 <th className="px-0.5 py-2 text-center text-white whitespace-nowrap w-20">Registro</th>
							 <th className="px-0.5 py-2 text-center text-white whitespace-nowrap w-20">Factura</th>
							 <th className="px-0.5 py-2 text-center text-white whitespace-nowrap w-16">F. Anulación</th>
							 <th className="px-0.5 py-2 text-center text-white whitespace-nowrap w-12">Tipo</th>
							<th className="px-0.5 py-2 text-center text-white whitespace-nowrap w-16">Documento</th>
							<th className="px-0.5 py-2 text-center text-white whitespace-nowrap w-28">Sede</th>
							<th className="px-0.5 py-2 text-center text-white whitespace-nowrap w-28">Aseguradora</th>
							<th className="px-0.5 py-2 text-center text-white whitespace-nowrap w-20">Valor</th>
							<th className="px-0.5 py-2 text-center text-white whitespace-nowrap w-20">Factura (R)</th>
							<th className="px-0.5 py-2 text-center text-white whitespace-nowrap w-16">Fecha (R)</th>
							<th className="px-0.5 py-2 text-center text-white whitespace-nowrap w-20">Valor (R)</th>
							<th className="px-1 py-2 text-center text-white whitespace-nowrap">Motivo Anulación</th>
							<th className="px-1 py-2 text-center text-white whitespace-nowrap">Estado</th>
							<th className="px-1 py-2 text-center text-white whitespace-nowrap w-8" title="Bloqueo/Desbloqueo de fila">
								<svg className="w-3 h-3 mx-auto" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
								</svg>
							</th>
						</tr>
					</thead>
					<tbody>
						{anulacionesFiltradas.length === 0 ? (
							<tr><td colSpan={6} className="text-center py-4">Sin registros</td></tr>
						) : (
							anulacionesFiltradas
								.slice((paginaActual-1)*registrosPorPagina, paginaActual*registrosPorPagina)
								.map(a => (
									<tr key={a.id} className={`border-b hover:bg-blue-50 ${estaFilaBloqueada(a.id || 0) ? 'bg-red-50 opacity-75' : ''}`}>
										 <td className="px-0.5 py-1 text-center whitespace-nowrap overflow-hidden text-ellipsis w-20" style={{ color: '#000000' }}>{(a.tipoRegistro || '').toUpperCase()}</td>
										 <td className="px-0.5 py-1 text-center whitespace-nowrap overflow-hidden text-ellipsis w-20" style={{ backgroundColor: 'transparent' }}>{a.numeroAnulacion || ''}</td>
										<td className="px-0.5 py-1 text-center whitespace-nowrap overflow-hidden text-ellipsis w-16">{formatDateShort(a.fechaNotaCredito)}</td>
										 <td className="px-0.5 py-1 text-center whitespace-nowrap overflow-hidden text-ellipsis w-12">{a.tipoDocumento || ''}</td>
										<td className="px-0.5 py-1 text-center whitespace-nowrap overflow-hidden text-ellipsis w-16">{a.documento || ''}</td>
										<td className="px-0.5 py-1 text-center whitespace-nowrap overflow-hidden text-ellipsis w-28">{a.sede?.nombre || ''}</td>
										<td className="px-0.5 py-1 text-center whitespace-nowrap overflow-hidden text-ellipsis w-28">{getAseguradoraDisplay(a)}</td>
										<td className="px-0.5 py-1 text-center whitespace-nowrap overflow-hidden text-ellipsis w-20">{formatearValor(Number(a.totalAnulado))}</td>
										<td className="px-0.5 py-1 text-center whitespace-nowrap overflow-hidden text-ellipsis w-20">{a.facturaRemplazo || ''}</td>
										<td className="px-0.5 py-1 text-center whitespace-nowrap overflow-hidden text-ellipsis w-16">{procesarFechaRemplazo(a.fechaRemplazo)}</td>
										<td className="px-0.5 py-1 text-center whitespace-nowrap overflow-hidden text-ellipsis w-20">{formatearValorContabilidad(procesarValorRemplazo(a.valorRemplazo))}</td>
										<td className="px-1 py-1 text-center whitespace-nowrap overflow-hidden text-ellipsis">{a.motivo || ''}</td>
										<td className="px-1 py-1 text-center whitespace-nowrap overflow-hidden text-ellipsis">{a.estado || ''}</td>
										<td className="px-1 py-1 text-center">
											{tieneInformacionPlano(a) ? (
												<button
													onClick={() => a.id && toggleBloqueoFila(a.id)}
													className={`p-0.5 rounded hover:bg-gray-200 transition-colors ${estaFilaBloqueada(a.id || 0) ? 'text-red-600' : 'text-green-600'}`}
													title={estaFilaBloqueada(a.id || 0) ? 'Fila bloqueada - Click para desbloquear' : 'Fila desbloqueada - Click para bloquear'}
												>
													{estaFilaBloqueada(a.id || 0) ? (
														<svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
															<path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
														</svg>
													) : (
														<svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
															<path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
														</svg>
													)}
												</button>
											) : (
												<span className="text-gray-400 text-xs">-</span>
											)}
										</td>
									</tr>
								))
						)}
					</tbody>
				</table>
								{/* Paginación (alineada con Facturación) */}
								{/** Usamos un flag `loading` que combina los posibles estados de carga **/}
								<div className="mt-2">
									{
										(() => {
											const totalRegistros = anulacionesFiltradas.length;
											const totalPaginas = Math.max(1, Math.ceil(totalRegistros / registrosPorPagina));
											const loading = !!(loadingCargar || loadingUltimosDias || loadingPlano);
											return (
												<div className="flex justify-between items-center mt-4 bg-gray-50 p-3 rounded">
													<div className="flex items-center gap-2">
														<button
															className="px-3 py-1 text-white rounded disabled:opacity-50 disabled:bg-gray-300"
															style={{ backgroundColor: loading || paginaActual === 1 ? undefined : '#002c50' }}
															onClick={() => setPaginaActual(1)}
															disabled={loading || paginaActual === 1}
														>
															Primera
														</button>
														<button
															className="px-3 py-1 text-white rounded disabled:opacity-50 disabled:bg-gray-300"
															style={{ backgroundColor: loading || paginaActual === 1 ? undefined : '#002c50' }}
															onClick={() => setPaginaActual(p => Math.max(1, p-1))}
															disabled={loading || paginaActual === 1}
														>
															Anterior
														</button>
													</div>

													<div className="text-center">
														<div className="text-sm text-gray-600">
															Página <strong>{paginaActual}</strong> de <strong>{totalPaginas}</strong>
														</div>
														<div className="text-xs text-gray-500">
															{totalRegistros.toLocaleString()} registros total • Mostrando {registrosPorPagina} por página
														</div>
													</div>

													<div className="flex items-center gap-2">
														<button
															className="px-3 py-1 text-white rounded disabled:opacity-50 disabled:bg-gray-300"
															style={{ backgroundColor: loading || paginaActual === totalPaginas ? undefined : '#002c50' }}
															onClick={() => setPaginaActual(p => Math.min(totalPaginas, p+1))}
															disabled={loading || paginaActual === totalPaginas}
														>
															Siguiente
														</button>
														<button
															className="px-3 py-1 text-white rounded disabled:opacity-50 disabled:bg-gray-300"
															style={{ backgroundColor: loading || paginaActual === totalPaginas ? undefined : '#002c50' }}
															onClick={() => setPaginaActual(totalPaginas)}
															disabled={loading || paginaActual === totalPaginas}
														>
															Última
														</button>
													</div>
												</div>
											);
										})()
									}
								</div>
			</div>
			{/* Mensajes de estado */}
			{showOpu && mensaje && (
				<OpuMessage message={mensaje} type={mensaje.toLowerCase().includes('error') ? 'error' : 'info'} duration={3000} onClose={() => setShowOpu(false)} />
			)}
			{showOpuSuccess && (
				<OpuMessage message="Carga exitosa, los datos han sido almacenados correctamente" type="success" duration={3000} onClose={() => setShowOpuSuccess(false)} />
			)}
		</section>
	);
}
