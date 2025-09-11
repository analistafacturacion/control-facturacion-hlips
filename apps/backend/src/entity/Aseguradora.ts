import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Aseguradora {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nombrePergamo!: string;

  @Column()
  nombre!: string;

  @Column({ length: 3 })
  iniciales!: string;
}
