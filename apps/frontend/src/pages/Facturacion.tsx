// Declaración para evitar error de typings con window.aseguradorasPergamo
declare global {
  interface Window {
    aseguradorasPergamo?: Record<string, string>;
  }
}
import { exportInformeGeneralExcel } from '../utils/exportInformeGeneralExcel';
// --- Componente ComparativaTabla ---
type ComparativaTablaProps = {
  eventos: any[];
};

const ComparativaTabla: React.FC<ComparativaTablaProps> = React.memo(({ eventos }) => {
  // Filtros de fecha independientes para cada ítem a comparar
  const [mes1, setMes1] = React.useState('');
  const [mes2, setMes2] = React.useState('');
  const [dia1Inicio, setDia1Inicio] = React.useState('');
  const [dia1Fin, setDia1Fin] = React.useState('');
  const [dia2Inicio, setDia2Inicio] = React.useState('');
  const [dia2Fin, setDia2Fin] = React.useState('');

  // Memoizar meses disponibles
  const mesesDisponibles = React.useMemo(() => 
    Array.from(new Set(eventos.map(ev => (ev.fecha || '').slice(0, 7)).filter(Boolean))),
    [eventos]
  );

  // Cuando cambia el mes, resetear los días seleccionados
  React.useEffect(() => {
    setDia1Inicio('');
    setDia1Fin('');
  }, [mes1]);
  React.useEffect(() => {
    setDia2Inicio('');
    setDia2Fin('');
  }, [mes2]);

  // Función para filtrar eventos por rango de fechas
  function filtrarPorMesYDias(eventos: any[], mes: string, diaInicio: string, diaFin: string) {
    if (!mes || !diaInicio || !diaFin) return [];
    const desde = `${mes}-${diaInicio.padStart(2, '0')}`;
    const hasta = `${mes}-${diaFin.padStart(2, '0')}`;
    return eventos.filter(ev => {
      const fecha = ev.fecha || '';
      return fecha >= desde && fecha <= hasta;
    });
  }

  // Obtener totales por sede y aseguradora para cada filtro
    function obtenerTotalesPorSede(eventos: any[]) {
      const resultado: Record<string, number> = {};
      eventos.forEach(ev => {
        if (ev.periodo === 'ANULADA') return; // Ignorar facturas anuladas
        const sede = ev.sede?.nombre || 'Sin sede';
        // Si es nota crédito, restar el valor
        if (ev.tipoRegistro === 'Nota Crédito') {
          resultado[sede] = (resultado[sede] || 0) - (Number(ev.total) || 0);
        } else {
          resultado[sede] = (resultado[sede] || 0) + (Number(ev.total) || 0);
        }
      });
      return resultado;
    }

  // Memoizar cálculos pesados de totales
  const totales1 = React.useMemo(() => 
    obtenerTotalesPorSede(filtrarPorMesYDias(eventos, mes1, dia1Inicio, dia1Fin)),
    [eventos, mes1, dia1Inicio, dia1Fin]
  );
  
  const totales2 = React.useMemo(() => 
    obtenerTotalesPorSede(filtrarPorMesYDias(eventos, mes2, dia2Inicio, dia2Fin)),
    [eventos, mes2, dia2Inicio, dia2Fin]
  );

  // Memoizar generación de filas
  const { filas, totalesGenerales } = React.useMemo(() => {
    // Unir todas las sedes presentes
    const sedes = Array.from(new Set([...Object.keys(totales1), ...Object.keys(totales2)]));

    // Generar filas comparativas solo por sede
    const filasCalculadas = sedes.map(sede => {
      const total1 = totales1[sede] || 0;
      const total2 = totales2[sede] || 0;
      return {
        sede,
        total1,
        total2,
        diferencia: total1 - total2
      };
    });

    // Totales generales para la fila final
    const totalFacturado1 = filasCalculadas.reduce((acc, f) => acc + f.total1, 0);
    const totalFacturado2 = filasCalculadas.reduce((acc, f) => acc + f.total2, 0);
    const totalDiferencia = filasCalculadas.reduce((acc, f) => acc + f.diferencia, 0);
    
    return {
      filas: filasCalculadas,
      totalesGenerales: { totalFacturado1, totalFacturado2, totalDiferencia }
    };
  }, [totales1, totales2]);

  // Función para mostrar el mes en formato bonito (ej: 2025-08 => Agosto)
  function mesBonito(mes: string) {
    if (!mes) return '';
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const [anio, mesNum] = mes.split('-');
    const idx = parseInt(mesNum, 10) - 1;
    return meses[idx] || mes;
  }

  return (
    <div className="w-full">
      <div className="flex flex-row items-end justify-center mb-4 w-full max-w-2xl mx-auto gap-0">
        {/* Primer bloque de filtros */}
        <div className="flex flex-col flex-1 items-center px-6">
          <div className="flex flex-row justify-center w-full">
            <label className="text-xs font-semibold mb-2 w-full text-center">Primer rango</label>
          </div>
          <div className="flex flex-row items-end gap-3 w-full justify-center">
            <select
              className="border rounded px-2 py-1 text-sm w-28"
              value={mes1}
              onChange={e => setMes1(e.target.value)}
            >
              <option value="">Mes</option>
              {mesesDisponibles.map(mes => (
                <option key={mes} value={mes}>{mes}</option>
              ))}
            </select>
            <input
              className="border rounded px-2 py-1 text-sm w-28"
              type="number"
              min={1}
              max={31}
              placeholder="Día ini"
              value={dia1Inicio}
              onChange={e => setDia1Inicio(e.target.value.replace(/[^0-9]/g, '').slice(0,2))}
              disabled={!mes1}
            />
            <input
              className="border rounded px-2 py-1 text-sm w-28"
              type="number"
              min={1}
              max={31}
              placeholder="Día fin"
              value={dia1Fin}
              onChange={e => setDia1Fin(e.target.value.replace(/[^0-9]/g, '').slice(0,2))}
              disabled={!mes1}
            />
          </div>
        </div>
        {/* Separador visual vertical */}
        <div className="h-14 border-l border-gray-300 mx-6 self-center" />
        {/* Segundo bloque de filtros */}
        <div className="flex flex-col flex-1 items-center px-6">
          <div className="flex flex-row justify-center w-full">
            <label className="text-xs font-semibold mb-2 w-full text-center">Segundo rango</label>
          </div>
          <div className="flex flex-row items-end gap-3 w-full justify-center">
            <select
              className="border rounded px-2 py-1 text-sm w-28"
              value={mes2}
              onChange={e => setMes2(e.target.value)}
            >
              <option value="">Mes</option>
              {mesesDisponibles.map(mes => (
                <option key={mes} value={mes}>{mes}</option>
              ))}
            </select>
            <input
              className="border rounded px-2 py-1 text-sm w-28"
              type="number"
              min={1}
              max={31}
              placeholder="Día ini"
              value={dia2Inicio}
              onChange={e => setDia2Inicio(e.target.value.replace(/[^0-9]/g, '').slice(0,2))}
              disabled={!mes2}
            />
            <input
              className="border rounded px-2 py-1 text-sm w-28"
              type="number"
              min={1}
              max={31}
              placeholder="Día fin"
              value={dia2Fin}
              onChange={e => setDia2Fin(e.target.value.replace(/[^0-9]/g, '').slice(0,2))}
              disabled={!mes2}
            />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl px-2 py-1">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm mt-2 table-fixed">
            <thead>
              <tr className="border-b bg-gray-100">
                <th className="px-2 py-1 font-semibold text-left w-1/4" style={{ color: '#002c50' }}>Sede</th>
                <th className="px-2 py-1 font-semibold text-left w-1/4" style={{ color: '#002c50' }}>Facturado {mesBonito(mes1)}</th>
                <th className="px-2 py-1 font-semibold text-left w-1/4" style={{ color: '#002c50' }}>Facturado {mesBonito(mes2)}</th>
                <th className="px-2 py-1 font-semibold text-left w-1/4" style={{ color: '#002c50' }}>Diferencia</th>
              </tr>
            </thead>
            <tbody>
              {filas.map(({ sede, total1, total2, diferencia }) => (
                <tr key={sede} className="border-b hover:bg-gray-50 transition">
                  <td className="px-2 py-1 whitespace-nowrap text-left w-1/4 truncate" style={{ color: '#002c50' }}>{sede}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-left w-1/4">{total1.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-left w-1/4">{total2.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                  <td className={`px-2 py-1 whitespace-nowrap text-left font-bold w-1/4 ${diferencia >= 0 ? 'text-green-600' : 'text-red-600'}`}>{diferencia >= 0 ? '+' : ''}{diferencia.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                </tr>
              ))}
              {filas.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-4">No hay datos para comparar</td>
                </tr>
              )}
              {/* Fila de totales */}
              {filas.length > 0 && (
                <tr className="border-t bg-gray-100 font-bold">
                  <td className="px-2 py-1 whitespace-nowrap text-left w-1/4" style={{ color: '#002c50' }}>Total Facturado</td>
                  <td className="px-2 py-1 whitespace-nowrap text-left w-1/4" style={{ color: '#002c50' }}>{totalesGenerales.totalFacturado1.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-left w-1/4" style={{ color: '#002c50' }}>{totalesGenerales.totalFacturado2.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                  <td className={`px-2 py-1 whitespace-nowrap text-left w-1/4 ${totalesGenerales.totalDiferencia >= 0 ? 'text-green-600' : 'text-red-600'}`}>{totalesGenerales.totalDiferencia >= 0 ? '+' : ''}{totalesGenerales.totalDiferencia.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});
// --- Fin componente ComparativaTabla ---

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
// Estado para el tipo de análisis mostrado en el modal (debe ir después de los imports)
import { GraficoComparativoSede } from '../ui/GraficoComparativoSede';

import OpuMessage from '../ui/OpuMessage';
import { useAuth } from '../auth';
import { getSocket } from '../socket';
import type { Sede } from '../types/sede';
import type { Aseguradora } from '../types/aseguradora';
import API_CONFIG from '../config/api';
import { GraficoComparativo } from '../ui/GraficoComparativo';
import { GraficoComparativoAseguradora } from '../ui/GraficoComparativoAseguradora';

type FacturacionEvento = {
  id: number;
  numeroFactura: string;
  fecha: string;
  valor: number;
  aseguradora?: string;
  paciente?: string;
  sede?: { nombre: string };
  tipoDocumento?: string;
  documento?: string;
  ambito?: string;
  tipoAtencion?: string;
  facturador?: string;
  programa?: string;
  total?: number;
  copago?: number;
  fechaInicial?: string;
  fechaFinal?: string;
  periodo?: string;
  estado?: string;
  tipoRegistro?: string; // 'Factura', 'Nota Crédito', etc.
};

export default function Facturacion() {
  // Estado para comparativa
  const [mesComparativa, setMesComparativa] = useState('');
  const [diasComparativa, setDiasComparativa] = useState<string[]>([]);
  // Ejemplo de meses disponibles, reemplazar por lógica real si es necesario
  const mesesDisponibles = ['Enero 2025', 'Febrero 2025', 'Marzo 2025', 'Abril 2025', 'Mayo 2025', 'Junio 2025', 'Julio 2025', 'Agosto 2025'];
  // Estado para el tipo de análisis mostrado en el modal
  const [analisisTipo, setAnalisisTipo] = React.useState<'sede' | 'aseguradora' | 'general' | 'comparativa' | 'grafico'>('general');
  // Estado para mostrar el modal de análisis
  const [showAnalisis, setShowAnalisis] = useState(false);

  // Utilidad para agrupar eventos por sede y aseguradora
  type AgrupacionValores = { total: number; corriente: number; remanente: number };
  type Agrupacion = Record<string, Record<string, AgrupacionValores>>;
  function agruparFacturacion(eventos: any[]): Agrupacion {
    const resultado: Agrupacion = {};
    eventos.forEach((ev: any) => {
      const periodo = (ev.periodo || '').trim().toUpperCase();
      if (periodo === 'ANULADA') return;
      const sede = ev.sede?.nombre || 'Sin sede';
      const aseguradora = ev.aseguradora || 'Sin aseguradora';
      if (!resultado[sede]) resultado[sede] = {};
      if (!resultado[sede][aseguradora]) resultado[sede][aseguradora] = { total: 0, corriente: 0, remanente: 0 };
      const valor = Number(ev.valor) || 0;
      resultado[sede][aseguradora].total += valor;
      if (periodo === 'CORRIENTE') resultado[sede][aseguradora].corriente += valor;
      if (periodo === 'REMANENTE') resultado[sede][aseguradora].remanente += valor;
    });
    return resultado;
  }

  // ...existing code...
  const [showOpu, setShowOpu] = useState(false);
  const [showOpuSuccess, setShowOpuSuccess] = useState(false);
  const [editandoPeriodoId, setEditandoPeriodoId] = useState<number|null>(null);
  const [menuReportesOpen, setMenuReportesOpen] = useState(false);

  // Función para actualizar periodo en el backend
  async function actualizarPeriodo(id: number, nuevoPeriodo: string) {
    try {
      const res = await fetch(`/api/facturacion/evento/${id}/periodo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodo: nuevoPeriodo })
      });
      if (!res.ok) throw new Error('Error al actualizar periodo');
      return true;
    } catch (e) {
      alert('No se pudo actualizar el periodo');
      return false;
    }
  }

  const descargarReporte = async (tipo: 'evento' | 'rips' | 'general') => {
    if (!fechaFiltroInicial || !fechaFiltroFinal) {
      alert('Debes seleccionar un rango de fechas válido.');
      return;
    }
    let url = `${API_CONFIG.BASE_URL}/facturacion/reporte?tipo=${tipo}&fechaInicial=${fechaFiltroInicial}&fechaFinal=${fechaFiltroFinal}`;
    if (tipo === 'general') {
      url = `${API_CONFIG.BASE_URL}/facturacion/reporte?tipo=general&fechaInicial=${fechaFiltroInicial}&fechaFinal=${fechaFiltroFinal}`;
    }
    window.open(url, '_blank');
    setMenuReportesOpen(false);
  };
  const { pergamoToken, user } = useAuth();
  const [fechaInicial, setFechaInicial] = useState('');
  const [fechaFinal, setFechaFinal] = useState('');
  const [loadingCargar, setLoadingCargar] = useState(false);
  const [loadingUltimosDias, setLoadingUltimosDias] = useState(false);
  const [mensaje, setMensaje] = useState<string|null>(null);
  const [actualizar, setActualizar] = useState(0); // Para forzar refresco
  const [ultimaActualizacion, setUltimaActualizacion] = useState<string>(() => {
    return localStorage.getItem('ultimaActualizacionFacturacion') || "";
  });
  const [eventos, setEventos] = useState<FacturacionEvento[]>([]);
  // Variable separada para TODOS los eventos del rango de fechas (para tarjetas)
  const [todosEventosFecha, setTodosEventosFecha] = useState<FacturacionEvento[]>([]);
  
  // Estado para totales precalculados (ultra-rápido)
  const [totalesTarjetas, setTotalesTarjetas] = useState({
    totalFacturas: 0,
    totalFacturado: 0,
    facturadoCorriente: 0,
    facturadoRemanente: 0
  });
  
  // Estados para paginación optimizada
  const [loading, setLoading] = useState(false);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  // ...existing code...
  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 100;
  // Mostrar/ocultar filtros avanzados
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  // Filtro unificado
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  // Filtros de select
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [aseguradoras, setAseguradoras] = useState<Aseguradora[]>([]);
  const [sedeFiltro, setSedeFiltro] = useState<string>('');
  const [aseguradoraFiltro, setAseguradoraFiltro] = useState<string>('');
  const [periodoFiltro, setPeriodoFiltro] = useState<string>('');
  // ...existing code...
  // Agrupación de facturación para el análisis (debe ir después de todos los useState)
  // Agrupación de facturación para el análisis (debe ir después de todos los useState)
  // Filtros de fecha inicial y final
  // Cargar sedes y aseguradoras
  useEffect(() => {
    fetch(`${API_CONFIG.BASE_URL}/sedes`)
      .then(res => res.json())
      .then(data => setSedes(data))
      .catch(() => setSedes([]));
    fetch(`${API_CONFIG.BASE_URL}/aseguradoras`)
      .then(res => res.json())
      .then(data => setAseguradoras(data))
      .catch(() => setAseguradoras([]));
  }, []);
  function getDefaultFechas() {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    return {
      inicial: `${yyyy}-${mm}-01`,
      final: `${yyyy}-${mm}-${dd}`
    };
  }
  const [{ inicial: fechaFiltroInicial, final: fechaFiltroFinal }, setFechasFiltro] = useState(getDefaultFechas());

  // Función ULTRA-RÁPIDA para cargar solo totales (no todos los datos)
  const cargarTotalesTarjetas = useCallback(async () => {
    if (!fechaFiltroInicial || !fechaFiltroFinal) return;
    
    const callId = Date.now();
    console.log(`[TOTALES RÁPIDOS ${callId}] Iniciando cálculo para fechas:`, fechaFiltroInicial, 'hasta', fechaFiltroFinal);
    
    try {
      const params = new URLSearchParams({
        fechaInicial: fechaFiltroInicial,
        fechaFinal: fechaFiltroFinal
      });

      const res = await fetch(`${API_CONFIG.BASE_URL}/facturacion/eventos/totales?${params}`);
      const data = await res.json();
      
      if (data.ok && data.totales) {
        console.log(`[TOTALES RÁPIDOS ${callId}] ✅ Totales recibidos:`, data.totales);
        setTotalesTarjetas(data.totales);
        return;
      }
      
      console.log(`[TOTALES RÁPIDOS ${callId}] ❌ Endpoint /totales no disponible, usando fallback...`);
      // Fallback: usar el método anterior
      await cargarTodosEventosFecha();
      
    } catch (error) {
      console.error(`[TOTALES RÁPIDOS ${callId}] Error:`, error);
      // Fallback: usar el método anterior
      await cargarTodosEventosFecha();
    }
  }, [fechaFiltroInicial, fechaFiltroFinal]);

  // Función para cargar TODOS los eventos del rango de fechas (para tarjetas)
  const cargarTodosEventosFecha = useCallback(async () => {
    if (!fechaFiltroInicial || !fechaFiltroFinal) return;
    
    const callId = Date.now(); // ID único para esta llamada
    console.log(`[DEBUG TARJETAS ${callId}] cargarTodosEventosFecha iniciado con fechas:`, fechaFiltroInicial, 'hasta', fechaFiltroFinal);
    
    try {
      // SOLUCIÓN TEMPORAL: Intentar primero el nuevo endpoint
      const paramsResumen = new URLSearchParams({
        fechaInicial: fechaFiltroInicial,
        fechaFinal: fechaFiltroFinal
      });

      let res = await fetch(`${API_CONFIG.BASE_URL}/facturacion/eventos/resumen?${paramsResumen}`);
      let data = await res.json();
      
      // Si el nuevo endpoint funciona, usarlo
      if (res.ok && data.ok) {
        console.log(`[DEBUG TARJETAS ${callId}] Usando endpoint /resumen - Eventos:`, data.eventos?.length || 0);
        setTodosEventosFecha(data.eventos || []);
        return;
      }
      
      console.log(`[DEBUG TARJETAS ${callId}] Endpoint /resumen no disponible, usando múltiples llamadas...`);
      
      // FALLBACK: Hacer múltiples llamadas para obtener todos los datos
      let todosLosEventos: any[] = [];
      let pagina = 1;
      let totalPaginas = 1;
      
      do {
        const params = new URLSearchParams({
          fechaInicial: fechaFiltroInicial,
          fechaFinal: fechaFiltroFinal,
          page: String(pagina),
          limit: '500' // Máximo permitido
        });

        res = await fetch(`${API_CONFIG.BASE_URL}/facturacion/eventos?${params}`);
        data = await res.json();
        
        if (data.ok && data.eventos) {
          todosLosEventos = [...todosLosEventos, ...data.eventos];
          totalPaginas = data.pagination?.totalPages || 1;
          console.log(`[DEBUG TARJETAS ${callId}] Página ${pagina}/${totalPaginas} - Eventos acumulados: ${todosLosEventos.length}`);
        } else {
          console.log(`[DEBUG TARJETAS ${callId}] Error en página`, pagina, ':', data.error);
          break;
        }
        
        pagina++;
      } while (pagina <= totalPaginas && pagina <= 20); // Límite de seguridad
      
      console.log(`[DEBUG TARJETAS ${callId}] Total final de eventos cargados:`, todosLosEventos.length);
      setTodosEventosFecha(todosLosEventos);
      
      // CALCULAR TOTALES PARA COMPATIBILIDAD
      const totalFacturas = todosLosEventos.length;
      const totalFacturado = todosLosEventos.filter(ev => {
        const periodoEv = (ev.periodo || '').trim().toUpperCase();
        return periodoEv !== 'ANULADA';
      }).reduce((acc, ev) => {
        if (ev.tipoRegistro === 'Nota Crédito') {
          return acc - (Number(ev.valor) || 0);
        }
        return acc + (Number(ev.valor) || 0);
      }, 0);
      
      const facturadoCorriente = todosLosEventos.filter(ev => {
        const periodoEv = (ev.periodo || '').trim().toUpperCase();
        return periodoEv === 'CORRIENTE';
      }).reduce((acc, ev) => {
        if (ev.tipoRegistro === 'Nota Crédito') {
          return acc - (Number(ev.valor) || 0);
        }
        return acc + (Number(ev.valor) || 0);
      }, 0);
      
      const facturadoRemanente = todosLosEventos.filter(ev => {
        const periodoEv = (ev.periodo || '').trim().toUpperCase();
        return periodoEv === 'REMANENTE';
      }).reduce((acc, ev) => acc + (Number(ev.valor) || 0), 0);
      
      setTotalesTarjetas({
        totalFacturas,
        totalFacturado,
        facturadoCorriente,
        facturadoRemanente
      });
      
      console.log(`[DEBUG TARJETAS ${callId}] Totales calculados localmente:`, {
        totalFacturas, totalFacturado, facturadoCorriente, facturadoRemanente
      });
      
    } catch (error) {
      console.error(`[DEBUG TARJETAS ${callId}] Error cargando todos los eventos:`, error);
      setTodosEventosFecha([]);
    }
  }, [fechaFiltroInicial, fechaFiltroFinal]);

  
  // Función optimizada para cargar eventos con paginación
  const cargarEventos = useCallback(async (pagina = 1, busqueda = '', resetPagina = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(resetPagina ? 1 : pagina),
        limit: String(registrosPorPagina),
        ...(fechaFiltroInicial && { fechaInicial: fechaFiltroInicial }),
        ...(fechaFiltroFinal && { fechaFinal: fechaFiltroFinal }),
        ...(sedeFiltro && { sede: sedeFiltro }),
        ...(aseguradoraFiltro && { aseguradora: aseguradoraFiltro }),
        ...(busqueda && { search: busqueda })
      });

      const res = await fetch(`${API_CONFIG.BASE_URL}/facturacion/eventos?${params}`);
      const data = await res.json();
      
      if (data.ok) {
        setEventos(data.eventos || []);
        setTotalRegistros(data.pagination?.totalRecords || 0);
        setTotalPaginas(data.pagination?.totalPages || 0);
        // Actualizar página actual siempre, no solo cuando resetPagina
        setPaginaActual(resetPagina ? 1 : pagina);
      } else {
        setEventos([]);
        setTotalRegistros(0);
        setTotalPaginas(0);
      }
    } catch (error) {
      console.error('Error cargando eventos:', error);
      setEventos([]);
      setTotalRegistros(0);
      setTotalPaginas(0);
    } finally {
      setLoading(false);
    }
  }, [fechaFiltroInicial, fechaFiltroFinal, sedeFiltro, aseguradoraFiltro, registrosPorPagina]);

  // Debounce para búsqueda
  const debouncedSearch = useCallback(
    useMemo(() => {
      let timeoutId: number;
      return (searchTerm: string) => {
        clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
          cargarEventos(1, searchTerm, true);
        }, 500);
      };
    }, [cargarEventos]),
    [cargarEventos]
  );

  // Efecto para búsqueda
  useEffect(() => {
    if (searchQuery !== undefined) {
      debouncedSearch(searchQuery);
    }
  }, [searchQuery, debouncedSearch]);
  // Memoización de datos de análisis para evitar recálculos innecesarios
  const datosAnalisis = useMemo(() => {
    const eventosFiltrados = eventos.filter(ev => {
      const filtro = filtroBusqueda.trim().toLowerCase();
      const coincideTexto = !filtro ||
        (ev.numeroFactura && ev.numeroFactura.toLowerCase().includes(filtro)) ||
        (ev.documento && ev.documento.toLowerCase().includes(filtro)) ||
        (ev.paciente && ev.paciente.toLowerCase().includes(filtro));
      const fechaEv = ev.fecha || '';
      const enRango = (!fechaFiltroInicial || fechaEv >= fechaFiltroInicial) && (!fechaFiltroFinal || fechaEv <= fechaFiltroFinal);
      const coincideSede = !sedeFiltro || (ev.sede && ev.sede.nombre === sedeFiltro);
      const coincideAseg = !aseguradoraFiltro || (ev.aseguradora === aseguradoraFiltro);
      const periodoEv = (ev.periodo || '').trim().toUpperCase();
      const periodoFiltroNorm = (periodoFiltro || '').trim().toUpperCase();
      const coincidePeriodo = !periodoFiltroNorm || periodoEv === periodoFiltroNorm;
      return coincideTexto && enRango && coincideSede && coincideAseg && coincidePeriodo;
    });
    return agruparFacturacion(eventosFiltrados);
  }, [eventos, filtroBusqueda, fechaFiltroInicial, fechaFiltroFinal, sedeFiltro, aseguradoraFiltro, periodoFiltro]);

  // Datos para tarjetas - TODOS los eventos del rango de fechas
  const eventosPorFecha = useMemo(() => {
    console.log('[DEBUG TARJETAS] todosEventosFecha contiene:', todosEventosFecha.length, 'eventos');
    console.log('[DEBUG TARJETAS] Primer evento:', todosEventosFecha[0]);
    console.log('[DEBUG TARJETAS] eventosPorFecha creado con', todosEventosFecha.length, 'eventos');
    return todosEventosFecha; // Ya vienen filtrados por fecha desde el backend
  }, [todosEventosFecha]);
  // Actualizar fechas por defecto al cambiar de mes
  useEffect(() => {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    const nuevaInicial = `${yyyy}-${mm}-01`;
    const nuevaFinal = `${yyyy}-${mm}-${dd}`;
    setFechasFiltro(f => (f.inicial.slice(0,7) !== nuevaInicial.slice(0,7) ? { inicial: nuevaInicial, final: nuevaFinal } : f));
  }, []);
  
  // Cargar datos iniciales usando la nueva API paginada
  useEffect(() => {
    cargarEventos(1, '', false);
  }, [cargarEventos]);
  
  // Efecto SEPARADO para cargar totales ULTRA-RÁPIDOS cuando cambien las fechas
  useEffect(() => {
    const effectId = Date.now();
    console.log(`[DEBUG USEEFFECT ${effectId}] Disparado con fechas:`, fechaFiltroInicial, fechaFiltroFinal);
    if (fechaFiltroInicial && fechaFiltroFinal) {
      cargarTotalesTarjetas(); // Usar función ultra-rápida
    }
  }, [fechaFiltroInicial, fechaFiltroFinal, cargarTotalesTarjetas]);
  
  // Efecto para recargar tabla cuando cambian filtros importantes
  useEffect(() => {
    if (fechaFiltroInicial && fechaFiltroFinal) {
      cargarEventos(1, '', true);
    }
  }, [fechaFiltroInicial, fechaFiltroFinal, sedeFiltro, aseguradoraFiltro, cargarEventos]);
  // Conexión a Socket.IO para refrescar en tiempo real
  useEffect(() => {
    const socket = getSocket();
    socket.on('facturacion_actualizada', (data) => {
  setShowOpuSuccess(true);
  setTimeout(() => setShowOpuSuccess(false), 3000);
  <h2 className="text-base font-semibold text-center text-purple-900 mb-2" style={{letterSpacing: '.01em'}}>Análisis Facturación</h2>
    });
    return () => {
      socket.off('facturacion_actualizada');
    };
  }, []);

  // Cargar por fechas
  const handleCargar = async () => {
    setMensaje(null);
    if (!fechaInicial || !fechaFinal) {
      setMensaje('Selecciona ambas fechas.');
      return;
    }
    if (!pergamoToken) {
      setShowOpu(true);
      setMensaje('Tu sesión ha vencido. Serás redirigido al login.');
      setTimeout(() => {
        setShowOpu(false);
        setMensaje(null);
        if (window.localStorage) {
          window.localStorage.clear();
        }
        window.location.href = '/login';
      }, 3000);
      return;
    }
    setLoadingCargar(true);
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/facturacion/cargar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fechaInicial, fechaFinal, token: pergamoToken, userId: user?.username })
      });
      const data = await res.json();
      if (res.ok) {
        setShowOpuSuccess(true);
        setTimeout(() => setShowOpuSuccess(false), 3000);
        // Actualizar y guardar fecha de última actualización
        const ahora = new Date().toLocaleString('es-CO', { hour12: false });
        setUltimaActualizacion(ahora);
        localStorage.setItem('ultimaActualizacionFacturacion', ahora);
        setActualizar(a => a + 1); // Refrescar tabla automáticamente
      } else {
        setMensaje(data.error || 'Error al cargar datos');
      }
    } catch (e) {
      setMensaje('Error de red o servidor');
    }
    setLoadingCargar(false);
  };

  // Cargar últimos dos días
  // Cargar últimos dos días
  const handleActualizarRapido = async () => {
    const hoy = new Date();
    const haceDosDias = new Date();
    haceDosDias.setDate(hoy.getDate() - 2);
    const fechaFinal = hoy.toISOString().slice(0, 10);
    const fechaInicial = haceDosDias.toISOString().slice(0, 10);
    setFechaInicial(fechaInicial);
    setFechaFinal(fechaFinal);
    setMensaje(null); // Solo limpiar errores previos, no mostrar mensaje de éxito
    if (!pergamoToken) {
      setShowOpu(true);
      setMensaje('Tu sesión ha vencido. Serás redirigido al login.');
      setTimeout(() => {
        setShowOpu(false);
        setMensaje(null);
        if (window.localStorage) {
          window.localStorage.clear();
        }
        window.location.href = '/login';
      }, 3000);
      return;
    }
    setLoadingUltimosDias(true);
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/facturacion/cargar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fechaInicial, fechaFinal, token: pergamoToken, userId: user?.username })
      });
      const data = await res.json();
      if (res.ok) {
        setShowOpuSuccess(true);
        setTimeout(() => setShowOpuSuccess(false), 3000);
        // Actualizar y guardar fecha de última actualización
        const ahora = new Date().toLocaleString('es-CO', { hour12: false });
        setUltimaActualizacion(ahora);
        localStorage.setItem('ultimaActualizacionFacturacion', ahora);
        setActualizar(a => a + 1); // Refrescar tabla automáticamente
      } else {
        setMensaje(data.error || 'Error al cargar datos');
      }
    } catch (e) {
      setMensaje('Error de red o servidor');
    }
    setLoadingUltimosDias(false);
  };

  return (
    <section className="pt-8">

      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
  <h1 className="text-3xl font-bold mb-1 whitespace-nowrap" style={{ color: '#002c50' }}>Modulo Facturación</h1>
        <div className="flex gap-2 items-center mt-2 md:mt-0 w-full justify-end">
          {/* Switch para habilitar edición de periodo */}
 
          {/* Menú de botones alineado a la derecha */}
          <div className="flex gap-2 items-center">
            {/* Filtros avanzados y botón cargar solo cuando mostrarFiltros, al lado izquierdo */}
            {mostrarFiltros && (
              <>
                <input
                  type="date"
                  className="border px-2 py-1 w-full text-xs rounded"
                  value={fechaInicial}
                  onChange={e => setFechaInicial(e.target.value)}
                  placeholder="Fecha inicial"
                  min="2025-01-01"
                />
                <input
                  type="date"
                  className="border px-2 py-1 w-full text-xs rounded"
                  value={fechaFinal}
                  onChange={e => setFechaFinal(e.target.value)}
                  placeholder="Fecha final"
                  min="2025-01-01"
                />
                {/* Botón cargar/actualizar facturación SOLO cuando mostrarFiltros */}
                <button
                  className={`p-0 m-0 bg-transparent border-none outline-none flex items-center ml-2 group ${loadingCargar ? 'animate-spin' : ''}`}
                  title="Cargar o actualizar facturación"
                  onClick={handleCargar}
                  disabled={loadingCargar}
                  style={{ boxShadow: 'none', borderRadius: '50%' }}
                >
                  {loadingCargar ? (
                    // Icono circular animado (simula carga)
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="url(#cargar-gradient)"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
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
                    // Icono base de datos minimalista
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 transition-all duration-200"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#002c50"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <defs>
                        <linearGradient id="db-gradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#2563eb" />
                          <stop offset="1" stopColor="#38bdf8" />
                        </linearGradient>
                      </defs>
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
              {/* Línea divisora */}
              <span className="h-8 w-px bg-gray-300 mx-2 self-center" />
            {/* Botón flecha para mostrar/ocultar filtros avanzados */}
            <button
              className={`p-0 m-0 bg-transparent border-none outline-none flex items-center group`}
              title={mostrarFiltros ? 'Ocultar filtros avanzados' : 'Mostrar filtros avanzados'}
              onClick={() => setMostrarFiltros(f => !f)}
              style={{ boxShadow: 'none', borderRadius: 0, minWidth: 32 }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 transition-all duration-200"
                viewBox="0 0 32 32"
                fill="none"
                stroke="#002c50"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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
              title="Actualizar últimos 2 días"
              onClick={handleActualizarRapido}
              disabled={loadingUltimosDias}
              style={{ boxShadow: 'none', borderRadius: '50%' }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 transition-all duration-200"
                viewBox="0 0 32 32"
                fill="none"
                stroke="#002c50"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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
            {/* Botones de Reportes y Análisis (SVG minimalista, simétricos) */}
            <button
              className="relative p-0 m-0 bg-transparent border-none outline-none flex items-center group ml-2"
              title="Reportes"
              style={{ boxShadow: 'none', borderRadius: '50%' }}
              onClick={e => { e.stopPropagation(); setMenuReportesOpen(v => !v); }}
              onBlur={() => setTimeout(() => setMenuReportesOpen(false), 150)}
            >
              {/* Icono de reporte: hoja minimalista más grande y líneas mejoradas */}
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
                <div className="absolute z-50 top-8 -left-24 bg-white border border-gray-200 rounded shadow-md min-w-[160px] text-xs animate-fade-in">
                  <button className="w-full text-left px-4 py-2 hover:bg-green-100" onMouseDown={e => {e.preventDefault(); descargarReporte('evento');}}>Descargar reporte de Evento</button>
                  <button className="w-full text-left px-4 py-2 hover:bg-green-100" onMouseDown={e => {e.preventDefault(); descargarReporte('rips');}}>Descargar reporte de RIPS</button>
                  <button className="w-full text-left px-4 py-2 hover:bg-green-100" onMouseDown={e => {e.preventDefault(); descargarReporte('general');}}>Descargar reporte General</button>
                </div>
              )}
            </button>
            <button
              className="p-0 m-0 bg-transparent border-none outline-none flex items-center group ml-2"
              title="Análisis"
              style={{ boxShadow: 'none', borderRadius: '50%' }}
              onClick={() => setShowAnalisis(true)}
            >
              {/* Icono de análisis: dashboard minimalista líneas finas */}
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
      {/* Filtros avanzados */}
  {/* Eliminado: bloque de filtros avanzados duplicado */}
      {showOpu && mensaje && (
        <OpuMessage message={mensaje} type={mensaje.toLowerCase().includes('error') || mensaje.toLowerCase().includes('red') ? 'error' : 'info'} duration={3000} onClose={() => setShowOpu(false)} />
      )}
      {showOpuSuccess && (
        <OpuMessage message="Carga exitosa, los datos han sido almacenados correctamente" type="success" duration={3000} onClose={() => setShowOpuSuccess(false)} />
      )}
  <hr className="border-t mt-4 mb-2 w-full" style={{ borderColor: '#002c50' }} />
  <div className="my-2" />



      {/* Modal de análisis */}
      {showAnalisis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-2">
          <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 w-full max-w-[98vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl min-h-[520px] min-w-[700px] max-h-[80vh] max-w-[90vw] h-[520px] md:h-[600px] relative animate-fade-in overflow-hidden flex flex-col">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setShowAnalisis(false)}
              aria-label="Cerrar"
            >×</button>
            <div className="flex gap-2 justify-center mb-4">
              <button
                className={`min-w-[160px] flex-1 px-5 py-2 rounded-xl font-semibold text-xs border border-gray-300 transition-all duration-150 focus:outline-none shadow-sm ${analisisTipo === 'grafico' ? 'text-white border-[#002c50]' : 'bg-white text-gray-900 hover:bg-gray-100'}`}
                style={analisisTipo === 'grafico' ? { backgroundColor: '#002c50', letterSpacing: '.01em' } : { letterSpacing: '.01em' }}
                onClick={() => setAnalisisTipo('grafico')}
              >Análisis General</button>
              <button
                className={`min-w-[160px] flex-1 px-5 py-2 rounded-xl font-semibold text-xs border border-gray-300 transition-all duration-150 focus:outline-none shadow-sm ${analisisTipo === 'sede' ? 'text-white border-[#002c50]' : 'bg-white text-gray-900 hover:bg-gray-100'}`}
                style={analisisTipo === 'sede' ? { backgroundColor: '#002c50', letterSpacing: '.01em' } : { letterSpacing: '.01em' }}
                onClick={() => setAnalisisTipo('sede')}
              >Análisis Sede</button>
              <button
                className={`min-w-[160px] flex-1 px-5 py-2 rounded-xl font-semibold text-xs border border-gray-300 transition-all duration-150 focus:outline-none shadow-sm ${analisisTipo === 'aseguradora' ? 'text-white border-[#002c50]' : 'bg-white text-gray-900 hover:bg-gray-100'}`}
                style={analisisTipo === 'aseguradora' ? { backgroundColor: '#002c50', letterSpacing: '.01em' } : { letterSpacing: '.01em' }}
                onClick={() => setAnalisisTipo('aseguradora')}
              >Análisis Aseguradora</button>
              <button
                className={`min-w-[160px] flex-1 px-5 py-2 rounded-xl font-semibold text-xs border border-gray-300 transition-all duration-150 focus:outline-none shadow-sm ${analisisTipo === 'comparativa' ? 'text-white border-[#002c50]' : 'bg-white text-gray-900 hover:bg-gray-100'}`}
                style={analisisTipo === 'comparativa' ? { backgroundColor: '#002c50', letterSpacing: '.01em' } : { letterSpacing: '.01em' }}
                onClick={() => setAnalisisTipo('comparativa')}
              >Comparativo</button>
              <button
                className={`min-w-[160px] flex-1 px-5 py-2 rounded-xl font-semibold text-xs border border-gray-300 transition-all duration-150 focus:outline-none shadow-sm ${analisisTipo === 'general' ? 'text-white border-[#002c50]' : 'bg-white text-gray-900 hover:bg-gray-100'}`}
                style={analisisTipo === 'general' ? { backgroundColor: '#002c50', letterSpacing: '.01em' } : { letterSpacing: '.01em' }}
                onClick={() => setAnalisisTipo('general')}
              >Informe General</button>
            </div>
            <hr className="border-t border-gray-300 mb-4 w-full" />
            <div className="flex-1 min-h-0 overflow-auto">
              {analisisTipo === 'grafico' && (
                <GraficoComparativo
                  data={eventos.map(ev => ({
                    sede: ev.sede?.nombre || '',
                    aseguradora: ev.aseguradora || '',
                    año: Number(ev.fecha?.slice(0,4)),
                    mes: Number(ev.fecha?.slice(5,7)),
                    valor: Number(ev.total) || 0
                  }))}
                  aseguradoras={[...new Set(eventos.map(ev => ev.aseguradora).filter((x): x is string => Boolean(x)))]}
                  sedes={[...new Set(eventos.map(ev => ev.sede?.nombre).filter((x): x is string => Boolean(x)))]}
                  años={[...new Set(eventos.map(ev => Number(ev.fecha?.slice(0,4))).filter(Boolean))].sort()}
                />
              )}
              {analisisTipo === 'general' && (
                <div className="flex flex-col gap-1">
                  {Object.entries(datosAnalisis).map(([sede, aseguradoras]) => {
                    let totalSede = 0, corrienteSede = 0, remanenteSede = 0;
                    Object.values(aseguradoras as Record<string, AgrupacionValores>).forEach(val => {
                      totalSede += val.total;
                      corrienteSede += val.corriente;
                      remanenteSede += val.remanente;
                    });
                    return (
                      <div key={sede} className="bg-white rounded-xl px-2 py-1">
                        <div className="mb-2">
                          <span className="font-bold text-sm sm:text-base" style={{ color: '#002c50' }}>{sede}</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs sm:text-sm mt-2 table-fixed">
                            <thead>
                              <tr className="border-b bg-gray-100">
                                <th className="px-2 py-1 font-semibold text-left w-1/4" style={{ color: '#002c50' }}>Aseguradora</th>
                                <th className="px-2 py-1 font-semibold text-left w-1/4" style={{ color: '#002c50' }}>Corriente</th>
                                <th className="px-2 py-1 font-semibold text-left w-1/4" style={{ color: '#002c50' }}>Remanente</th>
                                <th className="px-2 py-1 font-semibold text-left w-1/4" style={{ color: '#002c50' }}>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(aseguradoras as Record<string, AgrupacionValores>).map(([aseg, valores]) => (
                                <tr key={aseg} className="border-b hover:bg-gray-50 transition">
                                  <td className="px-2 py-1 text-gray-700 whitespace-nowrap text-left w-1/4 truncate">{aseg}</td>
                                  <td className="px-2 py-1 whitespace-nowrap text-left w-1/4">{valores.corriente.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                  <td className="px-2 py-1 whitespace-nowrap text-left w-1/4">{valores.remanente.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                  <td className="px-2 py-1 whitespace-nowrap text-left w-1/4">{valores.total.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                </tr>
                              ))}
                              <tr className="border-t bg-gray-100 font-bold">
                                <td className="px-2 py-1 whitespace-nowrap text-left w-1/4" style={{ color: '#002c50' }}>Total Facturado</td>
                                <td className="px-2 py-1 whitespace-nowrap text-left w-1/4" style={{ color: '#002c50' }}>{corrienteSede.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                <td className="px-2 py-1 whitespace-nowrap text-left w-1/4" style={{ color: '#002c50' }}>{remanenteSede.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                <td className="px-2 py-1 whitespace-nowrap text-left w-1/4" style={{ color: '#002c50' }}>{totalSede.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {analisisTipo === 'comparativa' && (
                <ComparativaTabla eventos={eventos} />
              )}
              {analisisTipo === 'sede' && (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <GraficoComparativoSede
                    data={eventos.map(ev => ({
                      sede: ev.sede?.nombre || '',
                      año: Number(ev.fecha?.slice(0,4)),
                      mes: Number(ev.fecha?.slice(5,7)),
                      valor: Number(ev.total) || 0
                    }))}
                    sedes={[...new Set(eventos.map(ev => ev.sede?.nombre).filter((x): x is string => Boolean(x)))]}
                    años={[...new Set(eventos.map(ev => Number(ev.fecha?.slice(0,4))).filter(Boolean))].sort()}
                  />
                </div>
              )}
              {analisisTipo === 'aseguradora' && (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <GraficoComparativoAseguradora
                    data={eventos.map(ev => ({
                      aseguradora: ev.aseguradora || '',
                      año: Number(ev.fecha?.slice(0,4)),
                      mes: Number(ev.fecha?.slice(5,7)),
                      valor: Number(ev.total) || 0
                    }))}
                    aseguradoras={[...new Set(eventos.map(ev => ev.aseguradora).filter((x): x is string => Boolean(x)))]}
                    años={[...new Set(eventos.map(ev => Number(ev.fecha?.slice(0,4))).filter(Boolean))].sort()}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tarjetas informativas */}
  <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">
    {/* Tarjeta: Total facturas */}
  <div className="relative bg-white rounded-2xl shadow-md px-7 py-6 flex flex-col items-center justify-center min-w-[180px] min-h-[110px]">
  <span className="text-2xl font-bold mb-2 mt-2" style={{fontFamily: 'Segoe UI, Arial, sans-serif', color: '#1f1200'}}> 
    {totalesTarjetas.totalFacturas.toLocaleString()}
  </span>
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Total facturas</span>
    </div>
    {/* Tarjeta: Total Facturado */}
  <div className="relative bg-white rounded-2xl shadow-md px-7 py-6 flex flex-col items-center justify-center min-w-[180px] min-h-[110px]">
  <span className="text-2xl font-bold mb-2 mt-2" style={{fontFamily: 'Segoe UI, Arial, sans-serif', color: '#103800'}}> 
    {totalesTarjetas.totalFacturado.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
  </span>
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Total Facturado</span>
    </div>
    {/* Tarjeta: Facturado Corriente */}
  <div className="relative bg-white rounded-2xl shadow-md px-7 py-6 flex flex-col items-center justify-center min-w-[180px] min-h-[110px]">
  <span className="text-2xl font-bold mb-2 mt-2" style={{fontFamily: 'Segoe UI, Arial, sans-serif', color: '#103800'}}> 
    {totalesTarjetas.facturadoCorriente.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
  </span>
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Facturado Corriente</span>
    </div>
    {/* Tarjeta: Facturado Remanente */}
  <div className="relative bg-white rounded-2xl shadow-md px-7 py-6 flex flex-col items-center justify-center min-w-[180px] min-h-[110px]">
  <span className="text-2xl font-bold mb-2 mt-2" style={{fontFamily: 'Segoe UI, Arial, sans-serif', color: '#103800'}}> 
    {totalesTarjetas.facturadoRemanente.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
  </span>
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Facturado Remanente</span>
    </div>
    {/* Tarjeta: Última actualización */}
  <div className="relative bg-white rounded-2xl shadow-md px-7 py-6 flex flex-col items-center justify-center min-w-[180px] min-h-[110px]">
  <span className="text-lg font-bold mb-2 mt-2" style={{fontFamily: 'Segoe UI, Arial, sans-serif', color: '#1f1200'}}>{ultimaActualizacion}</span>
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Última actualización</span>
    </div>
  </div>

      {/* Menú de filtros */}
  <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-6 w-full">
        {/* 1. Filtro texto */}
        <input
          className="border px-2 py-1 w-full text-xs"
          placeholder="Factura, Documento o Paciente"
          value={filtroBusqueda}
          onChange={e => {
            setFiltroBusqueda(e.target.value);
            setSearchQuery(e.target.value);
          }}
        />
        {/* 2. Fechas */}
        <input
          className="border px-2 py-1 w-full text-xs"
          type="date"
          value={fechaFiltroInicial}
          max={fechaFiltroFinal}
          onChange={e => setFechasFiltro(f => ({ ...f, inicial: e.target.value }))}
        />
        <input
          className="border px-2 py-1 w-full text-xs"
          type="date"
          value={fechaFiltroFinal}
          min={fechaFiltroInicial}
          max={getDefaultFechas().final}
          onChange={e => setFechasFiltro(f => ({ ...f, final: e.target.value }))}
        />
        {/* 3. Sede */}
        <select
          className="border px-2 py-1 w-full text-xs"
          value={sedeFiltro}
          onChange={e => setSedeFiltro(e.target.value)}
        >
          <option value="">Todas las sedes</option>
          {sedes.map(s => (
            <option key={s.id} value={s.nombre}>{s.nombre}</option>
          ))}
        </select>
        {/* 4. Aseguradora */}
        <select
          className="border px-2 py-1 w-full text-xs"
          value={aseguradoraFiltro}
          onChange={e => setAseguradoraFiltro(e.target.value)}
        >
          <option value="">Todas las aseguradoras</option>
          {aseguradoras.map(a => (
            <option key={a.id} value={a.nombre}>{a.nombre}</option>
          ))}
        </select>
        {/* 5. Periodo */}
        <select
          className="border px-2 py-1 w-full text-xs"
          value={periodoFiltro}
          onChange={e => setPeriodoFiltro(e.target.value)}
        >
          <option value="">Todos los periodos</option>
          <option value="CORRIENTE">CORRIENTE</option>
          <option value="REMANENTE">REMANENTE</option>
          {Array.from(new Set(eventos.map(ev => ev.periodo).filter(p => p && !['corriente','remanente','CORRIENTE','REMANENTE'].includes((p||'').trim().toUpperCase())))).map(p => (
            <option key={p} value={String(p).toUpperCase()}>{String(p).toUpperCase()}</option>
          ))}
        </select>
  {/* Espacio para alinear con grid, si se requiere */}
      </div>

      {/* Tabla de facturas con paginación */}
      <div className="border-0 rounded-none bg-white shadow overflow-x-auto p-0 m-0 w-full">
  <table className="min-w-full text-[10px] md:text-xs table-fixed">
          <thead>
            <tr style={{ backgroundColor: '#002c50' }}>
              <th className="px-1 py-2 text-center text-white whitespace-nowrap" style={{width:'8%'}}>Factura</th>
              <th className="px-1 py-2 text-center text-white whitespace-nowrap" style={{width:'8%'}}>Fecha</th>
              <th className="px-1 py-2 text-center text-white whitespace-nowrap" style={{width:'4%'}}>Tipo</th>
              <th className="px-1 py-2 text-center text-white whitespace-nowrap" style={{width:'10%'}}>Documento</th>
              <th className="px-1 py-2 text-white whitespace-nowrap" style={{width:'16%'}}>Paciente</th>
              <th className="px-1 py-2 text-center text-white whitespace-nowrap" style={{width:'10%'}}>Sede</th>
              <th className="px-1 py-2 text-center text-white whitespace-nowrap" style={{width:'10%'}}>Aseguradora</th>
              <th className="px-1 py-2 text-center text-white whitespace-nowrap" style={{width:'8%'}}>Fecha Inicial</th>
              <th className="px-1 py-2 text-center text-white whitespace-nowrap" style={{width:'8%'}}>Fecha Final</th>
              <th className="px-1 py-2 text-center text-white whitespace-nowrap" style={{width:'10%'}}>Total</th>
              <th className="px-1 py-2 text-center text-white whitespace-nowrap" style={{width:'8%'}}>Periodo</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={12} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2">Cargando datos...</span>
                  </div>
                </td>
              </tr>
            ) : eventos.length === 0 ? (
              <tr><td colSpan={12} className="text-center py-4">Sin registros</td></tr>
            ) : (
              eventos.map((ev, i) => (
                  <tr key={ev.id} className="border-b hover:bg-blue-50">
                    <td className="px-1 py-1 text-center whitespace-nowrap overflow-hidden text-ellipsis" style={{width:'8%'}}>{ev.numeroFactura || ''}</td>
                    <td className="px-1 py-1 text-center whitespace-nowrap overflow-hidden text-ellipsis" style={{width:'8%'}}>{ev.fecha || ''}</td>
                    <td className="px-1 py-1 text-center whitespace-nowrap overflow-hidden text-ellipsis" style={{width:'4%'}}>{ev.tipoDocumento || ''}</td>
                    <td className="px-1 py-1 text-center whitespace-nowrap overflow-hidden text-ellipsis" style={{width:'10%'}}>{ev.documento || ''}</td>
                    <td className="px-1 py-1 whitespace-nowrap overflow-hidden text-ellipsis" style={{width:'16%'}}>{ev.paciente || ''}</td>
                    <td className="px-1 py-1 text-center whitespace-nowrap overflow-hidden text-ellipsis" style={{width:'10%'}}>{ev.sede?.nombre || ''}</td>
                    <td className="px-1 py-1 text-center whitespace-nowrap overflow-hidden text-ellipsis" style={{width:'10%'}}>{ev.aseguradora || ''}</td>
                    <td className="px-1 py-1 text-center whitespace-nowrap overflow-hidden text-ellipsis" style={{width:'8%'}}>{ev.fechaInicial || ''}</td>
                    <td className="px-1 py-1 text-center whitespace-nowrap overflow-hidden text-ellipsis" style={{width:'8%'}}>{ev.fechaFinal || ''}</td>
                    <td className="px-1 py-1 text-center whitespace-nowrap overflow-hidden text-ellipsis" style={{width:'10%'}}>{ev.valor !== undefined ? Number(ev.valor).toLocaleString('es-CO', { style: 'currency', currency: 'COP' }) : ''}</td>
                    <td className="px-1 py-1 text-center whitespace-nowrap overflow-hidden text-ellipsis" style={{width:'8%'}}>
                      {editandoPeriodoId === ev.id ? (
                        <select
                          className="border rounded px-1 py-0.5 w-20 text-[10px]"
                          defaultValue={(ev.periodo || '').trim().toUpperCase()}
                          autoFocus
                          onBlur={async e => {
                            const nuevoPeriodo = (e.target as HTMLSelectElement).value;
                            if (nuevoPeriodo !== (ev.periodo || '')) {
                              const ok = await actualizarPeriodo(ev.id, nuevoPeriodo);
                              if (ok) {
                                setEventos(prev => prev.map(ev2 => ev2.id === ev.id ? { ...ev2, periodo: nuevoPeriodo } : ev2));
                              }
                            }
                            setEditandoPeriodoId(null);
                          }}
                          onKeyDown={async e => {
                            if (e.key === 'Enter') {
                              (e.target as HTMLSelectElement).blur();
                            } else if (e.key === 'Escape') {
                              setEditandoPeriodoId(null);
                            }
                          }}
                        >
                          <option value="CORRIENTE">CORRIENTE</option>
                          <option value="REMANENTE">REMANENTE</option>
                        </select>
                      ) : (
                        <span className="flex items-center gap-1">
                          {ev.periodo || ''}
                          {(ev.periodo?.trim().toUpperCase() !== 'ANULADA') && (
                            <button
                              className="ml-1 p-0.5 rounded hover:bg-purple-100"
                              title="Editar"
                              onClick={() => setEditandoPeriodoId(ev.id)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13zm0 0V17h4" />
                              </svg>
                            </button>
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
        {/* Paginación optimizada con datos del backend */}
        <div className="flex justify-between items-center mt-4 bg-gray-50 p-3 rounded">
          <div className="flex items-center gap-2">
            <button 
              className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50 disabled:bg-gray-300" 
              onClick={() => cargarEventos(1, searchQuery || '', false)} 
              disabled={loading || paginaActual === 1}
            >
              ⏮️ Primera
            </button>
            <button 
              className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50 disabled:bg-gray-300" 
              onClick={() => cargarEventos(paginaActual - 1, searchQuery || '', false)} 
              disabled={loading || paginaActual === 1}
            >
              ⬅️ Anterior
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
              className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50 disabled:bg-gray-300" 
              onClick={() => cargarEventos(paginaActual + 1, searchQuery || '', false)} 
              disabled={loading || paginaActual === totalPaginas}
            >
              Siguiente ➡️
            </button>
            <button 
              className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50 disabled:bg-gray-300" 
              onClick={() => cargarEventos(totalPaginas, searchQuery || '', false)} 
              disabled={loading || paginaActual === totalPaginas}
            >
              Última ⏭️
            </button>
          </div>
        </div>
      </div>
    </section>

  );
}
