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

<script>
import Parada from './parada.vue';

export default {
  name: 'ConsultarParadas',
  components: { Parada },
  data() {
    return {
      paradaKey: Date.now(),
      paradas: [],
      filtroUnidade: '',
      filtroTipo: '',
      filtroCelula: '',
      filtroEquipamento: '',
      filtroMotivo: '',
      dropdowns: {}
    };
  },
  computed: {
    paradasFiltradas() {
      let tipoLogin = '';
      const operadorLogado = localStorage.getItem('operadorLogado');
      if (operadorLogado) {
          try {
              const dados = JSON.parse(operadorLogado);
              if (dados.tipoEquipamento) tipoLogin = dados.tipoEquipamento.toUpperCase().trim();
          } catch (e) { console.log('Erro ao ler operadorLogado:', e); }
      }
      console.log('Tipo do operador logado (filtro):', tipoLogin);
      console.log('Paradas recebidas para filtro:', this.paradas);
      const resultado = this.paradas.filter(p => {
          const tipoParada = p.tipo ? p.tipo.toUpperCase().trim() : '';
          const tipoMatch = tipoLogin ? tipoParada === tipoLogin : true;
          return tipoMatch &&
              (this.filtroUnidade === '' || p.unidade === this.filtroUnidade) &&
              (this.filtroTipo === '' || p.tipo === this.filtroTipo) &&
              (this.filtroCelula === '' || p.celula === this.filtroCelula) &&
              (this.filtroEquipamento === '' || p.equipamento_nome === this.filtroEquipamento) &&
              (this.filtroMotivo === '' || p.motivo === this.filtroMotivo);
      });
      console.log('Resultado do filtro com tipoLogin:', resultado);
      return resultado;
    },
    tiposUnicos() {
      return [...new Set(this.paradas.map(p => p.tipo))].sort();
    },
    unidadesUnicas() {
      return [...new Set(this.paradas.map(p => p.unidade))].sort();
    },
    celulasUnicas() {
      return [...new Set(this.paradas.map(p => p.celula))].sort();
    },
    equipamentosUnicos() {
      return [...new Set(this.paradas.map(p => p.equipamento_nome))].sort();
    },
    motivosUnicos() {
      return [...new Set(this.paradas.map(p => p.motivo))].sort();
    }
  },
  methods: {
    async carregarParadas() {
      try {
        const res = await fetch('http://10.1.1.247:3000/paradas/abertas');
        const dados = await res.json();
        this.paradas = Array.isArray(dados) ? dados : [];
      } catch (err) {
        console.error('Erro ao carregar paradas abertas:', err);
      }
    },
    toggleDropdown(campo) {
      this.dropdowns = { [campo]: true };
    },
    fecharTodosDropdowns() {
      this.dropdowns = {};
    },
    selecionarFiltro(campo, valor) {
      this[`filtro${this.capitalize(campo)}`] = valor;
      this.fecharTodosDropdowns();
    },
    capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    },
    abrirModalParada() {
      if (!this.modalParadaInstance) {
        this.modalParadaInstance = new bootstrap.Modal(this.$refs.modalParada);
      }
      this.paradaKey = Date.now();
      this.modalParadaInstance.show();
      this.$refs.modalParada.addEventListener('hidden.bs.modal', this.carregarParadas, { once: true });
    }
  },
  mounted() {
    this.carregarParadas();
    this.$root.$on?.('abrir-parada', this.carregarParadas);
  }
};
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
