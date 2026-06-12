import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

export enum AcaoLogSistema {
  AVALIACAO_CRIADA = "AVALIACAO_CRIADA",
  AVALIACAO_EDITADA = "AVALIACAO_EDITADA",
  AVALIACAO_EXCLUIDA = "AVALIACAO_EXCLUIDA",
  ANEXO_ADICIONADO = "ANEXO_ADICIONADO",
  ANEXO_EXCLUIDO = "ANEXO_EXCLUIDO",
  SINAIS_VITAIS_REGISTRADOS = "SINAIS_VITAIS_REGISTRADOS",
}

export enum EntidadeLogSistema {
  AVALIACAO = "AVALIACAO",
  ANEXO = "ANEXO",
  SINAIS_VITAIS = "SINAIS_VITAIS",
}

@Entity("logs_sistema")
export class LogSistema {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int", nullable: true })
  usuarioId!: number | null;

  @Column({ type: "varchar", nullable: true })
  usuarioNome!: string | null;

  @Column({ type: "varchar" })
  acao!: AcaoLogSistema;

  @Column({ type: "varchar" })
  entidade!: EntidadeLogSistema;

  @Column({ type: "int", nullable: true })
  entidadeId!: number | null;

  @Column({ type: "varchar" })
  descricao!: string;

  @Column({ type: "longtext", nullable: true })
  dadosAntes!: string | null;

  @Column({ type: "longtext", nullable: true })
  dadosDepois!: string | null;

  @CreateDateColumn()
  criadoEm!: Date;
}
