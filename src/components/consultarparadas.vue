<template>
    <div class="p-4" @click="fecharTodosDropdowns">
        <table class="table table-dark table-striped">
            <thead>
                <tr>
                    <th class="position-relative">
                        <span class="coluna-com-icone" @click.stop="toggleDropdown('tipo')">
                            Tipo <i class="bi bi-arrow-down-short"></i>
                        </span>
                        <div v-if="dropdowns.tipo" class="dropdown-menu-custom">
                            <div class="dropdown-item" @click="filtroTipo = ''; fecharTodosDropdowns()">Todos os Tipos
                            </div>
                            <div class="dropdown-item" v-for="tipo in tiposUnicos" :key="tipo"
                                @click="filtroTipo = tipo; fecharTodosDropdowns()">{{ tipo }}</div>
                        </div>
                    </th>

                    <th class="position-relative">
                        <span class="coluna-com-icone" @click.stop="toggleDropdown('celula')">
                            Célula <i class="bi bi-arrow-down-short"></i>
                        </span>
                        <div v-if="dropdowns.celula" class="dropdown-menu-custom">
                            <div class="dropdown-item" @click="filtroCelula = ''; fecharTodosDropdowns()">Todas as
                                Células</div>
                            <div class="dropdown-item" v-for="celula in celulasUnicas" :key="celula"
                                @click="filtroCelula = celula; fecharTodosDropdowns()">{{ celula }}</div>
                        </div>
                    </th>

                    <th class="position-relative">
                        <span class="coluna-com-icone" @click.stop="toggleDropdown('equipamento')">
                            Equipamento <i class="bi bi-arrow-down-short"></i>
                        </span>
                        <div v-if="dropdowns.equipamento" class="dropdown-menu-custom">
                            <div class="dropdown-item" @click="filtroEquipamento = ''; fecharTodosDropdowns()">Todos os
                                Equipamentos</div>
                            <div class="dropdown-item" v-for="equip in equipamentosUnicos" :key="equip"
                                @click="filtroEquipamento = equip; fecharTodosDropdowns()">{{ equip }}</div>
                        </div>
                    </th>

                    <th class="position-relative">
                        <span class="coluna-com-icone" @click.stop="toggleDropdown('motivo')">
                            Motivo <i class="bi bi-arrow-down-short"></i>
                        </span>
                        <div v-if="dropdowns.motivo" class="dropdown-menu-custom">
                            <div class="dropdown-item" @click="filtroMotivo = ''; fecharTodosDropdowns()">Todos os
                                Motivos</div>
                            <div class="dropdown-item" v-for="motivo in motivosUnicos" :key="motivo"
                                @click="filtroMotivo = motivo; fecharTodosDropdowns()">{{ motivo }}</div>
                        </div>
                    </th>
                </tr>
            </thead>

            <tbody>
                <tr v-for="(parada, index) in paradasFiltradas" :key="index">
                    <td>{{ parada.tipo }}</td>
                    <td>{{ parada.celula }}</td>
                    <td>{{ parada.equipamento_nome }}</td>
                    <td>{{ parada.motivo }}</td>
                </tr>
            </tbody>
        </table>

        <button class="btn btn-danger mt-4" @click="abrirModalParada">Apontar Parada</button>

        <div class="modal fade" id="paradaModal" ref="modalParada" tabindex="-1" aria-labelledby="paradaModalLabel"
            aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="paradaModalLabel">Apontar Parada</h5>
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
            filtroTipo: '',
            filtroCelula: '',
            filtroEquipamento: '',
            filtroMotivo: '',
            dropdowns: {
                tipo: false,
                celula: false,
                equipamento: false,
                motivo: false
            }
        };
    },
    computed: {
        paradasFiltradas() {
            return this.paradas.filter(p =>
                (this.filtroTipo === '' || p.tipo === this.filtroTipo) &&
                (this.filtroCelula === '' || p.celula === this.filtroCelula) &&
                (this.filtroEquipamento === '' || p.equipamento_nome === this.filtroEquipamento) &&
                (this.filtroMotivo === '' || p.motivo === this.filtroMotivo)
            );
        },
        tiposUnicos() {
            return [...new Set(this.paradas.map(p => p.tipo))].sort();
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
                const res = await fetch('http://10.1.0.8:3000/paradas/abertas');
                this.paradas = await res.json();
            } catch (err) {
                console.error('Erro ao carregar paradas abertas:', err);
            }
        },
        toggleDropdown(campo) {
            Object.keys(this.dropdowns).forEach(k => this.dropdowns[k] = false);
            this.dropdowns[campo] = true;
        },
        fecharTodosDropdowns() {
            Object.keys(this.dropdowns).forEach(k => this.dropdowns[k] = false);
        },
        abrirModalParada() {
        if (!this.modalParadaInstance) {
            this.modalParadaInstance = new bootstrap.Modal(this.$refs.modalParada);
        }

        this.paradaKey = Date.now();

        this.modalParadaInstance.show();

        this.$refs.modalParada.addEventListener('hidden.bs.modal', () => {
            this.carregarParadas();
        }, { once: true });
        }

    },
    mounted() {
        this.carregarParadas();
        this.$root.$on && this.$root.$on('abrir-parada', this.carregarParadas);
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
