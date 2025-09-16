import React from 'react';
import { GraficoComparativo } from './GraficoComparativo';

// Wrapper que reutiliza GraficoComparativo para la vista por aseguradora.
export const GraficoComparativoAseguradora: React.FC<any> = (props) => {
  const data = props.data || [];
  const aseguradoras = props.aseguradoras || [];
  const años = props['años'] || props.anios || [];

  return (
    <GraficoComparativo
      data={data}
      aseguradoras={aseguradoras}
      sedes={[]}
      años={años}
      initialSede={props.initialSede}
      initialAseguradora={props.initialAseguradora}
      initialAño={props.initialAño}
      showSedeFilter={false}
    />
  );
};
