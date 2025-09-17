import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Cup {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  aseguradora!: string;

  @Column()
  cups!: string;

  @Column({ nullable: true })
  cuint!: string;

  @Column({ nullable: true })
  servicioFacturado!: string;

  @Column({ nullable: true })
  servicioNormalizado!: string;

  @Column({ nullable: true })
  valor!: string;
}
