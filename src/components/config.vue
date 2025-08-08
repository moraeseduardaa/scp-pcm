<template>
    <div class="container mt-4 text-white">
        <ul class="nav nav-tabs mb-4">
            <li class="nav-item">
                <a class="nav-link" :class="{ active: telaAtiva === 'operador' }" href="#"
                    @click.prevent="telaAtiva = 'operador'">
                    Operadores
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" :class="{ active: telaAtiva === 'motivo' }" href="#"
                    @click.prevent="telaAtiva = 'motivo'">
                    Motivos de Paradas
                </a>
            </li>
        </ul>

        <div v-if="telaAtiva === 'operador'">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <div class="form-check form-switch">
                    <input class="form-check-input bg-dark border-secondary" type="checkbox" id="mostrarInativos"
                        v-model="mostrarInativos" @change="buscarOperadores">
                        <span>{{ mostrarInativos ? 'Ocultar Inativos' : 'Mostrar Inativos' }}</span>
                </div>
                <button class="btn btn-primary btn-sm" @click="abrirInputAdicionar" v-if="!mostrarInputAdicionar">
                    Adicionar Operador
                </button>
            </div>
            <div v-if="mostrarInputAdicionar" class="mb-3">
                <div class="row g-2 align-items-center">
                    <div class="col">
                        <input v-model="novoOperadorNome" class="form-control" placeholder="Nome operador"
                            @input="novoOperadorNome = $event.target.value.toUpperCase()" />
                    </div>
            <div class="col">
                <select v-model="novoOperadorUnidade" class="form-control">
                    <option value="" disabled>Unidade</option>
                    <option v-for="unidade in unidadesFabris" :key="unidade" :value="unidade">{{ unidade }}</option>
                </select>
            </div>
            <div class="col">
                <select v-model="novoOperadorSetor" class="form-control">
                    <option value="" disabled>Setor</option>
                    <option v-for="setor in setoresUnicosAdd" :key="setor" :value="setor">{{ setor }}</option>
                </select>
            </div>
            <div class="col">
                <select v-model="novoOperadorCelula" class="form-control">
                    <option value="" disabled>Célula</option>
                    <option v-for="celula in celulasUnicasAdd" :key="celula" :value="celula">{{ celula }}</option>
                </select>
            </div>
                                        
                    <div class="col-auto d-flex gap-2">
                        <button class="btn btn-success btn-xs-width" @click="adicionarOperador">Salvar</button>
                        <button class="btn btn-secondary btn-xs-width"
                            @click="cancelarAdicionarOperador">Cancelar</button>
                    </div>
                </div>
            </div>
            <div v-if="operadoresDB.length > 0">
                <div class="table-responsive">
                    <table class="table table-dark table-hover mt-4">
                        <thead>
                            <tr>
                                <th>Nome do Operador</th>
                                <th class="position-relative">
                                    <span class="coluna-com-icone" @click.stop="toggleDropdownUnidade">
                                        Unidade <i class="bi bi-arrow-down-short"></i>
                                    </span>
                                    <div v-if="dropdownUnidade" class="dropdown-menu-custom">
                                        <div class="dropdown-item" @click="filtroUnidade = ''; fecharDropdownUnidade()">
                                            Todas as Unidades
                                        </div>
                                        <div class="dropdown-item" v-for="unidade in unidadesFabris" :key="unidade"
                                            @click="filtroUnidade = unidade; fecharDropdownUnidade()">{{ unidade }}
                                        </div>
                                    </div>
                                </th>
                                <th class="position-relative">
                                    <span class="coluna-com-icone" @click.stop="toggleDropdownSetor">
                                        Setor <i class="bi bi-arrow-down-short"></i>
                                    </span>
                                    <div v-if="dropdownSetor" class="dropdown-menu-custom">
                                        <div class="dropdown-item" @click="filtroSetor = ''; fecharDropdownSetor()">
                                            Todos os Setores
                                        </div>
                                        <div class="dropdown-item" v-for="setor in setoresUnicos" :key="setor"
                                            @click="filtroSetor = setor; fecharDropdownSetor()">{{ setor }}</div>
                                    </div>
                                </th>
                                <th>
                                    Célula
                                </th>
                                <th v-if="mostrarInativos">Status</th>
                                <th class="text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="op in operadoresFiltrados" :key="op.codigo">
                                <td v-if="editandoOperador === op.codigo">
                                    <input v-model="editNomeOperador" class="form-control"
                                        @input="editNomeOperador = $event.target.value.toUpperCase()" />
                                </td>
                                <td v-else>{{ op.nome_operador }}</td>
                                <td v-if="editandoOperador === op.codigo">
                                    <select v-model="editUnidade" class="form-control">
                                        <option v-if="editUnidade && !unidadesFabris.includes(editUnidade)"
                                            :value="editUnidade">{{ editUnidade }}</option>
                                        <option v-for="unidade in unidadesFabris" :key="unidade" :value="unidade">{{
                                            unidade }}</option>
                                    </select>
                                </td>
                                <td v-else>{{ op.unidade }}</td>
                                <td v-if="editandoOperador === op.codigo">
                                    <select v-model="editSetor" class="form-control">
                                        <option v-if="editSetor && !setoresUnicos.includes(editSetor)"
                                            :value="editSetor">{{ editSetor }}</option>
                                        <option v-for="setor in setoresUnicos" :key="setor" :value="setor">{{ setor }}
                                        </option>
                                    </select>
                                </td>
                                <td v-else>{{ op.setor }}</td>
                                <td v-if="editandoOperador === op.codigo">
                                    <select v-model="editCelula" class="form-control">
                                        <option v-if="editCelula && !celulasUnicas.includes(editCelula)"
                                            :value="editCelula">{{ editCelula }}</option>
                                        <option v-for="celula in celulasUnicas" :key="celula" :value="celula">{{ celula
                                            }}</option>
                                    </select>
                                </td>
                                <td v-else>{{ op.celula }}</td>
                                <td v-if="mostrarInativos" class="align-middle text-uppercase fw-bold">
                                    {{ op.status }}
                                </td>
                                <td class="text-center align-middle">
                                    <div class="d-flex justify-content-center gap-2">
                                        <template v-if="mostrarInativos">
                                            <button class="btn btn-success btn-sm btn-xs-width"
                                                @click="ativarOperador(op.codigo)">Ativar</button>
                                        </template>
                                        <template v-else>
                                            <button v-if="editandoOperador === op.codigo"
                                                class="btn btn-success btn-sm btn-xs-width"
                                                @click="salvarEdicaoOperador(op.codigo)">Salvar</button>
                                            <button v-if="editandoOperador === op.codigo"
                                                class="btn btn-secondary btn-sm btn-xs-width"
                                                @click="cancelarEdicaoOperador">Cancelar</button>
                                            <template v-else>
                                                <button class="btn btn-secondary btn-sm btn-xs-width"
                                                    @click="editarOperador(op)">Editar</button>
                                                <button class="btn btn-danger btn-sm btn-xs-width"
                                                    @click="inativarOperador(op.codigo)">Inativar</button>
                                            </template>
                                        </template>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div v-else class="text-center mt-5">
                <p>Nenhum operador inativo.</p>
            </div>
        </div>

        <div v-if="telaAtiva === 'motivo'">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <div class="form-check form-switch">
                    <input class="form-check-input bg-dark border-secondary" type="checkbox" id="mostrarInativosMotivos"
                        v-model="mostrarInativosMotivos" @change="buscarMotivos">
                        <span>{{ mostrarInativosMotivos ? 'Ocultar Inativos' : 'Mostrar Inativos' }}</span>
                </div>
                <button class="btn btn-primary btn-sm" @click="abrirInputAdicionarMotivo"
                    v-if="!mostrarInputAdicionarMotivo">Adicionar Motivo</button>
            </div>

            <div v-if="mostrarInputAdicionarMotivo" class="mb-3">
                <div class="row g-2 align-items-center">
                    <div class="col">
                        <input v-model="novoMotivo" class="form-control" placeholder="Novo motivo de parada"
                            @input="novoMotivo = $event.target.value.toUpperCase()" />
                    </div>
                    <div class="col">
                        <select v-model="novoParadaTipo" class="form-control">
                            <option value="">Selecione</option>
                            <option value="SIM">Programada</option>
                            <option value="NAO">Não Programada</option>
                        </select>
                    </div>
                    <div class="col-auto d-flex gap-2">
                        <button class="btn btn-success" @click="adicionarMotivo">Salvar</button>
                        <button class="btn btn-secondary" @click="cancelarAdicionarMotivo">Cancelar</button>
                    </div>
                </div>
            </div>

            <div v-if="motivosDB.length > 0">
                <div class="table-responsive">
                    <table class="table table-dark table-hover mt-4">
                        <thead>
                            <tr>
                                <th>Motivo de Parada</th>
                                <th>Parada</th>
                                <th v-if="mostrarInativosMotivos">Status</th>
                                <th class="text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="motivo in motivosDB" :key="motivo.codigo">
                                <td v-if="editandoMotivo === motivo.codigo">
                                    <input v-model="editNomeMotivo" class="form-control" @input="editNomeMotivo = $event.target.value.toUpperCase()" />
                                </td>
                                <td v-else>{{ motivo.motivo }}</td>
                                <td v-if="editandoMotivo === motivo.codigo">
                                    <select v-model="editParadaTipo" class="form-control">
                                        <option value="">Selecione</option>
                                        <option value="SIM">Programada</option>
                                        <option value="NAO">Não Programada</option>
                                    </select>
                                </td>
                                <td v-else>{{ motivo.parada === 'SIM' ? 'Programada' : motivo.parada === 'NAO' ? 'Não Programada' : 'Não Informada' }}</td>
                                <td v-if="mostrarInativosMotivos" class="align-middle text-uppercase fw-bold">
                                    {{ motivo.status }}
                                </td>
                                <td class="text-center align-middle">
                                    <div class="d-flex justify-content-center gap-2">
                                        <template v-if="mostrarInativosMotivos">
                                            <button class="btn btn-success" @click="ativarMotivo(motivo.codigo)">Ativar</button>
                                        </template>
                                        <template v-else>
                                            <button v-if="editandoMotivo === motivo.codigo" class="btn btn-success btn-sm" @click="salvarEdicaoMotivo(motivo.codigo)">Salvar</button>
                                            <button v-if="editandoMotivo === motivo.codigo" class="btn btn-secondary btn-sm" @click="cancelarEdicaoMotivo">Cancelar</button>
                                            <template v-else>
                                                <button class="btn btn-secondary btn-sm" @click="editarMotivo(motivo)">Editar</button>
                                                <button class="btn btn-danger btn-sm" @click="inativarMotivo(motivo.codigo)">Inativar</button>
                                            </template>
                                        </template>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div v-else class="text-center mt-5">
                <p>{{ mostrarInativosMotivos ? 'Nenhum motivo inativo.' : 'Nenhum motivo cadastrado.' }}</p>
            </div>
        </div>

    </div>
    
</template>

<script>
export default {
    name: "Config",
    data() {
        return {
            telaAtiva: "operador",
            novoOperador: "",
            operadores: [],
            operadoresDB: [],
            editandoOperador: null,
            editNomeOperador: '',
            editSetor: '',
            editUnidade: '',
            editCelula: '',
            filtroCelula: '',
            dropdownCelula: false,
            novoMotivo: "",
            motivos: [],
            motivosDB: [],
            motivosDetalhes: [],
            editandoMotivo: null,
            editNomeMotivo: '',
            mostrarInputAdicionar: false,
            novoOperadorNome: '',
            novoOperadorSetor: '',
            novoOperadorUnidade: '',
            novoOperadorCelula: '',
            mostrarInativos: false,
            mostrarInativosMotivos: false,
            filtroSetor: '',
            dropdownSetor: false,
            mostrarInputAdicionarMotivo: false,
            filtroUnidade: '',
            dropdownUnidade: false,
            editParadaTipo: '',
            novoParadaTipo: '',
            unidadesFabrisList: [],
            setoresDisponiveisAdd: [],
            setoresDisponiveisEdit: [],
        };
    },
    computed: {
        setoresUnicosAdd() {
            return this.setoresDisponiveisAdd.map(s => s.tipo_descricao);
        },
        celulasUnicasAdd() { 
            if (this.novoOperadorUnidade && this.novoOperadorSetor) {
                return [...new Set(this.operadoresDB.filter(op => op.unidade === this.novoOperadorUnidade && op.setor === this.novoOperadorSetor).map(op => op.celula).filter(Boolean))].sort();
            }
            return [...new Set(this.operadoresDB.map(op => op.celula).filter(Boolean))].sort();
        },
        setoresUnicos() {
            return this.setoresDisponiveisEdit.map(s => s.tipo_descricao);
        },
        celulasUnicas() {
            if (this.editandoOperador && this.editUnidade && this.editSetor) {
                return [...new Set(this.operadoresDB.filter(op => op.unidade === this.editUnidade && op.setor === this.editSetor).map(op => op.celula).filter(Boolean))].sort();
            }
            return [...new Set(this.operadoresDB.map(op => op.celula).filter(Boolean))].sort();
        },
        toggleDropdownCelula() {
            this.dropdownCelula = !this.dropdownCelula;
        },
        fecharDropdownCelula() {
            this.dropdownCelula = false;
        },
        unidadesFabris() {
            return this.unidadesFabrisList;
        },
        operadoresFiltrados() {
            let filtrados = this.operadoresDB;
            if (this.filtroUnidade) {
                filtrados = filtrados.filter(op => op.unidade === this.filtroUnidade);
            }
            if (this.filtroSetor) {
                filtrados = filtrados.filter(op => op.setor === this.filtroSetor);
            }
            if (this.filtroCelula) {
                filtrados = filtrados.filter(op => op.celula === this.filtroCelula);
            }
            return filtrados;
        }
    },
    methods: {
        async buscarOperadores() {
            try {
                let url = 'http://10.1.1.11:3000/operadores';
                if (this.mostrarInativos) {
                    url += '?status=INATIVO';
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
                this.operadoresDB = Array.isArray(data) ? data : [];
            } catch (e) {
                console.error('Erro ao buscar operadores:', e);
            }
        },
        abrirInputAdicionar() {
            this.mostrarInputAdicionar = true;
            this.$nextTick(() => {
                const input = this.$el.querySelector('input[placeholder="Nome do operador"]');
                if (input) input.focus();
            });
        },
        cancelarAdicionarOperador() {
            this.mostrarInputAdicionar = false;
            this.novoOperadorNome = '';
            this.novoOperadorSetor = '';
        },
        editarOperador(op) {
            this.editandoOperador = op.codigo;
            this.editNomeOperador = op.nome_operador;
            this.editUnidade = op.unidade;
            this.editSetor = op.setor;
            this.editCelula = op.celula;
        },
        cancelarEdicaoOperador() {
            this.editandoOperador = null;
            this.editNomeOperador = '';
            this.editSetor = '';
            this.editUnidade = '';
            this.editCelula = '';
        },
        async ativarOperador(codigo) {
            try {
                await fetch(`http://10.1.1.11:3000/operadores/${codigo}/ativar`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' }
                });
                this.buscarOperadores();
            } catch (e) {
                alert('Erro ao ativar operador!');
            }
        },
        async salvarEdicaoOperador(codigo) {
            try {
                await fetch(`http://10.1.1.11:3000/operadores/${codigo}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nome_operador: this.editNomeOperador,
                        setor: this.editSetor,
                        unidade: this.editUnidade,
                        celula: this.editCelula
                    })
                });
                this.buscarOperadores();
                this.cancelarEdicaoOperador();
            } catch (e) {
                alert('Erro ao salvar edição!');
            }
        },
        async inativarOperador(codigo) {
            if (confirm('Tem certeza que deseja inativar este operador?')) {
                try {
                    await fetch(`http://10.1.1.11:3000/operadores/${codigo}/inativar`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    this.buscarOperadores();
                } catch (e) {
                    alert('Erro ao inativar operador!');
                }
            }
        },
        async adicionarOperador() {
            if (!this.novoOperadorNome.trim() || !this.novoOperadorUnidade || !this.novoOperadorSetor.trim() || !this.novoOperadorCelula) {
                alert('Preencha o nome, unidade, setor e célula!');
                return;
            }
            try {
                await fetch('http://10.1.1.11:3000/operadores', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nome_operador: this.novoOperadorNome.trim(),
                        unidade: this.novoOperadorUnidade,
                        setor: this.novoOperadorSetor.trim(),
                        celula: this.novoOperadorCelula
                    })
                });
                this.novoOperadorNome = '';
                this.novoOperadorSetor = '';
                this.novoOperadorUnidade = '';
                this.novoOperadorCelula = '';
                this.mostrarInputAdicionar = false;
                this.buscarOperadores();
            } catch (e) {
                alert('Erro ao adicionar operador!');
            }
        },
        async buscarUnidadesFabris() {
            try {
                const res = await fetch('http://10.1.1.11:3000/unidades-fabrica');
                const data = await res.json();
                this.unidadesFabrisList = Array.isArray(data) ? data : [];
            } catch (e) {
                console.error('Erro ao buscar unidades fabris:', e);
                this.unidadesFabrisList = [];
            }
        },
        toggleDropdownSetor() {
            this.dropdownSetor = !this.dropdownSetor;
        },
        fecharDropdownSetor() {
            this.dropdownSetor = false;
        },
        toggleDropdownUnidade() {
            this.dropdownUnidade = !this.dropdownUnidade;
        },
        fecharDropdownUnidade() {
            this.dropdownUnidade = false;
        },
        async buscarSetoresPorUnidadeAdd() {
            if (!this.novoOperadorUnidade) {
                this.setoresDisponiveisAdd = [];
                return;
            }
            try {
                const res = await fetch(`http://10.1.1.11:3000/setores-por-unidade?unidade=${encodeURIComponent(this.novoOperadorUnidade)}`);
                const data = await res.json();
                this.setoresDisponiveisAdd = Array.isArray(data) ? data : [];
            } catch (e) {
                this.setoresDisponiveisAdd = [];
            }
        },
        async buscarSetoresPorUnidadeEdit() {
            if (!this.editUnidade) {
                this.setoresDisponiveisEdit = [];
                return;
            }
            try {
                const res = await fetch(`http://10.1.1.11:3000/setores-por-unidade?unidade=${encodeURIComponent(this.editUnidade)}`);
                const data = await res.json();
                this.setoresDisponiveisEdit = Array.isArray(data) ? data : [];
            } catch (e) {
                this.setoresDisponiveisEdit = [];
            }
        },

        async buscarMotivos() {
            try {
                let url = 'http://10.1.1.11:3000/motivos-parada';
                if (this.mostrarInativosMotivos) {
                    url += '?status=INATIVO';
                }
                console.log('URL para motivos:', url);
                console.log('mostrarInativosMotivos:', this.mostrarInativosMotivos);
                const res = await fetch(url);
                let data = await res.json();
                if (data && data.Content) {
                    try {
                        data = JSON.parse(data.Content);
                    } catch (e) {
                        console.error('Erro ao parsear Content:', e);
                    }
                }
                this.motivosDB = Array.isArray(data) ? data : [];
                console.log('motivosDB final:', this.motivosDB);
            } catch (e) {
                console.error('Erro ao buscar motivos:', e);
            }
        },
        abrirInputAdicionarMotivo() {
            this.mostrarInputAdicionarMotivo = true;
            this.$nextTick(() => {
                const input = this.$el.querySelector('input[placeholder="Novo motivo de parada"]');
                if (input) input.focus();
            });
        },
        cancelarAdicionarMotivo() {
            this.mostrarInputAdicionarMotivo = false;
            this.novoMotivo = '';
        },
        async adicionarMotivo() {
            if (!this.novoMotivo.trim() || !this.novoParadaTipo) {
                alert('Preencha o motivo e selecione o tipo de parada!');
                return;
            }
            try {
                await fetch('http://10.1.1.11:3000/motivos-parada', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ motivo: this.novoMotivo.trim(), parada: this.novoParadaTipo })
                });
                this.novoMotivo = '';
                this.novoParadaTipo = '';
                this.mostrarInputAdicionarMotivo = false;
                this.buscarMotivos();
            } catch (e) {
                alert('Erro ao adicionar motivo!');
            }
        },
        async inativarMotivo(codigo) {
            if (confirm('Tem certeza que deseja inativar este motivo?')) {
                try {
                    await fetch(`http://10.1.1.11:3000/motivos-parada/${codigo}/inativar`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    this.buscarMotivos();
                } catch (e) {
                    alert('Erro ao inativar motivo!');
                }
            }
        },
        async ativarMotivo(codigo) {
            try {
                await fetch(`http://10.1.1.11:3000/motivos-parada/${codigo}/ativar`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' }
                });
                this.buscarMotivos();
            } catch (e) {
                alert('Erro ao ativar motivo!');
            }
        },
        editarMotivo(motivo) {
            this.editandoMotivo = motivo.codigo;
            this.editNomeMotivo = motivo.motivo;
            this.editParadaTipo = motivo.parada || '';
        },
        cancelarEdicaoMotivo() {
            this.editandoMotivo = null;
            this.editNomeMotivo = '';
            this.editParadaTipo = '';
        },
        async salvarEdicaoMotivo(codigo) {
            if (!this.editNomeMotivo.trim() || !this.editParadaTipo) {
                alert('Preencha o motivo e selecione o tipo de parada!');
                return;
            }
            try {
                await fetch(`http://10.1.1.11:3000/motivos-parada/${codigo}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ motivo: this.editNomeMotivo.trim(), parada: this.editParadaTipo })
                });
                this.buscarMotivos();
                this.cancelarEdicaoMotivo();
            } catch (e) {
                alert('Erro ao salvar edição!');
            }
        },
    },
    watch: {
        atualizar() {
            setTimeout(() => {
                this.buscarOperadores();
            }, 100);
        },
        novoOperadorUnidade(newVal) {
            this.novoOperadorSetor = '';
            this.buscarSetoresPorUnidadeAdd();
        },
        editUnidade(newVal) {
            this.editSetor = '';
            this.buscarSetoresPorUnidadeEdit();
        },
    },
    async mounted() {
        this.buscarOperadores();
        this.buscarMotivos();
        await this.buscarUnidadesFabris();
    },
};
</script>

<style scoped>
body {
    background-color: #212529;
}
.nav-tabs .nav-link {
    color: #fff !important;
    background-color: transparent !important;
}
.nav-tabs .nav-link.active {
    border-color: #6c757d #6c757d #343a40;
    font-weight: bold;
}
input.form-control {
    background-color: #343a40 !important;
    color: #fff !important;
    border: 1px solid #7c838a;
}
select.form-control {
    background-color: #343a40 !important;
    color: #fff !important;
    border: 1px solid #7c838a;
}
input.form-control::placeholder {
    color: #ccc !important;
    opacity: 1;
}
.dropdown-menu-custom {
    position: absolute;
    z-index: 10;
    background: #23272b;
    border: 1px solid #444;
    border-radius: 0.25rem;
    min-width: 160px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    margin-top: 0.5rem;
}
.dropdown-item {
    padding: 0.5rem 1rem;
    cursor: pointer;
    color: #fff;
}
.dropdown-item:hover {
    background: #343a40;
}
.coluna-com-icone {
    cursor: pointer;
    user-select: none;
}
.btn-xs-width {
    min-width: 56px;
    font-size: 0.9rem;
}
</style>
