<template>
  <div class="bg-dark min-vh-100 d-flex align-items-center justify-content-center">
    <div class="container">
      <div class="card shadow-lg">
        <div class="card-body text-center p-5">
          <h1 class="display-4 fw-bold mb-2" style="color: #000080;">SCCP - Sistema Controle Centralizado de Processos</h1>
          <div class="mx-auto mb-4" style="height: 4px; width: 80%; background: #dc3545;"></div>
          <div class="d-flex justify-content-center gap-3 mt-4">
            <button class="btn btn-secondary btn-lg" @click="abrirModalHorimetro">Marcar Horímetro</button>
            <button class="btn btn-danger btn-lg" @click="abrirModalParada">Consultar Paradas</button>
            <span class="config-icon" @click="abrirModalConfig">
              <i class="bi bi-gear-fill fs-4"></i>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="configModal" tabindex="-1" aria-labelledby="configModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="configModalLabel">Configurações</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <Config :atualizar="configKey" />
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="horimetroModal" tabindex="-1" aria-labelledby="horimetroModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="horimetroModalLabel">Registrar Horímetro</h5>
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
import Config from './components/config.vue';

export default {
  name: 'App',
  components: { Horimetro, ConsultarParadas, Config },
  data() {
    return {
      dataHora: new Date().toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }),
      horimetroKey: 0,
      paradaKey: 0,
      configKey: 0
    };
  },
  methods: {
    abrirModalHorimetro() {
      this.horimetroKey++;
      const modal = new window.bootstrap.Modal(document.getElementById('horimetroModal'));
      modal.show();
    },
    abrirModalParada() {
      this.paradaKey++;
      const modal = new window.bootstrap.Modal(document.getElementById('paradaModal'));
      modal.show();
    },
    abrirModalConfig() {
      this.configKey++;
      const modal = new window.bootstrap.Modal(document.getElementById('configModal'));
      modal.show();
    }
  },
  mounted() {
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

.config-icon {
  position: fixed;
  color: #fff;
  bottom: 6PX;
  right: 6PX;
  z-index: 1050;
  cursor: pointer;
}
</style>
