import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export enum FuncaoUsuario {
  ADMINISTRADOR = 1,
  ENFERMEIRO = 2,
  MEDICO = 3,
}

@Entity("usuarios")
export class Usuario {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nome!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ select: false })
  senha!: string;

  @Column({ type: "tinyint" })
  funcao!: FuncaoUsuario;

  @Column({ name: "data_nascimento", type: "date", nullable: true })
  dataNascimento!: Date | null;

  @Column({ type: "varchar", length: 20, nullable: true })
  celular!: string | null;
}
