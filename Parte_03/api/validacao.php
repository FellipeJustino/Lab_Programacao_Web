<?php
declare(strict_types=1);

function validarCadastro(array $entrada): array
{
    $dados = [];
    $erros = [];
    $limites = [
        'nome' => 150,
        'cpf' => 14,
        'email' => 254,
        'telefone' => 30,
        'cidade' => 100,
        'nascimento' => 10,
        'pet' => 50,
        'moradia' => 20,
        'mensagem' => 500,
        'termo' => 5
    ];

    foreach ($limites as $campo => $limite) {
        $valor = $entrada[$campo] ?? '';

        if (!is_string($valor) || (!preg_match('//u', $valor) || str_contains($valor, "\0"))) {
            $erros[$campo] = 'Informe um valor válido.';
            $valor = '';
        }

        $dados[$campo] = trim($valor);

        if (preg_match_all('/./us', $dados[$campo]) > $limite) {
            $erros[$campo] = "Use no máximo $limite caracteres.";
        }
    }

    if (preg_match_all('/./us', $dados['nome']) < 3) {
        $erros['nome'] = 'Informe seu nome completo.';
    }

    $cpf = preg_replace('/\D/', '', $dados['cpf']);
    $valido =
        (bool) preg_match('/^(\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2})$/', $dados['cpf']) &&
        !preg_match('/^(\d)\1{10}$/', $cpf);

    if ($valido) {
        for ($tamanho = 9; $tamanho <= 10; $tamanho++) {
            $soma = 0;

            for ($i = 0; $i < $tamanho; $i++) {
                $soma += (int) $cpf[$i] * ($tamanho + 1 - $i);
            }

            if ((($soma * 10) % 11) % 10 !== (int) $cpf[$tamanho]) {
                $valido = false;
            }
        }
    }

    if (!$valido) {
        $erros['cpf'] = 'Informe um CPF válido com 11 dígitos.';
    }

    $dados['cpf'] = $cpf;

    if (!filter_var($dados['email'], FILTER_VALIDATE_EMAIL)) {
        $erros['email'] = 'Informe um e-mail válido.';
    }

    $data = DateTimeImmutable::createFromFormat('!Y-m-d', $dados['nascimento']);
    $hoje = new DateTimeImmutable('today');

    if (
        !$data ||
        $data->format('Y-m-d') !== $dados['nascimento'] ||
        $data < new DateTimeImmutable('1901-01-01') ||
        $data > $hoje
    ) {
        $erros['nascimento'] = 'Informe uma data de nascimento válida.';
    } elseif ($data->diff($hoje)->y < 18) {
        $erros['nascimento'] = 'É necessário ter pelo menos 18 anos para adotar.';
    }

    if (!in_array($dados['moradia'], ['casa', 'apartamento'], true)) {
        $erros['moradia'] = 'Selecione o tipo de moradia.';
    }

    if ($dados['termo'] !== 'on') {
        $erros['termo'] = 'Você precisa aceitar o termo para continuar.';
    }

    if (
        !in_array(
            $dados['pet'],
            ['', 'Ainda não escolhi', 'Thor', 'Mel', 'Paçoca', 'Frajola', 'Luna', 'Bolinha'],
            true
        )
    ) {
        $erros['pet'] = 'Selecione um pet válido.';
    }

    return [$dados, $erros];
}
