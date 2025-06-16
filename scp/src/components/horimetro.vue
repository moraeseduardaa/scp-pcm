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
      class="form-control cor-text-select mt-4 d-inline-block"
      style="background-color: #343a40; color: #fff; width: 48%; margin-right: 2%;"
    >
      <option selected disabled hidden>Selecione o Operador</option>
      <option>FELIPE GARCIA</option>
      <option>MARIA APARECIDA</option>
      <option>CECILIA EMILIANA</option>
    </select>

    <select
      name="tipo"
      v-model="tipoSelecionado"
      class="form-control cor-text-select mt-4 d-inline-block"
      style="background-color: #343a40; color: #fff; width: 48%; margin-right: 2%;"
    >
      <option selected disabled hidden value="">Selecionar Tipo Equipamento</option>
      <option :value="3">JACQUARD</option>
      <option :value="1">AGULHA</option>
      <option :value="2">CROCHE</option>
    </select>

    <select
      name="celula"
      v-model="celulaSelecionada"
      class="form-control cor-text-select mt-4 d-inline-block"
      style="background-color: #343a40; color: #fff; width: 48%; margin-right: 2%;"
      :disabled="!tipoSelecionado"
    >
      <option selected disabled hidden value="">Selecionar Célula</option>
      <option v-for="celula in celulas" :key="celula" :value="celula">
        {{ celula }}
      </option>
    </select>

    <select
      name="maquina"
      v-model="maquinaSelecionada"
      class="form-control cor-text-select mt-4 d-inline-block"
      style="background-color: #343a40; color: #fff; width: 48%; margin-right: 2%;"
      :disabled="!celulaSelecionada"
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
      tipoSelecionado: '',
      celulas: [],
      celulaSelecionada: '',
      maquinas: [],
      maquinaSelecionada: ''
    };
  },
  watch: {
    tipoSelecionado(novoTipo) {
      this.celulaSelecionada = '';
      this.celulas = [];
      this.maquinas = [];
      if (novoTipo) {
        this.carregarCelulas();
      }
    },
    celulaSelecionada(novaCelula) {
      if (novaCelula) {
        this.carregarMaquinas();
      } else {
        this.maquinas = [];
      }
    }
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
  carregarCelulas() {
    const tipoMap = { Jacquard: 3, Agulha: 1, Croche: 2 };
    const tipoCodigo = tipoMap[this.tipoSelecionado] || this.tipoSelecionado;
    if (!tipoCodigo) {
      this.celulas = [];
      return;
    }
    fetch(`http://10.1.0.238:3000/celulas?tipo=${tipoCodigo}`)
      .then(res => res.json())
      .then(data => {
        if (data.length && typeof data[0] === 'object' && data[0].celula) {
          this.celulas = data.map(item => item.celula);
        } else {
          this.celulas = data;
        }
      })
      .catch(err => {
        console.error('Erro ao buscar células:', err);
      });
  },
  carregarMaquinas() {
    const tipoCodigo = Number(this.tipoSelecionado);
    if (!this.celulaSelecionada || !tipoCodigo) {
      this.maquinas = [];
      return;
    }
    console.log('Buscando máquinas com:', {
      cod_celula: this.celulaSelecionada,
      tipo: tipoCodigo
    });
    fetch(`http://10.1.0.238:3000/equipamentos?cod_celula=${this.celulaSelecionada}&tipo=${tipoCodigo}`)
      .then(res => res.json())
      .then(data => {
        console.log('Máquinas retornadas:', data);
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
        maquinaId: this.maquinaSelecionada,
        celula: this.celulaSelecionada
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
  },
  mounted() {
  }
}
</script>
