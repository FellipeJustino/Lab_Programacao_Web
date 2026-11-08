<?php
$dados = [
    'nome' => 'Pessoa Teste',
    'cpf' => '52998224725',
    'email' => 'teste@example.com',
    'nascimento' => '1990-01-01',
    'moradia' => 'casa',
    'termo' => 'on'
];
$codigo =
    'putenv("DB_HOST=127.0.0.1");
putenv("DB_PORT=1");
$_SERVER["REQUEST_METHOD"] = "POST";
$_POST = ' .
    var_export($dados, true) .
    ';

register_shutdown_function(function () {
    fwrite(STDERR, "STATUS=" . http_response_code());
});

require ' .
    var_export(__DIR__ . '/../api/cadastro.php', true) .
    ';';
$processo = proc_open(
    [PHP_BINARY, '-r', $codigo],
    [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
    $pipes
);
fclose($pipes[0]);
$resposta = stream_get_contents($pipes[1]);
$erro = stream_get_contents($pipes[2]);
fclose($pipes[1]);
fclose($pipes[2]);
$status = proc_close($processo);
$dados = json_decode($resposta, true, 512, JSON_THROW_ON_ERROR);

if (
    $status !== 0 ||
    !str_contains($erro, 'STATUS=503') ||
    $dados['ok'] !== false ||
    str_contains($resposta, 'SQLSTATE')
) {
    throw new RuntimeException('Falha de conexão não tratada corretamente.');
}

echo "Indisponibilidade MySQL: OK\n";
