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
      <button class="btn btn-success" @click="enviarInicio" :disabled="botaoInicioDesabilitado">Iniciar Parada</button>
      <button class="btn btn-danger" @click="enviarFim" :disabled="!paradaAbertaEncontrada">
        Terminar Parada
      </button>
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
      // maquinaSelecionada removido, não é mais usado
      maquinasSelecionadas: [],
      mostrarDropdownMaquinas: false,
      motivoSelecionado: '',
      operadorSelecionado: '',
      botaoInicioDesabilitado: false,
      paradaAbertaEncontrada: false,
      formBloqueado: false,
      motivosParada: [],
      operadoresTodos: [],
      operadores: []
    };
  },
  computed: {
    todosSelecionados() {
      return this.maquinas.length > 0 && this.maquinasSelecionadas.length === this.maquinas.length;
    }
  },
  watch: {
    tipoSelecionado(novoTipo) {
      if (this.formBloqueado) return;
      this.celulaSelecionada = '';
      this.celulas = [];
      this.maquinas = [];
      this.filtrarOperadoresPorSetor();
      if (novoTipo) {
        this.carregarCelulas();
      }
    },
    celulaSelecionada(novaCelula) {
      if (this.formBloqueado) return;
      if (this.tipoSelecionado && novaCelula) {
        this.carregarMaquinas();
      } else {
        this.maquinas = [];
      }
    },
    maquinasSelecionadas(novasMaquinas) {
      this.verificarParadasAbertas(novasMaquinas);
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

      const url = `http://10.1.1.247:3000/equipamentos?tipo=${this.tipoSelecionado}&celula=${encodeURIComponent(this.celulaSelecionada)}`;

      fetch(url)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
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
    async carregarOperadores() {
      try {
        const res = await fetch('http://10.1.1.247:3000/operadores');
        let data = await res.json();
        if (data && data.Content) {
          try {
            data = JSON.parse(data.Content);
          } catch (e) { }
        }
        this.operadoresTodos = Array.isArray(data) ? data : [];
        this.filtrarOperadoresPorSetor();
      } catch (e) {
        this.operadoresTodos = [];
        this.operadores = [];
      }
    },
    filtrarOperadoresPorSetor() {
      if (!this.tipoSelecionado) {
        this.operadores = this.operadoresTodos.map(op => op.nome_operador).sort((a, b) => a.localeCompare(b, 'pt-BR'));
        return;
      }
      let setor = '';
      if (this.tipoSelecionado == 3) setor = 'JACQUARD';
      else if (this.tipoSelecionado == 1) setor = 'AGULHA';
      else if (this.tipoSelecionado == 2) setor = 'CROCHE';
      this.operadores = this.operadoresTodos
        .filter(op => op.setor && op.setor.toUpperCase() === setor)
        .map(op => op.nome_operador)
        .sort((a, b) => a.localeCompare(b, 'pt-BR'));
    },
    alternarTodosSelecionados() {
      if (this.todosSelecionados) {
        this.maquinasSelecionadas = [];
      } else {
        this.maquinasSelecionadas = this.maquinas.map(m => m.id);
      }
    },
    async carregarMotivosParada() {
      try {
        const res = await fetch('http://10.1.1.247:3000/motivos-parada');
        const data = await res.json();
        this.motivosParada = Array.isArray(data)
          ? data.map(item => typeof item === 'string' ? item : item.motivo)
            .sort((a, b) => a.localeCompare(b, 'pt-BR'))
          : [];
      } catch (e) {
        this.motivosParada = [];
      }
    },
    async enviarInicio() {
      if (!this.maquinasSelecionadas.length) {
        alert('Selecione uma ou mais máquinas');
        return;
      }

      if (!this.motivoSelecionado || this.motivoSelecionado.trim() === '') {
        alert('Selecione ou digite um motivo');
        return;
      }

      if (!this.operadorSelecionado || this.operadorSelecionado.trim() === '') {
        alert('Informe o nome do operador');
        return;
      }

      let erros = [];
      const promises = this.maquinasSelecionadas.map(equipamento => {
        return fetch('http://10.1.1.247:3000/parada/inicio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            equipamento,
            motivo: this.motivoSelecionado,
            datahora_inicio_parada: this.dataHora,
            operador: this.operadorSelecionado
          })
        })
          .then(res => {
            if (!res.ok) {
              return res.text().then(text => {
                throw new Error(text || `Erro ao registrar parada para o equipamento ${equipamento}`);
              });
            }
          })
          .catch(err => {
            erros.push(err.message || `Erro no equipamento ${equipamento}`);
          });
      });

      Promise.all(promises).then(() => {
        if (erros.length === 0) {
          alert('Início da parada registrado com sucesso!');
        } else {
          alert(`Alguns erros ocorreram:\n${erros.join('\n')}`);
        }

        this.maquinasSelecionadas = [];
        this.motivoSelecionado = '';
        this.atualizarDataHora();
      });
    },
    async verificarParadasAbertas(maquinas) {
      this.formBloqueado = false;
      this.botaoInicioDesabilitado = false;
      this.paradaAbertaEncontrada = false;
      if (!maquinas || !maquinas.length) return;
      let abertas = [];
      let paradasAbertasInfo = [];
      for (const maquinaId of maquinas) {
        try {
          const response = await fetch(`http://10.1.1.247:3000/parada/aberta/${maquinaId}`);
          if (response.status === 200) {
            const parada = await response.json();
            abertas.push(maquinaId);
            paradasAbertasInfo.push({ maquinaId, ...parada });
          }
        } catch (err) {
        }
      }
      if (abertas.length > 0) {
        this.paradaAbertaEncontrada = true;
        const parada = paradasAbertasInfo[0];
        this.motivoSelecionado = parada.motivo;
        this.operadorSelecionado = parada.operador;
        this.dataHora = this.getLocalDateTime();
        this.formBloqueado = abertas.length === maquinas.length;
        this.botaoInicioDesabilitado = abertas.length === maquinas.length;
        this.mostrarDropdownMaquinas = false;

        // Se todas as máquinas selecionadas estão abertas e o motivo e operador são iguais, mostra um alert só
        if (
          abertas.length === maquinas.length &&
          paradasAbertasInfo.every(info => info.motivo === paradasAbertasInfo[0].motivo && info.operador === paradasAbertasInfo[0].operador)
        ) {
          alert(`Já existe uma parada aberta para todas as máquinas selecionadas.\n\nMotivo: ${paradasAbertasInfo[0].motivo}\nOperador: ${paradasAbertasInfo[0].operador}`);
        } else {
          paradasAbertasInfo.forEach(info => {
            alert(`Já existe uma parada aberta para esta máquina.\n\nMotivo: ${info.motivo}\nOperador: ${info.operador}`);
          });
        }
      } else {
        this.formBloqueado = false;
        this.botaoInicioDesabilitado = false;
        this.paradaAbertaEncontrada = false;
      }
    },
    async enviarFim() {
      if (!this.maquinasSelecionadas.length) {
        alert('Selecione uma ou mais máquinas');
        return;
      }

      let erros = [];
      const promises = this.maquinasSelecionadas.map(equipamento => {
        return fetch('http://10.1.1.247:3000/parada/fim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            equipamento,
            datahora_fim_parada: this.dataHora,
            operador: this.operadorSelecionado || ''
          })
        })
          .then(res => {
            if (!res.ok) {
              return res.text().then(text => {
                throw new Error(text || `Erro ao registrar término da parada para o equipamento ${equipamento}`);
              });
            }
          })
          .catch(err => {
            erros.push(err.message || `Erro no equipamento ${equipamento}`);
          });
      });

      Promise.all(promises).then(() => {
        if (erros.length === 0) {
          alert('Término da parada registrado com sucesso!');
        } else {
          const unicos = [...new Set(erros)];
          alert(`Alguns erros ocorreram:\n${unicos.join('\n')}`);
        }

        this.maquinasSelecionadas = [];
        this.motivoSelecionado = '';
        this.formBloqueado = false;
        this.botaoInicioDesabilitado = false;
        this.atualizarDataHora();
      });
    },
    cliqueForaDoDropdown(event) {
      if (this.mostrarDropdownMaquinas) {
        const dropdown = this.$refs.dropdownMaquinas;
        if (dropdown && !dropdown.contains(event.target)) {
          this.mostrarDropdownMaquinas = false;
        }
      }
    }
  },
  mounted() {
    this.carregarMotivosParada();
    this.carregarOperadores();
    const operadorLogado = localStorage.getItem('operadorLogado');
    if (operadorLogado) {
      try {
        const dados = JSON.parse(operadorLogado);
        if (dados.tipoEquipamento) {
          if (dados.tipoEquipamento.toUpperCase() === 'JACQUARD') this.tipoSelecionado = 3;
          else if (dados.tipoEquipamento.toUpperCase() === 'AGULHA') this.tipoSelecionado = 1;
          else if (dados.tipoEquipamento.toUpperCase() === 'CROCHE') this.tipoSelecionado = 2;
        }
        if (dados.operador && dados.operador.celula) {
          this.celulaSelecionada = dados.operador.celula;
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
