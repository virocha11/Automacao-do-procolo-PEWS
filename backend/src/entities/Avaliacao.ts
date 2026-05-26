import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("avaliacoes")
export class Avaliacao {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", nullable: true })
  nomePaciente!: string | null;

  @Column({ type: "int", nullable: true })
  pacienteId!: number | null;

  @Column({ type: "varchar", nullable: true })
  avaliadorNome!: string | null;

  @Column({ type: "int", nullable: true })
  avaliadorId!: number | null;

  @Column({ type: "varchar", nullable: true })
  faixaEtaria!: string | null;

  @Column({ type: "varchar", nullable: true })
  leito!: string | null;

  @Column({ type: "varchar", nullable: true })
  diagnostico!: string | null;

  @Column({ type: "varchar", nullable: true })
  dih!: string | null;

  @Column({ type: "date", nullable: true })
  dataAvaliacao!: Date | null;

  @Column({ type: "varchar", nullable: true })
  avaliacaoRespiratoria!: string | null;

  @Column({ type: "int", default: 0 })
  pontuacaoRespiratoria!: number;

  @Column({ type: "varchar", nullable: true })
  avaliacaoCardiovascular!: string | null;

  @Column({ type: "int", default: 0 })
  pontuacaoCardiovascular!: number;

  @Column({ type: "varchar", nullable: true })
  avaliacaoNeurologica!: string | null;

  @Column({ type: "int", default: 0 })
  pontuacaoNeurologica!: number;

  @Column({ type: "int", nullable: true })
  frequenciaRespiratoria!: number | null;

  @Column({ type: "int", nullable: true })
  frequenciaCardiaca!: number | null;

  @Column({ type: "boolean", default: false })
  vigilia!: boolean;

  @Column({ type: "boolean", default: false })
  emesePosOperatorio!: boolean;

  @Column({ type: "boolean", default: false })
  nebulizacaoResgate!: boolean;

  @Column({ type: "int", default: 0 })
  pontuacaoTotal!: number;

  @Column({ type: "text", nullable: true })
  intervencao!: string | null;

  @Column({ type: "text", nullable: true })
  tempoControleSsvv!: string | null;

  @CreateDateColumn()
  criadoEm!: Date;
}
