<?php
// Executar apenas no banco descartável criado pelo Compose.
$pdo = new PDO(
    'mysql:host=db;dbname=petmatch;charset=utf8mb4',
    getenv('DB_USER'),
    getenv('DB_PASSWORD')
);

function enviar(array $dados): array
{
    $ctx = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/x-www-form-urlencoded',
            'content' => http_build_query($dados),
            'ignore_errors' => true
        ]
    ]);
    return json_decode(
        file_get_contents('http://web:8000/api/cadastro.php', false, $ctx),
        true,
        512,
        JSON_THROW_ON_ERROR
    );
}

function exigir($ok, $mensagem)
{
    if (!$ok) {
        throw new RuntimeException($mensagem);
    }
}

$dados = [
    'nome' => 'João Integração',
    'cpf' => '52998224725',
    'email' => 'teste@example.com',
    'nascimento' => '1990-01-01',
    'moradia' => 'casa',
    'termo' => 'on',
    'pet' => 'Thor',
    'mensagem' => 'Adoção com carinho'
];
$antes = (int) $pdo
    ->query(
        <<<'SQL'
        SELECT
            COUNT(*)
        FROM
            pre_cadastros
        SQL
    )
    ->fetchColumn();
exigir(enviar($dados)['ok'] === true, 'Gravação real');
$dados['nome'] = 'João Atualizado';
$dados['pet'] = 'Ainda não escolhi';
exigir(enviar($dados)['ok'] === true, 'CPF repetido e pet opcional');
exigir(
    (int) $pdo
        ->query(
            <<<'SQL'
            SELECT
                COUNT(*)
            FROM
                pre_cadastros
            SQL
        )
        ->fetchColumn() ===
        $antes + 2,
    'Histórico preservado'
);
exigir(
    (int) $pdo
        ->query(
            <<<'SQL'
            SELECT
                COUNT(*)
            FROM
                adotantes
            WHERE
                cpf = '52998224725'
            SQL
        )
        ->fetchColumn() === 1,
    'CPF único'
);
exigir(
    $pdo
        ->query(
            <<<'SQL'
            SELECT
                nome
            FROM
                adotantes
            WHERE
                cpf = '52998224725'
            SQL
        )
        ->fetchColumn() === 'João Atualizado',
    'Atualização com acentos'
);
exigir(
    (int) $pdo
        ->query(
            <<<'SQL'
            SELECT
                COUNT(*)
            FROM
                pre_cadastros p
                JOIN adotantes a ON a.id = p.adotante_id
            WHERE
                a.cpf = '52998224725'
                AND p.pet_id IS NULL
            SQL
        )
        ->fetchColumn() > 0,
    'Pet nulo'
);

foreach (
    [
        'cpf' => '11111111111',
        'email' => 'invalido',
        'nascimento' => date('Y-m-d'),
        'moradia' => '',
        'termo' => ''
    ]
    as $campo => $valor
) {
    $invalido = $dados;
    $invalido[$campo] = $valor;
    $resposta = enviar($invalido);
    exigir(!$resposta['ok'] && isset($resposta['erros'][$campo]), 'Rejeitar ' . $campo);
}

exigir(
    (int) $pdo
        ->query(
            <<<'SQL'
            SELECT
                COUNT(*)
            FROM
                pre_cadastros
            SQL
        )
        ->fetchColumn() ===
        $antes + 2,
    'Inválidos não gravados'
);
echo "Persistência MySQL: OK\n";
