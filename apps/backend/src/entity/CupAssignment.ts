import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class CupAssignment {
  @PrimaryGeneratedColumn()
  id!: number;

  // foreign keys stored as simple numeric ids to avoid heavy relations in this simple model
  @Column({ nullable: true })
  cupId!: number;

  @Column({ nullable: true })
  aseguradoraId!: number;

  @Column({ nullable: true })
  sedeId!: number;

  @Column({ nullable: true })
  notas!: string;
}
