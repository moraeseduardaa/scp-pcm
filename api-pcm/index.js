//npx nodemon index.js
const express = require('express');
const cors = require('cors');
const pool = require('./db'); 
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;
const MOTIVOS_PATH = path.join(__dirname, 'motivos.json');

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

app.get('/operadores', async (req, res) => {
  try {
    let status = req.query.status || 'ATIVO';
    status = status.toUpperCase();
    const result = await pool.query(
      "SELECT codigo, nome_operador, setor, status FROM operador WHERE status = $1 ORDER BY nome_operador",
      [status]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar operadores:', err);
    res.status(500).send('Erro ao buscar operadores');
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

app.post('/operadores', async (req, res) => {
  const { nome_operador, setor } = req.body;
  if (!nome_operador || !setor) {
    return res.status(400).json({ error: 'Nome e setor são obrigatórios' });
  }
  try {
    await pool.query(
      "INSERT INTO operador (nome_operador, setor, status) VALUES ($1, $2, 'ATIVO')",
      [nome_operador, setor]
    );
    res.sendStatus(201);
  } catch (err) {
    console.error('Erro ao adicionar operador:', err);
    res.status(500).send('Erro ao adicionar operador');
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

app.put('/operadores/:codigo/ativar', async (req, res) => {
  const { codigo } = req.params;
  try {
    await pool.query("UPDATE operador SET status = 'ATIVO' WHERE codigo = $1", [codigo]);
    res.sendStatus(200);
  } catch (err) {
    console.error('Erro ao ativar operador:', err);
    res.status(500).send('Erro ao ativar operador');
  }
});

// Listar motivos de parada
app.get('/motivos-parada', (req, res) => {
  fs.readFile(MOTIVOS_PATH, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Erro ao ler motivos' });
    try {
      const motivos = JSON.parse(data);
      res.json(motivos);
    } catch {
      res.status(500).json({ error: 'Erro ao parsear motivos' });
    }
  });
});

// Adicionar motivo de parada
app.post('/motivos-parada', (req, res) => {
  const { motivo } = req.body;
  if (!motivo || typeof motivo !== 'string') return res.status(400).json({ error: 'Motivo inválido' });
  fs.readFile(MOTIVOS_PATH, 'utf8', (err, data) => {
    let motivos = [];
    if (!err) {
      try { motivos = JSON.parse(data); } catch {}
    }
    if (motivos.includes(motivo)) return res.status(409).json({ error: 'Motivo já existe' });
    motivos.push(motivo);
    motivos.sort((a, b) => a.localeCompare(b, 'pt-BR'));
    fs.writeFile(MOTIVOS_PATH, JSON.stringify(motivos, null, 2), err2 => {
      if (err2) return res.status(500).json({ error: 'Erro ao salvar motivo' });
      res.status(201).json(motivos);
    });
  });
});

// Remover motivo de parada
app.delete('/motivos-parada/:motivo', (req, res) => {
  const motivo = decodeURIComponent(req.params.motivo);
  fs.readFile(MOTIVOS_PATH, 'utf8', (err, data) => {
    let motivos = [];
    if (!err) {
      try { motivos = JSON.parse(data); } catch {}
    }
    const idx = motivos.findIndex(m => m === motivo);
    if (idx === -1) return res.status(404).json({ error: 'Motivo não encontrado' });
    motivos.splice(idx, 1);
    fs.writeFile(MOTIVOS_PATH, JSON.stringify(motivos, null, 2), err2 => {
      if (err2) return res.status(500).json({ error: 'Erro ao remover motivo' });
      res.json(motivos);
    });
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://10.1.0.8:${port}`);
});