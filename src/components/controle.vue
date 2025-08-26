<template>
  <div class="container mt-4">
    <div class="d-flex justify-content-end" style="width: 98%;">
      <div style="padding: 8px; min-width: 180px; margin-top: -35px">
        <select class="form-control custom-date-input" v-model="filtroUnidade" @change="onUnidadeChange">
          <option v-for="u in unidadesDisponiveis" :key="u.codigo" :value="u.codigo">{{ u.descricao }}</option>
        </select>
      </div>

      <div style="padding: 8px; min-width: 180px; margin-top: -35px">
        <select class="form-control custom-date-input" v-model="filtroSetor">
          <option value="">Todos Setores</option>
          <option v-for="setor in setoresDisponiveis" :key="setor.codigo" :value="setor.codigo">
            {{ setor.descricao }}
          </option>
        </select>
      </div>

      <div style="padding: 8px; min-width: 180px; margin-top: -35px">
        <select class="form-control custom-date-input" v-model="filtroCelula">
          <option value="">Todas Células</option>
          <option v-for="celula in celulasDisponiveis" :key="celula.codigo" :value="celula.codigo">
            {{ celula.celula }}
          </option>
        </select>
      </div>

      <div style="padding: 8px; min-width: 180px; margin-top: -35px">
        <select class="form-control custom-date-input" v-model="filtroTurno">
          <option value="">Todos os Turnos</option>
        </select>
      </div>

      <div style="padding: 8px; min-width: 180px; margin-top: -35px">
        <!-- <label>Data Inicial</label> -->
        <input type="date" class="form-control custom-date-input" v-model="dataInicial" @change="buscarDados" />
      </div>
      <div style="padding: 8px; min-width: 180px; margin-top: -35px">
        <!-- <label>Data Final</label> -->
        <input type="date" class="form-control custom-date-input" v-model="dataFinal" @change="buscarDados" />
      </div>
    </div>

    <table class="table table-dark table-hover mt-3">
      <thead>
        <tr>
          <th>Equipamento</th>
          <th>Turno</th>
          <th>HE</th>
          <th>Turno Total</th>
          <th>Paradas</th>
          <th>Disponível</th>
          <th>Trabalhado</th>
          <th>Produtividade</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="equip in painelFiltrado" :key="equip.codigo">
          <td>{{ equip.descricao }}</td>
          <td>{{ formatarHoras(equip.turnoNormal) }}</td>
          <td>{{ formatarHoras(equip.horaExtra) }}</td>
          <td>{{ formatarHoras(equip.turnoComHE) }}</td>
          <td>{{ formatarHoras(equip.horasParadas || 0) }}</td>
          <td>{{ formatarHoras(equip.horaDisponivel || 0) }}</td>
          <td>{{ formatarHoras(equip.horimetroTotalHoras || 0) }}</td>
          <td>
            <span v-if="equip.produtividade !== null">
              {{ (equip.produtividade * 100).toFixed(0) }}%
            </span>
            <span v-else>-</span>
          </td>
        </tr>
        <tr v-if="painelFiltrado.length === 0">
          <td colspan="6" class="text-center">Nenhum equipamento encontrado para os filtros selecionados.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, defineProps } from "vue";

const painel = ref([]);
const props = defineProps({
  unidade: { type: String, required: true }
});
const dataInicial = ref(new Date().toISOString().split("T")[0]);
const dataFinal = ref(new Date().toISOString().split("T")[0]);

const filtroUnidade = ref(props.unidade);
const filtroSetor = ref("");
const filtroCelula = ref("");

const unidadesDisponiveis = ref([]);
const setoresDisponiveis = ref([]);
const celulasDisponiveis = ref([]);

const painelFiltrado = computed(() => {
  return painel.value.filter((equip) => {
    const setorOk =
      !filtroSetor.value ||
      String(equip.setor).trim().toUpperCase() ===
      String(filtroSetor.value).trim().toUpperCase();

    const celulaOk =
      !filtroCelula.value ||
      String(equip.cod_celula) === String(filtroCelula.value);

    return setorOk && celulaOk;
  });
});

async function buscarUnidadesFabris() {
  try {
    const res = await fetch("http://10.1.1.11:3000/unidades-fabrica");
    let unidades = await res.json();

    unidades = unidades.map((u) =>
      typeof u === "string"
        ? { codigo: u.replace(/\D/g, "") || u, descricao: u }
        : u
    );

    if (!unidades.some((u) => u.codigo === props.unidade)) {
      unidades.unshift({
        codigo: props.unidade,
        descricao: `UNIDADE ${props.unidade}`
      });
    }

    unidadesDisponiveis.value = unidades;
  } catch {
    unidadesDisponiveis.value = [
      { codigo: props.unidade, descricao: `UNIDADE ${props.unidade}` }
    ];
  }
}

async function buscarSetoresPorUnidade(unidadeDescricao) {
  try {
    const res = await fetch(
      `http://10.1.1.11:3000/setores-por-unidade?unidade=${encodeURIComponent(
        unidadeDescricao
      )}`
    );
    const setores = await res.json();

    return setores.map((s) => ({
      codigo: s.tipo,
      descricao: s.tipo_descricao
    }));
  } catch (e) {
    console.error("Erro ao buscar setores:", e);
    return [];
  }
}

async function buscarCelulasPorUnidadeSetor(setorCodigo) {
  if (!setorCodigo) return [];
  try {
    const res = await fetch(
      `http://10.1.1.11:3000/celulas?tipo=${encodeURIComponent(setorCodigo)}`
    );
    const celulas = await res.json();
    return celulas;
  } catch {
    return [];
  }
}

async function onUnidadeChange() {
  const unidadeObj = unidadesDisponiveis.value.find(
    (u) => u.codigo === filtroUnidade.value
  );
  const unidadeDescricao = unidadeObj
    ? unidadeObj.descricao
    : filtroUnidade.value;

  setoresDisponiveis.value = await buscarSetoresPorUnidade(unidadeDescricao);
  filtroSetor.value = "";
  filtroCelula.value = "";
  celulasDisponiveis.value = [];

  await buscarDados();
}

async function buscarDados() {
  try {
    const resEquip = await fetch(
      `http://10.1.1.11:3000/equipamentos-por-unidade?unidade=${encodeURIComponent(
        filtroUnidade.value
      )}&dataInicial=${dataInicial.value}&dataFinal=${dataFinal.value}`
    );
    const equipamentos = await resEquip.json();

    const resHori = await fetch(
      `http://10.1.1.11:3000/horimetro?unidade=${encodeURIComponent(
        filtroUnidade.value
      )}&dataInicial=${dataInicial.value}&dataFinal=${dataFinal.value}`
    );
    const horimetro = await resHori.json();

    const resParadas = await fetch(
      `http://10.1.1.11:3000/paradas?unidade=${encodeURIComponent(
        filtroUnidade.value)}&dataInicial=${dataInicial.value}&dataFinal=${dataFinal.value}`
    );
    const paradas = await resParadas.json();

    const resHoriTotal = await fetch(
      `http://10.1.1.11:3000/horimetro/total?dataInicial=${dataInicial.value}&dataFinal=${dataFinal.value}`
    );
    const horimetroTotal = await resHoriTotal.json();

    painel.value = equipamentos.map((equip) => {
      const registros = horimetro.filter(
        (h) => h.equipamento === equip.codigo
      );

      let totalNormal = 0;
      let totalHE = 0;

      registros.forEach((r) => {
        if (r.ini_1t && r.fim_1t) {
          const { horasNormais, horasHE } = calcularHorasExtras(
            new Date(r.ini_1t),
            new Date(r.fim_1t)
          );
          totalNormal += horasNormais;
          totalHE += horasHE;
        }
        if (r.ini_2t && r.fim_2t) {
          const { horasNormais, horasHE } = calcularHorasExtras(
            new Date(r.ini_2t),
            new Date(r.fim_2t)
          );
          totalNormal += horasNormais;
          totalHE += horasHE;
        }
      });

      const paradasEquip = paradas.filter(
        (p) => p.equipamento === equip.codigo && p.programada !== 'SIM'
      );
      let totalHorasParadas = 0;
      paradasEquip.forEach((p) => {
        if (p.inicio && p.fim) {
          const ini = new Date(p.inicio);
          const fim = new Date(p.fim);
          totalHorasParadas += (fim - ini) / 3600000;
        }
      });

      const horimetroEquip = horimetroTotal.find(
        (h) => {
          const dataH = (h.data || '').slice(0, 10);
          const dataSel = (dataInicial.value || '').slice(0, 10);
          return h.equipamento === equip.codigo && dataH === dataSel;
        }
      );
      let horimetroTotalHoras = null;
      if (horimetroEquip && horimetroEquip.horimetro_total) {
        const [h, m, s] = horimetroEquip.horimetro_total.split(":").map(Number);
        horimetroTotalHoras = h + m / 60 + s / 3600;
      }

      const horaDisponivel = (totalNormal + totalHE) - totalHorasParadas;
      let produtividade = null;
      if (horimetroTotalHoras && horimetroTotalHoras > 0) {
        produtividade = horaDisponivel / horimetroTotalHoras;
      }

      return {
        codigo: equip.codigo,
        descricao: equip.descricao,
        unidade: equip.unidade,
        setor: equip.tipo,
        cod_celula: equip.cod_celula,
        turnoNormal: totalNormal,
        horaExtra: totalHE,
        turnoComHE: totalNormal + totalHE,
        horasParadas: totalHorasParadas,
        horaDisponivel,
        horimetroTotalHoras,
        produtividade
      };
    });
  } catch (e) {
    painel.value = [];
  }
}

function calcularHorasExtras(inicio, fim) {
  let horasHE = 0;
  let horasNormais = 0;

  const totalHoras = (fim - inicio) / 3600000;

  const limiteManha = new Date(inicio);
  limiteManha.setHours(6, 30, 0, 0);
  if (inicio < limiteManha) {
    const fimHE = fim < limiteManha ? fim : limiteManha;
    horasHE += (fimHE - inicio) / 3600000;
  }

  const limiteMadrugada = new Date(inicio);
  limiteMadrugada.setDate(limiteMadrugada.getDate() + 1);
  limiteMadrugada.setHours(1, 46, 0, 0);
  if (fim > limiteMadrugada) {
    const inicioHE = inicio > limiteMadrugada ? inicio : limiteMadrugada;
    horasHE += (fim - inicioHE) / 3600000;
  }

  horasNormais = totalHoras - horasHE;
  return { horasNormais, horasHE };
}

function formatarHoras(horasDecimais) {
  const horas = Math.floor(horasDecimais);
  const minutos = Math.round((horasDecimais - horas) * 60);
  return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;
}

watch(filtroSetor, async (novoSetor) => {
  filtroCelula.value = "";
  celulasDisponiveis.value = await buscarCelulasPorUnidadeSetor(novoSetor);
  await buscarDados();
});

watch(filtroCelula, buscarDados);
watch(dataInicial, buscarDados);
watch(dataFinal, buscarDados);

onMounted(async () => {
  await buscarUnidadesFabris();

  const unidadeObj = unidadesDisponiveis.value.find(
    (u) => u.codigo === filtroUnidade.value
  );
  const unidadeDescricao = unidadeObj
    ? unidadeObj.descricao
    : filtroUnidade.value;

  setoresDisponiveis.value = await buscarSetoresPorUnidade(unidadeDescricao);
  filtroSetor.value = "";
  celulasDisponiveis.value = [];

  await buscarDados();
});
</script>


<style scoped>
.container {
  max-width: 1200px;
  min-width: 900px;
}

.custom-date-input {
  background-color: #343a40 !important;
  color: #fff !important;
  border: 1px solid #7c838a;
}
</style>