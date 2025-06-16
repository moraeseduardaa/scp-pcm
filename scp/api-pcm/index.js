const express = require('express');
const cors = require('cors');
const pool = require('./db'); 

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get('/celulas', async (req, res) => {
  const tipo = req.query.tipo;
  console.log('Tipo recebido na rota /celulas:', tipo, 'Query completa:', req.query);
  if (!tipo) {
    return res.status(400).json({ error: 'Tipo é obrigatório' });
  }
  try {
    const result = await pool.query('SELECT codigo, celula FROM celula WHERE tipo_equipamento = $1', [tipo]);
    res.json(result.rows.map(row => row.celula));
  } catch (err) {
    console.error('Erro ao buscar células:', err);
    res.status(500).send('Erro ao buscar células');
  }
});


app.get('/equipamentos', async (req, res) => {
  const cod_celula = req.query.cod_celula;
  const tipo = req.query.tipo;
  let query = `SELECT codigo, descricao FROM equipamento WHERE status = 'ATIVO'`;
  const params = [];
  console.log('Tipo recebido no tipo_equipamento:', tipo, 'celula:', cod_celula, 'Query completa:', req.query);

  if (tipo) {
    params.push(tipo);
    query += ` AND tipo_equipamento = $${params.length}`;
  }
  if (cod_celula) {
    params.push(cod_celula);
    query += ` AND cod_celula = $${params.length}`;
  }

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar equipamentos:', err);
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
