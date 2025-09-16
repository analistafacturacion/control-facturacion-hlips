import React, { useState, useRef, useEffect } from 'react';

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
  const [sede, setSede] = useState(initialSede ?? '');
  const [aseguradora, setAseguradora] = useState(initialAseguradora ?? '');
  const [año, setAño] = useState<number>(initialAño ?? (años[años.length-1] || new Date().getFullYear()));
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Generar datos por mes (12 meses siempre)
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const datosGrafico = meses.map((mes, idx) => {
    const eventosMes = data.filter(d => {
      const coincideSede = !sede || d.sede === sede;
      const coincideAseguradora = !aseguradora || d.aseguradora === aseguradora;
      const coincideAño = !año || d.año === año;
      const coincideMes = d.mes === idx + 1;
      return coincideSede && coincideAseguradora && coincideAño && coincideMes;
    });
    const totalMes = eventosMes.reduce((acc, ev) => acc + (Number(ev.valor) || 0), 0);
    const mesNum = idx + 1;
    const isFuture = (año === currentYear && mesNum > currentMonth) || (año > currentYear);
    return { mes: mes.slice(0,3), valor: isFuture ? null : totalMes };
  });

  // SVG sizing
  const width = 900;
  const height = 320;
  const padding = { left: 36, right: 20, top: 24, bottom: 28 };

  const visiblePoints = datosGrafico.map((d, i) => ({ xLabel: d.mes, y: d.valor, index: i }));
  const vals = visiblePoints.filter(p => p.y != null).map(p => Number(p.y));
  const maxVal = vals.length ? Math.max(...vals) : 1;
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const xForIndex = (idx: number) => padding.left + (innerWidth * (idx / (meses.length - 1)));
  const yForValue = (v: number) => padding.top + innerHeight - (v / maxVal) * innerHeight;

  const buildSmoothPath = (points: Array<{x:number,y:number}>) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const segments: Array<Array<{x:number,y:number,index:number}>> = [];
  let seg: Array<{x:number,y:number,index:number}> = [];
  visiblePoints.forEach(p => {
    if (p.y != null) {
      seg.push({ x: xForIndex(p.index), y: yForValue(Number(p.y)), index: p.index });
    } else {
      if (seg.length) { segments.push(seg); seg = []; }
    }
  });
  if (seg.length) segments.push(seg);

  const yTicks = [0, Math.round(maxVal / 2), Math.round(maxVal)];

  // tooltip
  const [tooltip, setTooltip] = useState<{visible:boolean,x:number,y:number,value:number|null,label:string}>({ visible: false, x: 0, y: 0, value: null, label: '' });

  // refs for animated paths and areas
  const lineRefs = useRef<Array<SVGPathElement | null>>([]);
  const areaRefs = useRef<Array<SVGPathElement | null>>([]);

  // run animation on data change
  useEffect(() => {
    // reset styles
    lineRefs.current.forEach(p => {
      if (p) {
        try {
          const len = p.getTotalLength();
          p.style.strokeDasharray = `${len}`;
          p.style.strokeDashoffset = `${len}`;
          p.style.transition = 'stroke-dashoffset 900ms cubic-bezier(.2,.8,.2,1)';
        } catch (e) { /* ignore */ }
      }
    });
    areaRefs.current.forEach(a => {
      if (a) {
        a.style.opacity = '0';
        a.style.transition = 'opacity 700ms ease';
      }
    });

    // trigger animation slightly after paint
    const t = setTimeout(() => {
      lineRefs.current.forEach(p => { if (p) p.style.strokeDashoffset = '0'; });
      areaRefs.current.forEach(a => { if (a) a.style.opacity = '1'; });
      // animate dots with stagger
      const dots = containerRef.current?.querySelectorAll('.cf-dot');
      dots?.forEach((dot, idx) => {
        const el = dot as HTMLElement;
        el.style.transform = 'scale(1)';
        el.style.opacity = '1';
        el.style.transition = `transform 350ms cubic-bezier(.2,.8,.2,1) ${idx * 80}ms, opacity 250ms ${idx * 80}ms`;
      });
    }, 80);

    return () => clearTimeout(t);
  }, [datosGrafico, sede, aseguradora, año]);

  const onEnterPoint = (evt: React.MouseEvent, p: any) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const clientX = evt.clientX;
    const clientY = evt.clientY;
    const x = rect ? clientX - rect.left : evt.nativeEvent.offsetX;
    const y = rect ? clientY - rect.top : evt.nativeEvent.offsetY;
    setTooltip({ visible: true, x, y, value: p.y as number, label: p.xLabel });
  };
  const onLeavePoint = () => setTooltip({ visible: false, x: 0, y: 0, value: null, label: '' });

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
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
          <defs>
            <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0369a1" stopOpacity={0.9} />
              <stop offset="40%" stopColor="#0369a1" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#0369a1" stopOpacity={0.03} />
            </linearGradient>
            <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="#0369a1" floodOpacity="0.08" />
            </filter>
          </defs>

          {/* Ejes Y (ticks) */}
          {yTicks.map((t, i) => (
            <g key={i}>
              <line x1={padding.left} x2={width - padding.right} y1={yForValue(t)} y2={yForValue(t)} stroke="#eef2ff" strokeWidth={1} />
              <text x={8} y={yForValue(t) + 4} fontSize={12} fill="#6b7280">{t.toLocaleString('es-CO')}</text>
            </g>
          ))}

          {/* Segments: area under curve */}
          {segments.map((s, i) => {
            const pts = s.map(p => ({ x: p.x, y: p.y }));
            const topPath = buildSmoothPath(pts);
            const firstX = pts[0].x;
            const lastX = pts[pts.length - 1].x;
            const baseline = yForValue(0);
            const areaD = `M ${firstX} ${baseline} L ${topPath.replace(/^M /, '')} L ${lastX} ${baseline} Z`;
            return (
              <g key={i}>
                <path ref={el => areaRefs.current[i] = el} d={areaD} fill="url(#gradArea)" stroke="none" filter="url(#softShadow)" style={{ opacity: 0 }} />
                <path ref={el => lineRefs.current[i] = el} d={topPath} fill="none" stroke="#0369a1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </g>
            );
          })}

          {/* Dots */}
          {visiblePoints.map((p, i) => {
            if (p.y == null) return null;
            const cx = xForIndex(i);
            const cy = yForValue(Number(p.y));
            return (
              <circle key={i} className="cf-dot" cx={cx} cy={cy} r={4} fill="#1F497D" stroke="#fff" strokeWidth={1}
                onMouseEnter={(e) => onEnterPoint(e, p)} onMouseLeave={onLeavePoint}
                style={{ transform: 'scale(0.6)', transformOrigin: 'center', opacity: 0 }} />
            );
          })}

          {/* X axis labels */}
          {visiblePoints.map((p, i) => (
            <text key={i} x={xForIndex(i)} y={height - 6} fontSize={11} textAnchor="middle" fill="#6b7280">{p.xLabel}</text>
          ))}
        </svg>

        {/* Tooltip básico */}
        {tooltip.visible && (
          <div style={{ position: 'absolute', left: tooltip.x + 8, top: tooltip.y + 8, background: 'rgba(255,255,255,0.98)', padding: 8, borderRadius: 8, boxShadow: '0 6px 18px rgba(2,6,23,0.12)', fontSize: 13 }}>
            <div style={{ fontWeight: 700 }}>{tooltip.label}</div>
            <div style={{ color: '#0369a1', fontWeight: 600 }}>{tooltip.value == null ? 'Sin datos' : `$ ${Number(tooltip.value).toLocaleString('es-CO')}`}</div>
          </div>
        )}
      </div>
    </div>
  );
};
