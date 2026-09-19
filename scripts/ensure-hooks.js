#!/usr/bin/env node
// Garante que os hooks versionados (.githooks) estao ativos neste clone.
// Roda sozinho no `npm install` do frontend (script "prepare") e nunca falha:
// fora de um clone git (build Docker, tarball) simplesmente nao faz nada.
const { execFileSync } = require('node:child_process');
const { existsSync, chmodSync } = require('node:fs');
const { join } = require('node:path');

const git = (...args) =>
    execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

try {
    const raiz = git('rev-parse', '--show-toplevel');
    const hook = join(raiz, '.githooks', 'pre-commit');
    if (!existsSync(hook)) {
        process.exit(0);
    }

    if (process.platform !== 'win32') {
        try {
            chmodSync(hook, 0o755);
        } catch {
            // sem permissao para ajustar o modo: o git ja versiona o bit de execucao
        }
    }

    let atual = '';
    try {
        atual = git('config', '--get', 'core.hooksPath');
    } catch {
        // config ausente: e exatamente o caso que este script existe para resolver
    }

    if (atual !== '.githooks') {
        git('config', 'core.hooksPath', '.githooks');
        console.log('Hooks do FinanceOS ativados (core.hooksPath = .githooks).');
        console.log('A build passa a ser incrementada automaticamente em commits de branch de versao.');
    }
}
catch {
    process.exit(0);
}
