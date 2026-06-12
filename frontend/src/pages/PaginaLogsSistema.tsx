import { App, Button, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ReloadOutlined } from "@ant-design/icons";
import { useCallback, useEffect, useState } from "react";
import { apiListarLogsSistema } from "../api/logSistemaServico";
import { useSessao } from "../contexts/SessaoContext";
import type { LogSistema } from "../types/logSistema";

const verde = "#1f6b3a";

function formatarDataHora(valor: string | null | undefined) {
  if (!valor) {
    return "-";
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(data);
}

function rotuloAcao(acao: string) {
  const rotulos: Record<string, string> = {
    AVALIACAO_CRIADA: "Avaliação criada",
    AVALIACAO_EDITADA: "Avaliação editada",
    AVALIACAO_EXCLUIDA: "Avaliação excluída",
    ANEXO_ADICIONADO: "Anexo adicionado",
    ANEXO_EXCLUIDO: "Anexo excluído",
  };

  return rotulos[acao] ?? acao;
}

function corAcao(acao: string) {
  if (acao.includes("EXCLUID")) {
    return "red";
  }

  if (acao.includes("EDITAD")) {
    return "gold";
  }

  return "green";
}

function rotuloEntidade(entidade: string) {
  const rotulos: Record<string, string> = {
    AVALIACAO: "Avaliação",
    ANEXO: "Anexo",
  };

  return rotulos[entidade] ?? entidade;
}

export function PaginaLogsSistema() {
  const { message } = App.useApp();
  const { token } = useSessao();
  const [logs, setLogs] = useState<LogSistema[]>([]);
  const [carregando, setCarregando] = useState(false);

  const carregarLogs = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setCarregando(true);
      const dados = await apiListarLogsSistema(token);
      setLogs(dados);
    } catch (e) {
      message.error(
        e instanceof Error ? e.message : "Não foi possível carregar os logs."
      );
    } finally {
      setCarregando(false);
    }
  }, [message, token]);

  useEffect(() => {
    const temporizadorCarregamento = window.setTimeout(() => {
      void carregarLogs();
    }, 0);

    return () => window.clearTimeout(temporizadorCarregamento);
  }, [carregarLogs]);

  const colunas: ColumnsType<LogSistema> = [
    {
      title: "Data",
      dataIndex: "criadoEm",
      key: "criadoEm",
      width: 170,
      render: (valor: string) => formatarDataHora(valor),
    },
    {
      title: "Usuário",
      dataIndex: "usuarioNome",
      key: "usuarioNome",
      width: 220,
      render: (valor: string | null | undefined) => valor ?? "-",
    },
    {
      title: "Ação",
      dataIndex: "acao",
      key: "acao",
      width: 190,
      render: (valor: string) => (
        <Tag color={corAcao(valor)}>{rotuloAcao(valor)}</Tag>
      ),
    },
    {
      title: "Item afetado",
      dataIndex: "entidade",
      key: "entidade",
      width: 130,
      render: (valor: string, log) =>
        `${rotuloEntidade(valor)}${log.entidadeId ? ` #${log.entidadeId}` : ""}`,
    },
    {
      title: "Descrição",
      dataIndex: "descricao",
      key: "descricao",
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Space
        align="center"
        style={{ justifyContent: "space-between", width: "100%" }}
      >
        <Typography.Title level={2} style={{ color: verde, margin: 0 }}>
          Logs do sistema
        </Typography.Title>
        <Button
          icon={<ReloadOutlined />}
          loading={carregando}
          onClick={() => void carregarLogs()}
        >
          Atualizar
        </Button>
      </Space>

      <Table<LogSistema>
        rowKey="id"
        loading={carregando}
        columns={colunas}
        dataSource={logs}
        pagination={{ pageSize: 12 }}
      />
    </Space>
  );
}
