<template>
  <div class="bg-dark min-vh-100 d-flex align-items-center justify-content-center">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-5">
          <div class="card shadow-lg">
            <div class="card-body text-center p-5">
              <h2 class="fw-bold mb-2" style="color: #000080;">Informe seu login do PCM</h2>
              <div class="mx-auto mb-5" style="height: 4px; width: 80%; background: #dc3545;"></div>
              <div class="mb-4">
                <input v-model="usuario" type="text" class="form-control form-control-lg mb-3"
                  placeholder="Usuário" style="background-color: #f8f9fa; color: #000; border: 2px solid #dc3545;"
                  @input="usuario = usuario.toUpperCase()">
                <input v-model="senha" type="password" class="form-control form-control-lg"
                  placeholder="Senha" style="background-color: #f8f9fa; color: #000; border: 2px solid #dc3545;">
              </div>

              <div v-if="erroLogin" class="mb-3 text-danger">{{ erroLogin }}</div>

              <button class="btn btn-secondary btn-lg px-5 mt-3 me-2" @click="emit('voltar-login')" style="border-radius: 50px;">
                <i class="bi bi-arrow-left-circle me-2"></i>
                Voltar
              </button>
              <button class="btn btn-danger btn-lg px-5 mt-3 ml-3" @click="fazerLogin" :disabled="loading"
                style="border-radius: 50px;">
                <i class="bi bi-arrow-right-circle me-2"></i>
                Login
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const usuario = ref('');
const senha = ref('');
const erroLogin = ref('');
const loading = ref(false);

const emit = defineEmits(['login-realizado', 'voltar-login']);

async function fazerLogin() {
  erroLogin.value = '';
  loading.value = true;
  try {
    const res = await fetch(`http://10.1.1.11:3000/usuarios/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario: usuario.value, senha: senha.value })
    });
    const data = await res.json();
    if (data && data.success && data.usuario) {
      emit('login-realizado', data.usuario);
    } else {
      erroLogin.value = data && data.message ? data.message : 'Usuário ou senha inválidos';
    }
  } catch (e) {
    erroLogin.value = 'Erro ao conectar ao servidor';
  } finally {
    loading.value = false;
  }
}
</script>
