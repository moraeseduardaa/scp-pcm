const express = require('express');
const cors = require('cors');
const pool = require('./db'); 

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get('/equipamentos', async (req, res) => {
  try {
    const result = await pool.query(`select codigo, descricao from equipamento where unidade = 3 and status = 'ATIVO' and descricao like '%JACQUARD%' AND CELULA = 'Célula 2'`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao buscar equipamentos');
  }
});

app.post('/horimetro', async (req, res) => {
  const { dataHora, operadorId, maquinaId } = req.body;

  try {
    await pool.query(
      'INSERT INTO horimetros (data_hora, operador_id, equipamento_id) VALUES ($1, $2, $3)',
      [dataHora, operadorId, maquinaId]
    );
    res.status(201).send('Horímetro salvo com sucesso');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao salvar horímetro');
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://10.1.0.238:${port}`);
});
