import React, { useState } from 'react';
import { LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: any[];
  aseguradoras: string[];
  sedes: string[];
  años: number[];
  showAseguradoraFilter?: boolean;
  showSedeFilter?: boolean;
  initialSede?: string;
  initialAseguradora?: string;
  initialAño?: number;
}

const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export const GraficoComparativo: React.FC<Props> = ({ data, aseguradoras, sedes, años, initialSede, initialAseguradora, initialAño, showAseguradoraFilter = true, showSedeFilter = true }) => {
  // Por defecto mostramos "Todas" las sedes/aseguradoras para que el gráfico agregue datos
  const [sede, setSede] = useState(initialSede ?? '');
  const [aseguradora, setAseguradora] = useState(initialAseguradora ?? '');
  const [año, setAño] = useState<number>(initialAño ?? (años[años.length-1] || new Date().getFullYear()));

  // fecha actual para determinar meses futuros
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

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
      if (idx === 0 && valor > 0) {
        console.log(`💰 Sumando valor en ${mes}:`, valor, 'del evento:', ev);
      }
      return acc + valor;
    }, 0);
    
  console.log(`📅 ${mes} (${idx+1}): ${eventosMes.length} eventos, total: $${totalMes.toLocaleString()}`);
    
    const mesNum = idx + 1;
    const isFuture = (año === currentYear && mesNum > currentMonth) || (año > currentYear);
    // Si es mes futuro, dejar null (sin datos todavía). Si hay datos (aunque 0), mostrar 0.
    const valor = isFuture ? null : (eventosMes.length > 0 ? totalMes : 0);
    return { mes: mes.slice(0,3), valor };
  });

    // Minimal custom dot: muestra punto cuando hay valor, gris cuando no
    const renderDot = (props: any) => {
      const { cx, cy, value } = props;
      if (value == null) {
        return <circle cx={cx} cy={cy} r={4} fill="#e6e6e6" stroke="#fff" strokeWidth={1} />;
      }
      return <circle cx={cx} cy={cy} r={4} fill="#1F497D" stroke="#fff" strokeWidth={1} />;
    };

    // Tooltip minimal
    const CustomTooltip = ({ active, payload, label }: any) => {
      if (!active || !payload || payload.length === 0) return null;
      const val = payload[0].value;
      // compute previous month value to display diff and percent
      const idx = datosGrafico.findIndex(d => d.mes === label);
      const prev = idx > 0 ? datosGrafico[idx-1].valor : null;
      let diff = null as number|null;
      let diffPct = null as number|null;
      if (val != null && prev != null) {
        diff = Number(val) - Number(prev);
        if (Number(prev) !== 0) diffPct = (diff / Number(prev)) * 100;
      }

      return (
        <div style={{ background: 'rgba(255,255,255,0.98)', padding: 10, borderRadius: 8, boxShadow: '0 6px 20px rgba(2,6,23,0.08)', fontSize: 13, minWidth: 160 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
          <div style={{ fontWeight: 700, color: '#0f172a' }}>{val == null ? 'Sin datos' : `$ ${Number(val).toLocaleString('es-CO')}`}</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 10, alignItems: 'center' }}>
            {diff == null ? (
              <div style={{ color: '#6b7280', fontSize: 12 }}>Sin comparación</div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {diff > 0 ? <path d="M12 19V6" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/> : <path d="M12 5v13" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
                    {diff > 0 ? <path d="M5 12l7-7 7 7" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/> : <path d="M19 12l-7 7-7-7" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
                  </svg>
                  <div style={{ fontSize: 13, fontWeight: 700, color: diff > 0 ? '#059669' : '#b91c1c' }}>{`${diff > 0 ? '+' : ''}$ ${Math.abs(diff).toLocaleString('es-CO')}`}</div>
                </div>
                {diffPct != null && (<div style={{ fontSize: 12, color: diff > 0 ? '#059669' : '#b91c1c' }}>{`${diffPct!.toFixed(1)}%`}</div>)}
              </>
            )}
          </div>
        </div>
      );
    };

  return (
    <div className="w-full flex flex-col gap-4" style={{height: '100%'}}>
      <div className="flex gap-2 justify-center">
        {showSedeFilter && (
          <select value={sede} onChange={e => setSede(e.target.value)} className="border rounded px-2 py-1">
            {sedes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        {showAseguradoraFilter && (
          <select value={aseguradora} onChange={e => setAseguradora(e.target.value)} className="border rounded px-2 py-1">
            {aseguradoras.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        )}
        <select value={año} onChange={e => setAño(Number(e.target.value))} className="border rounded px-2 py-1">
          {años.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div style={{height: 'calc(100% - 48px)', minHeight: 0, flex: 1, overflow: 'hidden', position: 'relative'}}>
        <div style={{width: '100%', height: '100%', overflow: 'visible'}} aria-hidden>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={datosGrafico} margin={{ top: 24, right: 8, left: 8, bottom: 24 }}>
              <defs>
                <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1F497D" stopOpacity={0.14} />
                  <stop offset="100%" stopColor="#1F497D" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="mes" axisLine={false} tickLine={false} />
              {/* Ocultar labels/ticks del eje Y izquierdo: dejamos el eje por si se necesita la rejilla, pero sin números */}
              <YAxis axisLine={false} tickLine={false} tick={false} label={undefined} />
              <Tooltip content={<CustomTooltip />} />
              {/* Área sutil debajo de la línea para dar profundidad */}
              {/* Area visible y más definida entre la línea y la base */}
              <Area type="monotone" dataKey="valor" stroke="#1F497D" strokeWidth={1} fill="url(#gradArea)" isAnimationActive={false} connectNulls />
              <Line type="monotone" dataKey="valor" stroke="#1F497D" strokeWidth={2} dot={renderDot} activeDot={{ r: 5 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
