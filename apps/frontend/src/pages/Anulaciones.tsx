import * as XLSX from 'xlsx';
import { exportAnulacionesExcel, exportAnulacionesSinEstado } from '../utils/exportAnulacionesExcel';
import API_CONFIG from '../config/api';
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
const procesarFechaRemplazo = (fechaRemplazo?: string): string => {
	if (!fechaRemplazo) return '';
	
	const fechas = fechaRemplazo.split(',').map(f => f.trim()).filter(f => f);
	if (fechas.length === 0) return '';
	
	// Si todas las fechas son iguales, devolver solo una
	const fechasUnicas = [...new Set(fechas)];
	return fechasUnicas.length === 1 ? fechasUnicas[0] : fechas[0];
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
		 fetch(`${API_CONFIG.BASE_URL}/facturacion/eventos`)
			 .then(res => res.json())
			 .then(data => {
				 console.log('[DEBUG][FacturasEvento] Respuesta del backend:', data);
				 if (Array.isArray(data.eventos)) {
					 const facturas = data.eventos.map((ev: any) => String(ev.numeroFactura).trim());
					 console.log('[DEBUG][FacturasEvento] Array de facturas extraído:', facturas);
					 setFacturasEvento(facturas);
					 setEventosFull(data.eventos);
				 } else {
					 setFacturasEvento([]);
					 setEventosFull([]);
				 }
			 })
			 .catch(() => { setFacturasEvento([]); setEventosFull([]); });
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
				// Buscar por Factura, Documento o Paciente
				const coincideTexto = !filtro
					|| (a.factura && a.factura.toLowerCase().includes(filtro))
					|| (a.numeroAnulacion && a.numeroAnulacion.toLowerCase().includes(filtro))
					|| (a.documento && a.documento.toLowerCase().includes(filtro))
					|| (a.paciente && a.paciente.toLowerCase().includes(filtro));
				// Filtrar por fechaNotaCredito en vez de fecha
				const fechaFiltro = a.fechaNotaCredito || '';
				const enRango = (!fechaFiltroInicial || fechaFiltro >= fechaFiltroInicial) && (!fechaFiltroFinal || fechaFiltro <= fechaFiltroFinal);
				const coincideSede = !sedeFiltro || (a.sede && a.sede.nombre === sedeFiltro);
				const coincideAseg = !aseguradoraFiltro || (a.aseguradora === aseguradoraFiltro);
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
		const coincideSede = !sedeFiltro || (a.sede && a.sede.nombre === sedeFiltro);
		const coincideAseg = !aseguradoraFiltro || (a.aseguradora === aseguradoraFiltro);
		return enRango && coincideSede && coincideAseg;
	});
	
	const cantidadAnulaciones = anulacionesParaTarjetas.filter(a => a.tipoRegistro === 'Anulación' || !a.tipoRegistro).length;
	const cantidadNotasCredito = anulacionesParaTarjetas.filter(a => a.tipoRegistro === 'Nota Crédito').length;
	const totalAnuladoFiltrado = anulacionesParaTarjetas.filter(a => a.tipoRegistro === 'Anulación' || !a.tipoRegistro).reduce((acc: number, a: Anulacion) => acc + (Number(a.totalAnulado) || 0), 0);
	const totalNotaCreditoFiltrado = anulacionesParaTarjetas.filter(a => a.tipoRegistro === 'Nota Crédito').reduce((acc: number, a: Anulacion) => acc + (Number(a.totalAnulado) || 0), 0);
	
	// Tarjetas informativas (según filtros activos EN LA TABLA - solo para mostrar info de tabla filtrada)
	const totalAnulaciones = anulacionesFiltradas.length;

	// Estado y lógica para modal de carga/validación de archivo plano
	const [showCargaPlano, setShowCargaPlano] = useState(false);
	const [archivoPlano, setArchivoPlano] = useState<File|null>(null);
	const [datosPlano, setDatosPlano] = useState<any[]>([]);
	const [loadingPlano, setLoadingPlano] = useState(false);
	const [mensajePlano, setMensajePlano] = useState<string|null>(null);
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
       // Estado para menú de reportes y análisis
       const [menuReportesOpen, setMenuReportesOpen] = useState(false);
       const [showAnalisis, setShowAnalisis] = useState(false);

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
			       setMensaje(`Carga exitosa: ${data.insertados} nuevas anulaciones, ${data.yaExistentes} ya existentes, ${data.ignoradosSede} ignoradas por sede.`);
				   // Recargar anulaciones y guardar fecha/hora de actualización
				   fetch(`${API_CONFIG.BASE_URL}/anulaciones`)
					   .then(res => res.json())
					   .then(data => {
						   console.log('[ANULACIONES] Recarga anulaciones:', data);
						   setAnulaciones(Array.isArray(data.anulaciones) ? data.anulaciones : []);
						   const fechaAct = new Date().toISOString();
						   setUltimaActualizacionFull(fechaAct);
						   localStorage.setItem('ultimaActualizacionAnulaciones', fechaAct);
					   })
					   .catch(err => {
						   console.error('[ANULACIONES] Error recargando anulaciones', err);
						   setAnulaciones([]);
						   setUltimaActualizacionFull('');
					   });
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
			   setMensaje(`Carga exitosa: ${data.insertados} nuevas anulaciones, ${data.yaExistentes} ya existentes, ${data.ignoradosSede} ignoradas por sede.`);
			   // Recargar anulaciones y guardar fecha/hora de actualización
			   fetch(`${API_CONFIG.BASE_URL}/anulaciones`)
				   .then(res => res.json())
				   .then(data => {
					   setAnulaciones(Array.isArray(data.anulaciones) ? data.anulaciones : []);
					   const fechaAct = new Date().toISOString();
					   setUltimaActualizacionFull(fechaAct);
					   localStorage.setItem('ultimaActualizacionAnulaciones', fechaAct);
				   })
				   .catch(() => {
					   setAnulaciones([]);
					   setUltimaActualizacionFull('');
				   });
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
					 const res = await fetch('/api/anulaciones/cargar-plano', {
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
						 fetch('/api/anulaciones')
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
					
					// Asegurar que el header tenga al menos las columnas básicas
					if (datosPlanoModificados[0] && datosPlanoModificados[0].length < 4) {
						const headersBasicos = ['Col1', 'Col2', 'Fecha', 'Valor', 'Motivo', 'Estado'];
						while (datosPlanoModificados[0].length < 6) {
							const index = datosPlanoModificados[0].length;
							datosPlanoModificados[0].push(headersBasicos[index] || `Col${index + 1}`);
						}
					}
					
					const resultados = datosPlano.slice(1).map((fila: any, idx: number) => {
						const valorCol1 = Array.isArray(fila) ? fila[0] : Object.values(fila)[0];
						let valorCol2 = Array.isArray(fila) ? fila[1] : Object.values(fila)[1];
						const valorCol3 = Array.isArray(fila) ? fila[2] : Object.values(fila)[2]; // motivo
						const valorCol4 = Array.isArray(fila) ? fila[3] : Object.values(fila)[3]; // estado
						
						// Las fechas y valores se auto-completan internamente para validación
						let fechasAutoCompletadas = [];
						let valoresAutoCompletados = [];

						// Verificar si es una factura múltiple (contiene '/' o ',' como separadores)
						const facturasCol1 = String(valorCol1 || '').includes('/') ? 
							String(valorCol1).split('/').map(f => f.trim()) : 
							String(valorCol1 || '').includes(',') ?
							String(valorCol1).split(',').map(f => f.trim()) :
							[String(valorCol1 || '').trim()];

						// AUTO-COMPLETADO: Siempre buscar fechas y valores para las facturas de col2
						let facturasCol2: string[] = [];
						let autoCompletado = false;
						
						if (String(valorCol2 || '').trim()) {
							// Hay datos en col2, parsear facturas
							facturasCol2 = String(valorCol2 || '').includes('/') ? 
								String(valorCol2).split('/').map(f => f.trim()) : 
								String(valorCol2 || '').includes(',') ?
								String(valorCol2).split(',').map(f => f.trim()) :
								[String(valorCol2 || '').trim()];
							
							// AUTO-COMPLETADO: Siempre buscar fechas y valores para validación interna
							for (const facturaCol2 of facturasCol2) {
								const eventoEncontrado = eventosFull.find(ev => 
									String(ev.numeroFactura).trim() === facturaCol2
								);
								
								if (eventoEncontrado) {
									fechasAutoCompletadas.push(String(eventoEncontrado.fecha).trim());
									let valor = String(eventoEncontrado.valor);
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
						const facturasCol1Validas = [];
						const facturasCol1Invalidas = [];

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
						const facturasCol2Validas = [];
						const facturasCol2Invalidas = [];
						const eventosEncontrados = [];

						// Mantener el orden exacto de facturasCol2
						for (let i = 0; i < facturasCol2.length; i++) {
							const factura = facturasCol2[i];
							const eventoFactura = eventosFull.find(ev => String(ev.numeroFactura).trim() === factura);
							if (eventoFactura) {
								facturasCol2Validas.push(factura);
								eventosEncontrados.push(eventoFactura);
								existeCol2 = true;
							} else {
								facturasCol2Invalidas.push(factura);
								// Agregar null para mantener posición en eventosEncontrados
								eventosEncontrados.push(null);
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

										const fechaEvento = eventoFactura.fecha ? String(eventoFactura.fecha).trim() : '';
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
								const fechaEvento = eventoFactura.fecha ? String(eventoFactura.fecha).trim() : '';
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

						return {
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
						};
					});
					setResultadosValidacionPlano(resultados);
					
					// Actualizar datosPlano con los valores auto-completados
					setDatosPlano(datosPlanoModificados);
				} catch (e) {
					setMensajePlano('Error en la validación.');
					setResultadosValidacionPlano([]);
				}
				setLoadingPlano(false);
};

			 // Modal de carga y validación de archivo plano
			 const renderModalCargaPlano = () => (
				 showCargaPlano && (
					 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-2">
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
							 {loadingPlano && <div className="text-center text-sm text-gray-500 mb-2">Procesando archivo...</div>}
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
						       className={`p-0 m-0 bg-transparent border-none outline-none flex items-center transition-colors duration-200 ${loadingUltimosDias ? 'animate-spin' : ''} group`}
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
									<a className="w-full text-left px-4 py-2 hover:bg-green-100 block" href="/Archivo_plano_anulaciones.xlsx" download>Descargar archivo Plano</a>
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
						       onClick={() => setShowAnalisis(true)}
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
					{sedes.map(s => (<option key={s.id} value={s.nombre}>{s.nombre}</option>))}
				</select>
				<select className="border px-2 py-1 w-full text-xs" value={aseguradoraFiltro} onChange={e => setAseguradoraFiltro(e.target.value)}>
					<option value="">Todas las aseguradoras</option>
					{aseguradoras.map(a => (<option key={a.nombre} value={a.nombre}>{a.nombre}</option>))}
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
										 <td className="px-0.5 py-1 text-center whitespace-nowrap overflow-hidden text-ellipsis w-16">{a.fechaNotaCredito || ''}</td>
										 <td className="px-0.5 py-1 text-center whitespace-nowrap overflow-hidden text-ellipsis w-12">{a.tipoDocumento || ''}</td>
										<td className="px-0.5 py-1 text-center whitespace-nowrap overflow-hidden text-ellipsis w-16">{a.documento || ''}</td>
										<td className="px-0.5 py-1 text-center whitespace-nowrap overflow-hidden text-ellipsis w-28">{a.sede?.nombre || ''}</td>
										<td className="px-0.5 py-1 text-center whitespace-nowrap overflow-hidden text-ellipsis w-28">{
											(() => {
												if (!a.aseguradora) return '';
												const normalizar = (str: string) => (str || '').replace(/\s+/g, '').toLowerCase();
												const aseg = aseguradoras.find(x =>
													normalizar(x.nombrePergamo) === normalizar(a.aseguradora || '') ||
													normalizar(x.nombre) === normalizar(a.aseguradora || '')
												);
												return aseg ? aseg.nombre : (a.aseguradora || '');
											})()
										}</td>
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
				{/* Paginación */}
				<div className="flex justify-between items-center mt-2">
					<button className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50" onClick={() => setPaginaActual(p => Math.max(1, p-1))} disabled={paginaActual === 1}>Anterior</button>
					<span className="text-xs">Página {paginaActual} de {Math.ceil(anulacionesFiltradas.length/registrosPorPagina)}</span>
					<button className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50" onClick={() => setPaginaActual(p => Math.min(Math.ceil(anulacionesFiltradas.length/registrosPorPagina), p+1))} disabled={paginaActual === Math.ceil(anulacionesFiltradas.length/registrosPorPagina)}>Siguiente</button>
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
