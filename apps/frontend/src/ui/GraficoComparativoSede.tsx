import React from 'react';
import { GraficoComparativo } from './GraficoComparativo';

// Wrapper que reutiliza GraficoComparativo para asegurar diseño y comportamiento idéntico
// entre el Análisis General y el Análisis por Sede.
export const GraficoComparativoSede: React.FC<any> = (props) => {
  // Aceptamos props genéricos para permanecer compatibles con llamadas existentes desde Facturacion.tsx
  const data = props.data || [];
  const sedes = props.sedes || [];
  // Soportar tanto 'años' (prop con tilde) como 'anios' por compatibilidad
  const años = props['años'] || props.anios || [];

  return (
    <GraficoComparativo
      data={data}
      aseguradoras={[]}
      sedes={sedes}
      años={años}
      initialSede={props.initialSede}
      initialAseguradora={props.initialAseguradora}
      initialAño={props.initialAño}
      showAseguradoraFilter={false}
    />
  );
};
