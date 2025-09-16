import React, { useState, useRef, useEffect, useMemo } from 'react';

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
  const svgRef = useRef<SVGSVGElement | null>(null);

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

  // Build per-pair segments so we can animate segment-by-segment from left to right
  const contiguousPoints: Array<{x:number,y:number,index:number}> = useMemo(() => {
    const arr: Array<{x:number,y:number,index:number}> = [];
    visiblePoints.forEach(p => {
      if (p.y != null) arr.push({ x: xForIndex(p.index), y: yForValue(Number(p.y)), index: p.index });
    });
    return arr;
  }, [visiblePoints]);

  type PairSegment = { p0: {x:number,y:number}, p1:{x:number,y:number}, p2:{x:number,y:number}, p3:{x:number,y:number}, topPath:string, areaD:string };
  const pairSegments: PairSegment[] = useMemo(() => {
    const segs: PairSegment[] = [];
    for (let i = 0; i < contiguousPoints.length - 1; i++) {
    const p1 = contiguousPoints[i];
    const p2 = contiguousPoints[i + 1];
    const p0 = contiguousPoints[i - 1] || p1;
    const p3 = contiguousPoints[i + 2] || p2;

    // control points for cubic bezier approximating Catmull-Rom between p1 and p2
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    const topPath = `M ${p1.x} ${p1.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    const baseline = yForValue(0);
    const areaD = `M ${p1.x} ${baseline} L ${topPath.replace(/^M /, '')} L ${p2.x} ${baseline} Z`;
      segs.push({ p0, p1, p2, p3, topPath, areaD });
    }
    return segs;
  }, [contiguousPoints]);

  const yTicks = [0, Math.round(maxVal / 2), Math.round(maxVal)];

  // tooltip
  const [tooltip, setTooltip] = useState<{visible:boolean,x:number,y:number,value:number|null,label:string,diff:number|null,diffPercent:number|null,trend:'up'|'down'|'same'|'nodata'}>({ visible: false, x: 0, y: 0, value: null, label: '', diff: null, diffPercent: null, trend: 'nodata' });
  const [cardAnimate, setCardAnimate] = useState(false);

  // refs for animated paths and areas
  const lineRefs = useRef<Array<SVGPathElement | null>>([]);
  const areaRefs = useRef<Array<SVGPathElement | null>>([]);
  const timersRef = useRef<number[]>([]);
  const lastAnimatedKey = useRef<string>('');

  // run progressive segment animation when filters or data change
  useEffect(() => {
    // compute a key representing the inputs that should trigger animation
    const key = `${sede}__${aseguradora}__${año}__${JSON.stringify(datosGrafico.map(d => d.valor))}`;
    if (lastAnimatedKey.current === key) {
      // nothing changed that should re-run the animation
      return;
    }
    lastAnimatedKey.current = key;

    // clear previous timers
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];

    // slightly faster animation per user's request
    const segmentStagger = 200; // ms between segments
    const strokeDuration = 700; // per-segment draw duration
    const areaFade = 600;

    // prepare each path
    lineRefs.current.forEach((p, idx) => {
      if (!p) return;
      try {
        const len = p.getTotalLength();
        p.style.strokeDasharray = `${len}`;
        p.style.strokeDashoffset = `${len}`;
        p.style.transition = `stroke-dashoffset ${strokeDuration}ms cubic-bezier(.2,.8,.2,1)`;
      } catch (e) { /* ignore */ }
    });

    areaRefs.current.forEach(a => {
      if (!a) return;
      a.style.opacity = '0';
      a.style.transition = `opacity ${areaFade}ms ease`;
    });

    // sequentially animate each segment and its area
    lineRefs.current.forEach((p, idx) => {
      const delay = idx * segmentStagger + 120; // small initial delay
      const t1 = window.setTimeout(() => {
        if (p) p.style.strokeDashoffset = '0';
      }, delay);
      timersRef.current.push(t1 as unknown as number);

      const a = areaRefs.current[idx];
      const t2 = window.setTimeout(() => {
        if (a) a.style.opacity = '1';
      }, delay + Math.min(200, strokeDuration / 2));
      timersRef.current.push(t2 as unknown as number);
    });

    // animate dots staggered to appear after their incoming segment
    const dots = containerRef.current?.querySelectorAll('.cf-dot');
    dots?.forEach((dot, idx) => {
      const el = dot as HTMLElement;
      // reset
      el.style.transform = 'scale(0.6)';
      el.style.opacity = '0';
      const delay = idx * segmentStagger + strokeDuration;
      const t = window.setTimeout(() => {
        el.style.transition = `transform 520ms cubic-bezier(.2,.8,.2,1), opacity 420ms`;
        el.style.transform = 'scale(1)';
        el.style.opacity = '1';
      }, delay);
      timersRef.current.push(t as unknown as number);
    });

    return () => {
      timersRef.current.forEach(t => clearTimeout(t));
      timersRef.current = [];
    };
  }, [datosGrafico, sede, aseguradora, año]);

  const onEnterPoint = (evt: React.MouseEvent, p: any) => {
    // Compute position using SVG coordinates scaled to rendered size for pixel-perfect anchoring
    const containerRect = containerRef.current?.getBoundingClientRect();
    const svgEl = svgRef.current;
    let centerX = 0;
    let centerY = 0;
    if (svgEl && containerRect) {
      const svgRect = svgEl.getBoundingClientRect();
      const scaleX = svgRect.width / width;
      const scaleY = svgRect.height / height;
      const svgX = xForIndex(p.index);
      const svgY = yForValue(Number(p.y));
      const screenX = svgRect.left + svgX * scaleX;
      const screenY = svgRect.top + svgY * scaleY;
      centerX = screenX - containerRect.left;
      centerY = screenY - containerRect.top;
    } else {
      // fallback to mouse position
      const rect = containerRef.current?.getBoundingClientRect();
      const clientX = evt.clientX;
      const clientY = evt.clientY;
      centerX = rect ? clientX - rect.left : evt.nativeEvent.offsetX;
      centerY = rect ? clientY - rect.top : evt.nativeEvent.offsetY;
    }

    // compute difference with previous month and percent
    const idx = p.index;
    const prev = datosGrafico[idx - 1]?.valor ?? null;
    const curr = p.y == null ? null : Number(p.y);
    let diff: number | null = null;
    let diffPercent: number | null = null;
    let trend: 'up'|'down'|'same'|'nodata' = 'nodata';
    if (curr == null || prev == null) {
      diff = null;
      diffPercent = null;
      trend = 'nodata';
    } else {
      diff = curr - Number(prev);
      if (Number(prev) !== 0) diffPercent = (diff / Number(prev)) * 100;
      else diffPercent = null; // cannot compute percent reliably when prev is 0
      if (diff > 0) trend = 'up';
      else if (diff < 0) trend = 'down';
      else trend = 'same';
    }

    // position tooltip to the right of the point by default, clamp inside container
    const cardW = 150;
    const cardH = 84; // enough height for stacked lines
    const offset = 10;
    let x = centerX + offset;
    // if overflowing to the right, place to the left
    if (containerRect && x + cardW > containerRect.width - 8) {
      x = centerX - cardW - offset;
    }
    if (x < 8) x = 8;

    // vertically center the card around the point
    let y = centerY - cardH / 2;
    if (containerRect) {
      if (y < 8) y = 8;
      if (y + cardH > containerRect.height - 8) y = Math.max(8, containerRect.height - cardH - 8);
    }

    setTooltip({ visible: true, x, y, value: curr, label: p.xLabel, diff, diffPercent, trend });
    // trigger animation state in next frame
    setCardAnimate(false);
    window.requestAnimationFrame(() => setCardAnimate(true));
  };
  const onLeavePoint = () => {
    // play hide animation then clear tooltip
    setCardAnimate(false);
    const hideDelay = 260;
    window.setTimeout(() => setTooltip({ visible: false, x: 0, y: 0, value: null, label: '', diff: null, diffPercent: null, trend: 'nodata' }), hideDelay);
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
  <svg ref={el => svgRef.current = el} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
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

          {/* Segments: area under curve (pairwise) */}
          {pairSegments.map((segm, i) => (
            <g key={i}>
              <path ref={el => areaRefs.current[i] = el} d={segm.areaD} fill="url(#gradArea)" stroke="none" filter="url(#softShadow)" style={{ opacity: 0 }} />
              <path ref={el => lineRefs.current[i] = el} d={segm.topPath} fill="none" stroke="#0369a1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          ))}

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

        {/* Tooltip / tarjeta minimalista anclada al punto */}
        {tooltip.visible && (
          <div
            style={{
              position: 'absolute',
              left: tooltip.x,
              top: tooltip.y,
              width: 150,
              background: 'rgba(255,255,255,0.98)',
              padding: '10px 12px',
              borderRadius: 10,
              boxShadow: '0 10px 30px rgba(2,6,23,0.10)',
              fontSize: 13,
              transform: 'translateY(' + (cardAnimate ? 0 : 6) + 'px)',
              opacity: cardAnimate ? 1 : 0,
              transition: 'transform 260ms cubic-bezier(.2,.8,.2,1), opacity 220ms'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div style={{ fontWeight: 700 }}>{tooltip.label}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{tooltip.value == null ? 'Sin datos' : `$ ${Number(tooltip.value).toLocaleString('es-CO')}`}</div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    {tooltip.diff == null ? 'Sin comparación' : `${tooltip.trend === 'up' ? '+' : tooltip.trend === 'down' ? '-' : ''} $${Math.abs(tooltip.diff ?? 0).toLocaleString('es-CO')}`}
                  </div>
                  {tooltip.diffPercent != null && (
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{`${tooltip.diffPercent!.toFixed(1)}% vs mes anterior`}</div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {tooltip.diff == null || tooltip.trend === 'nodata' ? (
                    <div style={{ color: '#6b7280', fontSize: 12 }}>—</div>
                  ) : tooltip.trend === 'up' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 19V6" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M5 12l7-7 7 7" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div style={{ color: '#059669', fontSize: 12, fontWeight: 700 }}>{`+ $${Math.abs(tooltip.diff!).toLocaleString('es-CO')}`}</div>
                    </div>
                  ) : tooltip.trend === 'down' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5v13" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M19 12l-7 7-7-7" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div style={{ color: '#b91c1c', fontSize: 12, fontWeight: 700 }}>{`- $${Math.abs(tooltip.diff!).toLocaleString('es-CO')}`}</div>
                    </div>
                  ) : (
                    <div style={{ color: '#6b7280', fontSize: 12 }}>0</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
