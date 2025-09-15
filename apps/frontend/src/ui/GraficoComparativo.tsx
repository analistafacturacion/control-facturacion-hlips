import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, /*Area,*/ XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Customized } from 'recharts';

interface Props {
  data: any[];
  aseguradoras: string[];
  sedes: string[];
  años: number[];
  initialSede?: string;
  initialAseguradora?: string;
  initialAño?: number;
}

const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export const GraficoComparativo: React.FC<Props> = ({ data, aseguradoras, sedes, años, initialSede, initialAseguradora, initialAño }) => {
  // Por defecto mostramos "Todas" las sedes/aseguradoras para que el gráfico agregue datos
  const [sede, setSede] = useState(initialSede ?? '');
  const [aseguradora, setAseguradora] = useState(initialAseguradora ?? '');
  const [año, setAño] = useState<number>(initialAño ?? (años[años.length-1] || new Date().getFullYear()));

  // Debug: Log inicial de datos recibidos
  console.log('🎯 GraficoComparativo - Datos recibidos:', {
    totalEventos: data.length,
    sedes: sedes,
    aseguradoras: aseguradoras,
    años: años,
    selectedSede: sede,
    selectedAseguradora: aseguradora,
    selectedAño: año
  });

  // Debug: Mostrar estructura de algunos eventos
  if (data.length > 0) {
    console.log('🔍 Estructura de los primeros 3 eventos:', data.slice(0, 3));
  }

  // Generar datos para el gráfico: total facturado por mes (mostrar siempre 12 meses)
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const currentYear = currentDate.getFullYear();

  const datosGrafico = meses.map((mes, idx) => {
    // Filtrar todos los eventos del mes actual, sede, aseguradora y año
    // Si sede o aseguradora están vacíos significa "todas" -> no filtrar por ese campo
    const eventosMes = data.filter(d => {
      const coincideSede = !sede || d.sede === sede;
      const coincideAseguradora = !aseguradora || d.aseguradora === aseguradora;
      const coincideAño = !año || d.año === año;
      const coincideMes = d.mes === idx+1;
      
      // Debug para el primer mes
      if (idx === 0) {
        console.log(`🔍 Filtrado ${mes} - Evento ejemplo:`, {
          evento: d,
          coincideSede,
          coincideAseguradora,
          coincideAño,
          coincideMes,
          filtroCompleto: coincideSede && coincideAseguradora && coincideAño && coincideMes
        });
      }
      
      return coincideSede && coincideAseguradora && coincideAño && coincideMes;
    });
    
    const totalMes = eventosMes.reduce((acc, ev) => {
      const valor = Number(ev.valor) || 0;
      return acc + valor;
    }, 0);
    
  console.log(`📅 ${mes} (${idx+1}): ${eventosMes.length} eventos, total: $${totalMes.toLocaleString()}`);
    
    // Determinar si este mes es futuro respecto al año seleccionado
    const mesNum = idx + 1;
    const isFuture = (año === currentYear && mesNum > currentMonth) || (año > currentYear);

    return {
      mes: mes.slice(0,3),
      // Para meses futuros no mostramos nada (null). Para meses pasados o actuales mostramos 0 si no hay datos.
      valor: isFuture ? null : totalMes
    };
  });

    // Minimal custom dot: muestra punto cuando hay valor, gris cuando no
    const renderDot = (props: any) => {
      const { cx, cy, value } = props;
      if (value == null) {
        return <circle cx={cx} cy={cy} r={4} fill="#e6e6e6" stroke="#fff" strokeWidth={1} />;
      }
      return <circle cx={cx} cy={cy} r={4} fill="#1F497D" stroke="#fff" strokeWidth={1} />;
    };

    // Estado y ref para el overlay SVG que copiará el path del Area generado por Recharts
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [areaPathD, setAreaPathD] = useState<string | null>(null);

    // Después de cada render intentamos leer el path que Recharts generó para el Area
    useEffect(() => {
      // Delay corto para que Recharts haya generado el DOM
      const timer = setTimeout(() => {
        try {
          if (!containerRef.current) return;
          // Buscar el primer path de área dentro del contenedor del gráfico
          const areaPath = containerRef.current.querySelector('.recharts-area .recharts-area-area, .recharts-area-area') as SVGPathElement | null;
          if (areaPath) {
            const d = areaPath.getAttribute('d');
            if (d) setAreaPathD(d);
          }
        } catch (err) {
          // no critical
        }
      }, 50);

      return () => clearTimeout(timer);
    }, [datosGrafico, sede, aseguradora, año]);

    // Customized renderer: dibuja el área bajo la línea usando las escalas internas del chart.
    const CustomArea = (props: any) => {
      try {
        const { width, height, xAxisMap, yAxisMap, data } = props;
        if (!xAxisMap || !yAxisMap || !data) return null;
        const xAxis: any = Object.values(xAxisMap)[0];
        const yAxis: any = Object.values(yAxisMap)[0];
        if (!xAxis || !yAxis || !xAxis.scale || !yAxis.scale) return null;
        const xScale: any = xAxis.scale;
        const yScale: any = yAxis.scale;

        const baseline = yScale(0);

        // Crear segmentos contiguos (saltarnos nulls)
        const segments: Array<Array<[number, number]>> = [];
        let seg: Array<[number, number]> = [];
        data.forEach((d: any) => {
          if (d && d.valor != null) {
            const x = xScale(d.mes);
            const y = yScale(d.valor);
            seg.push([x, y]);
          } else {
            if (seg.length) {
              segments.push(seg);
              seg = [];
            }
          }
        });
        if (seg.length) segments.push(seg);

        return (
          <g>
            {segments.map((s, i) => {
              const firstX = s[0][0];
              const lastX = s[s.length - 1][0];
              const topPath = s.map(p => `${p[0]},${p[1]}`).join(' L ');
              const d = `M ${firstX} ${baseline} L ${topPath} L ${lastX} ${baseline} Z`;
              return <path key={i} d={d} fill="url(#gradArea)" stroke="none" opacity={1} />;
            })}
          </g>
        );
      } catch (err) {
        return null;
      }
    };

    // Tooltip minimal con indicador de variación respecto al mes anterior
    const CustomTooltip = ({ active, payload, label }: any) => {
      if (!active || !payload || payload.length === 0) return null;
      const val = payload[0].value;
      // Encontrar índice del mes en datosGrafico (mes es ej. 'Ene')
      const idx = datosGrafico.findIndex(d => d.mes === label);
      const prev = idx > 0 ? datosGrafico[idx - 1].valor : null;
      let variation = null;
      let pct = null;
      if (prev != null && val != null) {
        variation = Number(val) - Number(prev);
        pct = prev !== 0 ? (variation / Number(prev)) * 100 : null;
      }

      const variationColor = variation == null ? '#6b7280' : (variation > 0 ? '#16a34a' : (variation < 0 ? '#dc2626' : '#6b7280'));
      const variationSign = variation == null ? '' : (variation > 0 ? '▲' : (variation < 0 ? '▼' : ''));

      return (
        <div style={{ background: 'rgba(255,255,255,0.98)', padding: 8, borderRadius: 8, boxShadow: '0 4px 14px rgba(2,6,23,0.12)', fontSize: 13, minWidth: 120 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
          <div style={{ color: '#1F497D', fontWeight: 600, marginBottom: 6 }}>{val == null ? 'Sin datos' : `$ ${Number(val).toLocaleString('es-CO')}`}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: variationColor }} />
            <div style={{ color: variationColor, fontWeight: 600 }}>
              {variation == null ? 'Sin comparación' : `${variationSign} $ ${Math.abs(Number(variation)).toLocaleString('es-CO')}`}
            </div>
            {pct != null && (
              <div style={{ color: variationColor, opacity: 0.9 }}>{`(${pct > 0 ? '+' : ''}${pct.toFixed(1)}%)`}</div>
            )}
          </div>
        </div>
      );
    };

  return (
    <div className="w-full flex flex-col gap-4" style={{height: '100%'}}>
      <div className="flex gap-2 justify-center">
        <select value={sede} onChange={e => setSede(e.target.value)} className="border rounded px-2 py-1">
          {sedes.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={aseguradora} onChange={e => setAseguradora(e.target.value)} className="border rounded px-2 py-1">
          {aseguradoras.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={año} onChange={e => setAño(Number(e.target.value))} className="border rounded px-2 py-1">
          {años.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div ref={containerRef} style={{height: 'calc(100% - 48px)', minHeight: 0, flex: 1, overflow: 'hidden', position: 'relative'}}>
        <div style={{width: '100%', height: '100%', overflow: 'visible'}} aria-hidden>

          {/* Overlay SVG: si logramos capturar el path del Area de Recharts, lo usamos como máscara
              y pintamos un rect con gradiente más visible debajo de la línea. Esto fuerza el
              desvanecido azul aunque el Area original no se vea por CSS o rendering issues. */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }} preserveAspectRatio="none" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="forcedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0369a1" stopOpacity={0.95} />
                <stop offset="30%" stopColor="#0369a1" stopOpacity={0.6} />
                <stop offset="70%" stopColor="#0369a1" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#0369a1" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            {areaPathD ? (
              <g>
                <path d={areaPathD} fill="url(#forcedGrad)" opacity={1} transform="scale(1,1)" />
              </g>
            ) : null}
          </svg>

          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={datosGrafico} margin={{ top: 12, right: 8, left: 8, bottom: 12 }}>
              {/* Fondo blanco para mayor contraste del área */}
              <rect x={0} y={0} width="100%" height="100%" fill="#ffffff" />
              <defs>
                {/* Gradiente más intenso y con transiciones de opacidad para asegurar visibilidad */}
                <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
                  {/* color principal en la parte superior (más opaco) */}
                  <stop offset="0%" stopColor="#0369a1" stopOpacity={0.85} />
                  {/* suavizado intermedio */}
                  <stop offset="30%" stopColor="#0369a1" stopOpacity={0.55} />
                  {/* transición hacia transparencia */}
                  <stop offset="70%" stopColor="#0369a1" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#0369a1" stopOpacity={0.02} />
                </linearGradient>

                {/* Filtro drop-shadow suave para dar volumen al área (aplicar como filter en el Area) */}
                <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#0369a1" floodOpacity="0.08" />
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="mes" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} domain={[0, 'dataMax']} tickFormatter={v => {
                if (v == null) return '';
                if (Math.abs(v) >= 1000000) return `${Math.round(v/1000000)}M`;
                if (Math.abs(v) >= 1000) return `${Math.round(v/1000)}K`;
                return (v as number).toLocaleString('es-CO');
              }} />
              <Tooltip content={<CustomTooltip />} />
              {/* Customized area: dibujamos manualmente el área bajo la línea para garantizar visibilidad */}
              <Customized component={CustomArea} />

              {/* Línea sobre el área */}
              <Line type="monotone" dataKey="valor" stroke="#0369a1" strokeWidth={2} dot={renderDot} activeDot={{ r: 5 }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
