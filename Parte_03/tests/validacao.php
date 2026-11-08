<?php
require __DIR__ . '/../api/validacao.php';

function verificar($condicao, $mensagem)
{
    if (!$condicao) {
        throw new RuntimeException($mensagem);
    }
}

$dados = [
    'nome' => 'João Teste',
    'cpf' => '529.982.247-25',
    'email' => 'joao@example.com',
    'nascimento' => '1990-01-01',
    'moradia' => 'casa',
    'termo' => 'on',
    'pet' => 'Thor',
    'mensagem' => 'Quero adotar.'
];
[$normalizados, $erros] = validarCadastro($dados);
verificar(!$erros && $normalizados['cpf'] === '52998224725', 'Cadastro válido e normalização');

foreach (
    [
        'cpf' => '11111111111',
        'email' => 'invalido',
        'nascimento' => date('Y-m-d'),
        'moradia' => 'outro',
        'termo' => '',
        'pet' => 'Pet inexistente',
        'nome' => str_repeat('a', 151),
        'mensagem' => str_repeat('á', 501)
    ]
    as $campo => $valor
) {
    $invalido = $dados;
    $invalido[$campo] = $valor;
    [, $erros] = validarCadastro($invalido);
    verificar(isset($erros[$campo]), 'Deve rejeitar ' . $campo);
}

[, $erros] = validarCadastro(['nome' => ['array']]);
verificar(isset($erros['nome']), 'Rejeitar arrays');
$dados['nascimento'] = (new DateTimeImmutable('today'))->modify('-18 years')->format('Y-m-d');
verificar(!validarCadastro($dados)[1], 'Aceitar aniversário de 18 anos');
$dados['nascimento'] = (new DateTimeImmutable('today'))
    ->modify('-18 years')
    ->modify('+1 day')
    ->format('Y-m-d');
verificar(isset(validarCadastro($dados)[1]['nascimento']), 'Rejeitar véspera dos 18 anos');
$dados['nascimento'] = "1990-01-01\0";
verificar(isset(validarCadastro($dados)[1]['nascimento']), 'Rejeitar bytes nulos sem exceção');
echo "Validação PHP: OK\n";
