import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Props {
  data: { aseguradora: string; año: number; mes: number; valor: number }[];
  aseguradoras: string[];
  años: number[];
}

const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export const GraficoComparativoAseguradora: React.FC<Props> = ({ data, aseguradoras, años }) => {
  const [aseguradora, setAseguradora] = useState(aseguradoras[0] || '');
  const [año, setAño] = useState(años[años.length-1] || new Date().getFullYear());

  // Generar datos para el gráfico: total facturado por aseguradora en cada mes
  const datosGrafico = meses.map((mes, idx) => {
    const eventosMes = data.filter(d => d.aseguradora === aseguradora && d.año === año && d.mes === idx+1);
    const totalMes = eventosMes.reduce((acc, ev) => acc + (Number(ev.valor) || 0), 0);
    return {
      mes: mes.slice(0,3),
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
              if (!v) return '';
              if (Math.abs(v) >= 1000000) {
                return `${Math.round(v/1000000)}M`;
              }
              if (Math.abs(v) >= 1000) {
                return `${Math.round(v/1000)}K`;
              }
              return v.toLocaleString('es-CO');
            }} />
            <Tooltip formatter={v => `$ ${Number(v).toLocaleString('es-CO')}`} />
            <Legend />
            <Line type="monotone" dataKey="valor" stroke="#1F497D" strokeWidth={3} dot={renderDot} activeDot={{ r: 7 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
