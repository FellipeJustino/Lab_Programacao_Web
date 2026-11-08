<?php
// Roteador do servidor local: entrega apenas páginas e recursos públicos.
$caminho = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/');

if ($caminho === '/api/cadastro.php') {
    require __DIR__ . '/api/cadastro.php';
    return true;
}

$arquivo = realpath(__DIR__ . ($caminho === '/' ? '/index.html' : $caminho));
$extensao = $arquivo ? strtolower(pathinfo($arquivo, PATHINFO_EXTENSION)) : '';

if (
    $arquivo &&
    str_starts_with($arquivo, __DIR__ . DIRECTORY_SEPARATOR) &&
    is_file($arquivo) &&
    in_array($extensao, ['html', 'css', 'js', 'jpg', 'jpeg', 'png', 'ico', 'svg'], true) &&
    !preg_match('~/(tests|docs|database)/~', $caminho)
) {
    return false;
}

http_response_code(404);
echo 'Página não encontrada.';
