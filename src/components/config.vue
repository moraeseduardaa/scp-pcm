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
            <div v-if="operadoresDB.length > 0">
                <button class="btn btn-primary mb-2" @click="adicionarOperador">Adicionar Operador</button>
                <div class="table-responsive">
                    <table class="table table-dark table-hover mt-4">
                        <thead>
                            <tr>
                                <th>Nome do Operador</th>
                                <th >Setor</th>
                                <th class="text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="op in operadoresDB" :key="op.codigo">
                                <td v-if="editandoOperador === op.codigo">
                                    <input v-model="editNomeOperador" class="form-control" />
                                </td>
                                <td v-else>{{ op.nome_operador }}</td>
                                <td v-if="editandoOperador === op.codigo">
                                    <input v-model="editSetor" class="form-control" />
                                </td>
                                <td v-else>{{ op.setor }}</td>
                                <td class="text-center align-middle">
                                    <div class="d-flex justify-content-center gap-2">
                                        <button v-if="editandoOperador === op.codigo" class="btn btn-success btn-sm" @click="salvarEdicaoOperador(op.codigo)">Salvar</button>
                                        <button v-if="editandoOperador === op.codigo" class="btn btn-secondary btn-sm" @click="cancelarEdicaoOperador">Cancelar</button>
                                        <template v-else>
                                            <button class="btn btn-secondary btn-sm" @click="editarOperador(op)">Editar</button>
                                            <button class="btn btn-danger btn-sm" @click="inativarOperador(op.codigo)">Inativar</button>
                                        </template>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div v-else class="text-center mt-5">
                <p>Nenhum operador cadastrado.</p>
            </div>
        </div>

        <div v-if="telaAtiva === 'motivo'">
            <input v-model="novoMotivo" class="form-control my-3" placeholder="Motivo" />
            <button class="btn btn-success mb-3" @click="adicionarMotivo">Adicionar</button>
            <ul class="list-group">
                <li v-for="(motivo, index) in motivos" :key="index" class="list-group-item bg-dark text-white">
                    {{ motivo }}
                </li>
            </ul>
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
            novoMotivo: "",
            motivos: []
        };
    },
    methods: {
        async buscarOperadores() {
            try {
                const res = await fetch('http://10.1.0.8:3000/operadores');
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
        editarOperador(op) {
            this.editandoOperador = op.codigo;
            this.editNomeOperador = op.nome_operador;
            this.editSetor = op.setor;
        },
        cancelarEdicaoOperador() {
            this.editandoOperador = null;
            this.editNomeOperador = '';
            this.editSetor = '';
        },
        async salvarEdicaoOperador(codigo) {
            try {
                await fetch(`http://10.1.0.8:3000/operadores/${codigo}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome_operador: this.editNomeOperador, setor: this.editSetor })
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
                    await fetch(`http://10.1.0.8:3000/operadores/${codigo}/inativar`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    this.buscarOperadores();
                } catch (e) {
                    alert('Erro ao inativar operador!');
                }
            }
        },
        adicionarOperador() {
            if (this.novoOperador.trim()) {
                this.novoOperador = "";
                this.buscarOperadores();
            }
        },
        adicionarMotivo() {
            if (this.novoMotivo.trim()) {
                this.motivos.push(this.novoMotivo.trim());
                this.novoMotivo = "";
            }
        }
    },
    watch: {
        atualizar() {
            setTimeout(() => {
                this.buscarOperadores();
            }, 100);
        }
    },
    mounted() {
        this.buscarOperadores();
    }
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
</style>
