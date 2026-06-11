import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Avaliacao } from "./Avaliacao";

@Entity("avaliacao_anexos")
export class AvaliacaoAnexo {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Avaliacao, (avaliacao) => avaliacao.anexos, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "avaliacaoId" })
  avaliacao!: Avaliacao;

  @Column({ type: "int" })
  avaliacaoId!: number;

  @Column({ type: "varchar" })
  caminho!: string;

  @Column({ type: "varchar" })
  nomeOriginal!: string;

  @CreateDateColumn()
  criadoEm!: Date;
}
