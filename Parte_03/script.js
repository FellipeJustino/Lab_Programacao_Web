// Interações da página inicial: filtros no DOM, história e galeria jQuery.
const cartoes = [...document.querySelectorAll('.cartao[data-especie]')];

if (cartoes.length) {
    const especie = document.getElementById('filtro-especie');
    const porte = document.getElementById('filtro-porte');

    function filtrarPets() {
        let total = 0;
        cartoes.forEach((cartao) => {
            cartao.hidden = !!(
                (especie.value && cartao.dataset.especie !== especie.value) ||
                (porte.value && cartao.dataset.porte !== porte.value)
            );

            if (!cartao.hidden) {
                total++;
            }
        });
        document.getElementById('resultado-filtro').textContent =
            `${total} ${total === 1 ? 'pet encontrado' : 'pets encontrados'}.`;
        document.getElementById('sem-resultados').hidden = total !== 0;
    }

    especie.addEventListener('change', filtrarPets);
    porte.addEventListener('change', filtrarPets);
    document.getElementById('limpar-filtros').addEventListener('click', () => {
        especie.value = porte.value = '';
        filtrarPets();
    });

    // Histórias fictícias para a demonstração acadêmica.
    const historias = {
        Thor: 'Thor encontrou acolhimento depois de ser resgatado. Brincalhão e ótimo com crianças, gosta de companhia e passeios. Aos 2 anos, espera uma família para compartilhar suas aventuras.',
        Mel: 'Mel tem 1 ano e um jeitinho calmo e carinhoso. Depois de chegar ao abrigo, descobriu seu lugar favorito: uma janela ensolarada. Procura um lar seguro para descansar e receber carinho.',
        Paçoca: 'Paçoca chegou ainda filhote e hoje, aos 5 meses, está cheio de energia para descobrir o mundo. Precisa de uma família paciente para ensinar a rotina e acompanhar seu crescimento.',
        Frajola:
            'Frajola tem 4 anos e conquistou os voluntários com sua tranquilidade. Independente, gosta de explorar e depois descansar por perto. Espera uma família que respeite seu tempo de adaptação.',
        Luna: 'Luna tem 6 anos e muito carinho para oferecer. Dócil e companheira, adora ficar perto das pessoas. Essa cadela de porte grande procura uma família para passear e dividir momentos tranquilos.',
        Bolinha:
            'Bolinha tem 3 anos e se anima sempre que vê a guia de passeio. No abrigo, virou companhia dos voluntários nas caminhadas. Procura um lar com atenção, carinho e passeios diários.'
    };
    const modal = document.getElementById('modal-pet');
    let origem;
    document.querySelectorAll('.conhecer').forEach((botao) => {
        botao.addEventListener('click', () => {
            origem = botao;
            const nome = botao.dataset.pet;
            const foto = botao.closest('.cartao').querySelector('img');
            document.getElementById('nome-pet').textContent = nome;
            document.getElementById('historia-pet').textContent = historias[nome];
            document.getElementById('foto-pet').src = foto.src;
            document.getElementById('foto-pet').alt = foto.alt;
            document.getElementById('adotar-pet').href =
                `cadastro.html?pet=${encodeURIComponent(nome)}`;
            modal.showModal();
            document.body.classList.add('modal-aberto');
        });
    });
    document.getElementById('fechar-modal').addEventListener('click', () => {
        return modal.close();
    });
    modal.addEventListener('click', (evento) => {
        const limites = modal.getBoundingClientRect();

        if (
            evento.target === modal &&
            (evento.clientX < limites.left ||
                evento.clientX > limites.right ||
                evento.clientY < limites.top ||
                evento.clientY > limites.bottom)
        ) {
            modal.close();
        }
    });
    modal.addEventListener('close', () => {
        document.body.classList.remove('modal-aberto');
        origem?.focus();
    });

    const $ = window.jQuery;

    if ($) {
        const viewport = document.getElementById('galeria-fotos');
        const trilho = viewport.querySelector('.galeria-trilho');
        const movimentoReduzido = window.matchMedia('(prefers-reduced-motion: reduce)');
        // Três grupos permitem circular nos dois sentidos sem deixar espaços vazios.

        for (let grupo = 0; grupo < 3; grupo++) {
            cartoes.forEach((cartao) => {
                const foto = cartao.querySelector('img');
                const card = $('<figure>', { class: 'galeria-card' });

                if (grupo !== 1) {
                    card.attr('aria-hidden', 'true');
                }

                $('<img>', {
                    src: foto.getAttribute('src'),
                    alt: foto.alt,
                    draggable: false
                }).appendTo(card);
                const legenda = $('<figcaption>').appendTo(card);
                $('<h3>').text(cartao.querySelector('h3').textContent).appendTo(legenda);
                $('<p>').text(cartao.querySelector('p').textContent).appendTo(legenda);
                $('<span>', { class: 'etiqueta' })
                    .text(cartao.querySelector('.etiqueta').textContent)
                    .appendTo(legenda);
                card.appendTo(trilho);
            });
        }

        const $viewport = $(viewport);
        let larguraGrupo = 0;
        let passo = 0;
        let arrastando = false;
        let ultimoX = 0;
        let sobre = false;
        let focado = false;
        let temporizador;
        let posicao = 0;
        let visivel = false;
        let cardDestacado;

        function atualizarDestaque() {
            const centro = viewport.scrollLeft + viewport.clientWidth / 2;
            let proximo;
            let menorDistancia = Infinity;

            for (const card of trilho.children) {
                const distancia = Math.abs(card.offsetLeft + card.offsetWidth / 2 - centro);

                if (distancia < menorDistancia) {
                    menorDistancia = distancia;
                    proximo = card;
                }
            }

            if (proximo === cardDestacado) {
                return;
            }

            cardDestacado?.classList.remove('em-destaque');
            proximo?.classList.add('em-destaque');
            cardDestacado = proximo;
        }

        function bloqueado() {
            return (
                !visivel ||
                movimentoReduzido.matches ||
                sobre ||
                focado ||
                arrastando ||
                document.hidden ||
                modal.open
            );
        }

        function agendar() {
            clearTimeout(temporizador);

            if (!bloqueado()) {
                temporizador = window.setTimeout(() => {
                    return avancar(1);
                }, 3000);
            }
        }

        function interromper() {
            clearTimeout(temporizador);
            $viewport.stop(true);
        }

        function normalizar() {
            if (!larguraGrupo) {
                return;
            }

            viewport.scrollLeft =
                larguraGrupo +
                ((((viewport.scrollLeft - larguraGrupo) % larguraGrupo) + larguraGrupo) %
                    larguraGrupo);
            posicao = (viewport.scrollLeft - larguraGrupo) / passo;
            atualizarDestaque();
        }

        function medir() {
            interromper();
            const cards = trilho.children;
            passo = cards[1].getBoundingClientRect().left - cards[0].getBoundingClientRect().left;
            larguraGrupo =
                cards[cartoes.length].getBoundingClientRect().left -
                cards[0].getBoundingClientRect().left;
            viewport.scrollLeft = larguraGrupo + posicao * passo;
            atualizarDestaque();
            agendar();
        }

        function avancar(direcao) {
            interromper();
            normalizar();
            $viewport.animate(
                { scrollLeft: viewport.scrollLeft + direcao * passo },
                {
                    duration: movimentoReduzido.matches ? 0 : 900,
                    easing: 'swing',
                    progress: () => {
                        posicao = (viewport.scrollLeft - larguraGrupo) / passo;
                        atualizarDestaque();
                    },
                    complete: () => {
                        normalizar();
                        agendar();
                    }
                }
            );
        }

        function atualizarPausa() {
            interromper();
            agendar();
        }

        medir();
        new ResizeObserver(medir).observe(viewport);
        new IntersectionObserver(
            ([entrada]) => {
                const agoraVisivel = entrada.isIntersecting && entrada.intersectionRatio >= 0.5;

                if (agoraVisivel === visivel) {
                    return;
                }

                visivel = agoraVisivel;
                interromper();

                if (!bloqueado()) {
                    avancar(1);
                }
            },
            { threshold: 0.5 }
        ).observe(viewport);
        viewport.addEventListener('scroll', atualizarDestaque, { passive: true });
        viewport.addEventListener('pointerenter', (evento) => {
            if (evento.pointerType === 'mouse') {
                sobre = true;
                atualizarPausa();
            }
        });
        viewport.addEventListener('pointerleave', () => {
            sobre = false;
            atualizarPausa();
        });
        viewport.addEventListener('focus', () => {
            focado = true;
            atualizarPausa();
        });
        viewport.addEventListener('blur', () => {
            focado = false;
            atualizarPausa();
        });
        viewport.addEventListener('pointerdown', (evento) => {
            if (!evento.isPrimary || evento.button !== 0) {
                return;
            }
            // O mouse controla o arraste sem manter uma pausa por foco após sair.

            if (evento.pointerType === 'mouse') {
                evento.preventDefault();
            }

            interromper();
            arrastando = true;
            ultimoX = evento.clientX;
            viewport.setPointerCapture(evento.pointerId);
            viewport.classList.add('arrastando');
        });
        viewport.addEventListener('pointermove', (evento) => {
            if (!arrastando) {
                return;
            }

            viewport.scrollLeft += ultimoX - evento.clientX;
            ultimoX = evento.clientX;
            normalizar();
        });

        function finalizarArraste() {
            if (!arrastando) {
                return;
            }

            arrastando = false;
            viewport.classList.remove('arrastando');
            normalizar();
            agendar();
        }

        viewport.addEventListener('pointerup', finalizarArraste);
        viewport.addEventListener('pointercancel', finalizarArraste);
        viewport.addEventListener('lostpointercapture', finalizarArraste);
        viewport.addEventListener('keydown', (evento) => {
            if (evento.key === 'ArrowRight' || evento.key === 'ArrowLeft') {
                evento.preventDefault();
                avancar(evento.key === 'ArrowRight' ? 1 : -1);
            }
        });
        movimentoReduzido.addEventListener('change', atualizarPausa);
        document.addEventListener('visibilitychange', atualizarPausa);
        new MutationObserver(atualizarPausa).observe(modal, {
            attributes: true,
            attributeFilter: ['open']
        });
    }
}

// Validação em tempo real e envio ao servidor PHP.

const form = document.getElementById('form-cadastro');

if (form) {
    const sucesso = document.getElementById('sucesso');
    const nascimento = document.getElementById('nascimento');
    const hoje = new Date();
    nascimento.max = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
    const pet = new URLSearchParams(window.location.search).get('pet');
    const selecao = document.getElementById('pet');

    if (
        [...selecao.options].some((opcao) => {
            return opcao.value === pet;
        })
    ) {
        selecao.value = pet;
    }


    function cpfValido(valor) {
        if (!/^(\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2})$/.test(valor)) {
            return false;
        }

        const digitos = valor.replace(/\D/g, '');

        if (/^(\d)\1{10}$/.test(digitos)) {
            return false;
        }

        for (let tamanho = 9; tamanho <= 10; tamanho++) {
            let soma = 0;

            for (let i = 0; i < tamanho; i++) soma += Number(digitos[i]) * (tamanho + 1 - i);

            const resto = (soma * 10) % 11;

            if ((resto === 10 ? 0 : resto) !== Number(digitos[tamanho])) {
                return false;
            }
        }

        return true;
    }

    function validarNascimento(valor) {
        if (!valor) {
            return 'Informe sua data de nascimento.';
        }

        const [ano, mes, dia] = valor.split('-').map(Number);
        const data = new Date(ano, mes - 1, dia);
        const agora = new Date();

        if (
            ano < 1901 ||
            data.getFullYear() !== ano ||
            data.getMonth() !== mes - 1 ||
            data.getDate() !== dia ||
            data > agora
        ) {
            return 'Informe uma data de nascimento válida.';
        }

        let idade = agora.getFullYear() - ano;

        if (agora.getMonth() < mes - 1 || (agora.getMonth() === mes - 1 && agora.getDate() < dia)) {
            idade--;
        }

        return idade >= 18 ? '' : 'É necessário ter pelo menos 18 anos para adotar.';
    }

    const regras = {
        nome: () => {
            return document.getElementById('nome').value.trim().length >= 3
                ? ''
                : 'Informe seu nome completo.';
        },
        cpf: () => {
            return cpfValido(document.getElementById('cpf').value.trim())
                ? ''
                : 'Informe um CPF válido com 11 dígitos.';
        },
        email: () => {
            return /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(
                document.getElementById('email').value.trim()
            )
                ? ''
                : 'Informe um e-mail válido, como nome@dominio.com.';
        },
        nascimento: () => {
            return validarNascimento(nascimento.value);
        },
        moradia: () => {
            return form.querySelector('[name="moradia"]:checked')
                ? ''
                : 'Selecione o tipo de moradia.';
        },
        termo: () => {
            return document.getElementById('termo').checked
                ? ''
                : 'Você precisa aceitar o termo para continuar.';
        }
    };

    function validarCampo(nome) {
        const erro = regras[nome]();
        document.getElementById(`erro-${nome}`).textContent = erro;
        form.querySelectorAll(`[name="${nome}"]`).forEach((campo) => {
            campo.classList.toggle('invalido', !!erro);
            campo.setAttribute('aria-invalid', String(!!erro));
        });
        return !erro;
    }

    Object.keys(regras).forEach((nome) => {
        document.getElementById(`erro-${nome}`).setAttribute('aria-live', 'polite');
        form.querySelectorAll(`[name="${nome}"]`).forEach((campo) => {
            campo.setAttribute('aria-describedby', `erro-${nome}`);
            ['input', 'change', 'blur'].forEach((evento) => {
                return campo.addEventListener(evento, () => {
                    return validarCampo(nome);
                });
            });
        });
    });
    form.addEventListener('input', () => {
        sucesso.textContent = '';
    });
    document.getElementById('mensagem').addEventListener('input', (evento) => {
        document.getElementById('contador').textContent = evento.target.value.length;
    });
    let enviando = false;
    form.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        if (enviando) {
            return;
        }

        sucesso.textContent = '';
        form.querySelectorAll('.erro').forEach((erro) => {
            erro.textContent = '';
        });
        form.querySelectorAll('[aria-invalid]').forEach((campo) => {
            campo.setAttribute('aria-invalid', 'false');
            campo.classList.remove('invalido');
        });
        const resultados = Object.keys(regras).map(validarCampo);

        if (resultados.every(Boolean)) {
            enviando = true;
            const botao = form.querySelector('[type="submit"]');
            botao.disabled = true;
            botao.textContent = 'Enviando…';
            form.setAttribute('aria-busy', 'true');

            try {
                const resposta = await fetch(form.action, {
                    method: 'POST',
                    body: new FormData(form)
                });
                const dados = await resposta.json();

                if (!resposta.ok || !dados.ok) {
                    Object.entries(dados.erros || {}).forEach(([nome, mensagem]) => {
                        const erro = document.getElementById(`erro-${nome}`);

                        if (erro) {
                            erro.textContent = mensagem;
                            form.querySelectorAll(`[name="${nome}"]`).forEach((campo) => {
                                campo.setAttribute('aria-invalid', 'true');
                                campo.setAttribute('aria-describedby', erro.id);
                            });
                        }
                    });
                    sucesso.textContent =
                        dados.mensagem || 'Não foi possível salvar o pré-cadastro.';
                    form.querySelector('[aria-invalid="true"]')?.focus();
                } else {
                    sucesso.textContent = dados.mensagem;
                }
            } catch {
                sucesso.textContent =
                    'Não foi possível conectar ao servidor. Seus dados continuam no formulário; tente novamente.';
            } finally {
                enviando = false;
                botao.disabled = false;
                botao.textContent = 'Enviar pré-cadastro';
                form.removeAttribute('aria-busy');
            }
        } else {
            form.querySelector('[aria-invalid="true"]').focus();
        }
    });
}
