import { ref } from "vue";

export function useUtils() {
  const getLocalDateTime = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  };

  const atualizarDataHora = (dataHoraRef) => {
    dataHoraRef.value = getLocalDateTime();
  };

  const formatDate = (isoString, timeOnly = false) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return "";
      const pad = (n) => String(n).padStart(2, "0");
      if (timeOnly) {
        return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
      }
      return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${String(
        date.getFullYear()
      ).slice(-2)} - ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
        date.getSeconds()
      )}`;
    } catch (e) {
      console.warn("Erro ao formatar data:", isoString, e);
      return "";
    }
  };

  const carregarCelulas = async (
    tipoSelecionadoRef,
    celulasRef,
    celulaSelecionadaRef
  ) => {
    const tipoCodigo = tipoSelecionadoRef.value;
    if (!tipoCodigo) {
      celulasRef.value = [];
      return;
    }

    try {
      const res = await fetch(
        `http://10.1.1.247:3000/celulas?tipo=${tipoCodigo}`
      );
      const data = await res.json();

      if (data.length && typeof data[0] === "object" && data[0].celula) {
        celulasRef.value = data.map((item) => item.celula);
      } else {
        celulasRef.value = data;
      }

      const operadorLogado = localStorage.getItem("operadorLogado");
      if (operadorLogado) {
        try {
          const dados = JSON.parse(operadorLogado);
          if (
            dados.operador?.celula &&
            celulasRef.value.includes(dados.operador.celula)
          ) {
            celulaSelecionadaRef.value = dados.operador.celula;
          }
        } catch (_) {}
      }
    } catch (err) {
      console.error("Erro ao buscar células:", err);
    }
  };

  const carregarMaquinas = async (
    tipoSelecionadoRef,
    celulaSelecionadaRef,
    maquinasRef
  ) => {
    const tipo = tipoSelecionadoRef.value;
    const celula = celulaSelecionadaRef.value;
    if (!tipo || !celula) {
      maquinasRef.value = [];
      return;
    }

    try {
      const res = await fetch(
        `http://10.1.1.247:3000/equipamentos?tipo=${tipo}&celula=${encodeURIComponent(
          celula
        )}`
      );
      const data = await res.json();
      maquinasRef.value = data
        .map((item) => ({
          id: item.codigo,
          nome: item.descricao,
        }))
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    } catch (err) {
      console.error("Erro ao buscar máquinas:", err);
    }
  };

  const alternarTodosSelecionados = (
    event,
    maquinasRef,
    maquinasSelecionadasRef
  ) => {
    if (event.target.checked) {
      maquinasSelecionadasRef.value = maquinasRef.value.map((m) => m.id);
    } else {
      maquinasSelecionadasRef.value = [];
    }
  };

  const cliqueForaDoDropdown = (
    event,
    dropdownElementOrRef,
    setMostrarDropdown
  ) => {
    let el;

    if (dropdownElementOrRef?.value instanceof HTMLElement) {
      el = dropdownElementOrRef.value;
    } else if (typeof dropdownElementOrRef === "string") {
      el = document.querySelector(dropdownElementOrRef);
    } else if (dropdownElementOrRef instanceof HTMLElement) {
      el = dropdownElementOrRef;
    }

    if (el && typeof el.contains === "function" && !el.contains(event.target)) {
      setMostrarDropdown(false);
    }
  };

  const carregarDadosOperadorLogado = (
    tipoSelecionadoRef,
    celulaSelecionadaRef = null,
    operadorSelecionadoRef = null
  ) => {
    const operadorLogado = localStorage.getItem("operadorLogado");
    if (!operadorLogado) return;

    try {
      const dados = JSON.parse(operadorLogado);
      const tipo = dados.tipoEquipamento?.toUpperCase();

      if (tipo === "JACQUARD") tipoSelecionadoRef.value = 3;
      else if (tipo === "AGULHA") tipoSelecionadoRef.value = 1;
      else if (tipo === "CROCHE") tipoSelecionadoRef.value = 2;

      if (celulaSelecionadaRef && dados.operador?.celula)
        celulaSelecionadaRef.value = dados.operador.celula;

      if (operadorSelecionadoRef && dados.operador?.nome_operador)
        operadorSelecionadoRef.value = dados.operador.nome_operador;
    } catch (e) {}
  };

  return {
    getLocalDateTime,
    atualizarDataHora,
    formatDate,
    carregarCelulas,
    carregarMaquinas,
    alternarTodosSelecionados,
    cliqueForaDoDropdown,
    carregarDadosOperadorLogado,
  };
}
