//npx nodemon index.js
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

app.put('/operadores/:codigo', async (req, res) => {
  const { codigo } = req.params;
  const { nome_operador, setor } = req.body;
  try {
    await pool.query(
      'UPDATE operador SET nome_operador = $1, setor = $2 WHERE codigo = $3',
      [nome_operador, setor, codigo]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error('Erro ao atualizar operador:', err);
    res.status(500).send('Erro ao atualizar operador');
  }
});

app.get('/operadores', async (req, res) => {
  try {
    const result = await pool.query("SELECT codigo, nome_operador, setor FROM operador WHERE status = 'ATIVO' ORDER BY nome_operador");
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar operadores:', err);
    res.status(500).send('Erro ao buscar operadores');
  }
});

// Inativar operador
app.put('/operadores/:codigo/inativar', async (req, res) => {
  const { codigo } = req.params;
  try {
    await pool.query("UPDATE operador SET status = 'INATIVO' WHERE codigo = $1", [codigo]);
    res.sendStatus(200);
  } catch (err) {
    console.error('Erro ao inativar operador:', err);
    res.status(500).send('Erro ao inativar operador');
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

app.post('/parada/inicio', async (req, res) => {
  console.log('Dados recebidos:', req.body);
  const { equipamento, motivo, datahora_inicio_parada, operador } = req.body;
  try {
    await pool.query(
      `INSERT INTO paradas_equipamentos (equipamento, motivo, datahora_inicio_parada, operador)
       VALUES ($1, $2, $3, $4)`,
      [equipamento, motivo, datahora_inicio_parada, operador]
    );
    res.sendStatus(201);
  } catch {
    res.status(500).send('Erro ao salvar início da parada');
  }
});

app.post('/parada/fim', async (req, res) => {
  const { equipamento, datahora_fim_parada, operador } = req.body;
  try {
    await pool.query(
      `UPDATE paradas_equipamentos SET datahora_fim_parada = $1, operador = $2
       WHERE equipamento = $3 AND datahora_fim_parada IS NULL`,
      [datahora_fim_parada, operador, equipamento]
    );
    res.sendStatus(201);
    
  } catch {
    res.status(500).send('Erro ao salvar término da parada');
  }
});

app.get('/parada/aberta/:equipamento', async (req, res) => {
  const equipamento = req.params.equipamento;

  try {
    const result = await pool.query(
      `SELECT motivo, operador, datahora_inicio_parada 
       FROM paradas_equipamentos 
       WHERE equipamento = $1 AND datahora_fim_parada IS NULL 
       LIMIT 1`,
      [equipamento]
    );

    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(204).send(); 
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao verificar parada aberta');
  }
});

app.get('/paradas/abertas', async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT 
        equipamento.codigo AS equipamento_id,
        equipamento.descricao AS equipamento_nome,
        tipo_equipamento.descricao AS tipo,
        celula.celula AS celula,
        paradas_equipamentos.motivo
      FROM equipamento
      JOIN celula ON equipamento.cod_celula = celula.codigo
      JOIN paradas_equipamentos ON equipamento.codigo = paradas_equipamentos.equipamento
      JOIN tipo_equipamento ON equipamento.tipo = tipo_equipamento.codigo
      WHERE paradas_equipamentos.datahora_fim_parada IS NULL
    `);
    res.json(resultado.rows);
  } catch (err) {
    console.error('Erro ao buscar paradas abertas:', err);
    res.status(500).send('Erro ao buscar paradas abertas');
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://10.1.0.8:${port}`);
});
