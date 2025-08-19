<template>
  <div>
    <input type="datetime-local" v-model="dataHora" class="form-control cor-text-select mt-4" id="horimetroDataHora"
      style="background-color: #343a40; color: #fff;" />

    <div class="d-flex justify-content-between" style="gap: 2%;">
      <select name="tipo" v-model="tipoSelecionado" class="form-control cor-text-select mt-4 d-inline-block"
        :disabled="formBloqueado" style="width: 49%; background-color: #343a40; color: #fff;">
        <option selected disabled hidden value="">Selecionar Tipo Equipamento</option>
        <option :value="3">JACQUARD</option>
        <option :value="1">AGULHA</option>
        <option :value="2">CROCHE</option>
      </select>

      <select name="celula" v-model="celulaSelecionada" class="form-control cor-text-select mt-4 d-inline-block"
        style="width: 49%; background-color: #343a40; color: #fff;" :disabled="formBloqueado || !tipoSelecionado">
        <option selected disabled hidden value="">Selecionar Célula</option>
        <option v-for="celula in celulas" :key="celula" :value="celula">
          {{ celula }}
        </option>
      </select>
    </div>

    <div class="d-flex justify-content-between" style="gap: 2%;">
      <div class="dropdown mt-4" style="width: 49%; position: relative; display: inline-block;" ref="dropdownMaquinas">
        <button class="form-control text-start" style="background-color: #343a40; color: #fff;"
          @click="mostrarDropdownMaquinas = !mostrarDropdownMaquinas"
          :disabled="formBloqueado || !tipoSelecionado || !celulaSelecionada">
          {{ maquinasSelecionadas.length ? `${maquinasSelecionadas.length} selecionada(s)` : 'Selecionar Equipamento' }}
        </button>

        <div v-if="mostrarDropdownMaquinas" class="dropdown-menu show p-2"
          style="width: 100%; max-height: 348px; overflow-y: auto; background-color: #343a40; border: 1px solid #555;">

          <div class="form-check text-white mb-2">
            <input class="form-check-input" type="checkbox" id="select-all-maquinas" :checked="todosSelecionados"
              @change="alternarTodosSelecionados" />
            <label class="form-check-label" for="select-all-maquinas">
              Selecionar Todos
            </label>
          </div>
          <hr style="border-top: 1px solid #ffffff; margin: 8px 0;">

          <div v-for="(maquina, index) in maquinas" :key="maquina.id">
            <div class="form-check text-white">
              <input class="form-check-input" type="checkbox" :id="'maq-' + maquina.id" :value="maquina.id"
                v-model="maquinasSelecionadas" />
              <label class="form-check-label" :for="'maq-' + maquina.id">
                {{ maquina.nome }}
              </label>
            </div>
            <hr v-if="index < maquinas.length - 1" style="border-top: 1px solid #ffffff; margin: 8px 0;">
          </div>
        </div>
      </div>

      <select name="motivo" v-model="motivoSelecionado" class="form-control cor-text-select mt-4 d-inline-block"
        :disabled="formBloqueado" style="width: 49%; background-color: #343a40; color: #fff;">
        <option selected disabled hidden value="">Selecionar Motivo da Parada</option>
        <option v-for="motivo in motivosParada" :key="motivo">{{ motivo }}</option>
      </select>

    </div>

    <div class="mt-4 d-flex gap-4">
      <button class="btn btn-success" @click="enviarParada('inicio')">Iniciar Parada</button>
      <button class="btn btn-danger" @click="enviarParada('fim')">Terminar Parada</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue';
import { useUtils } from '@/composables/MetodosCompartilhados.js';

const {
  getLocalDateTime,
  atualizarDataHora,
  carregarCelulas,
  carregarMaquinas,
  cliqueForaDoDropdown,
  carregarDadosOperadorLogado,
  getDataReferenciaTurno,
} = useUtils();

const dataHora = ref(getLocalDateTime());
const tipoSelecionado = ref('');
const celulaSelecionada = ref('');
const maquinasSelecionadas = ref([]);
const mostrarDropdownMaquinas = ref(false);
const dropdownMaquinas = ref(null);
const motivoSelecionado = ref('');
const operadorSelecionado = ref('');
const motivosParada = ref([]);
const celulas = ref([]);
const maquinas = ref([]);
const formBloqueado = ref(false);
const botaoInicioDesabilitado = ref(false);
const paradaAbertaEncontrada = ref(true);

const ApiJson = async (url) => {
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data;
  } catch (e) {
    console.warn(`Erro ao buscar ${url}:`, e);
    return null;
  }
};

const carregarMotivosParada = async () => {
  const data = await ApiJson('http://10.1.1.11:3000/motivos-parada');
  motivosParada.value = Array.isArray(data)
    ? data
      .map(item => typeof item === 'string' ? item : item.motivo)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
    : [];
};

const cliqueFora = (event) => {
  cliqueForaDoDropdown(event, dropdownMaquinas, (val) => (mostrarDropdownMaquinas.value = val));
};

const todosSelecionados = computed(() =>
  maquinas.value.length > 0 && maquinasSelecionadas.value.length === maquinas.value.length
);

const alternarTodosSelecionados = (event) => {
  maquinasSelecionadas.value = event.target.checked
    ? maquinas.value.map(m => m.id)
    : [];
};

watch(tipoSelecionado, async (novoTipo) => {
  if (novoTipo) {
    await carregarCelulas(tipoSelecionado, celulas, celulaSelecionada);
  } else {
    celulas.value = [];
    celulaSelecionada.value = '';
  }
});

watch(celulaSelecionada, async (novaCelula) => {
  if (tipoSelecionado.value && novaCelula) {
    await carregarMaquinas(tipoSelecionado, celulaSelecionada, maquinas);
  } else {
    maquinas.value = [];
  }
});

async function enviarParada(acao) {
  if (!maquinasSelecionadas.value.length) {
    alert('Selecione um ou mais equipamentos');
    return;
  }

  const dataReferenciaTurno = getDataReferenciaTurno(dataHora.value);

  async function buscarParadasAbertas(maquinas, dataReferencia) {
    let maquinasComParada = [];
    let maquinasSemParada = [];
    let paradasAbertasInfo = [];

    for (const maquinaId of maquinas) {
      try {
        const res = await fetch(`http://10.1.1.11:3000/parada/aberta/${maquinaId}?data=${dataReferencia}`);
        if (res.status === 200) {
          const parada = await res.json();
          const maquinaEncontrada = maquinas.value.find(m => m.id === maquinaId);
          paradasAbertasInfo.push({
            maquinaId,
            nome_equipamento: maquinaEncontrada?.nome || `ID ${maquinaId}`,
            ...parada
          });
          maquinasComParada.push(maquinaId);
        } else {
          maquinasSemParada.push(maquinaId);
        }
      } catch {
        maquinasComParada.push(maquinaId);
      }
    }
    return { maquinasComParada, maquinasSemParada, paradasAbertasInfo };
  }

  function resetarFormulario() {
    maquinasSelecionadas.value = [];
    motivoSelecionado.value = '';
    operadorSelecionado.value = '';
    formBloqueado.value = false;
    botaoInicioDesabilitado.value = false;
    paradaAbertaEncontrada.value = false;
    mostrarDropdownMaquinas.value = false;
    atualizarDataHora(dataHora);
  }

  async function enviarParaEquipamentos(url, corpoBase, maquinas) {
    let erros = [];
    const promises = maquinas.map(equipamento => {
      const corpo = { ...corpoBase, equipamento };
      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      })
        .then(res => {
          if (!res.ok) {
            return res.text().then(text => {
              throw new Error(text || `Erro ao enviar dados para o equipamento ${equipamento}`);
            });
          }
        })
        .catch(err => {
          erros.push(err.message || `Erro no equipamento ${equipamento}`);
        });
    });
    await Promise.all(promises);
    return erros;
  }

  function exibirAlertasParadaAberta(paradas) {
    if (paradas.length === 1 && paradas[0].motivo && paradas[0].operador) {
      alert(`Já existe uma parada aberta para o equipamento:\n"${paradas[0].nome_equipamento}".\n\nMotivo: ${paradas[0].motivo}\nOperador: ${paradas[0].operador}`);
    } else if (paradas.length > 1) {
      const listaEquipamentos = paradas
        .map(p => `• ${p.nome_equipamento} — Motivo: ${p.motivo}`)
        .join('\n\n');
      alert(`Já existe parada aberta para os seguintes equipamentos:\n\n${listaEquipamentos}`);
    }
  }
  
  if (acao === 'inicio') {
    if (!motivoSelecionado.value?.trim()) {
      alert('Selecione um motivo');
      return;
    }

    const { maquinasComParada, maquinasSemParada, paradasAbertasInfo } =
      await buscarParadasAbertas(maquinasSelecionadas.value, dataReferenciaTurno);

    if (
      maquinasSelecionadas.value.length > 1 &&
      maquinasComParada.length === maquinasSelecionadas.value.length &&
      paradasAbertasInfo.length === maquinasSelecionadas.value.length &&
      paradasAbertasInfo.every(
        info => info.motivo === paradasAbertasInfo[0].motivo && info.operador === paradasAbertasInfo[0].operador
      )
    ) {
      paradaAbertaEncontrada.value = true;
      motivoSelecionado.value = paradasAbertasInfo[0].motivo || '';
      operadorSelecionado.value = paradasAbertasInfo[0].operador || operadorSelecionado.value || '';
      dataHora.value = getLocalDateTime();
      formBloqueado.value = false;
      botaoInicioDesabilitado.value = false;
      mostrarDropdownMaquinas.value = false;
      exibirAlertasParadaAberta(paradasAbertasInfo);
      return;
    }
    if (maquinasSelecionadas.value.length === 1 && maquinasComParada.length === 1) {
      paradaAbertaEncontrada.value = true;
      const parada = paradasAbertasInfo[0];
      motivoSelecionado.value = parada.motivo || '';
      operadorSelecionado.value = parada.operador || operadorSelecionado.value || '';
      dataHora.value = getLocalDateTime();
      formBloqueado.value = true;
      botaoInicioDesabilitado.value = true;
      mostrarDropdownMaquinas.value = false;
      exibirAlertasParadaAberta(paradasAbertasInfo);
      return;
    }
    if (maquinasSelecionadas.value.length > 1 && maquinasComParada.length > 0) {
      exibirAlertasParadaAberta(paradasAbertasInfo);
    }
    if (maquinasSemParada.length === 0) {
      alert('Todas as máquinas selecionadas já possuem parada aberta. Não é possível iniciar nova parada.');
      return;
    }
    if (!operadorSelecionado.value) {
      await carregarDadosOperadorLogado(tipoSelecionado, celulaSelecionada, operadorSelecionado);
    }

    const erros = await enviarParaEquipamentos('http://10.1.1.11:3000/parada/inicio', {
      motivo: motivoSelecionado.value,
      datahora_inicio_parada: dataHora.value,
      operador: operadorSelecionado.value,
    }, maquinasSemParada);

    if (erros.length === 0) {
      alert(`Início da parada registrado com sucesso para ${maquinasSemParada.length} equipamento(s)!`);
    } else {
      alert(`Alguns erros ocorreram:\n${[...new Set(erros)].join('\n')}`);
    }
    resetarFormulario();
    return;
  }

  if (acao === 'fim') {
    const { maquinasComParada, paradasAbertasInfo } =
      await buscarParadasAbertas(maquinasSelecionadas.value, dataReferenciaTurno);
    if (maquinasComParada.length === 0) {
      alert('Não há parada aberta para os equipamentos selecionados.');
      return;
    }

    paradaAbertaEncontrada.value = true;
    if (paradasAbertasInfo.length === 1) {
      motivoSelecionado.value = paradasAbertasInfo[0].motivo || '';
      operadorSelecionado.value = paradasAbertasInfo[0].operador || operadorSelecionado.value || '';
    }
    const erros = await enviarParaEquipamentos('http://10.1.1.11:3000/parada/fim', {
      datahora_fim_parada: dataHora.value,
      operador: operadorSelecionado.value || '',
    }, maquinasComParada);
    if (erros.length === 0) {
      alert('Término da parada registrado com sucesso!');
    } else {
      const unicos = [...new Set(erros)];
      alert(`Alguns erros ocorreram:\n${unicos.join('\n')}`);
    }
    resetarFormulario();
    return;
  }
}

onMounted(async () => {
  carregarDadosOperadorLogado(tipoSelecionado, celulaSelecionada, operadorSelecionado);
  if (tipoSelecionado.value) {
    await carregarCelulas(tipoSelecionado, celulas, celulaSelecionada);
  }
  if (tipoSelecionado.value && celulaSelecionada.value) {
    await carregarMaquinas(tipoSelecionado, celulaSelecionada, maquinas);
  }
  await carregarMotivosParada();
  document.addEventListener('mousedown', cliqueFora);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', cliqueFora);
});

</script>