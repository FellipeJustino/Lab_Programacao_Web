<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
date_default_timezone_set('America/Sao_Paulo');
require __DIR__ . '/validacao.php';

function responder(int $status, array $resposta): never
{
    http_response_code($status);
    echo json_encode($resposta, JSON_UNESCAPED_UNICODE);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    responder(405, ['ok' => false, 'mensagem' => 'Use o formulário para enviar seu pré-cadastro.']);
}

[$dados, $erros] = validarCadastro($_POST);

if ($erros) {
    responder(422, ['ok' => false, 'mensagem' => 'Revise os campos indicados.', 'erros' => $erros]);
}

$pdo = null;

try {
    $host = getenv('DB_HOST') ?: '127.0.0.1';
    $porta = getenv('DB_PORT') ?: '3306';
    $banco = getenv('DB_NAME') ?: 'petmatch';
    $pdo = new PDO(
        "mysql:host=$host;port=$porta;dbname=$banco;charset=utf8mb4",
        getenv('DB_USER') ?: '',
        getenv('DB_PASSWORD') ?: '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]
    );
    $pdo->beginTransaction();
    $petId = null;

    if (!in_array($dados['pet'], ['', 'Ainda não escolhi'], true)) {
        $consulta = $pdo->prepare(
            <<<'SQL'
            SELECT
                id
            FROM
                pets
            WHERE
                nome = ?
            SQL
        );
        $consulta->execute([$dados['pet']]);
        $petId = $consulta->fetchColumn();

        if ($petId === false) {
            $pdo->rollBack();
            responder(422, [
                'ok' => false,
                'mensagem' => 'Pet indisponível. Revise a seleção.',
                'erros' => ['pet' => 'Selecione outro pet ou Ainda não escolhi.']
            ]);
        }
    }

    $consulta = $pdo->prepare(
        <<<'SQL'
        INSERT INTO
            adotantes (nome, cpf, email, telefone, cidade, nascimento)
        VALUES
            (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            id = LAST_INSERT_ID(id),
            nome = VALUES(nome),
            email = VALUES(email),
            telefone = VALUES(telefone),
            cidade = VALUES(cidade),
            nascimento = VALUES(nascimento)
        SQL
    );
    $consulta->execute([
        $dados['nome'],
        $dados['cpf'],
        $dados['email'],
        $dados['telefone'] ?: null,
        $dados['cidade'] ?: null,
        $dados['nascimento']
    ]);
    $adotanteId = $pdo->lastInsertId();
    $consulta = $pdo->prepare(
        <<<'SQL'
        INSERT INTO
            pre_cadastros (
                adotante_id,
                pet_id,
                moradia,
                mensagem,
                termo_aceito
            )
        VALUES
            (?, ?, ?, ?, 1)
        SQL
    );
    $consulta->execute([$adotanteId, $petId, $dados['moradia'], $dados['mensagem'] ?: null]);
    $pdo->commit();
    responder(201, ['ok' => true, 'mensagem' => 'Pré-cadastro salvo com sucesso!']);
} catch (Throwable $erro) {
    if ($pdo && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log('PetMatch: falha na persistência (código ' . $erro->getCode() . ').');
    responder(503, [
        'ok' => false,
        'mensagem' =>
            'Não foi possível salvar agora. Seus dados continuam no formulário; tente novamente mais tarde.'
    ]);
}
