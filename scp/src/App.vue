<template>
  <div class="bg-dark min-vh-100 d-flex align-items-center justify-content-center">
    <div class="container">
      <div class="card shadow-lg">
        <div class="card-body text-center p-5">
          <h1 class="display-4 fw-bold mb-2" style="color: #000080;">SCP - Sistema Controle de Produção</h1>
          <div class="mx-auto mb-4" style="height: 4px; width: 80%; background: #dc3545;"></div>
          <div class="d-flex justify-content-center gap-3 mt-4">
            <button class="btn btn-secondary btn-lg" @click="abrirModalHorimetro">Marcar Horímetro</button>
            <button class="btn btn-danger btn-lg">Apontar Parada</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="horimetroModal" tabindex="-1" aria-labelledby="horimetroModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="horimetroModalLabel">Início e Término de Operação</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <Horimetro />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Horimetro from './components/horimetro.vue';

export default {
  name: 'App',
  components: { Horimetro },
  data() {
    return {
      dataHora: new Date().toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    };
  },
  methods: {
    abrirModalHorimetro() {
      const modal = new window.bootstrap.Modal(document.getElementById('horimetroModal'));
      this.$root.$emit && this.$root.$emit('abrir-horimetro');
      modal.show();
    }
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
