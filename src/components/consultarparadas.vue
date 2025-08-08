<template>
  <div class="p-4" @click="fecharTodosDropdowns">
    <div class="table-responsive">
      <table class="table table-dark table-striped">
        <thead>
          <tr>
            <th class="position-relative">
              <span class="coluna-com-icone" @click.stop="toggleDropdown('unidade')">
                Unidade <i class="bi bi-arrow-down-short"></i>
              </span>
              <div v-if="dropdowns.unidade" class="dropdown-menu-custom">
                <div class="dropdown-item" @click="filtroUnidade = ''">Todas as Unidades</div>
                <div class="dropdown-item" v-for="valor in unidadesUnicas" :key="valor" @click="selecionarFiltro('unidade', valor)">
                  {{ valor }}
                </div>
              </div>
            </th>
            <th class="position-relative">
              <span class="coluna-com-icone" @click.stop="toggleDropdown('tipo')">
                Tipo <i class="bi bi-arrow-down-short"></i>
              </span>
              <div v-if="dropdowns.tipo" class="dropdown-menu-custom">
                <div class="dropdown-item" @click="filtroTipo = ''">Todos os Tipos</div>
                <div class="dropdown-item" v-for="valor in tiposUnicos" :key="valor" @click="selecionarFiltro('tipo', valor)">
                  {{ valor }}
                </div>
              </div>
            </th>
            <th class="position-relative">
              <span class="coluna-com-icone" @click.stop="toggleDropdown('celula')">
                Célula <i class="bi bi-arrow-down-short"></i>
              </span>
              <div v-if="dropdowns.celula" class="dropdown-menu-custom">
                <div class="dropdown-item" @click="filtroCelula = ''">Todas as Células</div>
                <div class="dropdown-item" v-for="valor in celulasUnicas" :key="valor" @click="selecionarFiltro('celula', valor)">
                  {{ valor }}
                </div>
              </div>
            </th>
            <th class="position-relative">
              <span class="coluna-com-icone" @click.stop="toggleDropdown('equipamento')">
                Equipamento <i class="bi bi-arrow-down-short"></i>
              </span>
              <div v-if="dropdowns.equipamento" class="dropdown-menu-custom">
                <div class="dropdown-item" @click="filtroEquipamento = ''">Todos os Equipamentos</div>
                <div class="dropdown-item" v-for="valor in equipamentosUnicos" :key="valor" @click="selecionarFiltro('equipamento', valor)">
                  {{ valor }}
                </div>
              </div>
            </th>
            <th class="position-relative">
              <span class="coluna-com-icone" @click.stop="toggleDropdown('motivo')">
                Motivo <i class="bi bi-arrow-down-short"></i>
              </span>
              <div v-if="dropdowns.motivo" class="dropdown-menu-custom">
                <div class="dropdown-item" @click="filtroMotivo = ''">Todos os Motivos</div>
                <div class="dropdown-item" v-for="valor in motivosUnicos" :key="valor" @click="selecionarFiltro('motivo', valor)">
                  {{ valor }}
                </div>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(parada, index) in paradasFiltradas" :key="index">
            <td>{{ parada.unidade }}</td>
            <td>{{ parada.tipo }}</td>
            <td>{{ parada.celula }}</td>
            <td>{{ parada.equipamento_nome }}</td>
            <td>{{ parada.motivo }}</td>
          </tr>
        </tbody>
      </table>

      <button class="btn btn-danger mt-4" @click="abrirModalParada">Apontar Parada</button>
    </div>

    <div class="modal fade" id="paradaModal" ref="modalParada" tabindex="-1" aria-labelledby="paradaModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Apontar Parada</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
          </div>
          <div class="modal-body">
            <Parada :key="paradaKey" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Parada from './parada.vue';

const paradaKey = ref(Date.now());
const paradas = ref([]);
const filtroUnidade = ref('');
const filtroTipo = ref('');
const filtroCelula = ref('');
const filtroEquipamento = ref('');
const filtroMotivo = ref('');
const dropdowns = ref({});
const modalParada = ref(null);
let modalParadaInstance = null;

const paradasFiltradas = computed(() => {
  let tipoLogin = '';
  const operadorLogado = localStorage.getItem('operadorLogado');
  if (operadorLogado) {
    try {
      const dados = JSON.parse(operadorLogado);
      if (dados.tipoEquipamento) tipoLogin = dados.tipoEquipamento.toUpperCase().trim();
    } catch (e) { console.log('Erro ao ler operadorLogado:', e); }
  }
  // console.log('Tipo do operador logado (filtro):', tipoLogin);
  // console.log('Paradas recebidas para filtro:', paradas.value);
  const resultado = paradas.value.filter(p => {
    const tipoParada = p.tipo ? p.tipo.toUpperCase().trim() : '';
    const tipoMatch = tipoLogin ? tipoParada === tipoLogin : true;
    return tipoMatch &&
      (filtroUnidade.value === '' || p.unidade === filtroUnidade.value) &&
      (filtroTipo.value === '' || p.tipo === filtroTipo.value) &&
      (filtroCelula.value === '' || p.celula === filtroCelula.value) &&
      (filtroEquipamento.value === '' || p.equipamento_nome === filtroEquipamento.value) &&
      (filtroMotivo.value === '' || p.motivo === filtroMotivo.value);
  });
  // console.log('Resultado do filtro com tipoLogin:', resultado);
  return resultado;
});

const tiposUnicos = computed(() => [...new Set(paradas.value.map(p => p.tipo))].sort());
const unidadesUnicas = computed(() => [...new Set(paradas.value.map(p => p.unidade))].sort());
const celulasUnicas = computed(() => [...new Set(paradas.value.map(p => p.celula))].sort());
const equipamentosUnicos = computed(() => [...new Set(paradas.value.map(p => p.equipamento_nome))].sort());
const motivosUnicos = computed(() => [...new Set(paradas.value.map(p => p.motivo))].sort());

async function carregarParadas() {
  try {
    const res = await fetch('http://10.1.1.11:3000/paradas/abertas');
    const dados = await res.json();
    paradas.value = Array.isArray(dados) ? dados : [];
  } catch (err) {
    console.error('Erro ao carregar paradas abertas:', err);
  }
}

function toggleDropdown(campo) {
  dropdowns.value = { [campo]: true };
}

function fecharTodosDropdowns() {
  dropdowns.value = {};
}

function selecionarFiltro(campo, valor) {
  if (campo === 'unidade') filtroUnidade.value = valor;
  if (campo === 'tipo') filtroTipo.value = valor;
  if (campo === 'celula') filtroCelula.value = valor;
  if (campo === 'equipamento') filtroEquipamento.value = valor;
  if (campo === 'motivo') filtroMotivo.value = valor;
  fecharTodosDropdowns();
}

function abrirModalParada() {
  if (!modalParadaInstance) {
    modalParadaInstance = new bootstrap.Modal(modalParada.value);
  }
  paradaKey.value = Date.now();
  modalParadaInstance.show();
  modalParada.value.addEventListener('hidden.bs.modal', carregarParadas, { once: true });
}

onMounted(() => {
  carregarParadas();
  if (typeof window !== 'undefined' && window?.$root?.$on) {
    window.$root.$on('abrir-parada', carregarParadas);
  }
});
</script>

<style>
.dropdown-menu-custom {
    position: absolute;
    top: 100%;
    left: 0;
    background-color: #212529;
    border: 1px solid #444;
    z-index: 10;
    min-width: 150px;
    padding: 5px 0;
    box-shadow: 0 0 6px rgba(0, 0, 0, 0.3);
}
.dropdown-item {
    padding: 6px 12px;
    color: white;
    cursor: pointer;
}
.dropdown-item:hover {
    background-color: #343a40;
}
th {
    vertical-align: top;
}
.coluna-com-icone {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
}
</style>
