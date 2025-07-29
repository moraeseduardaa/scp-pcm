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
      <div class="dropdown mt-4" style="width: 100%; position: relative;">
        <button class="form-control text-start" style="background-color: #343a40; color: #fff;"
          @click="mostrarDropdownMaquinas = !mostrarDropdownMaquinas"
          :disabled="!tipoSelecionado || !celulaSelecionada">
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
    </div>

    <div class="mt-4 d-flex gap-4">
      <button class="btn btn-success" @click="registrarInicio">Início</button>
      <button class="btn btn-danger" @click="registrarFim">Fim</button>
    </div>
    


    
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
      mostrarDropdownMaquinas: false,
      maquinasSelecionadas: [],
    };
  },
  computed: {
    todosSelecionados() {
      return this.maquinas.length > 0 &&
        this.maquinasSelecionadas.length === this.maquinas.length;
    }
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
            } catch (e) { }
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
    alternarTodosSelecionados(event) {
      if (event.target.checked) {
        this.maquinasSelecionadas = this.maquinas.map(m => m.id);
      } else {
        this.maquinasSelecionadas = [];
      }
    },
    cliqueForaDoDropdown(event) {
      if (this.mostrarDropdownMaquinas) {
        const dropdown = this.$el.querySelector('.dropdown');
        if (dropdown && !dropdown.contains(event.target)) {
          this.mostrarDropdownMaquinas = false;
        }
      }
    },
    async registrarInicio() {
      if (!this.maquinasSelecionadas.length) {
        alert('Selecione uma ou mais máquinas');
        return;
      }
      const erros = [];
      const promises = this.maquinasSelecionadas.map(async equipamento => {
        let registro;
        try {
          const res = await fetch(`http://10.1.1.247:3000/horimetro/aberto/${equipamento}`);
          if (res.status === 200) {
            registro = await res.json();
          }
        } catch (e) {}

        if (!registro) {
          const payload = {
            equipamento,
            ini_1t: this.dataHora,
          };
          return fetch('http://10.1.1.247:3000/horimetro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
            .then(res => {
              if (!res.ok) {
                return res.text().then(text => { throw new Error(text || `Erro ao registrar início para ${equipamento}`); });
              }
            })
            .catch(err => { erros.push(err.message || `Erro no equipamento ${equipamento}`); });
        } else if (registro.ini_1t && registro.fim_1t && !registro.ini_2t) {
          const payload = { ini_2t: this.dataHora };
          return fetch(`http://10.1.1.247:3000/horimetro/${registro.cod}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
            .then(res => {
              if (!res.ok) {
                return res.text().then(text => { throw new Error(text || `Erro ao registrar início2 para ${equipamento}`); });
              }
            })
            .catch(err => { erros.push(err.message || `Erro no equipamento ${equipamento}`); });
        } else if (registro.ini_1t && !registro.fim_1t) {
          erros.push(`Já existe operação aberta para o equipamento ${equipamento}`);
        } else {
          erros.push(`Não foi possível registrar início para o equipamento ${equipamento}`);
        }
      });
      await Promise.all(promises);
      if (erros.length === 0) {
        alert('Início registrado com sucesso!');
      } else {
        alert(`Alguns erros ocorreram:\n${erros.join('\n')}`);
      }
      this.maquinasSelecionadas = [];
      this.dataHora = this.getLocalDateTime();
    },

    async registrarFim() {
      if (!this.maquinasSelecionadas.length) {
        alert('Selecione uma ou mais máquinas');
        return;
      }
      const erros = [];
      const promises = this.maquinasSelecionadas.map(async equipamento => {
        let registro;
        try {
          const res = await fetch(`http://10.1.1.247:3000/horimetro/aberto/${equipamento}`);
          if (res.status === 200) {
            registro = await res.json();
          }
        } catch (e) {}

        if (registro && registro.ini_1t && !registro.fim_1t) {
          const payload = { fim_1t: this.dataHora };
          return fetch(`http://10.1.1.247:3000/horimetro/${registro.cod}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
            .then(res => {
              if (!res.ok) {
                return res.text().then(text => { throw new Error(text || `Erro ao registrar fim1 para ${equipamento}`); });
              }
            })
            .catch(err => { erros.push(err.message || `Erro no equipamento ${equipamento}`); });
        } else if (registro && registro.ini_2t && !registro.fim_2t) {
          const payload = { fim_2t: this.dataHora };
          return fetch(`http://10.1.1.247:3000/horimetro/${registro.cod}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
            .then(res => {
              if (!res.ok) {
                return res.text().then(text => { throw new Error(text || `Erro ao registrar fim2 para ${equipamento}`); });
              }
            })
            .catch(err => { erros.push(err.message || `Erro no equipamento ${equipamento}`); });
        } else if (!registro) {
          const payload = {
            equipamento,
            ini_1t: this.dataHora,
            fim_1t: this.dataHora,
          };
          return fetch('http://10.1.1.247:3000/horimetro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
            .then(res => {
              if (!res.ok) {
                return res.text().then(text => { throw new Error(text || `Erro ao registrar fim para ${equipamento}`); });
              }
            })
            .catch(err => { erros.push(err.message || `Erro no equipamento ${equipamento}`); });
        } else {
          erros.push(`Não foi possível registrar fim para o equipamento ${equipamento}`);
        }
      });
      await Promise.all(promises);
      if (erros.length === 0) {
        alert('Fim registrado com sucesso!');
      } else {
        alert(`Alguns erros ocorreram:\n${erros.join('\n')}`);
      }
      this.maquinasSelecionadas = [];
      this.dataHora = this.getLocalDateTime();
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
      } catch (e) { }
    }
    document.addEventListener('mousedown', this.cliqueForaDoDropdown);
  },
  beforeDestroy() {
    document.removeEventListener('mousedown', this.cliqueForaDoDropdown);
  }
}
</script>