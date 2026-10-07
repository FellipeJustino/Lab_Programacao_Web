// Validação do formulário de pré-cadastro
const form = document.getElementById("form-cadastro");
const nome = document.getElementById("nome");
const email = document.getElementById("email");
const nascimento = document.getElementById("nascimento");
const mensagem = document.getElementById("mensagem");
const contador = document.getElementById("contador");
const termo = document.getElementById("termo");

function mostrarErro(campo, idErro, texto) {
  document.getElementById(idErro).textContent = texto;
  if (campo) campo.classList.toggle("invalido", texto !== "");
}

// Contador de caracteres do "Por que você quer adotar?"
mensagem.addEventListener("input", function () {
  contador.textContent = mensagem.value.length;
});

form.addEventListener("submit", function (evento) {
  evento.preventDefault();
  let valido = true;
  document.getElementById("sucesso").textContent = "";

  // Nome
  if (nome.value.trim().length < 3) {
    mostrarErro(nome, "erro-nome", "Informe seu nome completo.");
    valido = false;
  } else {
    mostrarErro(nome, "erro-nome", "");
  }

  // E-mail: estrutura nome@dominio.com
  const padraoEmail = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+$/;
  if (!padraoEmail.test(email.value.trim())) {
    mostrarErro(email, "erro-email", "E-mail inválido. Use o formato nome@gmail.com.");
    valido = false;
  } else {
    mostrarErro(email, "erro-email", "");
  }

  // Data de nascimento entre 1901 e 2026
  if (nascimento.value === "") {
    mostrarErro(nascimento, "erro-nascimento", "Informe sua data de nascimento.");
    valido = false;
  } else {
    const ano = parseInt(nascimento.value.substring(0, 4));
    if (ano < 1901 || ano > 2026) {
      mostrarErro(nascimento, "erro-nascimento", "O ano deve estar entre 1901 e 2026.");
      valido = false;
    } else {
      mostrarErro(nascimento, "erro-nascimento", "");
    }
  }

  // Tipo de moradia
  if (!document.querySelector('input[name="moradia"]:checked')) {
    mostrarErro(null, "erro-moradia", "Selecione o tipo de moradia.");
    valido = false;
  } else {
    mostrarErro(null, "erro-moradia", "");
  }

  // Termo de adoção
  if (!termo.checked) {
    mostrarErro(null, "erro-termo", "Você precisa aceitar o termo para continuar.");
    valido = false;
  } else {
    mostrarErro(null, "erro-termo", "");
  }

  if (valido) {
    document.getElementById("sucesso").textContent = "Pré-cadastro enviado! Entraremos em contato em breve.";
    form.reset();
    contador.textContent = "0";
  }
});
