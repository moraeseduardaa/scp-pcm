<template>
  <div>
    <input
      type="datetime-local"
      name="datahora"
      v-model="dataHora"
      class="form-control cor-text-select mt-4"
      id="horimetroDataHora"
      style="background-color: #343a40; color: #fff;"
    />

    <div class="d-flex justify-content-between" style="gap: 2%;">
    <select name="tipo" v-model="tipoSelecionado" class="form-control cor-text-select mt-4 d-inline-block"
      style="width: 49%; background-color: #343a40; color: #fff;">
      <option selected disabled hidden value="">Selecionar Tipo Equipamento</option>
      <option :value="3">JACQUARD</option>
      <option :value="1">AGULHA</option>
      <option :value="2">CROCHE</option>
    </select>

    <select name="celula" v-model="celulaSelecionada" class="form-control cor-text-select mt-4 d-inline-block"
      style="width: 49%; background-color: #343a40; color: #fff;"
      :disabled="!tipoSelecionado">
      <option selected disabled hidden value="">Selecionar Célula</option>
      <option v-for="celula in celulas" :key="celula" :value="celula">
        {{ celula }}
      </option>
    </select>
    </div>

    <div class="d-flex justify-content-between" style="gap: 2%;">
    <select name="maquina" v-model="maquinaSelecionada" 
      :disabled="!tipoSelecionado || !celulaSelecionada"
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

    <input
      type="time"
      name="horimetro"
      v-model="horimetroValue"
      class="form-control cor-text-select mt-4 d-inline-block"
      style="background-color: #343a40; color: #fff;"
      id="horimetro"
      placeholder="Adicione o Horímetro"
    />

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
      maquinaSelecionada: '',
      horimetroValue: '',
      periodoSelecionado: ''
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
      if (this.tipoSelecionado && novaCelula) {
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
      const tipoCodigo = this.tipoSelecionado;
      if (!tipoCodigo) {
        this.celulas = [];
        return;
      }
      fetch(`http://10.1.1.247:3000/celulas?tipo=${tipoCodigo}`)
        .then(res => res.json())
        .then(data => {
          if (data.length && typeof data[0] === 'object' && data[0].celula) {
            this.celulas = data.map(item => item.celula);
          } else {
            this.celulas = data;
          }
          const operadorLogado = localStorage.getItem('operadorLogado');
          if (operadorLogado) {
            try {
              const dados = JSON.parse(operadorLogado);
              if (dados.operador && dados.operador.celula && this.celulas.includes(dados.operador.celula)) {
                this.celulaSelecionada = dados.operador.celula;
              }
            } catch (e) {}
          }
        })
        .catch(err => {
          console.error('Erro ao buscar células:', err);
        });
    },
    carregarMaquinas() {
      const tipoCodigo = this.tipoSelecionado;
      if (!this.celulaSelecionada || !tipoCodigo) {
        this.maquinas = [];
        return;
      }
      fetch(`http://10.1.1.247:3000/equipamentos?tipo=${this.tipoSelecionado}&celula=${encodeURIComponent(this.celulaSelecionada)}`)
        .then(res => res.json())
        .then(data => {
          this.maquinas = data
            .map(item => ({
              id: item.codigo,
              nome: item.descricao
            }))
            .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
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

      if (!this.periodoSelecionado) {
        alert('Selecione um período');
        return;
      }

      if (!this.horimetroValue) {
        alert('Preencha o horímetro');
        return;
      }

      const equipamentos = [this.maquinaSelecionada];

      let erros = [];

      const promises = equipamentos.map(equipamento => {
        const payload = {
          equipamento,
          dataHora: this.dataHora,
          horimetro: this.horimetroValue,
          periodo: this.periodoSelecionado
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

        this.maquinaSelecionada = '';
        this.horimetroValue = '';
        this.dataHora = this.getLocalDateTime();
      });
    }
  },
  mounted() {
    const operadorLogado = localStorage.getItem('operadorLogado');
    if (operadorLogado) {
      try {
        const dados = JSON.parse(operadorLogado);
        if (dados.tipoEquipamento) {
          if (dados.tipoEquipamento.toUpperCase() === 'JACQUARD') this.tipoSelecionado = 3;
          else if (dados.tipoEquipamento.toUpperCase() === 'AGULHA') this.tipoSelecionado = 1;
          else if (dados.tipoEquipamento.toUpperCase() === 'CROCHE') this.tipoSelecionado = 2;
        }
        if (dados.operador && dados.operador.nome_operador) {
          this.operadorSelecionado = dados.operador.nome_operador;
        }
      } catch (e) {}
    }
  }
}
</script>