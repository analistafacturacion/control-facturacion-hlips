import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'ultima_actualizacion' })
export class UltimaActualizacion {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text', nullable: false })
  fecha!: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
