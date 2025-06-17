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
    const result = await pool.query('SELECT celula FROM celula WHERE tipo_equipamento = $1', [tipo]);
    res.json(result.rows.map(row => row.celula));
  } catch (err) {
    console.error('Erro ao buscar células:', err);
    res.status(500).send('Erro ao buscar células');
  }
});


app.get('/equipamentos', async (req, res) => {
  const tipo = req.query['tipo'];
  const celula = req.query['celula'];

  console.log('req.query:', req.query);
  console.log('req.query keys:', Object.keys(req.query));
  console.log('celula diretamente acessado:', req.query['celula']);


  const sql = `SELECT codigo, descricao FROM equipamento
               WHERE status = 'ATIVO' AND tipo = $1 AND celula = $2`;
  const params = [tipo, celula];

  try {
    const result = await pool.query(sql, params);
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
