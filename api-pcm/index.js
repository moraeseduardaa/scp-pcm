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

app.get('/setores-por-unidade', async (req, res) => {
  const { unidade } = req.query;
  if (!unidade) {
    return res.status(400).json({ error: 'Unidade é obrigatória' });
  }
  try {
    const result = await pool.query(`
      SELECT DISTINCT equipamento.tipo, tipo_equipamento.descricao AS tipo_descricao
      FROM equipamento
      JOIN unidade ON equipamento.unidade = unidade.codigo
      JOIN tipo_equipamento ON equipamento.tipo = tipo_equipamento.codigo
      WHERE unidade.unidade = $1
        AND unidade.fabrica = 'SIM'
        AND tipo_equipamento.codigo IN (1,2,3,5,6,8,11)
      ORDER BY tipo_equipamento.descricao
    `, [unidade]);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar setores por unidade:', err);
    res.status(500).send('Erro ao buscar setores por unidade');
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

app.get('/unidades-fabrica', async (req, res) => {
  try {
    const result = await pool.query("SELECT unidade FROM unidade WHERE fabrica = 'SIM' ORDER BY unidade");
    res.json(result.rows.map(row => row.unidade));
  } catch (err) {
    console.error('Erro ao buscar unidades fabris:', err);
    res.status(500).send('Erro ao buscar unidades fabris');
  }
});

app.get('/operadores', async (req, res) => {
  try {
    let status = req.query.status || 'ATIVO';
    status = status.toUpperCase();
    const unidade = req.query.unidade;
    let query = `
      SELECT 
        unidade.unidade AS unidade,
        operador.setor,
        celula.celula AS celula,
        operador.nome_operador,
        operador.codigo,
        operador.status
      FROM operador
      LEFT JOIN unidade ON operador.cod_unidade = unidade.codigo
      LEFT JOIN celula ON operador.cod_celula = celula.codigo
      WHERE operador.status = $1
    `;
    const params = [status];
    if (unidade) {
      query += ' AND unidade.unidade = $2';
      params.push(unidade);
    }
    query += ' ORDER BY unidade.unidade, operador.setor, celula.celula, operador.nome_operador';
    const result = await pool.query(query, params);
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
        unidade.unidade AS unidade,
        equipamento.codigo AS equipamento_id,
        equipamento.descricao AS equipamento_nome,
        tipo_equipamento.descricao AS tipo,
        celula.celula AS celula,
        paradas_equipamentos.motivo
      FROM equipamento
      LEFT JOIN unidade ON equipamento.unidade = unidade.codigo
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

app.get('/motivos-parada', async (req, res) => {
  try {
    let status = req.query.status || 'ATIVO';
    status = status.toUpperCase();
    const result = await pool.query(
      "SELECT codigo, motivo, status, programada as parada FROM motivos_parada WHERE status = $1 ORDER BY motivo",
      [status]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar motivos:', err);
    res.status(500).send('Erro ao buscar motivos');
  }
});

app.get('/operacao/aberta/:equipamento', async (req, res) => {
  const equipamento = req.params.equipamento;
  const data = req.query.data; 
  if (!data) {
    return res.status(400).json({ error: 'Data é obrigatória' });
  }
  try {
    const result = await pool.query(
      `SELECT * FROM operacao WHERE equipamento = $1 AND data = $2 AND (ini_1t IS NOT NULL OR ini_2t IS NOT NULL) AND (fim_1t IS NULL OR fim_2t IS NULL) LIMIT 1`,
      [equipamento, data]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(204).send();
    }
  } catch (err) {
    console.error('Erro ao verificar operação aberta:', err);
    res.status(500).send('Erro ao verificar operação aberta');
  }
});

app.post('/operadores', async (req, res) => {
  const { nome_operador, setor, unidade, celula } = req.body;
  if (!nome_operador || !setor || !unidade || !celula) {
    return res.status(400).json({ error: 'Nome, setor, unidade e célula são obrigatórios' });
  }
  try {
    const unidadeResult = await pool.query('SELECT codigo FROM unidade WHERE unidade = $1', [unidade]);
    if (unidadeResult.rows.length === 0) {
      return res.status(400).json({ error: 'Unidade não encontrada' });
    }
    const cod_unidade = unidadeResult.rows[0].codigo;
    const tipoEquipamentoResult = await pool.query('SELECT codigo FROM tipo_equipamento WHERE descricao = $1', [setor]);
    if (tipoEquipamentoResult.rows.length === 0) {
      return res.status(400).json({ error: 'Tipo de equipamento (setor) não encontrado' });
    }
    const tipo_equipamento = tipoEquipamentoResult.rows[0].codigo;
    const celulaResult = await pool.query('SELECT codigo FROM celula WHERE celula = $1 AND tipo_equipamento = $2', [celula, tipo_equipamento]);
    if (celulaResult.rows.length === 0) {
      return res.status(400).json({ error: 'Célula não encontrada para o tipo de equipamento informado' });
    }
    const cod_celula = celulaResult.rows[0].codigo;
    await pool.query(
      "INSERT INTO operador (nome_operador, setor, cod_unidade, cod_celula, status) VALUES ($1, $2, $3, $4, 'ATIVO')",
      [nome_operador, setor, cod_unidade, cod_celula]
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
      res.status(201).send('Horímetro do 1º turno salvo com sucesso');
    } else if (periodo === 'FIM DO 2° TURNO') {
      const busca = await pool.query(
        "SELECT * FROM horimetro WHERE equipamento = $1 AND data2 IS NULL ORDER BY data1 DESC LIMIT 1",
        [equipamento]
      );
      if (busca.rows.length === 0) {
        await pool.query(
          'INSERT INTO horimetro (equipamento, data2, horimetro2) VALUES ($1, $2, $3)',
          [equipamento, dataHora, horimetro]
        );
        return res.status(201).send('Horímetro do 2º turno salvo (sem 1º turno)');
      }
      await pool.query(
        'UPDATE horimetro SET data2 = $1, horimetro2 = $2 WHERE equipamento = $3 AND data2 IS NULL AND data1 = $4',
        [dataHora, horimetro, equipamento, busca.rows[0].data1]
      );
      res.status(200).send('Horímetro do 2º turno salvo com sucesso');
    } else {
      res.status(400).send('Período inválido');
    }
  } catch (err) {
    console.error('Erro ao salvar horímetro:', err);
    res.status(500).send('Erro ao salvar horímetro: ' + (err.detail || err.message));
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
  const { motivo, parada } = req.body;
  if (!motivo || !parada) {
    return res.status(400).json({ error: 'Motivo e tipo de parada são obrigatórios' });
  }
  try {
    await pool.query(
      "INSERT INTO motivos_parada (motivo, status, programada) VALUES ($1, 'ATIVO', $2)",
      [motivo, parada]
    );
    res.sendStatus(201);
  } catch (err) {
    console.error('Erro ao adicionar motivo:', err);
    res.status(500).send('Erro ao adicionar motivo');
  }
});

app.post('/operacao/inicio', async (req, res) => {
  const { equipamento, data, turno, operador, hora } = req.body;
  if (!equipamento || !data || !turno || !operador || !hora) {
    return res.status(400).json({ error: 'Campos obrigatórios: equipamento, data, turno, operador, hora' });
  }
  let colunaIni = turno === '1T' ? 'ini_1t' : 'ini_2t';
  try {
    const busca = await pool.query('SELECT * FROM operacao WHERE equipamento = $1 AND data = $2', [equipamento, data]);
    if (busca.rows.length === 0) {
      const campos = turno === '1T' ? '(equipamento, data, ini_1t, operador_1t)' : '(equipamento, data, ini_2t, operador_2t)';
      const valores = turno === '1T' ? '($1, $2, $3, $4)' : '($1, $2, $3, $4)';
      await pool.query(
        `INSERT INTO operacao ${campos} VALUES ${valores}`,
        [equipamento, data, hora, operador]
      );
    } else {
      const colunaOperador = turno === '1T' ? 'operador_1t' : 'operador_2t';
      await pool.query(
        `UPDATE operacao SET ${colunaIni} = $1, ${colunaOperador} = $2 WHERE equipamento = $3 AND data = $4`,
        [hora, operador, equipamento, data]
      );
    }
    res.sendStatus(201);
  } catch (err) {
    console.error('Erro ao registrar início de operação:', err);
    res.status(500).send('Erro ao registrar início de operação');
  }
});

app.post('/operacao/fim', async (req, res) => {
  const { equipamento, data, turno, operador, hora } = req.body;
  if (!equipamento || !data || !turno || !operador || !hora) {
    return res.status(400).json({ error: 'Campos obrigatórios: equipamento, data, turno, operador, hora' });
  }
  let colunaFim = turno === '1T' ? 'fim_1t' : 'fim_2t';
  const colunaOperador = turno === '1T' ? 'operador_1t' : 'operador_2t';
  try {
    const result = await pool.query(
      `UPDATE operacao SET ${colunaFim} = $1, ${colunaOperador} = $2 WHERE equipamento = $3 AND data = $4`,
      [hora, operador, equipamento, data]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Registro de operação não encontrado para encerrar' });
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('Erro ao registrar fim de operação:', err);
    res.status(500).send('Erro ao registrar fim de operação');
  }
});

app.put('/motivos-parada/:codigo', async (req, res) => {
  const { codigo } = req.params;
  const { motivo, parada } = req.body;
  if (!motivo || !parada) {
    return res.status(400).json({ error: 'Motivo e tipo de parada são obrigatórios' });
  }
  try {
    await pool.query("UPDATE motivos_parada SET motivo = $1, programada = $2 WHERE codigo = $3", [motivo, parada, codigo]);
    res.sendStatus(200);
  } catch (err) {
    console.error('Erro ao editar motivo:', err);
    res.status(500).send('Erro ao editar motivo');
  }
});

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

app.put('/operadores/:codigo', async (req, res) => {
  const { codigo } = req.params;
  const { nome_operador, setor, unidade, celula } = req.body;
  try {
    const unidadeResult = await pool.query('SELECT codigo FROM unidade WHERE unidade = $1', [unidade]);
    if (unidadeResult.rows.length === 0) {
      return res.status(400).json({ error: 'Unidade não encontrada' });
    }
    const cod_unidade = unidadeResult.rows[0].codigo;
    const tipoEquipamentoResult = await pool.query('SELECT codigo FROM tipo_equipamento WHERE descricao = $1', [setor]);
    if (tipoEquipamentoResult.rows.length === 0) {
      return res.status(400).json({ error: 'Tipo de equipamento (setor) não encontrado' });
    }
    const tipo_equipamento = tipoEquipamentoResult.rows[0].codigo;
    const celulaResult = await pool.query('SELECT codigo FROM celula WHERE celula = $1 AND tipo_equipamento = $2', [celula, tipo_equipamento]);
    if (celulaResult.rows.length === 0) {
      return res.status(400).json({ error: 'Célula não encontrada para o tipo de equipamento informado' });
    }
    const cod_celula = celulaResult.rows[0].codigo;
    await pool.query(
      'UPDATE operador SET nome_operador = $1, setor = $2, cod_unidade = $3, cod_celula = $4 WHERE codigo = $5',
      [nome_operador, setor, cod_unidade, cod_celula, codigo]
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