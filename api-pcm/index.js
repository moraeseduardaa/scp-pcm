const express = require("express");
const cors = require("cors");
const pool = require("./db");
const fs = require("fs");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend rodando!");
});

app.get("/celulas", async (req, res) => {
  const tipo = req.query.tipo;
  console.log(
    "Tipo recebido na rota /celulas:",
    tipo,
    "Query completa:",
    req.query
  );
  if (!tipo) {
    return res.status(400).json({ error: "Tipo é obrigatório" });
  }
  try {
    const result = await pool.query(
      "SELECT codigo, celula FROM celula WHERE tipo_equipamento = $1",
      [tipo]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar células:", err);
    res.status(500).send("Erro ao buscar células");
  }
});

app.get("/unidades-fabrica", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT unidade FROM unidade WHERE fabrica = 'SIM' ORDER BY unidade"
    );
    res.json(result.rows.map((row) => row.unidade));
  } catch (err) {
    console.error("Erro ao buscar unidades fabris:", err);
    res.status(500).send("Erro ao buscar unidades fabris");
  }
});

app.get("/equipamentos", async (req, res) => {
  const tipo = req.query["tipo"];
  const celula = req.query["celula"];
  console.log("req.query:", req.query);
  console.log("req.query keys:", Object.keys(req.query));
  console.log("celula diretamente acessado:", req.query["celula"]);

  if (!tipo || !celula) {
    return res.status(400).json({ error: "Tipo e célula são obrigatórios" });
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
    console.error("Erro ao buscar equipamentos:", err);
    res.status(500).send("Erro ao buscar equipamentos");
  }
});

app.get("/equipamentos-por-unidade", async (req, res) => {
  const unidade = req.query.unidade;
  if (!unidade) {
    return res.status(400).json({ error: "Unidade é obrigatória" });
  }

  let tiposPermitidos = [];
  if (unidade === "1") tiposPermitidos = [1];
  else if (unidade === "2") tiposPermitidos = [1, 2];
  else if (unidade === "3") tiposPermitidos = [1, 2, 3];
  else if (unidade === "4") tiposPermitidos = [5, 6, 8, 11];

  try {
    let sql = `SELECT equipamento.codigo, equipamento.descricao, equipamento.unidade, equipamento.tipo, equipamento.cod_celula, celula.celula
               FROM equipamento
               LEFT JOIN celula ON equipamento.cod_celula = celula.codigo
               WHERE equipamento.unidade = $1
                 AND equipamento.status = 'ATIVO'`;
    let params = [unidade];
    if (tiposPermitidos.length > 0) {
      sql += " AND equipamento.tipo = ANY($2)";
      params.push(tiposPermitidos);
    }
    sql += " ORDER BY equipamento.descricao";
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar equipamentos:", err);
    res.status(500).json({ error: "Erro ao buscar equipamentos" });
  }
});

app.get("/horimetro", async (req, res) => {
  const unidade = req.query.unidade;
  const data = req.query.data;
  if (!unidade) {
    return res.status(400).json({ error: "Unidade é obrigatória!" });
  }
  try {
    let query = `
      SELECT h.equipamento,
             h.ini_1t,
             h.fim_1t,
             h.ini_2t,
             h.fim_2t
      FROM horimetro h
      JOIN equipamento e ON e.codigo = h.equipamento
      WHERE e.unidade = $1
    `;
    let params = [unidade];
    if (data) {
      query += ` AND (CAST(h.ini_1t AS DATE) = $2 OR CAST(h.ini_2t AS DATE) = $2)`;
      params.push(data);
    }
    query += ` ORDER BY h.equipamento;`;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar dados do horímetro:", err);
    res.status(500).send("Erro ao buscar dados do horímetro");
  }
});

app.get("/horimetro/aberto/:equipamento", async (req, res) => {
  const equipamento = req.params.equipamento;
  const data = req.query.data;
  if (!data) {
    return res.status(400).json({ error: "Data é obrigatória" });
  }
  try {
    const result = await pool.query(
      `SELECT * FROM horimetro WHERE equipamento = $1 AND CAST(ini_1t AS DATE) = $2`,
      [equipamento, data]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(204).send();
    }
  } catch (err) {
    console.error("Erro ao verificar operação aberta (horimetro):", err);
    res.status(500).send("Erro ao verificar operação aberta (horimetro)");
  }
});

app.get("/operadores", async (req, res) => {
  try {
    let status = req.query.status || "ATIVO";
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
      query += " AND unidade.unidade = $2";
      params.push(unidade);
    }
    query +=
      " ORDER BY unidade.unidade, operador.setor, celula.celula, operador.nome_operador";
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar operadores:", err);
    res.status(500).send("Erro ao buscar operadores");
  }
});

app.get("/operacao/aberta/:equipamento", async (req, res) => {
  const equipamento = req.params.equipamento;
  const data = req.query.data;
  if (!data) {
    return res.status(400).json({ error: "Data é obrigatória" });
  }
  try {
    const result = await pool.query(
      `SELECT * FROM horimetro WHERE equipamento = $1 AND CAST(ini_1t AS DATE) = $2 AND (ini_1t IS NOT NULL OR ini_2t IS NOT NULL) AND (fim_1t IS NULL OR fim_2t IS NULL) LIMIT 1`,
      [equipamento, data]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(204).send();
    }
  } catch (err) {
    console.error("Erro ao verificar operação aberta:", err);
    res.status(500).send("Erro ao verificar operação aberta");
  }
});

app.get("/motivos-parada", async (req, res) => {
  try {
    let status = req.query.status || "ATIVO";
    status = status.toUpperCase();
    const result = await pool.query(
      "SELECT codigo, motivo, status, programada as parada FROM motivos_parada WHERE status = $1 ORDER BY motivo",
      [status]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar motivos:", err);
    res.status(500).send("Erro ao buscar motivos");
  }
});

app.get("/paradas", async (req, res) => {
  const unidade = req.query.unidade;
  const data = req.query.data;
  if (!unidade || !data) {
    return res.status(400).json({ error: "Unidade e data são obrigatórias" });
  }
  try {
    const result = await pool.query(
      `SELECT 
         p.equipamento, 
         p.datahora_inicio_parada AS inicio, 
         p.datahora_fim_parada AS fim
       FROM paradas_equipamentos p
       JOIN equipamento e ON e.codigo = p.equipamento
       WHERE e.unidade = $1
         AND p.datahora_inicio_parada IS NOT NULL
         AND p.datahora_fim_parada IS NOT NULL
         AND CAST(p.datahora_inicio_parada AS DATE) = $2
       ORDER BY p.equipamento, p.datahora_inicio_parada`,
      [unidade, data]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar paradas:", err);
    res.status(500).send("Erro ao buscar paradas");
  }
});

app.get("/paradas/abertas", async (req, res) => {
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
    console.error("Erro ao buscar paradas abertas:", err);
    res.status(500).send("Erro ao buscar paradas abertas");
  }
});

app.get("/parada/aberta/:equipamento", async (req, res) => {
  const equipamento = req.params.equipamento;
  const data = req.query.data;
  try {
    let result;
    if (data) {
      result = await pool.query(
        `SELECT motivo, operador, datahora_inicio_parada 
         FROM paradas_equipamentos 
         WHERE equipamento = $1 
           AND datahora_fim_parada IS NULL
           AND CAST(datahora_inicio_parada AS DATE) = $2
         LIMIT 1`,
        [equipamento, data]
      );
    } else {
      result = await pool.query(
        `SELECT motivo, operador, datahora_inicio_parada 
         FROM paradas_equipamentos 
         WHERE equipamento = $1 AND datahora_fim_parada IS NULL 
         LIMIT 1`,
        [equipamento]
      );
    }
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(204).send();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao verificar parada aberta");
  }
});

app.get("/setores-por-unidade", async (req, res) => {
  const { unidade } = req.query;
  if (!unidade) {
    return res.status(400).json({ error: "Unidade é obrigatória" });
  }
  try {
    const result = await pool.query(
      `SELECT DISTINCT equipamento.tipo, tipo_equipamento.descricao AS tipo_descricao
      FROM equipamento
      JOIN unidade ON equipamento.unidade = unidade.codigo
      JOIN tipo_equipamento ON equipamento.tipo = tipo_equipamento.codigo
      WHERE unidade.unidade = $1
        AND unidade.fabrica = 'SIM'
        AND tipo_equipamento.codigo IN (1,2,3,5,6,8,11)
      ORDER BY tipo_equipamento.descricao`,
      [unidade]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar setores por unidade:", err);
    res.status(500).send("Erro ao buscar setores por unidade");
  }
});

app.post("/horimetro", async (req, res) => {
  const { equipamento, dataHora, dataBusca, horimetro, periodo } = req.body;
  if (!equipamento || !dataHora || !dataBusca || !horimetro || !periodo) {
    return res.status(400).send("Todos os campos são obrigatórios");
  }
  const dataValida = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(dataHora);
  const dataBuscaValida = /^\d{4}-\d{2}-\d{2}$/.test(dataBusca);
  if (!dataValida || !dataBuscaValida) {
    return res.status(400).send("Formato de data inválido");
  }
  try {
    const busca = await pool.query(
      `SELECT * FROM horimetro WHERE equipamento = $1 AND (
        CAST(ini_1t AS DATE) = $2 OR
        CAST(data1 AS DATE) = $2 OR
        CAST(ini_2t AS DATE) = $2 OR
        CAST(data2 AS DATE) = $2
      ) ORDER BY codigo DESC LIMIT 1`,
      [equipamento, dataBusca]
    );
    const registroExistente = busca.rows[0];
    if (registroExistente) {
      const { codigo } = registroExistente;
      if (periodo === "FIM DO 1° TURNO") {
        await pool.query(
          `UPDATE horimetro SET data1 = $1, horimetro1 = $2 WHERE codigo = $3`,
          [dataHora, horimetro, codigo]
        );
        return res.status(200).send("Horímetro do 1º turno salvo com sucesso");
      }
      if (periodo === "FIM DO 2° TURNO") {
        await pool.query(
          `UPDATE horimetro SET data2 = $1, horimetro2 = $2 WHERE codigo = $3`,
          [dataHora, horimetro, codigo]
        );
        return res.status(200).send("Horímetro do 2º turno salvo com sucesso");
      }
      return res.status(400).send("Período inválido");
    }
    if (periodo === "FIM DO 1° TURNO") {
      await pool.query(
        `INSERT INTO horimetro (equipamento, data1, horimetro1) VALUES ($1, $2, $3)`,
        [equipamento, dataHora, horimetro]
      );
      return res.status(201).send("Novo horímetro do 1º turno inserido");
    }
    if (periodo === "FIM DO 2° TURNO") {
      await pool.query(
        `INSERT INTO horimetro (equipamento, data2, horimetro2) VALUES ($1, $2, $3)`,
        [equipamento, dataHora, horimetro]
      );
      return res.status(201).send("Novo horímetro do 2º turno inserido");
    }
    return res.status(400).send("Período inválido");
  } catch (err) {
    console.error("Erro ao salvar horímetro:", err);
    res
      .status(500)
      .send("Erro ao salvar horímetro: " + (err.detail || err.message));
  }
});

app.post("/motivos-parada", async (req, res) => {
  const { motivo, parada } = req.body;
  if (!motivo || !parada) {
    return res
      .status(400)
      .json({ error: "Motivo e tipo de parada são obrigatórios" });
  }
  try {
    await pool.query(
      "INSERT INTO motivos_parada (motivo, status, programada) VALUES ($1, 'ATIVO', $2)",
      [motivo, parada]
    );
    res.sendStatus(201);
  } catch (err) {
    console.error("Erro ao adicionar motivo:", err);
    res.status(500).send("Erro ao adicionar motivo");
  }
});

app.post("/operadores", async (req, res) => {
  const { nome_operador, setor, unidade, celula } = req.body;
  if (!nome_operador || !setor || !unidade || !celula) {
    return res
      .status(400)
      .json({ error: "Nome, setor, unidade e célula são obrigatórios" });
  }
  try {
    const unidadeResult = await pool.query(
      "SELECT codigo FROM unidade WHERE unidade = $1",
      [unidade]
    );
    if (unidadeResult.rows.length === 0) {
      return res.status(400).json({ error: "Unidade não encontrada" });
    }
    const cod_unidade = unidadeResult.rows[0].codigo;
    const tipoEquipamentoResult = await pool.query(
      "SELECT codigo FROM tipo_equipamento WHERE descricao = $1",
      [setor]
    );
    if (tipoEquipamentoResult.rows.length === 0) {
      return res
        .status(400)
        .json({ error: "Tipo de equipamento (setor) não encontrado" });
    }
    const tipo_equipamento = tipoEquipamentoResult.rows[0].codigo;
    const celulaResult = await pool.query(
      "SELECT codigo FROM celula WHERE celula = $1 AND tipo_equipamento = $2",
      [celula, tipo_equipamento]
    );
    if (celulaResult.rows.length === 0) {
      return res.status(400).json({
        error: "Célula não encontrada para o tipo de equipamento informado",
      });
    }
    const cod_celula = celulaResult.rows[0].codigo;
    await pool.query(
      "INSERT INTO operador (nome_operador, setor, cod_unidade, cod_celula, status) VALUES ($1, $2, $3, $4, 'ATIVO')",
      [nome_operador, setor, cod_unidade, cod_celula]
    );
    res.sendStatus(201);
  } catch (err) {
    console.error("Erro ao adicionar operador:", err);
    res.status(500).send("Erro ao adicionar operador");
  }
});

app.post("/operacao/inicio", async (req, res) => {
  const { equipamento, hora } = req.body;
  if (!equipamento || !hora) {
    return res
      .status(400)
      .json({ error: "Campos obrigatórios: equipamento, hora" });
  }
  const data = hora.slice(0, 10);
  try {
    const busca = await pool.query(
      `SELECT * FROM horimetro WHERE equipamento = $1 AND CAST(ini_1t AS DATE) = $2 ORDER BY codigo DESC LIMIT 1`,
      [equipamento, data]
    );
    if (busca.rows.length > 0) {
      const reg = busca.rows[0];
      if (reg.ini_1t && reg.fim_1t && !reg.ini_2t) {
        await pool.query("UPDATE horimetro SET ini_2t = $1 WHERE codigo = $2", [
          hora,
          reg.codigo,
        ]);
        return res.sendStatus(201);
      }
      if (!reg.ini_1t) {
        await pool.query("UPDATE horimetro SET ini_1t = $1 WHERE codigo = $2", [
          hora,
          reg.codigo,
        ]);
        return res.sendStatus(201);
      }
      if (reg.ini_1t && !reg.fim_1t) {
        return res.sendStatus(200);
      }
      if (reg.ini_2t && !reg.fim_2t) {
        return res.sendStatus(200);
      }
      return res.status(409).send("Turnos já registrados.");
    }
    await pool.query(
      "INSERT INTO horimetro (equipamento, ini_1t) VALUES ($1, $2)",
      [equipamento, hora]
    );
    return res.sendStatus(201);
  } catch (err) {
    console.error("Erro ao registrar início de operação:", err);
    return res.status(500).send("Erro ao registrar início de operação");
  }
});

app.post("/operacao/fim", async (req, res) => {
  const { equipamento, hora } = req.body;
  if (!equipamento || !hora) {
    return res
      .status(400)
      .json({ error: "Campos obrigatórios: equipamento, hora" });
  }
  const data = hora.slice(0, 10);
  try {
    let busca = await pool.query(
      `SELECT * FROM horimetro WHERE equipamento = $1 AND CAST(ini_1t AS DATE) = $2 AND (fim_1t IS NULL OR fim_2t IS NULL) ORDER BY codigo DESC LIMIT 1`,
      [equipamento, data]
    );
    if (!busca.rows.length) {
      busca = await pool.query(
        `SELECT * FROM horimetro WHERE equipamento = $1 AND (fim_1t IS NULL OR fim_2t IS NULL) ORDER BY codigo DESC LIMIT 1`,
        [equipamento]
      );
      if (!busca.rows.length) {
        return res
          .status(409)
          .json({ error: "Não há registro aberto para encerrar." });
      }
    }
    const reg = busca.rows[0];
    if (reg.ini_2t && !reg.fim_2t) {
      await pool.query("UPDATE horimetro SET fim_2t = $1 WHERE codigo = $2", [
        hora,
        reg.codigo,
      ]);
      return res.sendStatus(200);
    }
    if (reg.ini_1t && !reg.fim_1t) {
      await pool.query("UPDATE horimetro SET fim_1t = $1 WHERE codigo = $2", [
        hora,
        reg.codigo,
      ]);
      return res.sendStatus(200);
    }
    return res
      .status(409)
      .json({ error: "Não há registro aberto para encerrar." });
  } catch (err) {
    console.error("Erro ao registrar fim de operação:", err);
    res.status(500).send("Erro ao registrar fim de operação");
  }
});

app.post("/parada/inicio", async (req, res) => {
  const { equipamento, motivo, datahora_inicio_parada, operador } = req.body;
  try {
    const busca = await pool.query(
      `SELECT * FROM paradas_equipamentos WHERE equipamento = $1 AND datahora_fim_parada IS NULL`,
      [equipamento]
    );
    if (busca.rows.length > 0) {
      return res.status(409).json({
        existente: true,
        equipamento,
        motivo: busca.rows[0].motivo,
        operador: busca.rows[0].operador,
        datahora_inicio_parada: busca.rows[0].datahora_inicio_parada,
      });
    }
    await pool.query(
      `INSERT INTO paradas_equipamentos (equipamento, motivo, datahora_inicio_parada, operador)
       VALUES ($1, $2, $3, $4)`,
      [equipamento, motivo, datahora_inicio_parada, operador]
    );
    res.status(201).json({ existente: false });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao salvar início da parada");
  }
});

app.post("/parada/fim", async (req, res) => {
  const { equipamento, datahora_fim_parada, operador } = req.body;
  try {
    await pool.query(
      `UPDATE paradas_equipamentos SET datahora_fim_parada = $1, operador = $2
       WHERE equipamento = $3 AND datahora_fim_parada IS NULL`,
      [datahora_fim_parada, operador, equipamento]
    );
    res.sendStatus(201);
  } catch {
    res.status(500).send("Erro ao salvar término da parada");
  }
});

app.post("/usuarios/login", async (req, res) => {
  const { usuario, senha } = req.body;
  if (!usuario || !senha) {
    return res
      .status(400)
      .json({ success: false, message: "Usuário e senha são obrigatórios" });
  }
  try {
    const result = await pool.query(
      `SELECT usuarios.codigo as coduser, usuarios.usuario, usuarios.tipo, usuarios.unidade, unidade.unidade as uniduser 
       FROM usuarios, unidade
       WHERE usuarios.usuario = $1 
         AND usuarios.unidade = unidade.codigo
         AND usuarios.senha = $2
         LIMIT 1`,
      [usuario, senha]
    );
    if (result.rows.length > 0) {
      res.json({ success: true, usuario: result.rows[0] });
    } else {
      res
        .status(401)
        .json({ success: false, message: "Usuário ou senha inválidos" });
    }
  } catch (err) {
    console.error("Erro ao buscar usuário:", err);
    res.status(500).json({ success: false, message: "Erro ao buscar usuário" });
  }
});

app.put("/motivos-parada/:codigo", async (req, res) => {
  const { codigo } = req.params;
  const { motivo, parada } = req.body;
  if (!motivo || !parada) {
    return res
      .status(400)
      .json({ error: "Motivo e tipo de parada são obrigatórios" });
  }
  try {
    await pool.query(
      "UPDATE motivos_parada SET motivo = $1, programada = $2 WHERE codigo = $3",
      [motivo, parada, codigo]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error("Erro ao editar motivo:", err);
    res.status(500).send("Erro ao editar motivo");
  }
});

app.put("/motivos-parada/:codigo/inativar", async (req, res) => {
  const { codigo } = req.params;
  try {
    await pool.query(
      "UPDATE motivos_parada SET status = 'INATIVO' WHERE codigo = $1",
      [codigo]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error("Erro ao inativar motivo:", err);
    res.status(500).send("Erro ao inativar motivo");
  }
});

app.put("/motivos-parada/:codigo/ativar", async (req, res) => {
  const { codigo } = req.params;
  try {
    await pool.query(
      "UPDATE motivos_parada SET status = 'ATIVO' WHERE codigo = $1",
      [codigo]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error("Erro ao ativar motivo:", err);
    res.status(500).send("Erro ao ativar motivo");
  }
});

app.put("/operadores/:codigo", async (req, res) => {
  const { codigo } = req.params;
  const { nome_operador, setor, unidade, celula } = req.body;
  try {
    const unidadeResult = await pool.query(
      "SELECT codigo FROM unidade WHERE unidade = $1",
      [unidade]
    );
    if (unidadeResult.rows.length === 0) {
      return res.status(400).json({ error: "Unidade não encontrada" });
    }
    const cod_unidade = unidadeResult.rows[0].codigo;
    const tipoEquipamentoResult = await pool.query(
      "SELECT codigo FROM tipo_equipamento WHERE descricao = $1",
      [setor]
    );
    if (tipoEquipamentoResult.rows.length === 0) {
      return res
        .status(400)
        .json({ error: "Tipo de equipamento (setor) não encontrado" });
    }
    const tipo_equipamento = tipoEquipamentoResult.rows[0].codigo;
    const celulaResult = await pool.query(
      "SELECT codigo FROM celula WHERE celula = $1 AND tipo_equipamento = $2",
      [celula, tipo_equipamento]
    );
    if (celulaResult.rows.length === 0) {
      return res.status(400).json({
        error: "Célula não encontrada para o tipo de equipamento informado",
      });
    }
    const cod_celula = celulaResult.rows[0].codigo;
    await pool.query(
      "UPDATE operador SET nome_operador = $1, setor = $2, cod_unidade = $3, cod_celula = $4 WHERE codigo = $5",
      [nome_operador, setor, cod_unidade, cod_celula, codigo]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error("Erro ao atualizar operador:", err);
    res.status(500).send("Erro ao atualizar operador");
  }
});

app.put("/operadores/:codigo/inativar", async (req, res) => {
  const { codigo } = req.params;
  try {
    await pool.query(
      "UPDATE operador SET status = 'INATIVO' WHERE codigo = $1",
      [codigo]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error("Erro ao inativar operador:", err);
    res.status(500).send("Erro ao inativar operador");
  }
});

app.put("/operadores/:codigo/ativar", async (req, res) => {
  const { codigo } = req.params;
  try {
    await pool.query("UPDATE operador SET status = 'ATIVO' WHERE codigo = $1", [
      codigo,
    ]);
    res.sendStatus(200);
  } catch (err) {
    console.error("Erro ao ativar operador:", err);
    res.status(500).send("Erro ao ativar operador");
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://10.1.1.11:${port}`);
});
