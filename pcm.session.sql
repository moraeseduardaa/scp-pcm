UPDATE equipamento
SET cod_celula = 9
WHERE tipo = 2
and unidade = 3;
AND codigo IN (
9235,
422
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


DELETE FROM operador
WHERE codigo IN (41,47);


alter table unidade add column fabrica VARCHAR(3);

SELECT unidade.codigo, unidade.unidade, tipo_equipamento.codigo, tipo_equipamento.descricao, celula.celula, equipamento.codigo, equipamento.descricao
FROM unidade, tipo_equipamento, celula, equipamento
WHERE unidade.codigo = 3
AND equipamento.unidade = unidade.codigo
AND equipamento.tipo = tipo_equipamento.codigo
AND equipamento.cod_celula = celula.codigo;

select unidade.codigo, unidade.unidade, tipo_equipamento.codigo, tipo_equipamento.descricao
from unidade, tipo_equipamento
where unidade.fabrica = 'SIM'
and tipo_equipamento.codigo in (1,2,3);
 
select equipamento.unidade, unidade.unidade as unidade, equipamento.tipo, tipo_equipamento.descricao as tipo_descricao
from equipamento, tipo_equipamento, unidade
where equipamento.unidade = unidade.codigo
and equipamento.tipo = tipo_equipamento.codigo
and unidade.fabrica = 'SIM'
and tipo_equipamento.codigo in (1,2,3);