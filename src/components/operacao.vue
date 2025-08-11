<template>
  <div>
    <input type="datetime-local" name="datahora" v-model="dataHora" class="form-control cor-text-select mt-4"
      id="horimetroDataHora" style="background-color: #343a40; color: #fff;" />

    <div class="d-flex justify-content-between" style="gap: 2%;">
      <select name="tipo" v-model="tipoSelecionado" class="form-control cor-text-select mt-4 d-inline-block"
        style="width: 49%; background-color: #343a40; color: #fff;">
        <option selected disabled hidden value="">Selecionar Tipo Equipamento</option>
        <option :value="3">JACQUARD</option>
        <option :value="1">AGULHA</option>
        <option :value="2">CROCHE</option>
      </select>

      <select name="celula" v-model="celulaSelecionada" class="form-control cor-text-select mt-4 d-inline-block"
        style="width: 49%; background-color: #343a40; color: #fff;" :disabled="!tipoSelecionado">
        <option selected disabled hidden value="">Selecionar Célula</option>
        <option v-for="celula in celulas" :key="celula" :value="celula">
          {{ celula }}
        </option>
      </select>
    </div>

    <div class="d-flex justify-content-between" style="gap: 2%;">
      <div class="dropdown mt-4" style="width: 100%; position: relative;" ref="dropdownMaquinas">
        <button class="form-control text-start" style="background-color: #343a40; color: #fff;"
          @click="mostrarDropdownMaquinas = !mostrarDropdownMaquinas"
          :disabled="!tipoSelecionado || !celulaSelecionada">
          {{ maquinasSelecionadas.length ? `${maquinasSelecionadas.length} selecionada(s)` : 'Selecionar Equipamento' }}
        </button>

        <div v-if="mostrarDropdownMaquinas" class="dropdown-menu show p-2"
          style="width: 100%; max-height: 348px; overflow-y: auto; background-color: #343a40; border: 1px solid #555;">

          <div class="form-check text-white mb-2">
            <input class="form-check-input" type="checkbox" id="select-all-maquinas" :checked="todosSelecionados"
              @change="onAlternarTodosSelecionados" />
            <label class="form-check-label" for="select-all-maquinas">
              Selecionar Todos
            </label>
          </div>
          <hr style="border-top: 1px solid #ffffff; margin: 8px 0;">

          <div v-for="(maquina, index) in maquinas" :key="maquina.id">
            <div class="form-check text-white">
              <input class="form-check-input" type="checkbox" :id="'maq-' + maquina.id" :value="maquina.id"
                v-model="maquinasSelecionadas" @mousedown.stop />
              <label class="form-check-label" :for="'maq-' + maquina.id">
                {{ maquina.nome }}
              </label>
            </div>
            <hr v-if="index < maquinas.length - 1" style="border-top: 1px solid #ffffff; margin: 8px 0;">
          </div>
        </div>
      </div>
    </div>

    <div class="mt-4 d-flex gap-4">
      <button class="btn btn-success" @click="registrarOperacao('inicio')"
        :disabled="botaoInicioDesabilitado">Início</button>
      <button class="btn btn-danger" @click="registrarOperacao('fim')" :disabled="botaoFimDesabilitado">Fim</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed } from "vue";
import { useUtils } from "@/composables/MetodosCompartilhados.js";

const dataHora = ref("");
const tipoSelecionado = ref("");
const celulas = ref([]);
const celulaSelecionada = ref("");
const maquinas = ref([]);
const maquinasSelecionadas = ref([]);
const mostrarDropdownMaquinas = ref(false);
const dropdownMaquinas = ref(null);
const botaoInicioDesabilitado = ref(false);
const botaoFimDesabilitado = ref(false);

const {
  getLocalDateTime,
  atualizarDataHora,
  formatDate,
  carregarCelulas,
  carregarMaquinas,
  alternarTodosSelecionados,
  cliqueForaDoDropdown,
  carregarDadosOperadorLogado,
  getDataReferenciaTurno,
} = useUtils();

dataHora.value = getLocalDateTime();

watch(tipoSelecionado, (novoTipo) => {
  celulaSelecionada.value = "";
  celulas.value = [];
  maquinas.value = [];
  if (novoTipo) {
    carregarCelulas(tipoSelecionado, celulas, celulaSelecionada);
  }
});

watch(celulaSelecionada, (novaCelula) => {
  if (tipoSelecionado.value && novaCelula) {
    carregarMaquinas(tipoSelecionado, celulaSelecionada, maquinas);
  } else {
    maquinas.value = [];
  }
});

watch(maquinasSelecionadas, () => {
  verificarOperacaoAberta();
});

const todosSelecionados = computed(() => {
  return (
    maquinas.value.length > 0 &&
    maquinasSelecionadas.value.length === maquinas.value.length
  );
});

function onAlternarTodosSelecionados(event) {
  alternarTodosSelecionados(event, maquinas, maquinasSelecionadas);
}

function onCliqueForaDoDropdown(event) {
  cliqueForaDoDropdown(event, dropdownMaquinas, (val) => (mostrarDropdownMaquinas.value = val));
}

async function buscarRegistroAberto(equipamento, dataDia) {
  try {
    const res = await fetch(
      `http://10.1.1.11:3000/horimetro/aberto/${equipamento}?data=${dataDia}`
    );
    if (res.ok && res.status !== 204) return await res.json();
  } catch (_) { }
  return null;
}

async function enviarRequisicao(url, metodo, payload) {
  try {
    const res = await fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (url.includes("/operacao/inicio") && res.status === 200) {
      throw new Error("__JA_ABERTO__");
    }

    if (!res.ok) {
      const texto = await res.text();
      if (
        res.status === 409 &&
        texto.includes("Não há registro aberto para encerrar")
      ) {
        throw new Error("__NAO_HA_OPERACAO_ABERTA__");
      }
      throw new Error(texto || "Erro ao enviar requisição");
    }

    return true;
  } catch (err) {
    throw err?.message || "Erro inesperado na requisição";
  }
}

async function registrarOperacao(tipo) {
  if (!maquinasSelecionadas.value.length) {
    alert("Selecione uma ou mais máquinas");
    return;
  }

  const hora = dataHora.value;
  const url = `http://10.1.1.11:3000/operacao/${tipo}`;
  const erros = [];
  let jaAbertoCount = 0;
  let nenhumParaEncerrarCount = 0;

  const promises = maquinasSelecionadas.value.map(async (equipamento) => {
    const dataDia = getDataReferenciaTurno(hora);
    if (tipo === "inicio") {
      const registro = await buscarRegistroAberto(equipamento, dataDia);
      if (
        registro &&
        registro.ini_1t &&
        registro.fim_1t &&
        registro.ini_2t
      ) {
        jaAbertoCount++;
        return;
      }
    }
    try {
      await enviarRequisicao(url, "POST", { equipamento, hora, data: dataDia });
    } catch (e) {
      if (e === "__JA_ABERTO__" && tipo === "inicio") {
        jaAbertoCount++;
      } else if (e === "__NAO_HA_OPERACAO_ABERTA__" && tipo === "fim") {
        nenhumParaEncerrarCount++;
      } else {
        erros.push(`Erro em ${equipamento}: ${e}`);
      }
    }
  });

  await Promise.all(promises);
  const total = maquinasSelecionadas.value.length;
  const sucessoCount = total - jaAbertoCount - nenhumParaEncerrarCount - erros.length;
  const mensagens = [];

  if (jaAbertoCount > 0 && tipo === "inicio") {
    mensagens.push(
      `Já existe início de operação aberta para ${jaAbertoCount} equipamento(s).`
    );
  }
  if (nenhumParaEncerrarCount > 0 && tipo === "fim") {
    mensagens.push(
      `Operação já encerrada em ${nenhumParaEncerrarCount} equipamento(s).`
    );
  }
  if (sucessoCount > 0) {
    const texto = tipo === "inicio" ? "Início" : "Fim";
    mensagens.push(`\n${texto} registrado com sucesso para ${sucessoCount} equipamento(s).`);
  }
  if (erros.length > 0) {
    mensagens.push("Erros:\n" + erros.join("\n"));
  }

  alert(mensagens.join("\n"));
  maquinasSelecionadas.value = [];
  dataHora.value = getLocalDateTime();
  verificarOperacaoAberta();
}

async function verificarOperacaoAberta() {
  const [equipamento] = maquinasSelecionadas.value;

  if (!equipamento || maquinasSelecionadas.value.length !== 1) {
    botaoInicioDesabilitado.value = false;
    botaoFimDesabilitado.value = false;
    return;
  }

  const dataDia = getDataReferenciaTurno(dataHora.value);
  const registro = await buscarRegistroAberto(equipamento, dataDia);
  const { ini_1t = null, fim_1t = null, ini_2t = null, fim_2t = null } = registro || {};

  if (!ini_1t) {
    botaoInicioDesabilitado.value = false;
    botaoFimDesabilitado.value = true;
  } else if (ini_1t && !fim_1t) {
    botaoInicioDesabilitado.value = true;
    botaoFimDesabilitado.value = false;
  } else if (fim_1t && !ini_2t) {
    botaoInicioDesabilitado.value = false;
    botaoFimDesabilitado.value = true;
  } else if (ini_2t && !fim_2t) {
    botaoInicioDesabilitado.value = true;
    botaoFimDesabilitado.value = false;
  } else {
    botaoInicioDesabilitado.value = true;
    botaoFimDesabilitado.value = true;
  }
}

onMounted(() => {
  carregarDadosOperadorLogado(tipoSelecionado, celulaSelecionada);
  document.addEventListener('mousedown', onCliqueForaDoDropdown);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onCliqueForaDoDropdown);
});

</script>