# PetMatch — Parte 3: PHP e MySQL

O pré-cadastro agora é recebido pelo PHP e armazenado exclusivamente no MySQL. A Parte_02 permanece independente. Filtros, modal, galeria e validações JavaScript foram preservados.

## Executar com Docker (recomendado)

Requisitos: Docker com Compose. No diretório `Parte_03`:

```sh
docker compose up -d --build
```

Acesse http://localhost:8000. O MySQL 8.4 fica acessível apenas na rede interna do Compose. As senhas padrão são destinadas ao ambiente acadêmico local. Para personalizar, copie `.env.example` para `.env` e defina as senhas antes da primeira inicialização. O Compose usa `db` como host automaticamente.

O banco é inicializado com estrutura, seis pets e dados fictícios **somente quando o volume está vazio**. Reiniciar preserva os registros. Para encerrar sem apagar dados:

```sh
docker compose down
```

## Executar com PHP e MySQL instalados

Requisitos: PHP 8.1+ com PDO MySQL e MySQL 8.0.16+ (para aplicar as restrições CHECK). Importe, nesta ordem:

```sh
mysql -u root -p < database/01-schema.sql
mysql -u root -p petmatch < database/02-dados.sql
```

O segundo script deve ser importado apenas uma vez. Crie um usuário próprio com acesso SELECT, INSERT e UPDATE ao banco `petmatch`. Configure `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASSWORD` como variáveis de ambiente; `.env.example` lista as opções. A aplicação PHP não carrega `.env` automaticamente. Em Bash, depois de preencher `.env`:

```sh
set -a
source .env
set +a
php -S 127.0.0.1:8000 -t . router.php
```

Use o roteador fornecido para manter SQL, configuração e testes fora das rotas públicas. O servidor PHP integrado destina-se ao uso local.

## Dados e regras

- `adotantes`: CPF único, nome, e-mail, telefone e cidade opcionais, nascimento e data de criação.
- `pets`: catálogo dos seis pets apresentados no site.
- `pre_cadastros`: adotante, pet opcional, moradia, mensagem opcional, aceite e data do envio.

Cada envio válido salva uma nova solicitação. O mesmo CPF atualiza os dados do adotante sem apagar solicitações anteriores. Os contatos exibidos em consultas históricas serão os dados atuais do adotante. A operação usa transação e consultas preparadas. CPF é armazenado sem pontuação. Nenhum dado real é necessário para testar.

O PHP valida os dados independentemente do JavaScript: CPF, e-mail, aniversário de 18 anos, data válida a partir de 1901, nome, moradia, termo, opções de pet e limites de tamanho. Campos opcionais vazios são gravados como NULL. A verificação de CPF não comprova identidade.

O botão fica desabilitado durante o envio. Erros de validação aparecem junto aos campos; falhas de conexão preservam os valores. Reenvios deliberados são novas solicitações.

### Endpoint

`POST /api/cadastro.php`, corpo `multipart/form-data` ou `application/x-www-form-urlencoded`, com os nomes dos campos do formulário. Retorna JSON:

- `201`: `{ "ok": true, "mensagem": "..." }` após commit.
- `422`: `{ "ok": false, "mensagem": "...", "erros": { "campo": "..." } }`.
- `405`: método não permitido; cabeçalho `Allow: POST`.
- `503`: falha de persistência, sem credenciais ou detalhes internos na resposta.

## Entrega do banco

- `database/01-schema.sql`: banco completo e relacionamentos.
- `database/02-dados.sql`: dados fictícios para avaliação.
- [Diagrama visual](docs/diagrama.svg) e [fonte editável Mermaid](docs/diagrama.mmd).

Para conferir os registros no MySQL:

```sql
USE petmatch;
SELECT pc.id, a.nome, a.cpf, p.nome AS pet, pc.moradia, pc.criado_em
FROM pre_cadastros pc
JOIN adotantes a ON a.id = pc.adotante_id
LEFT JOIN pets p ON p.id = pc.pet_id
ORDER BY pc.id DESC;
```

Para exportar o banco com os registros salvos, no ambiente nativo:

```sh
mysqldump -u root -p --databases petmatch > petmatch-completo.sql
```

## Testes

```sh
npm ci
npm test
docker compose exec -T web php tests/validacao.php
docker compose exec -T web php tests/persistencia.php
docker compose exec -T web php tests/indisponibilidade.php
PETMATCH_BASE_URL=http://localhost:8000 npm test
```

Os testes de persistência usam MySQL real e acrescentam registros fictícios; execute-os em uma instância de avaliação. O teste de navegador usa Chrome em `/usr/bin/google-chrome-stable`; defina `CHROME_BIN` para outro caminho. Sem `PETMATCH_BASE_URL`, a suíte verifica páginas locais e falha de conexão; com a variável, também verifica envio real. A fonte externa é opcional e o jQuery está incluído em `vendor/`.
