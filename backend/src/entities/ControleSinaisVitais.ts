import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Avaliacao } from "./Avaliacao";

export enum CondicaoGeralSinaisVitais {
  SEM_ALTERACOES = "SEM_ALTERACOES",
  ALTERACOES_OBSERVADAS = "ALTERACOES_OBSERVADAS",
}

@Entity("controle_sinais_vitais")
export class ControleSinaisVitais {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Avaliacao, (avaliacao) => avaliacao.sinaisVitais, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "avaliacaoId" })
  avaliacao!: Avaliacao;

  @Column({ type: "int" })
  avaliacaoId!: number;

  @Column({ type: "int", nullable: true })
  pacienteId!: number | null;

  @Column({ type: "int", nullable: true })
  usuarioId!: number | null;

  @Column({ type: "varchar", nullable: true })
  usuarioNome!: string | null;

  @Column({ type: "varchar" })
  condicaoGeral!: CondicaoGeralSinaisVitais;

  @Column({ type: "text", nullable: true })
  observacao!: string | null;

  @CreateDateColumn()
  registradoEm!: Date;
}
