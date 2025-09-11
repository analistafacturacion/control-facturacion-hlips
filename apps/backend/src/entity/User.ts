import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nombre!: string;

  @Column()
  usuario!: string;

  @Column()
  rol!: string;

  @Column({ type: 'simple-array', nullable: true })
  aseguradoras!: string[];

  @Column()
  password!: string;

  @Column({ default: true })
  estado!: boolean;
}
