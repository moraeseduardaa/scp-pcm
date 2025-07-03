<template>
  <div class="container mt-4 text-white">
    <ul class="nav nav-tabs mb-4">
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: telaAtiva === 'operador' }"
          href="#"
          @click.prevent="telaAtiva = 'operador'"
        >
          Operador
        </a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: telaAtiva === 'motivo' }"
          href="#"
          @click.prevent="telaAtiva = 'motivo'"
        >
          Motivo de Parada
        </a>
      </li>
    </ul>

    <div v-if="telaAtiva === 'operador'">
      <h3>Cadastro de Operador</h3>
      <input v-model="novoOperador" class="form-control my-3" placeholder="Nome do operador" />
      <button class="btn btn-success mb-3" @click="adicionarOperador">Adicionar</button>

      <ul class="list-group">
        <li v-for="(op, index) in operadores" :key="index" class="list-group-item bg-dark text-white">
          {{ op }}
        </li>
      </ul>
    </div>

    <div v-if="telaAtiva === 'motivo'">
      <h3>Cadastro de Motivo de Parada</h3>
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
      novoMotivo: "",
      motivos: []
    };
  },
  methods: {
    adicionarOperador() {
      if (this.novoOperador.trim()) {
        this.operadores.push(this.novoOperador.trim());
        this.novoOperador = "";
      }
    },
    adicionarMotivo() {
      if (this.novoMotivo.trim()) {
        this.motivos.push(this.novoMotivo.trim());
        this.novoMotivo = "";
      }
    }
  }
};
</script>

<style scoped>
body {
  background-color: #212529;
}
.nav-tabs .nav-link {
  background-color: #00000000;
  color: #fff;
  font-weight: bold;
}
</style>

