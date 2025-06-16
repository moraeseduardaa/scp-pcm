<template>
  <div>
    <input
      type="datetime-local"
      name="datahora"
      class="form-control cor-text-select mt-4"
      id="horimetroDataHora"
      style="background-color: #343a40; color: #fff;"
      :value="dataHora"
      readonly
    />

    <select
      name="operador"
      class="form-control cor-text-select mt-4"
      style="background-color: #343a40; color: #fff;"
    >
      <option selected disabled hidden>Selecione o Operador</option>
      <option>Felipe Garcia</option>
      <option>Maria Aparecida</option>
      <option>Cecilia Emiliana</option>
    </select>

    <select
      name="maquina"
      v-model="maquinaSelecionada"
      class="form-control cor-text-select mt-4"
      style="background-color: #343a40; color: #fff;"
    >
      <option disabled value="">Selecione a Máquina</option>
      <option v-for="maquina in maquinas" :key="maquina.id" :value="maquina.id">
        {{ maquina.nome }}
      </option>
    </select>


    <button class="btn btn-danger mt-4" @click="enviarHorimetro">Registrar</button>

  </div>
</template>

<script>
export default {
  name: 'Horimetro',
  data() {
    return {
      dataHora: this.getLocalDateTime(),
      maquinas: [],              
      maquinaSelecionada: ''    
    };
  },
  mounted() {
    this.carregarMaquinas();
  },
  methods: {
    getLocalDateTime() {
      const now = new Date();
      const offset = now.getTimezoneOffset();
      const local = new Date(now.getTime() - offset * 60000);
      return local.toISOString().slice(0, 16);
    },
    atualizarDataHora() {
      this.dataHora = this.getLocalDateTime();
    },
  formatDate(isoString, timeOnly = false) {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '';
      const pad = (n) => String(n).padStart(2, '0');
      if (timeOnly) {
        return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
      }
      return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${String(date.getFullYear()).slice(-2)} - ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    } catch (e) {
      console.warn('Erro ao formatar data:', isoString, e);
      return '';
    }
  },
  carregarMaquinas() {
    fetch('http://10.1.0.238:3000/equipamentos')
      .then(res => res.json())
      .then(data => {
        this.maquinas = data.map(item => ({
          id: item.codigo, 
          nome: item.descricao 
        }));
      })
      .catch(err => {
        console.error('Erro ao buscar máquinas:', err);
      });
  },
  enviarHorimetro() {
    if (!this.maquinaSelecionada) {
      alert('Selecione uma máquina');
      return;
    }

    fetch('http://10.1.0.238:3000/horimetro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataHora: this.dataHora,
        operadorId: 1, 
        maquinaId: this.maquinaSelecionada
      })
    })
      .then(res => {
        if (res.ok) {
          alert('Horímetro salvo com sucesso!');
          this.maquinaSelecionada = ''; 
          throw new Error('Erro ao salvar');
        }
      })
      .catch(err => {
        console.error(err);
        alert('Erro ao salvar horímetro');
      });
    }
  }
}
</script>
