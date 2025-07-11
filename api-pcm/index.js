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

app.get('/', (req, res) => {
  res.send('Backend rodando!');
});

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

  if (!tipo || !celula) {
    return res.status(400).json({ error: 'Tipo e célula são obrigatórios' });
  }

  const sqlCelula = `SELECT codigo FROM celula WHERE celula = $1 AND tipo_equipamento = $2`;
  const paramsCelula = [celula, tipo];

  try {
    const resultCelula = await pool.query(sqlCelula, paramsCelula);
    
    if (resultCelula.rows.length === 0) {
      return res.json([]);
    }
    
    const codCelula = resultCelula.rows[0].codigo;
    
    const sql = `SELECT codigo, descricao FROM equipamento
                 WHERE status = 'ATIVO' AND tipo = $1 AND cod_celula = $2`;
    const params = [tipo, codCelula];

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

app.get('/motivos-parada/detalhes', async (req, res) => {
  try {
    let status = req.query.status || 'ATIVO';
    status = status.toUpperCase();
    const result = await pool.query(
      "SELECT codigo, motivo, status FROM motivos_parada WHERE status = $1 ORDER BY motivo",
      [status]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar detalhes dos motivos:', err);
    res.status(500).json({ error: 'Erro ao buscar detalhes dos motivos' });
  }
});

app.get('/motivos-parada', async (req, res) => {
  try {
    let status = req.query.status || 'ATIVO';
    status = status.toUpperCase();
    
    const result = await pool.query(
      "SELECT codigo, motivo, status FROM motivos_parada WHERE status = $1 ORDER BY motivo",
      [status]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar motivos:', err);
    res.status(500).json({ error: 'Erro ao buscar motivos' });
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

app.post('/motivos-parada', async (req, res) => {
  const { motivo } = req.body;
  if (!motivo || typeof motivo !== 'string') {
    return res.status(400).json({ error: 'Motivo inválido' });
  }
  
  try {
    // Verificar se já existe um motivo ativo com o mesmo nome
    const existente = await pool.query(
      "SELECT codigo FROM motivos_parada WHERE UPPER(motivo) = UPPER($1) AND status = 'ATIVO'",
      [motivo.trim()]
    );
    
    if (existente.rows.length > 0) {
      return res.status(409).json({ error: 'Motivo já existe' });
    }
    
    // Inserir novo motivo
    await pool.query(
      "INSERT INTO motivos_parada (motivo, status) VALUES ($1, 'ATIVO')",
      [motivo.trim()]
    );
    
    // Retornar lista atualizada
    const result = await pool.query(
      "SELECT motivo FROM motivos_parada WHERE status = 'ATIVO' ORDER BY motivo"
    );
    
    res.status(201).json(result.rows.map(row => row.motivo));
  } catch (err) {
    console.error('Erro ao adicionar motivo:', err);
    res.status(500).json({ error: 'Erro ao adicionar motivo' });
  }
});

// Endpoint para editar motivo
app.put('/motivos-parada/:codigo', async (req, res) => {
  const { codigo } = req.params;
  const { motivo } = req.body;
  
  if (!motivo || typeof motivo !== 'string') {
    return res.status(400).json({ error: 'Motivo inválido' });
  }
  
  try {
    // Verificar se já existe outro motivo ativo com o mesmo nome
    const existente = await pool.query(
      "SELECT codigo FROM motivos_parada WHERE UPPER(motivo) = UPPER($1) AND status = 'ATIVO' AND codigo != $2",
      [motivo.trim(), codigo]
    );
    
    if (existente.rows.length > 0) {
      return res.status(409).json({ error: 'Motivo já existe' });
    }
    
    // Atualizar motivo
    await pool.query(
      "UPDATE motivos_parada SET motivo = $1 WHERE codigo = $2",
      [motivo.trim(), codigo]
    );
    
    res.sendStatus(200);
  } catch (err) {
    console.error('Erro ao editar motivo:', err);
    res.status(500).json({ error: 'Erro ao editar motivo' });
  }
});

// Endpoint para inativar motivo
app.put('/motivos-parada/:codigo/inativar', async (req, res) => {
  const { codigo } = req.params;
  try {
    await pool.query("UPDATE motivos_parada SET status = 'INATIVO' WHERE codigo = $1", [codigo]);
    res.sendStatus(200);
  } catch (err) {
    console.error('Erro ao inativar motivo:', err);
    res.status(500).send('Erro ao inativar motivo');
  }
});

// Endpoint para ativar motivo
app.put('/motivos-parada/:codigo/ativar', async (req, res) => {
  const { codigo } = req.params;
  try {
    await pool.query("UPDATE motivos_parada SET status = 'ATIVO' WHERE codigo = $1", [codigo]);
    res.sendStatus(200);
  } catch (err) {
    console.error('Erro ao ativar motivo:', err);
    res.status(500).send('Erro ao ativar motivo');
  }
});

app.post('/horimetro', async (req, res) => {
  const { equipamento, dataHora, horimetro, periodo } = req.body;
  if (!equipamento || !dataHora || !horimetro || !periodo) {
    return res.status(400).send('Todos os campos são obrigatórios');
  }
  const dataValida = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?/.test(dataHora);
  if (!dataValida) {
    return res.status(400).send('DataHora em formato inválido');
  }
  if (typeof horimetro !== 'string' && typeof horimetro !== 'number') {
    return res.status(400).send('Horímetro inválido');
  }
  try {
    if (periodo === 'FIM DO 1° TURNO') {
      const busca = await pool.query(
        "SELECT * FROM horimetro WHERE equipamento = $1 AND data2 IS NULL",
        [equipamento]
      );
      if (busca.rows.length > 0) {
        return res.status(409).send('Finalize o 2º turno.');
      }
      await pool.query(
        'INSERT INTO horimetro (equipamento, data1, horimetro1) VALUES ($1, $2, $3)',
        [equipamento, dataHora, horimetro]
      );
      res.status(201).send('Horímetro salvo com sucesso');
    } else if (periodo === 'FIM DO 2° TURNO') {
      const busca = await pool.query(
        "SELECT * FROM horimetro WHERE equipamento = $1 AND data2 IS NULL ORDER BY data1 DESC LIMIT 1",
        [equipamento]
      );
      if (busca.rows.length === 0) {
        return res.status(404).send('Registro do 1º turno não encontrado');
      }
      await pool.query(
        'UPDATE horimetro SET data2 = $1, horimetro2 = $2 WHERE equipamento = $3 AND data2 IS NULL AND data1 = $4',
        [dataHora, horimetro, equipamento, busca.rows[0].data1]
      );
      res.status(200).send('Horímetro salvo com sucesso');
    } else {
      res.status(400).send('Período inválido');
    }
  } catch (err) {
    console.error('Erro ao salvar horímetro:', err);
    res.status(500).send('Erro ao salvar horímetro: ' + (err.detail || err.message));
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

app.listen(port, () => {
  console.log(`Servidor rodando em http://10.1.1.247:${port}`);
});