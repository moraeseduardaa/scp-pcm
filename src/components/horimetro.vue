<template>
  <div>
    <input type="datetime-local" name="datahora" v-model="dataHora" class="form-control cor-text-select mt-4"
      id="horimetroDataHora" style="background-color: #343a40; color: #fff;" />

    <div class="d-flex justify-content-between" style="gap: 2%;">
    <select name="tipo" v-model.number="tipoSelecionado" class="form-control cor-text-select mt-4 d-inline-block"
      style="width: 49%; background-color: #343a40; color: #fff;">
      <option selected disabled hidden :value="null">Selecionar Tipo Equipamento</option>
      <option :value="3">JACQUARD</option>
      <option :value="1">AGULHA</option>
      <option :value="2">CROCHE</option>
    </select>

    <select name="celula" v-model.number="celulaSelecionada" class="form-control cor-text-select mt-4 d-inline-block"
      style="width: 49%; background-color: #343a40; color: #fff;" :disabled="!tipoSelecionado">
      <option selected disabled hidden :value="null">Selecionar Célula</option>
      <option v-for="celula in celulas" :key="celula" :value="celula">
        {{ celula }}
      </option>
    </select>
    </div>

    <div class="d-flex justify-content-between" style="gap: 2%;">
      <select name="maquina" v-model="maquinaSelecionada" :disabled="!tipoSelecionado || !celulaSelecionada"
        class="form-control cor-text-select mt-4 d-inline-block"
        style="width: 49%; background-color: #343a40; color: #fff;">
        <option disabled value="">Selecionar Equipamento</option>
        <option v-for="maquina in maquinas" :key="maquina.id" :value="maquina.id">
          {{ maquina.nome }}
        </option>
      </select>

      <select name="periodo" v-model="periodoSelecionado" class="form-control cor-text-select mt-4 d-inline-block"
        style="width: 49%; background-color: #343a40; color: #fff;">
        <option selected disabled hidden value="">Selecionar Período</option>
        <option value="FIM DO 1° TURNO">1° TURNO</option>
        <option value="FIM DO 2° TURNO">2° TURNO</option>
      </select>
    </div>

    <input type="time" name="horimetro" v-model="horimetroValue"
      class="form-control cor-text-select mt-4 d-inline-block" style="background-color: #343a40; color: #fff;"
      id="horimetro" placeholder="Adicione o Horímetro" />

    <button class="btn btn-danger mt-4" @click="enviarHorimetro">Registrar</button>

  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useUtils } from '@/composables/MetodosCompartilhados.js';

const { getLocalDateTime, formatDate, carregarCelulas, carregarMaquinas, carregarDadosOperadorLogado } = useUtils();

const dataHora = ref(getLocalDateTime());
const tipoSelecionado = ref(null); 
const celulas = ref([]);
const celulaSelecionada = ref(null);
const maquinas = ref([]);
const maquinaSelecionada = ref('');
const horimetroValue = ref('');
const periodoSelecionado = ref('');
const operadorSelecionado = ref('');

watch(tipoSelecionado, (novoTipo) => {
  celulaSelecionada.value = null;
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

function enviarHorimetro() {
  if (!maquinaSelecionada.value) {
    alert('Selecione uma máquina');
    return;
  }
  if (!periodoSelecionado.value) {
    alert('Selecione um período');
    return;
  }
  if (!horimetroValue.value) {
    alert('Preencha o horímetro');
    return;
  }
  const equipamentos = [maquinaSelecionada.value];
  let erros = [];
  const promises = equipamentos.map(equipamento => {
    const dataHoraEnvio = new Date(dataHora.value);
    const dataBusca = new Date(dataHoraEnvio);
    if (periodoSelecionado.value === 'FIM DO 2° TURNO') {
      dataBusca.setDate(dataBusca.getDate() - 1);
    }
    const payload = {
      equipamento,
      dataHora: new Date(dataHoraEnvio.getTime() - (dataHoraEnvio.getTimezoneOffset() * 60000)).toISOString(),
      dataBusca: dataBusca.toISOString().split('T')[0],
      horimetro: horimetroValue.value,
      periodo: periodoSelecionado.value
    };
    return fetch('http://10.1.1.247:3000/horimetro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) {
          return res.text().then(text => {
            throw new Error(text || `Erro ao salvar para equipamento ${equipamento}`);
          });
        }
      })
      .catch(err => {
        erros.push(err.message || `Erro no equipamento ${equipamento}`);
      });
  });
  Promise.all(promises).then(() => {
    if (erros.length === 0) {
      alert('Horímetro salvo com sucesso!');
    } else {
      alert(`Alguns erros ocorreram:\n${erros.join('\n')}`);
    }
    maquinaSelecionada.value = '';
    horimetroValue.value = '';
    dataHora.value = getLocalDateTime();
  });
}

onMounted(() => {
  carregarDadosOperadorLogado(tipoSelecionado, celulaSelecionada, operadorSelecionado);
});
</script>