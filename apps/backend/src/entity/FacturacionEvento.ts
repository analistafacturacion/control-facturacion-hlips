import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Sede } from './Sede';

@Entity()
export class FacturacionEvento {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  numeroFactura!: string;

  @Column({ type: 'date' })
  fecha!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  valor!: number;

  @ManyToOne(() => Sede)
  @JoinColumn({ name: 'sede_id' })
  sede!: Sede;

  @Column({ nullable: true })
  aseguradora?: string;

  @Column({ nullable: true })
  paciente?: string;

  @Column({ nullable: true })
  tipoDocumento?: string;

  @Column({ nullable: true })
  documento?: string;

  @Column({ nullable: true })
  ambito?: string;

  @Column({ nullable: true })
  tipoAtencion?: string;

  @Column({ nullable: true })
  facturador?: string;

  @Column({ nullable: true })
  programa?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  total?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  copago?: number;

  @Column({ type: 'date', nullable: true })
  fechaInicial?: string;

  @Column({ type: 'date', nullable: true })
  fechaFinal?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  periodo?: string; // CORRIENTE o REMANENTE

  @Column({ nullable: true })
  convenio?: string;

  @Column({ nullable: true })
  portafolio?: string;

  @Column({ type: 'bigint', nullable: true })
  nit?: number;

  @Column({ nullable: true })
  regional?: string;
}
