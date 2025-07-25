<template>
  <div v-if="!operadorLogado">
    <Login @login-realizado="handleLogin" />
  </div>

  <div v-else class="bg-dark min-vh-100 d-flex align-items-center justify-content-center">
    <div class="container">
      <div class="card shadow-lg">
        <div class="card-body text-center p-5">
          <h1 class="display-5 fw-bold mb-2" style="color: #000080;">SCCP - Sistema Controle Centralizado de Processos
          </h1>
          <div class="mx-auto mb-2" style="height: 4px; width: 80%; background: #dc3545;"></div>

          <div class="d-flex justify-content-center gap-3 mt-4">
            <button class="btn btn-secondary btn-lg" @click="abrirModalHorimetro">Registrar Horímetro</button>
            <button class="btn btn-danger btn-lg" @click="abrirModalParada">Consultar Paradas</button>
          </div>
        </div>
      </div>
      <div class="fixed-bottom w-100 bg-dark py-2 px-4 d-flex justify-content-between align-items-center" style="z-index: 1050;">
        <div class="text-start">
          <p class="mb-1 text-white">
        <strong>{{ operadorLogado.operador.nome_operador }} - {{ operadorLogado.operador.setor }}</strong>
          </p>
        </div>
        <i class="bi bi-box-arrow-right" style="color: #dc3545; cursor: pointer; font-size: 1.5rem;" @click="logout"></i>
      </div>
    </div>
  </div>

  <div class="modal fade" id="horimetroModal" tabindex="-1" aria-labelledby="horimetroModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="horimetroModalLabel">Início e Termino de Operação</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <Horimetro :key="horimetroKey" />
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="paradaModal" tabindex="-1" aria-labelledby="paradaModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="paradaModalLabel">Listagem de Paradas</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <ConsultarParadas :key="paradaKey" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Horimetro from './components/horimetro.vue';
import ConsultarParadas from './components/consultarparadas.vue';
import Login from './components/login.vue';

export default {
  name: 'App',
  components: { Horimetro, ConsultarParadas, Login },
  data() {
    return {
      operadorLogado: null,
      dataHora: new Date().toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }),
      horimetroKey: 0,
      paradaKey: 0
    };
  },
  methods: {
    handleLogin(dadosLogin) {
      this.operadorLogado = dadosLogin;
    },

    logout() {
      if (confirm('Deseja realmente sair do sistema?')) {
        this.operadorLogado = null;
        localStorage.removeItem('operadorLogado');
      }
    },

    abrirModalHorimetro() {
      this.horimetroKey++;
      const modal = new window.bootstrap.Modal(document.getElementById('horimetroModal'));
      modal.show();
    },
    abrirModalParada() {
      this.paradaKey++;
      const modal = new window.bootstrap.Modal(document.getElementById('paradaModal'));
      modal.show();
    }
  },
  mounted() {
    const operadorSalvo = localStorage.getItem('operadorLogado');
    if (operadorSalvo) {
      try {
        this.operadorLogado = JSON.parse(operadorSalvo);
      } catch (e) {
        console.error('Erro ao recuperar operador logado:', e);
        localStorage.removeItem('operadorLogado');
      }
    }

    this.$nextTick(() => {
      const paradaModal = document.getElementById('paradaModal');
      if (paradaModal) {
        paradaModal.addEventListener('show.bs.modal', () => {
          setTimeout(() => {
            this.$root.$emit && this.$root.$emit('abrir-parada');
          }, 50);
        });
        paradaModal.addEventListener('hidden.bs.modal', () => {
          setTimeout(() => {
            this.$root.$emit && this.$root.$emit('abrir-parada');
          }, 50);
        });
      }
      const horimetroModal = document.getElementById('horimetroModal');
      if (horimetroModal) {
        horimetroModal.addEventListener('show.bs.modal', () => {
          setTimeout(() => {
            this.$root.$emit && this.$root.$emit('abrir-horimetro');
          }, 50);
        });
        horimetroModal.addEventListener('hidden.bs.modal', () => {
          setTimeout(() => {
            this.$root.$emit && this.$root.$emit('abrir-horimetro');
          }, 50);
        });
      }
    });
  }
};
</script>

<style>
body {
  background-color: #212529;
}

.bg-dark {
  background-color: #212529 !important;
}

.card {
  border-radius: 1.5rem;
}

.card-body {
  border-radius: 1.5rem;
}

button.btn {
  min-width: 150px;
}

.modal-content {
  background-color: #343a40 !important;
  color: #fff;
}
</style>
