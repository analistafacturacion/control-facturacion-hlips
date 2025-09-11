import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Sede {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  nombre!: string;

  @Column({ length: 100 })
  regional!: string;

  @Column({ length: 100 })
  zonal!: string;

  @Column({ length: 100 })
  indicadorFacturacion!: string;

  @Column({ length: 10 })
  iniciales!: string;
}
