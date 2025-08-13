<template>
  <div class="container mt-4">
    <table class="table table-dark table-hover">
      <thead>
        <tr>
          <th>Equipamento</th>
          <th>Turno</th>
          <th>HE</th>
          <th>Turno com HE</th>
          <th>Paradas</th>
          <th>Produtividade</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="equip in equipamentos" :key="equip.codigo">
          <td>{{ equip.descricao }}</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
        </tr>
        <tr v-if="equipamentos.length === 0">
          <td colspan="6" class="text-center">Nenhum equipamento encontrado para a unidade.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'Controle',
  props: {
    unidade: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      equipamentos: []
    };
  },
  async mounted() {
    await this.buscarEquipamentos();
  },
  methods: {
    async buscarEquipamentos() {
      try {
        const res = await fetch(`http://10.1.1.11:3000/equipamentos-por-unidade?unidade=${encodeURIComponent(this.unidade)}`);
        const data = await res.json();
        this.equipamentos = Array.isArray(data) ? data : [];
      } catch (e) {
        this.equipamentos = [];
      }
    }
  }
};
</script>

<style scoped>
.container {
  max-width: 900px;
}
</style>