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

SELECT codigo, equipamento, ini_1t, fim_1t, ini_2t, fim_2t
FROM horimetro 
WHERE ini_1t IS NOT NULL
ORDER BY codigo;

DELETE FROM horimetro
WHERE codigo IN (1110, 1111, 1112, 1113, 1156);

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


INSERT INTO horimetro (equipamento, ini_1t) VALUES (354, '2025-07-30T08:00:00');