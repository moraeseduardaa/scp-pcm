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

  async function buscarParadasAbertas(maquinasSelecionadas, dataHoraBusca) {
    const dataReferenciaTurno = getDataReferenciaTurno(toLocalISOStringFromDatetimeLocal(dataHoraBusca));
    let maquinasComParada = [];
    let maquinasSemParada = [];
    let paradasAbertasInfo = [];
    const listaMaquinas = (typeof maquinas !== 'undefined' && maquinas.value) ? maquinas.value : [];
    for (const maquinaId of maquinasSelecionadas) {
      try {
        const url = `http://10.1.1.11:3000/parada/aberta/${maquinaId}?data=${dataReferenciaTurno}`;
        const res = await fetch(url);
        if (res.status === 200) {
          const parada = await res.json();
          const maquinaEncontrada = listaMaquinas.find(m => m.id === maquinaId);
          paradasAbertasInfo.push({
            maquinaId,
            nome_equipamento: maquinaEncontrada?.nome || `ID ${maquinaId}`,
            ...parada
          });
          maquinasComParada.push(maquinaId);
        } else {
          maquinasSemParada.push(maquinaId);
        }
      } catch (e) {
        maquinasComParada.push(maquinaId);
      }
    }
    return { maquinasComParada, maquinasSemParada, paradasAbertasInfo };
  }
  
  function toLocalISOStringFromDatetimeLocal(datetimeLocalStr) {
    if (typeof datetimeLocalStr === 'string' && datetimeLocalStr.length >= 16 && datetimeLocalStr.includes('T')) {
      const [datePart, timePart] = datetimeLocalStr.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour, minute] = timePart.split(':').map(Number);
      const date = new Date(year, month - 1, day, hour, minute, 0);
      const pad = n => String(n).padStart(2, '0');
      const localStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
      return localStr;
    }
    return datetimeLocalStr;
  }

  function resetarFormulario() {
    maquinasSelecionadas.value = [];
    motivoSelecionado.value = '';
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
        .then(async res => {
          if (!res.ok) {
            let msg = '';
            try {
              const data = await res.json();
              if (data && data.existente) {
                msg = `Já existe uma parada aberta para o equipamento ${equipamento}.\nMotivo: ${data.motivo}\nOperador: ${data.operador}`;
              } else if (data && data.error) {
                msg = data.error;
              } else {
                msg = await res.text();
              }
            } catch {
              msg = await res.text();
            }
            throw new Error(msg || `Erro ao enviar dados para o equipamento ${equipamento}`);
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
        .map(p => `• ${p.nome_equipamento} — Motivo: ${p.motivo || 'Não informado'}`)
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
      await buscarParadasAbertas(maquinasSelecionadas.value, toLocalISOStringFromDatetimeLocal(dataHora.value));

    if (maquinasComParada.length > 0) {
      if (maquinasSelecionadas.value.length === 1) {
        const parada = paradasAbertasInfo[0];
        let nomeEquipamento = parada?.nome_equipamento;
        if (!nomeEquipamento) {
          const maq = maquinas.value.find(m => m.id === maquinasSelecionadas.value[0] || m.codigo === maquinasSelecionadas.value[0]);
          nomeEquipamento = maq?.nome || maq?.descricao || maquinasSelecionadas.value[0] || '';
        }
        const motivo = parada?.motivo && parada.motivo.trim() ? parada.motivo : 'Não informado';
        const operador = parada?.operador && parada.operador.trim() ? parada.operador : 'Não informado';
        alert(`Já existe uma parada aberta para o equipamento:\n"${nomeEquipamento}".\n\nMotivo: ${motivo}\nOperador: ${operador}`);
        return;
      } else {
        exibirAlertasParadaAberta(paradasAbertasInfo);
        if (maquinasSemParada.length === 0) {
          alert('Todas as máquinas selecionadas já possuem parada aberta. Não é possível iniciar nova parada.');
          return;
        }
      }
      if (maquinasSemParada.length === 0) {
        return;
      }
    }
    if (!operadorSelecionado.value || !operadorSelecionado.value.trim()) {
      await carregarDadosOperadorLogado(tipoSelecionado, celulaSelecionada, operadorSelecionado);
    }
    if (!operadorSelecionado.value || !operadorSelecionado.value.trim()) {
      const opLogin = localStorage.getItem('operador') || localStorage.getItem('usuario');
      if (opLogin) operadorSelecionado.value = opLogin;
    }

    const erros = await enviarParaEquipamentos('http://10.1.1.11:3000/parada/inicio', {
      motivo: motivoSelecionado.value,
      datahora_inicio_parada: dataHora.value,
      operador: operadorSelecionado.value,
    }, maquinasSemParada);

    if (erros.length === 0) {
      alert(`Início da parada registrado com sucesso para ${maquinasSemParada.length} equipamento(s)!`);
    } else {
      alert(`${[...new Set(erros)].join('\n')}`);
    }
    resetarFormulario();
    return;
  }

  if (acao === 'fim') {
    const { maquinasComParada, maquinasSemParada, paradasAbertasInfo } =
      await buscarParadasAbertas(maquinasSelecionadas.value, toLocalISOStringFromDatetimeLocal(dataHora.value));
    if (maquinasComParada.length === 0) {
      alert('Não há parada aberta para os equipamentos selecionados.');
      return;
    }

    paradaAbertaEncontrada.value = true;
    if (paradasAbertasInfo.length === 1) {
      const parada = paradasAbertasInfo[0];
      if (parada) {
        motivoSelecionado.value = parada.motivo || '';
        operadorSelecionado.value = parada.operador || operadorSelecionado.value || '';
      }
    }
    if (!operadorSelecionado.value || !operadorSelecionado.value.trim()) {
      await carregarDadosOperadorLogado(tipoSelecionado, celulaSelecionada, operadorSelecionado);
    }
    if (!operadorSelecionado.value || !operadorSelecionado.value.trim()) {
      const opLogin = localStorage.getItem('operador') || localStorage.getItem('usuario');
      if (opLogin) operadorSelecionado.value = opLogin;
    }
    const erros = await enviarParaEquipamentos('http://10.1.1.11:3000/parada/fim', {
      datahora_fim_parada: dataHora.value,
      operador: operadorSelecionado.value,
    }, maquinasComParada);
    let msg = '';
    if (maquinasSemParada && maquinasSemParada.length > 0) {
      const listaMaquinas = (typeof maquinas !== 'undefined' && maquinas.value) ? maquinas.value : [];
      const nomesSemParada = maquinasSemParada.map(id => {
        const maq = listaMaquinas.find(m => m.id === id || m.codigo === id);
        return maq?.nome || maq?.descricao || id;
      });
      msg += `Não há parada aberta para o(s) equipamento(s):\n${nomesSemParada.map(n => `• ${n}`).join('\n')}`;
      msg += '\n\n';
    }
    if (maquinasComParada.length > 0 && erros.length === 0) {
      msg += `Término da parada registrado com sucesso para ${maquinasComParada.length} equipamento(s)!`;
    } else if (erros.length > 0) {
      const unicos = [...new Set(erros)];
      msg += `${unicos.join('\n')}`;
    }
    if (msg) alert(msg.trim());
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