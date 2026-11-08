const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

async function abrir(t, arquivo) {
    const browser = await chromium.launch({
        executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome-stable',
        headless: true,
        args: ['--no-sandbox']
    });
    t.after(() => {
        return browser.close();
    });
    const page = await browser.newPage();
    page.setDefaultTimeout(1500);
    await page.goto(pathToFileURL(path.resolve(arquivo)).href);
    return page;
}

test('filtros combinados, resultado vazio e limpeza sem navegação', async (t) => {
    const p = await abrir(t, 'index.html');
    assert.equal(await p.locator('#filtro-especie').count(), 1, 'filtro de espécie disponível');
    await p.selectOption('#filtro-especie', 'gato');
    assert.equal(await p.locator('.cartao:visible').count(), 2);
    await p.selectOption('#filtro-porte', 'grande');
    assert.equal(await p.locator('.cartao:visible').count(), 0);
    assert.equal(await p.locator('#sem-resultados').isVisible(), true);
    await p.click('#limpar-filtros');
    assert.equal(await p.locator('.cartao:visible').count(), 6);
});
test('história individual, Escape devolve foco e link seleciona pet', async (t) => {
    const p = await abrir(t, 'index.html');
    assert.equal(await p.getByRole('button', { name: 'Conhecer Thor' }).count(), 1);
    await p.getByRole('button', { name: 'Conhecer Thor' }).click();
    assert.equal(await p.locator('dialog').isVisible(), true);
    assert.match(await p.locator('#historia-pet').textContent(), /Thor/);
    await p.keyboard.press('Escape');
    assert.equal(
        await p.getByRole('button', { name: 'Conhecer Thor' }).evaluate((e) => {
            return e === document.activeElement;
        }),
        true
    );
    await p.getByRole('button', { name: 'Conhecer Mel', exact: true }).click();
    await p.locator('#adotar-pet').click();
    assert.equal(await p.locator('#pet').inputValue(), 'Mel');
});
test('carrossel automático com vários cards, arraste e pausa', async (t) => {
    const p = await abrir(t, 'index.html');
    const galeria = p.locator('#galeria-fotos');
    assert.equal(
        (await p.locator('.galeria-card').count()) >= 6,
        true,
        'cards da galeria disponíveis'
    );
    const foraDaTela = await galeria.evaluate((e) => {
        return e.scrollLeft;
    });
    await p.waitForTimeout(4100);
    assert.equal(
        await galeria.evaluate((e) => {
            return e.scrollLeft;
        }),
        foraDaTela,
        'não avança fora da tela'
    );
    await galeria.evaluate((e) => {
        const r = e.getBoundingClientRect();
        window.scrollBy(0, r.top - innerHeight + r.height * 0.4);
    });
    await p.waitForTimeout(1100);
    assert.equal(
        await galeria.evaluate((e) => {
            return e.scrollLeft;
        }),
        foraDaTela,
        '40% visível ainda não inicia'
    );
    await galeria.evaluate((e) => {
        const r = e.getBoundingClientRect();
        window.scrollBy(0, r.top - innerHeight + r.height * 0.6);
    });
    const inicio = await galeria.evaluate((e) => {
        return e.scrollLeft;
    });
    await p.waitForTimeout(1100);
    assert.ok(
        (await galeria.evaluate((e) => {
            return e.scrollLeft;
        })) > inicio,
        'avança automaticamente'
    );
    await p.evaluate(() => {
        return window.scrollTo(0, 0);
    });
    await p.waitForTimeout(100);
    const saiu = await galeria.evaluate((e) => {
        return e.scrollLeft;
    });
    await p.waitForTimeout(4100);
    assert.equal(
        await galeria.evaluate((e) => {
            return e.scrollLeft;
        }),
        saiu,
        'pausa ao sair da tela'
    );
    await galeria.scrollIntoViewIfNeeded();
    await p.waitForTimeout(1100);
    const retomou = await galeria.evaluate((e) => {
        return e.scrollLeft;
    });
    assert.ok(retomou > saiu, 'retoma imediatamente ao voltar');
    await p.waitForTimeout(1500);
    assert.equal(
        await galeria.evaluate((e) => {
            return e.scrollLeft;
        }),
        retomou,
        'não acumula avanços ao retornar'
    );
    const box = await galeria.boundingBox();
    await p.mouse.move(box.x + box.width / 2, box.y + 100);
    await p.waitForTimeout(1100);
    const antes = await galeria.evaluate((e) => {
        return e.scrollLeft;
    });
    await p.waitForTimeout(3100);
    assert.equal(
        await galeria.evaluate((e) => {
            return e.scrollLeft;
        }),
        antes,
        'mouse pausa o autoplay'
    );
    await p.mouse.down();
    await p.mouse.move(box.x + box.width / 2 - 180, box.y + 100, { steps: 12 });
    await p.mouse.up();
    assert.ok(
        (await galeria.evaluate((e) => {
            return e.scrollLeft;
        })) >
            antes + 100,
        'arraste move os cards'
    );
    assert.equal(await p.locator('#pausar-galeria, #galeria-ajuda').count(), 0);
    await galeria.focus();
    await p.mouse.move(0, 0);
    const pausado = await galeria.evaluate((e) => {
        return e.scrollLeft;
    });
    await p.waitForTimeout(4000);
    assert.equal(
        await galeria.evaluate((e) => {
            return e.scrollLeft;
        }),
        pausado
    );
    assert.equal(await p.locator('.galeria button').count(), 0);
    await galeria.focus();
    await p.keyboard.press('ArrowRight');
    await p.waitForTimeout(1100);
    assert.ok(
        (await galeria.evaluate((e) => {
            return e.scrollLeft;
        })) > pausado
    );
});

test('card central acompanha navegação e hover sem alterar a largura', async (t) => {
    const p = await abrir(t, 'index.html');
    await p.emulateMedia({ reducedMotion: 'reduce' });
    const g = p.locator('#galeria-fotos');
    await g.focus();

    for (const width of [390, 768, 1024, 1440]) {
        await p.setViewportSize({ width, height: 900 });

        for (let i = 0; i < 7; i++) {
            await p.keyboard.press('ArrowRight');
            await p.waitForTimeout(50);
            const central = await g.evaluate((e) => {
                const centro = e.getBoundingClientRect().left + e.clientWidth / 2;
                const cards = [...e.querySelectorAll('.galeria-card')];
                const distancias = cards.map((c) => {
                    return Math.abs(c.getBoundingClientRect().left + c.offsetWidth / 2 - centro);
                });
                const ativos = cards.filter((c) => {
                    return c.classList.contains('em-destaque');
                });
                return (
                    ativos.length === 1 &&
                    Math.abs(
                        ativos[0].getBoundingClientRect().left + ativos[0].offsetWidth / 2 - centro
                    ) <=
                        Math.min(...distancias) + 1
                );
            });
            assert.ok(central, 'um único card mais próximo do centro fica destacado');
        }
    }

    const card = g.locator('.em-destaque');
    const largura = await card.evaluate((e) => {
        return e.offsetWidth;
    });
    await card.hover();
    assert.equal(
        await card.evaluate((e) => {
            return e.offsetWidth;
        }),
        largura
    );
    assert.equal(
        await card.evaluate((e) => {
            return getComputedStyle(e).transform;
        }),
        'matrix(1, 0, 0, 1, 0, -4)'
    );
    assert.equal(
        await card.evaluate((e) => {
            return getComputedStyle(e).transitionDuration;
        }),
        '0s'
    );
});
test('CPF, e-mail e maioridade validados durante digitação e envio bloqueado', async (t) => {
    const p = await abrir(t, 'cadastro.html');
    assert.equal(await p.locator('#cpf').count(), 1, 'campo CPF disponível');

    for (const cpf of ['11111111111', '52998224724', '123']) {
        await p.fill('#cpf', cpf);
        assert.notEqual(await p.locator('#erro-cpf').textContent(), '');
    }

    await p.fill('#cpf', '52998224725');
    assert.equal(await p.locator('#erro-cpf').textContent(), '');
    await p.fill('#email', 'invalido');
    assert.notEqual(await p.locator('#erro-email').textContent(), '');
    await p.fill('#email', 'ana+adocao@example.com');
    assert.equal(await p.locator('#erro-email').textContent(), '');
    await p.clock.install({ time: new Date('2026-11-08T12:00:00') });
    await p.fill('#nascimento', '2008-11-09');
    assert.notEqual(await p.locator('#erro-nascimento').textContent(), '');
    await p.fill('#nascimento', '2008-11-08');
    assert.equal(await p.locator('#erro-nascimento').textContent(), '');
    await p.click('button[type=submit]');
    assert.equal(await p.locator('#sucesso').textContent(), '');
    await p.fill('#nome', 'Ana Silva');
    await p.check('#casa');
    await p.check('#termo');
    await p.click('button[type=submit]');
    assert.match(await p.locator('#sucesso').textContent(), /simulação/i);
});

test('galeria ocupa a tela e preserva posição no resize e no loop', async (t) => {
    const p = await abrir(t, 'index.html');
    await p.emulateMedia({ reducedMotion: 'reduce' });
    const g = p.locator('#galeria-fotos');
    await g.focus();
    await p.keyboard.press('ArrowRight');
    const posicao = () => {
        return g.evaluate((e) => {
            const cards = e.querySelectorAll('.galeria-card');
            const passo = cards[1].offsetLeft - cards[0].offsetLeft;
            return (e.scrollLeft / passo) % 6;
        });
    };

    for (const width of [390, 768, 1024, 1440]) {
        await p.setViewportSize({ width, height: 900 });
        await p.waitForTimeout(100);
        const box = await g.boundingBox();
        assert.equal(box.x, 0);
        assert.equal(box.width, width);
        assert.ok(Math.abs((await posicao()) - 1) < 0.03, 'mantém Mel no início');
        assert.equal(
            await p.evaluate(() => {
                return document.documentElement.scrollWidth > innerWidth;
            }),
            false
        );
    }

    for (let i = 0; i < 5; i++) await p.keyboard.press('ArrowRight');

    assert.ok(Math.min(await posicao(), 6 - (await posicao())) < 0.03, 'retorna a Thor');
    await p.keyboard.press('ArrowLeft');
    assert.ok(Math.abs((await posicao()) - 5) < 0.03, 'circula para Bolinha');
    await g.evaluate((e) => {
        return e.blur();
    });
    const antes = await g.evaluate((e) => {
        return e.scrollLeft;
    });
    await p.waitForTimeout(4100);
    assert.equal(
        await g.evaluate((e) => {
            return e.scrollLeft;
        }),
        antes,
        'movimento reduzido impede autoplay'
    );
});
