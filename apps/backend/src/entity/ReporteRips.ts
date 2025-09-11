import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class ReporteRips {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'date' })
  fechaInicial!: string;

  @Column({ type: 'date' })
  fechaFinal!: string;

  @Column({ type: 'text' })
  datos!: string; // JSON.stringify de los datos RIPS

  @CreateDateColumn()
  creadoEn!: Date;
}
