import React, { useState } from 'react';
import { LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: any[];
  aseguradoras: string[];
  sedes: string[];
  años: number[];
}

const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export const GraficoComparativo: React.FC<Props> = ({ data, aseguradoras, sedes, años }) => {
  // Por defecto mostramos "Todas" las sedes/aseguradoras para que el gráfico agregue datos
  const [sede, setSede] = useState('');
  const [aseguradora, setAseguradora] = useState('');
  const [año, setAño] = useState(años[años.length-1] || new Date().getFullYear());

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
    
    return {
      mes: mes.slice(0,3),
      // Igual que en los gráficos por sede/aseguradora: usar null cuando no hay datos para que no se dibuje punto/valor
      valor: totalMes > 0 ? totalMes : null
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

    // Tooltip minimal
    const CustomTooltip = ({ active, payload, label }: any) => {
      if (!active || !payload || payload.length === 0) return null;
      const val = payload[0].value;
      return (
        <div style={{ background: 'rgba(255,255,255,0.95)', padding: 8, borderRadius: 6, boxShadow: '0 1px 6px rgba(0,0,0,0.12)', fontSize: 12 }}>
          <div style={{ fontWeight: 600 }}>{label}</div>
          <div style={{ color: '#1F497D' }}>{val == null ? 'Sin datos' : `$ ${Number(val).toLocaleString('es-CO')}`}</div>
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
              <YAxis axisLine={false} tickLine={false} tickFormatter={v => {
                if (v == null) return '';
                if (Math.abs(v) >= 1000000) return `${Math.round(v/1000000)}M`;
                if (Math.abs(v) >= 1000) return `${Math.round(v/1000)}K`;
                return (v as number).toLocaleString('es-CO');
              }} />
              <Tooltip content={<CustomTooltip />} />
              {/* Área sutil debajo de la línea para dar profundidad */}
              <Area type="monotone" dataKey="valor" stroke="none" fill="url(#gradArea)" isAnimationActive={false} connectNulls />
              <Line type="monotone" dataKey="valor" stroke="#1F497D" strokeWidth={2} dot={renderDot} activeDot={{ r: 5 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
