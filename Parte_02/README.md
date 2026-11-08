# PetMatch — Parte 2: JavaScript / jQuery

Abra `index.html` em um navegador moderno. Não é necessário servidor ou instalação para usar o site. O jQuery 3.7.1 está incluído em `vendor/`, com a licença preservada no cabeçalho. A fonte externa é opcional; há fontes alternativas locais.

## Recursos

- Filtros combinados por espécie e porte, sem recarregar a página, com contagem, estado vazio e botão para limpar.
- Botão “Conhecer” em cada pet: modal com foto e história fictícia, fechamento por botão, Escape ou clique fora; foco devolvido ao botão de origem.
- “Quero adotar” no modal abre o formulário com o pet selecionado.
- CPF com verificação dos dois dígitos verificadores (aceita com ou sem pontuação); e-mail e idade mínima de 18 anos validados durante a edição. A maioridade considera dia, mês e ano atuais.
- Carrossel com quatro cards em telas grandes, três no desktop, dois no tablet e um com prévia do próximo no celular. Transição horizontal automática com jQuery, arraste por mouse/toque e setas do teclado. Avança um card em 900 ms e aguarda 3 segundos para leitura. Pausa ao interagir, ao abrir um modal ou ao ocultar a aba. Respeita a preferência por movimento reduzido.
- Erros junto aos campos, associação para leitores de tela, foco no primeiro campo inválido e contador de caracteres.

O formulário é uma simulação: não envia nem armazena dados. A validação de CPF verifica sua estrutura, não a identidade de uma pessoa. Em uma aplicação real, a validação também precisaria ocorrer no servidor.

## Testes automatizados

Requisitos: Node.js, npm e Google Chrome instalado.

```sh
npm install
npm test
```

Por padrão, os testes usam `/usr/bin/google-chrome-stable`. Em outro ambiente, informe o caminho do executável:

```sh
CHROME_BIN=/caminho/do/chrome npm test
```

A suíte testa filtros e limpeza, história e seleção do pet, retorno de foco, navegação circular da galeria, CPF inválido e válido, e-mail, aniversário de 18 anos e bloqueio de envio incompleto. Nenhum dado real é necessário.
