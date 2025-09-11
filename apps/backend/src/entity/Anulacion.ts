import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Sede } from './Sede';

@Entity()
export class Anulacion {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ length: 100 })
	numeroAnulacion!: string;

	@Column({ type: 'date' })
	fecha!: string;

	@Column({ length: 100, nullable: true })
	notaCredito?: string;

	@Column({ type: 'date', nullable: true })
	fechaNotaCredito?: string;

	@Column({ length: 20, nullable: true })
	tipoDocumento?: string;

	@Column({ length: 30, nullable: true })
	documento?: string;

	@Column({ length: 100, nullable: true })
	paciente?: string;

	@Column({ length: 100, nullable: true })
	aseguradora?: string;

	@ManyToOne(() => Sede)
	@JoinColumn({ name: 'sede_id' })
	sede!: Sede;

	@Column({ length: 100, nullable: true })
	facturador?: string;

	@Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
	totalAnulado?: number;

	@Column({ length: 100, nullable: true })
	motivo?: string;

	@Column({ length: 30, nullable: true })
	estado?: string;

	// Nuevas columnas para datos del archivo plano
	@Column({ length: 500, nullable: true })
	facturaRemplazo?: string; // Para múltiples facturas separadas por comas

	@Column({ length: 500, nullable: true })
	fechaRemplazo?: string; // Para múltiples fechas separadas por comas

	@Column({ length: 500, nullable: true })
	valorRemplazo?: string; // Para múltiples valores separados por comas

	@Column({ length: 20, nullable: true })
	tipoRegistro?: string; // 'Anulación' o 'Nota Crédito'

	@Column({ type: 'text', nullable: true })
	observaciones?: string;
}
