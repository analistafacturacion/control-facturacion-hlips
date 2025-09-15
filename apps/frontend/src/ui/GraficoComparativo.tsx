import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

    // Custom dot para mostrar flechas de tendencia
    const renderDot = (props: any) => {
      const { cx, cy, index, value } = props;
      if (value == null) {
        return (
          <g>
            <circle cx={cx} cy={cy} r={5} fill="#ccc" stroke="#fff" strokeWidth={2} />
          </g>
        );
      }
      // Comparar con el valor anterior
      const prev = index > 0 ? datosGrafico[index-1].valor : null;
      let flecha = null;
      let textoDiferencia = null;
      if (prev != null) {
        const diferencia = value - prev;
        // Limitar la posición vertical para evitar que se salga del área visible
        let yFlecha, yTexto;
        if (value > prev) {
          yFlecha = Math.max(cy-15, 30);
          yTexto = Math.max(cy-30, 10);
          flecha = <text x={cx} y={yFlecha} textAnchor="middle" fontSize={16} fill="#2ecc40">▲</text>;
          textoDiferencia = <text x={cx} y={yTexto} textAnchor="middle" fontSize={12} fill="#2ecc40">+{diferencia.toLocaleString('es-CO')}</text>;
        } else if (value < prev) {
          yFlecha = Math.min(cy+20, 210);
          yTexto = Math.min(cy+35, 230);
          flecha = <text x={cx} y={yFlecha} textAnchor="middle" fontSize={16} fill="#e74c3c">▼</text>;
          textoDiferencia = <text x={cx} y={yTexto} textAnchor="middle" fontSize={12} fill="#e74c3c">{diferencia.toLocaleString('es-CO')}</text>;
        }
      }
      return (
        <g>
          <circle cx={cx} cy={cy} r={5} fill="#1F497D" stroke="#fff" strokeWidth={2} />
          {flecha}
          {textoDiferencia}
        </g>
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
      <div style={{height: 'calc(100% - 48px)', minHeight: 0, flex: 1}}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={datosGrafico} margin={{ top: 40, right: 10, left: 10, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis tickFormatter={v => {
              // Mostrar tick solo si el valor es distinto de null/undefined
              if (v == null) return '';
              if (Math.abs(v) >= 1000000) {
                return `${Math.round(v/1000000)}M`;
              }
              if (Math.abs(v) >= 1000) {
                return `${Math.round(v/1000)}K`;
              }
              return (v as number).toLocaleString('es-CO');
            }} />
            <Tooltip formatter={(v: any) => v == null ? 'Sin datos' : `$ ${Number(v).toLocaleString('es-CO')}`} />
            <Legend />
            <Line type="monotone" dataKey="valor" stroke="#1F497D" strokeWidth={3} dot={renderDot} activeDot={{ r: 7 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
