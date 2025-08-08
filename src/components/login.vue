<template>
    <div class="bg-dark min-vh-100 d-flex align-items-center justify-content-center">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-md-6">
                    <div class="card shadow-lg">
                        <div class="card-body text-center p-5">
                            <h2 class="fw-bold mb-2" style="color: #000080;">SCCP - Sistema Controle Centralizado de
                                Processos</h2>
                            <div class="mx-auto mb-4" style="height: 4px; width: 80%; background: #dc3545;"></div>

                            <div class="mb-4">
                                <select v-model="unidadeSelecionada" class="form-select form-control-lg mb-2"
                                    style="background-color: #f8f9fa; color: #000; border: 2px solid #dc3545;">
                                    <option value="" disabled>Filtrar por unidade</option>
                                    <option v-for="unidade in unidadesFabrisList" :key="unidade" :value="unidade">{{ unidade }}</option>
                                </select> 

                                <select v-model="operadorSelecionado" class="form-select form-control-lg"
                                    style="background-color: #f8f9fa; color: #000; border: 2px solid #dc3545;"
                                    @change="carregarTipoEquipamento">
                                    <option value="" disabled>Selecione um operador</option>
                                    <option v-for="operador in operadores" :key="operador.codigo" :value="operador">
                                        {{ operador.nome_operador }}
                                    </option>
                                </select>
                            </div>

                            <div v-if="tipoEquipamento" class="mb-4">
                                <h6 class="text-dark">Setor: {{ tipoEquipamento }}</h6>
                            </div>

                            <button class="btn btn-danger btn-lg px-5" @click="fazerLogin"
                                :disabled="!operadorSelecionado" style="border-radius: 50px;">
                                <i class="bi bi-arrow-right-circle me-2"></i>
                                Entrar
                            </button>
                            <span class="config-icon" @click="abrirModalConfig">
                                <i class="bi bi-gear-fill fs-4"></i>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="configModal" tabindex="-1" aria-labelledby="configModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-xl" style="max-width: 62vw;">
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
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import Config from './config.vue';

const operadores = ref([]);
const unidadeSelecionada = ref('');
const unidadesFabrisList = ref([]);
const operadorSelecionado = ref('');
const tipoEquipamento = ref('');
const configKey = ref(0);

const emit = defineEmits(['login-realizado']);

function abrirModalConfig() {
  configKey.value++;
  const modal = new window.bootstrap.Modal(document.getElementById('configModal'));
  modal.show();
}

async function carregarOperadores() {
  try {
    let url = 'http://10.1.1.11:3000/operadores';
    if (unidadeSelecionada.value) {
      url += '?unidade=' + encodeURIComponent(unidadeSelecionada.value);
    }
    const res = await fetch(url);
    let data = await res.json();
    if (data && data.Content) {
      try {
        data = JSON.parse(data.Content);
      } catch (e) {
        console.error('Erro ao parsear Content:', e);
      }
    }
    operadores.value = Array.isArray(data)
      ? data.sort((a, b) => a.nome_operador.localeCompare(b.nome_operador, 'pt-BR'))
      : [];
  } catch (e) {
    console.error('Erro ao buscar operadores:', e);
  }
}

function carregarTipoEquipamento() {
  if (operadorSelecionado.value && operadorSelecionado.value.setor) {
    tipoEquipamento.value = operadorSelecionado.value.setor;
  }
}

async function carregarUnidadesFabris() {
  try {
    const res = await fetch('http://10.1.1.11:3000/unidades-fabrica');
    const data = await res.json();
    unidadesFabrisList.value = Array.isArray(data) ? data : [];
  } catch (e) {
    unidadesFabrisList.value = [];
  }
}

function fazerLogin() {
  if (!operadorSelecionado.value) {
    alert('Selecione um operador!');
    return;
  }

  const dadosLogin = {
    operador: operadorSelecionado.value,
    tipoEquipamento: tipoEquipamento.value,
    timestamp: new Date().toISOString()
  };

  localStorage.setItem('operadorLogado', JSON.stringify(dadosLogin));
  emit('login-realizado', dadosLogin);
}

onMounted(() => {
  carregarUnidadesFabris();
  carregarOperadores();
});

watch(unidadeSelecionada, () => {
  operadorSelecionado.value = '';
  carregarOperadores();
});
</script>

<style scoped>
.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.form-select:focus {
    border-color: #dc3545;
    box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

.config-icon {
    position: fixed;
    color: #fff;
    bottom: 6px;
    right: 6px;
    z-index: 1050;
    cursor: pointer;
}
</style>