SELECT codigo, descricao, cod_celula, tipo
FROM equipamento
WHERE status = 'ATIVO'
and tipo = 2;
and unidade = 3;

UPDATE equipamento
SET cod_celula = 9
WHERE tipo = 2
and unidade = 3;
AND codigo IN (
9235,
340,
9257,
35,
37,
423,
43,
414,
337,
31,
39,
42,
44,
45,
54,
36,
32,
34,
417,
422
);

update celula
set tipo_equipamento = 2
where codigo = 9;

TRUNCATE TABLE horimetro RESTART IDENTITY;
