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


