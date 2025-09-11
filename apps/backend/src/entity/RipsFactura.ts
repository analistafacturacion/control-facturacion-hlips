import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class RipsFactura {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50 })
  factura!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  tipo!: string;

  @Column({ type: 'date', nullable: true })
  fechaFactura!: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  tipoDocumento!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  documento!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  codEps!: string;

  @Column({ type: 'int', nullable: true })
  regimen!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  primerApellido!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  segundoApellido!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  primerNombre!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  segundoNombre!: string;

  @Column({ type: 'int', nullable: true })
  edad!: number;

  @Column({ type: 'varchar', length: 2, nullable: true })
  genero!: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  departamento!: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  municipio!: string;

  @Column({ type: 'varchar', length: 2, nullable: true })
  zonaResidencial!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  cie10!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  diagnostico!: string;

  @Column({ type: 'int', nullable: true })
  servicioId!: number;

  @Column({ type: 'varchar', length: 30, nullable: true })
  cumsCups!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  procedimiento!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  fechaServicio!: string;

  @Column({ type: 'date', nullable: true })
  fechaInicial!: string;

  @Column({ type: 'date', nullable: true })
  fechaFinal!: string;

  @Column({ type: 'bigint', nullable: true })
  autorizacionId!: number;

  @Column({ type: 'int', nullable: true })
  cantidad!: number;

  @Column({ type: 'int', nullable: true })
  valorUnitario!: number;

  @Column({ type: 'int', nullable: true })
  copago!: number;

  @Column({ type: 'int', nullable: true })
  total!: number;

  @Column({ type: 'int', nullable: true })
  totalPagado!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  aseguradora!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ruta!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ambito!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  modalidad!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sede!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  regional!: string;

  @CreateDateColumn()
  creadoEn!: Date;
}
