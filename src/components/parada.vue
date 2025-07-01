<template>
  <div>
    <input type="datetime-local" name="datahora" class="form-control cor-text-select mt-4" id="horimetroDataHora"
      style="background-color: #343a40; color: #fff;" :value="dataHora" />

    <select name="operador" v-model="operadorSelecionado" class="form-control cor-text-select mt-4 d-inline-block"
      :disabled="formBloqueado" style="background-color: #343a40; color: #fff; width: 48%; margin-right: 2%;">
      <option selected disabled hidden value="">Selecionar Operador</option>
      <option>GABRIEL BARBOSA</option>
      <option>MARIA APARECIDA</option>
      <option>ALEX PERASSOLI</option>
      <option>TAIS MACEDO</option>
      <option>FELIPE GARCIA</option>
      <option>LUCIANA PARANHOS</option>
      <option>CECILIA EMILIANA</option>
      <option>TAINÃ PAIVA</option>
      <option>LUCAS ANTÔNIO</option>
      <option>THAIS VENANCIO</option>
      <option>GRASIELE FERREIRA</option>
      <option>LUIZ GUILHERME</option>
      <option>LEONILDA VICENTE</option>
      <option>AMANDA NOGUEIRA</option>
      <option>MARCIANO DE ASSIS</option>
      <option>LUANA TEIXEIRA</option>
      <option>NAYARA CAROLINE</option>
      <option>ALINE VIEIRA</option>
      <option>YOHANNA GABRIELA</option>
      <option>WAGNER LUCAS</option>
    </select>

    <select name="tipo" v-model="tipoSelecionado" class="form-control cor-text-select mt-4 d-inline-block"
      :disabled="formBloqueado" style="background-color: #343a40; color: #fff; width: 48%; margin-right: 2%;">
      <option selected disabled hidden value="">Selecionar Tipo Equipamento</option>
      <option :value="3">JACQUARD</option>
      <option :value="1">AGULHA</option>
      <option :value="2">CROCHE</option>
    </select>

    <select name="celula" v-model="celulaSelecionada" class="form-control cor-text-select mt-4 d-inline-block"
      style="background-color: #343a40; color: #fff; width: 48%; margin-right: 2%;"
      :disabled="formBloqueado || !tipoSelecionado">
      <option selected disabled hidden value="">Selecionar Célula</option>
      <option v-for="celula in celulas" :key="celula" :value="celula">
        {{ celula }}
      </option>
    </select>

    <select name="maquina" v-model="maquinaSelecionada" @change="verificarParadaAberta"
      :disabled="formBloqueado || !tipoSelecionado || !celulaSelecionada"
      class="form-control cor-text-select mt-4 d-inline-block"
      style="background-color: #343a40; color: #fff; width: 48%; margin-right: 2%;">
      <option disabled value="">Selecionar Equipamento</option>
      <option v-for="maquina in maquinas" :key="maquina.id" :value="maquina.id">
        {{ maquina.id }} - {{ maquina.nome }}
      </option>
    </select>

    <select name="motivo" v-model="motivoSelecionado" class="form-control cor-text-select mt-4 d-inline-block"
      :disabled="formBloqueado" style="background-color: #343a40; color: #fff;">
      <option selected disabled hidden value="">Selecionar Motivo da Parada</option>
      <option>AMARRAÇÃO DE BORRACHA</option>
      <option>AMARRAÇÃO DE CARGA</option>
      <option>COMPLEMENTO</option>
      <option>FALTA DE CARRETEL</option>
      <option>FALTA DE FUNCIONÁRIO</option>
      <option>FALTA DE MATÉRIA PRIMA</option>
      <option>FALTA DE PEDIDO</option>
      <option>LIBERAÇÃO</option>
      <option>MANUTENÇÃO</option>
      <option>PASSAMENTO</option>
      <option>PROBLEMA NA MATÉRIA PRIMA</option>
      <option>REGULAGEM</option>
      <option>REUNIÃO</option>
      <option>TROCA DE ARTIGO</option>
      <option>TROCA DE PEDIDO</option>
    </select>

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
      maquinaSelecionada: '',
      motivoSelecionado: '',
      operadorSelecionado: '',
      botaoInicioDesabilitado: false,
      paradaAbertaEncontrada: false,
      formBloqueado: false
    };
  },
  watch: {
    tipoSelecionado(novoTipo) {
      if (this.formBloqueado) return;
      this.celulaSelecionada = '';
      this.celulas = [];
      this.maquinas = [];
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
      fetch(`http://10.1.0.8:3000/celulas?tipo=${tipoCodigo}`)
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
      const tipoCodigo = this.tipoSelecionado;
      if (!this.celulaSelecionada || !tipoCodigo) {
        this.maquinas = [];
        return;
      }
      fetch(`http://10.1.0.8:3000/equipamentos?tipo=${this.tipoSelecionado}&celula=${encodeURIComponent(this.celulaSelecionada)}`)
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

    async enviarInicio() {
      if (!this.maquinaSelecionada) {
        alert('Selecione uma máquina');
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

      fetch('http://10.1.0.8:3000/parada/inicio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipamento: this.maquinaSelecionada,
          motivo: this.motivoSelecionado,
          datahora_inicio_parada: this.dataHora,
          operador: this.operadorSelecionado
        })
      })
        .then(res => {
          if (res.ok) {
            alert('Início da parada registrado com sucesso!');
            this.maquinaSelecionada = '',
              this.motivoSelecionado = '',
              this.operadorSelecionado = '',
              this.tipoSelecionado = '',
              this.celulaSelecionada = '',
              this.atualizarDataHora();
          } else {
            throw new Error('Erro ao registrar início da parada');
          }
        })
        .catch(err => {
          console.error(err);
          alert('Erro ao registrar início da parada');
        });
    },

    async verificarParadaAberta() {
      if (!this.maquinaSelecionada) return;

      try {
        const response = await fetch(`http://10.1.0.8:3000/parada/aberta/${this.maquinaSelecionada}`);

        if (response.status === 200) {
          this.paradaAbertaEncontrada = true;
          const parada = await response.json();

          alert(`Já existe uma parada aberta para esta máquina.\n\nMotivo: ${parada.motivo}\nOperador: ${parada.operador}`);
          this.formBloqueado = true;
          this.botaoInicioDesabilitado = true;

          this.motivoSelecionado = parada.motivo;
          this.operadorSelecionado = parada.operador;
          this.dataHora = this.getLocalDateTime();

        } else {
          this.formBloqueado = false;
          this.botaoInicioDesabilitado = false;
          this.paradaAbertaEncontrada = false;

          if (!this.motivoSelecionado) this.motivoSelecionado = '';
          if (!this.operadorSelecionado) this.operadorSelecionado = '';

          this.dataHora = this.getLocalDateTime();

        }
      } catch (err) {
        console.error('Erro ao verificar parada:', err);
        alert('Erro ao verificar se já existe uma parada aberta');
      }
    },

    async enviarFim() {
      if (!this.maquinaSelecionada) {
        alert('Selecione uma máquina');
        return;
      }

      fetch('http://10.1.0.8:3000/parada/fim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipamento: this.maquinaSelecionada,
          datahora_fim_parada: this.dataHora,
          operador: this.operadorSelecionado || ''
        })
      })
        .then(res => {
          if (res.ok) {
            alert('Término da parada registrado com sucesso!');
            this.maquinaSelecionada = '';
            this.motivoSelecionado = '';
            this.operadorSelecionado = '';
            this.tipoSelecionado = '';
            this.celulaSelecionada = '';

            this.formBloqueado = false;
            this.botaoInicioDesabilitado = false;
            this.paradaAbertaEncontrada = false;
            this.atualizarDataHora();
          } else {
            throw new Error('Erro ao registrar término da parada');
          }
        })
        .catch(err => {
          console.error(err);
          alert('Erro ao registrar término da parada');
        });
    }

  },
  mounted() {
  }
}
</script>

