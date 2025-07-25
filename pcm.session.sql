UPDATE equipamento
SET unidade = 4
WHERE unidade = 3
and tipo in (5,11)
AND codigo IN (
248,
233,
236,
249,
251,
319,
307,
338,
242
);

TRUNCATE TABLE horimetro RESTART IDENTITY;

CREATE TABLE motivos_parada (
    codigo SERIAL PRIMARY KEY,
    motivo VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(10) NOT NULL DEFAULT 'ATIVO'
);

SELECT codigo, motivo, status 
FROM motivos_parada 
WHERE status = 'ATIVO'
ORDER BY motivo;

DELETE FROM paradas_equipamentos
WHERE codigo IN (2429);

alter table unidade add column fabrica VARCHAR(3);
 
select equipamento.unidade, unidade.unidade as unidade, equipamento.tipo, tipo_equipamento.descricao as tipo_descricao
from equipamento, tipo_equipamento, unidade
where equipamento.unidade = unidade.codigo
and equipamento.tipo = tipo_equipamento.codigo
and unidade.fabrica = 'SIM'
and tipo_equipamento.codigo in (1,2,3,5,6,8,11);

select equipamento.codigo, equipamento.descricao, equipamento.unidade, unidade.unidade as unidade, equipamento.tipo, tipo_equipamento.descricao as tipo_descricao
from equipamento
join unidade on equipamento.unidade = unidade.codigo
join tipo_equipamento on equipamento.tipo = tipo_equipamento.codigo
where unidade.codigo = 4
and tipo_equipamento.codigo in (5,11);

