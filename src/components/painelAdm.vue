<template>
  <div class="bg-dark min-vh-100 d-flex align-items-center justify-content-center">
    <div class="container">
      <div class="card shadow-lg">
        <div class="card-body text-center p-5">
          <h1 class="display-5 fw-bold mb-2" style="color: #000080;">SCCP - Sistema Controle Centralizado de Processos
          </h1>
          <div class="mx-auto mb-2" style="height: 4px; width: 80%; background: #dc3545;"></div>
          <div class="d-flex justify-content-center gap-3 mt-4">
            <button class="btn btn-lg" style="background-color: #000080; color: #fff;"
              @click="abrirModalCadastro">Cadastro/Configuração</button>
            <button class="btn btn-danger btn-lg" @click="abrirModalControle">Produtividade</button>
          </div>
        </div>
      </div>
      <div class="fixed-bottom w-100 bg-dark py-2 px-4 d-flex justify-content-between align-items-center"
        style="z-index: 1050;">
        <div class="text-start">
          <p class="mb-1 text-white">
            <strong>{{ nomeUsuario || 'Administrador' }}</strong>
          </p>
        </div>
        <i class="bi bi-box-arrow-right" style="color: #dc3545; cursor: pointer; font-size: 1.5rem;"
          @click="logout"></i>
      </div>
    </div>
  </div>

  <div class="modal fade" id="cadastroModal" tabindex="-1" aria-labelledby="cadastroModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="cadastroModalLabel">Cadastro/Configuração</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <Config />
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="controleModal" tabindex="-1" aria-labelledby="controleModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-xl" style="max-width:90vw; width:90vw; min-width:900px;">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="controleModalLabel">Painel de Controle</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <Controle :unidade="unidadeUsuario" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import Config from './config.vue';
import Controle from './controle.vue';

const props = defineProps({
  nomeUsuario: {
    type: String,
    default: ''
  },
  unidadeUsuario: {
    type: String,
    default: ''
  }
});

function abrirModalCadastro() {
  const modal = new window.bootstrap.Modal(document.getElementById('cadastroModal'));
  modal.show();
}

function abrirModalControle() {
  const modal = new window.bootstrap.Modal(document.getElementById('controleModal'));
  modal.show();
}

function logout() {
  if (confirm('Deseja realmente sair do painel administrativo?')) {
    window.location.reload();
  }
}
</script>

<style scoped>
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