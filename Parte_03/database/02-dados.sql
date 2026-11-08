USE petmatch;

INSERT INTO
    pets (nome, especie)
VALUES
    ('Thor', 'cachorro'),
    ('Mel', 'gato'),
    ('Paçoca', 'cachorro'),
    ('Frajola', 'gato'),
    ('Luna', 'cachorro'),
    ('Bolinha', 'cachorro');

-- Dados exclusivamente fictícios para avaliação; não representam pessoas reais.
INSERT INTO
    adotantes (nome, cpf, email, telefone, cidade, nascimento)
VALUES
    (
        'Pessoa Exemplo',
        '12345678909',
        'exemplo@example.com',
        '32999990000',
        'Juiz de Fora',
        '1995-05-20'
    );

INSERT INTO
    pre_cadastros (
        adotante_id,
        pet_id,
        moradia,
        mensagem,
        termo_aceito
    )
SELECT
    a.id,
    p.id,
    'casa',
    'Registro fictício para avaliação.',
    1
FROM
    adotantes a
    JOIN pets p ON p.nome = 'Thor'
WHERE
    a.cpf = '12345678909';
