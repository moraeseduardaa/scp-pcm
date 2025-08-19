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
                            <option v-for="unidade in unidadesFabris" :key="unidade" :value="unidade">{{ unidade }}
                            </option>
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
                            <option v-for="celula in celulasUnicasAdd" :key="celula" :value="celula">{{ celula }}
                            </option>
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
                                        <div class="dropdown-item" @click="selecionarUnidade('')">
                                            Todas as Unidades
                                        </div>
                                        <div class="dropdown-item" v-for="unidade in unidadesFabris" :key="unidade"
                                            @click="selecionarUnidade(unidade)">
                                            {{ unidade }}
                                        </div>
                                    </div>
                                </th>
                                <th class="position-relative">
                                    <span class="coluna-com-icone" @click.stop="toggleDropdownSetor">
                                        Setor <i class="bi bi-arrow-down-short"></i>
                                    </span>
                                    <div v-if="dropdownSetor" class="dropdown-menu-custom">
                                        <div class="dropdown-item" @click="selecionarSetor('')">
                                            Todos os Setores
                                        </div>
                                        <div class="dropdown-item" v-for="setor in setoresUnicos" :key="setor"
                                            @click="selecionarSetor(setor)">
                                            {{ setor }}
                                        </div>
                                    </div>
                                </th>
                                <th>Célula</th>
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
                                        <option v-if="editSetor && !setoresUnicosEdit.includes(editSetor)"
                                            :value="editSetor">{{ editSetor }}</option>
                                        <option v-for="setor in setoresUnicosEdit" :key="setor" :value="setor">{{ setor }}
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
                                <th class="position-relative">
                                    <span class="coluna-com-icone" @click.stop="toggleDropdownTipoParada">
                                        Parada <i class="bi bi-arrow-down-short"></i>
                                    </span>
                                    <div v-if="dropdownTipoParada" class="dropdown-menu-custom">
                                        <div class="dropdown-item" @click="selecionarTipoParada('')">
                                            Todas
                                        </div>
                                        <div class="dropdown-item" @click="selecionarTipoParada('SIM')">
                                            Programada
                                        </div>
                                        <div class="dropdown-item" @click="selecionarTipoParada('NAO')">
                                            Não Programada
                                        </div>
                                    </div>
                                </th>
                                <th v-if="mostrarInativosMotivos">Status</th>
                                <th class="text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="motivo in motivosFiltrados" :key="motivo.codigo">
                                <td v-if="editandoMotivo === motivo.codigo">
                                    <input v-model="editNomeMotivo" class="form-control"
                                        @input="editNomeMotivo = $event.target.value.toUpperCase()" />
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
                                            <button class="btn btn-success"
                                                @click="ativarMotivo(motivo.codigo)">Ativar</button>
                                        </template>
                                        <template v-else>
                                            <button v-if="editandoMotivo === motivo.codigo"
                                                class="btn btn-success btn-sm"
                                                @click="salvarEdicaoMotivo(motivo.codigo)">Salvar</button>
                                            <button v-if="editandoMotivo === motivo.codigo"
                                                class="btn btn-secondary btn-sm"
                                                @click="cancelarEdicaoMotivo">Cancelar</button>
                                            <template v-else>
                                                <button class="btn btn-secondary btn-sm"
                                                    @click="editarMotivo(motivo)">Editar</button>
                                                <button class="btn btn-danger btn-sm"
                                                    @click="inativarMotivo(motivo.codigo)">Inativar</button>
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

<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";

const telaAtiva = ref("operador");
const unidadesFabrisList = ref([]);
const operadoresDB = ref([]);
const motivosDB = ref([]);
const setoresDisponiveisAdd = ref([]);
const setoresDisponiveisEdit = ref([]);

const filtroUnidade = ref("");
const filtroSetor = ref("");
const filtroCelula = ref("");
const filtroTipoParada = ref("");

const dropdownUnidade = ref(false);
const dropdownSetor = ref(false);
const dropdownTipoParada = ref(false);

const novoOperadorNome = ref("");
const novoOperadorUnidade = ref("");
const novoOperadorSetor = ref("");
const novoOperadorCelula = ref("");
const novoMotivo = ref("");
const novoParadaTipo = ref("");

const editandoOperador = ref(null);
const editNomeOperador = ref("");
const editUnidade = ref("");
const editSetor = ref("");
const editCelula = ref("");
const editandoMotivo = ref(null);
const editNomeMotivo = ref("");
const editParadaTipo = ref("");

const mostrarInativos = ref(false);
const mostrarInputAdicionar = ref(false);
const mostrarInativosMotivos = ref(false);
const mostrarInputAdicionarMotivo = ref(false);

const unidadesFabris = computed(() => unidadesFabrisList.value);
const setoresUnicosAdd = computed(() => setoresDisponiveisAdd.value.map(s => s.tipo_descricao));
const setoresUnicosEdit = computed(() => setoresDisponiveisEdit.value.map(s => s.tipo_descricao));
const celulasUnicasAdd = computed(() => filtrarCelulas(novoOperadorUnidade.value, novoOperadorSetor.value));
const celulasUnicas = computed(() => filtrarCelulas(editUnidade.value, editSetor.value));

const operadoresFiltrados = computed(() => {
    return operadoresDB.value.filter(op => {
        const unidadeOk = !filtroUnidade.value || String(op.unidade).toUpperCase().trim() === String(filtroUnidade.value).toUpperCase().trim();
        const setorOk = !filtroSetor.value || String(op.setor).toUpperCase().trim() === String(filtroSetor.value).toUpperCase().trim();
        const celulaOk = !filtroCelula.value || String(op.celula).toUpperCase().trim() === String(filtroCelula.value).toUpperCase().trim();
        return unidadeOk && setorOk && celulaOk;
    });
});

const motivosFiltrados = computed(() => {
    return motivosDB.value.filter(motivo => {
        if (!filtroTipoParada.value) return true;
        return String(motivo.parada).toUpperCase().trim() === filtroTipoParada.value.toUpperCase().trim();
    });
});

const setoresUnicos = computed(() => {
    if (!filtroUnidade.value) {
        const setores = [];
        operadoresDB.value.forEach(op => {
            if (op.setor && !setores.includes(op.setor)) setores.push(op.setor);
        });
        return setores.sort();
    } else {
        const setores = [];
        operadoresDB.value.forEach(op => {
            if (op.unidade === filtroUnidade.value && op.setor && !setores.includes(op.setor)) setores.push(op.setor);
        });
        return setores.sort();
    }
});

async function request(url, options = {}) {
    try {
        const res = await fetch(url, options);
        let data = await res.json();
        if (data?.Content) data = JSON.parse(data.Content);
        return Array.isArray(data) ? data : [];
    } catch (e) {
        console.error("Erro na requisição:", e);
        return [];
    }
}

function filtrarCelulas(unidade, setor) {
    return [...new Set(
        operadoresDB.value
            .filter(op => (!unidade || op.unidade === unidade) && (!setor || op.setor === setor))
            .map(op => op.celula)
            .filter(Boolean)
    )].sort();
}

async function buscarUnidadesFabris() {
    unidadesFabrisList.value = await request(`http://10.1.1.11:3000/unidades-fabrica`);
}

async function buscarSetoresPorUnidadeAdd() {
    setoresDisponiveisAdd.value = novoOperadorUnidade.value
        ? await request(`http://10.1.1.11:3000/setores-por-unidade?unidade=${encodeURIComponent(novoOperadorUnidade.value)}`)
        : [];
}

async function buscarSetoresPorUnidadeEdit() {
    setoresDisponiveisEdit.value = editUnidade.value
        ? await request(`http://10.1.1.11:3000/setores-por-unidade?unidade=${encodeURIComponent(editUnidade.value)}`)
        : [];
}

//filtros
function toggleDropdownUnidade() {
    dropdownUnidade.value = !dropdownUnidade.value;
    dropdownSetor.value = false;
}
function selecionarUnidade(unidade) {
    filtroUnidade.value = unidade;
    dropdownUnidade.value = false;
}

function toggleDropdownSetor() {
    dropdownSetor.value = !dropdownSetor.value;
    dropdownUnidade.value = false;
}
function selecionarSetor(setor) {
    filtroSetor.value = setor;
    dropdownSetor.value = false;
}

function toggleDropdownTipoParada() {
    dropdownTipoParada.value = !dropdownTipoParada.value;
}
function selecionarTipoParada(tipo) {
    filtroTipoParada.value = tipo;
    dropdownTipoParada.value = false;
}

//operadores
async function buscarOperadores() {
    const url = `http://10.1.1.11:3000/operadores${mostrarInativos.value ? "?status=INATIVO" : ""}`;
    operadoresDB.value = await request(url);
}
function abrirInputAdicionar() {
    mostrarInputAdicionar.value = true;
    nextTick(() => document.querySelector('input[placeholder="Nome do operador"]')?.focus());
}
function cancelarAdicionarOperador() {
    mostrarInputAdicionar.value = false;
    novoOperadorNome.value = "";
    novoOperadorSetor.value = "";
}
async function adicionarOperador() {
    if (!novoOperadorNome.value.trim() || !novoOperadorUnidade.value || !novoOperadorSetor.value.trim() || !novoOperadorCelula.value)
        return alert("Preencha o nome, unidade, setor e célula!");

    await fetch(`http://10.1.1.11:3000/operadores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            nome_operador: novoOperadorNome.value.trim(),
            unidade: novoOperadorUnidade.value,
            setor: novoOperadorSetor.value.trim(),
            celula: novoOperadorCelula.value
        })
    });

    novoOperadorNome.value = "";
    novoOperadorSetor.value = "";
    novoOperadorUnidade.value = "";
    novoOperadorCelula.value = "";
    mostrarInputAdicionar.value = false;

    buscarOperadores();
}

async function editarOperador(op) {
    editandoOperador.value = op.codigo;
    editNomeOperador.value = op.nome_operador;
    editUnidade.value = op.unidade;
    await buscarSetoresPorUnidadeEdit();
    editSetor.value = op.setor;
    editCelula.value = op.celula;
}
async function salvarEdicaoOperador(codigo) {
    await fetch(`http://10.1.1.11:3000/operadores/${codigo}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            nome_operador: editNomeOperador.value,
            setor: editSetor.value,
            unidade: editUnidade.value,
            celula: editCelula.value
        })
    });
    buscarOperadores();
    cancelarEdicaoOperador();
}
function cancelarEdicaoOperador() {
    editandoOperador.value = null;
    editNomeOperador.value = "";
    editSetor.value = "";
    editUnidade.value = "";
    editCelula.value = "";
}

function inativarOperador(codigo) {
    if (confirm("Tem certeza que deseja inativar este operador?"))
        alterarStatusOperador(codigo, "inativar");
}
function ativarOperador(codigo) {
    alterarStatusOperador(codigo, "ativar");
}

async function alterarStatusOperador(codigo, acao) {
    await fetch(`http://10.1.1.11:3000/operadores/${codigo}/${acao}`, { method: "PUT", headers: { "Content-Type": "application/json" } });
    buscarOperadores();
}

//motivos-parada
async function buscarMotivos() {
    const url = `http://10.1.1.11:3000/motivos-parada${mostrarInativosMotivos.value ? "?status=INATIVO" : ""}`;
    motivosDB.value = await request(url);
}
function abrirInputAdicionarMotivo() {
    mostrarInputAdicionarMotivo.value = true;
    nextTick(() => document.querySelector('input[placeholder="Novo motivo de parada"]')?.focus());
}
function cancelarAdicionarMotivo() {
    mostrarInputAdicionarMotivo.value = false;
    novoMotivo.value = "";
}
async function adicionarMotivo() {
    if (!novoMotivo.value.trim() || !novoParadaTipo.value)
        return alert("Preencha o motivo e selecione o tipo de parada!");

    await fetch(`http://10.1.1.11:3000/motivos-parada`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo: novoMotivo.value.trim(), parada: novoParadaTipo.value })
    });

    novoMotivo.value = "";
    novoParadaTipo.value = "";
    mostrarInputAdicionarMotivo.value = false;
    buscarMotivos();
}

function editarMotivo(motivo) {
    editandoMotivo.value = motivo.codigo;
    editNomeMotivo.value = motivo.motivo;
    editParadaTipo.value = motivo.parada || "";
}
async function salvarEdicaoMotivo(codigo) {
    if (!editNomeMotivo.value.trim() || !editParadaTipo.value)
        return alert("Preencha o motivo e selecione o tipo de parada!");

    await fetch(`http://10.1.1.11:3000/motivos-parada/${codigo}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo: editNomeMotivo.value.trim(), parada: editParadaTipo.value })
    });

    buscarMotivos();
    cancelarEdicaoMotivo();
}
function cancelarEdicaoMotivo() {
    editandoMotivo.value = null;
    editNomeMotivo.value = "";
    editParadaTipo.value = "";
}

function inativarMotivo(codigo) {
    if (confirm("Tem certeza que deseja inativar este motivo?"))
        alterarStatusMotivo(codigo, "inativar");
}
function ativarMotivo(codigo) {
    alterarStatusMotivo(codigo, "ativar");
}

async function alterarStatusMotivo(codigo, acao) {
    await fetch(`http://10.1.1.11:3000/motivos-parada/${codigo}/${acao}`, { method: "PUT", headers: { "Content-Type": "application/json" } });
    buscarMotivos();
}

watch(novoOperadorUnidade, () => {
    novoOperadorSetor.value = "";
    buscarSetoresPorUnidadeAdd();
});

watch(editUnidade, () => {
    editSetor.value = "";
    buscarSetoresPorUnidadeEdit();
});

onMounted(async () => {
    const unidadeLogin = window?.app?.unidadePainelAdm;
    filtroUnidade.value = unidadeLogin !== undefined && unidadeLogin !== null ? String(unidadeLogin) : "";
    await buscarOperadores();
    buscarMotivos();
    await buscarUnidadesFabris();
});
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