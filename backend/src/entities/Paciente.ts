import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("pacientes")
export class Paciente {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: "varchar",
  })
  nome!: string;

  @Column({
    type: "date",
  })
  dataNascimento!: Date;

  @Column({
    type: "varchar",
  })
  nomeResponsavelLegal!: string;

  @Column({
    type: "varchar",
    length: 20,
  })
  telefoneResponsavelLegal!: string;

  @Column({
    type: "varchar",
  })
  endereco!: string;
}