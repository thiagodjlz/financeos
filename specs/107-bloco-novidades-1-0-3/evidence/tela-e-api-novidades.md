# Evidencia — tela e API de Novidades por versao (stack local)

Medido em 2026-09-30 ~15:55, imagens `financeos-backend`/`financeos-frontend` criadas 15:49-15:50 (depois da ultima edicao de codigo, 15:44).
Autenticacao: JWT assinado localmente com `backend/src/main/resources/privateKey.pem`, `iss=https://financeos.local/issuer`, `sub=00000000-0000-0000-0000-000000000001` (`dev@financeos.local`), validade 10 min. **So GET.**

## API real

`GET http://localhost:8080/api/release-notes` -> 200

- `currentVersion = "1.0.3"`; `versions` com 2 blocos.
- `versions[0] = {"categories":[],"version":"1.0.3"}` — lista vazia presente no JSON bruto.
- `versions[1].version = "1.0.2"`: NEW 4, IMPROVEMENT 15, FIX 4 (23 itens). Os 23 textos existem literalmente no `ReleaseNotesContent.java` da `origin/main` (f3ae7a7), com literais concatenados unidos: 0 ausentes.
- Bytes: 79 ocorrencias de `c3`, 0 de `c383c2` (sem mojibake).
- Sem token: 401.

`GET http://localhost:8080/api/documentation` -> 200: contem "Ainda não há mudanças publicadas nesta versão" (1x) e "Nenhuma novidade publicada ainda" (1x); a frase antiga "Enquanto nenhuma versão tiver novidades publicadas" nao aparece mais.

## Tela servida (`http://localhost/release-notes`, Chrome headless via CDP)

Sessao com o token no `localStorage` (`financeos_token`) e interceptacao `Fetch` que **falharia qualquer requisicao nao-GET** — nenhuma foi tentada. Respostas **nao** substituidas: dados reais. Requisicoes de API vistas: `GET /api/auth/me`, `GET /api/release-notes`.

Bundle servido: `chunk-DI2e8X9H.js` contem `.release-empty{margin:0;color:var(--text-muted);font-size:var(--fs-body);line-height:var(--lh-body)}` e o texto como `Ainda n\xE3o h\xE1 mudan\xE7as publicadas nesta vers\xE3o`; 0 ocorrencias de `Ã`/`Â`.

| Viewport | Bloco 1 (h3 / atual) | `.release-empty` no bloco 1 | Abaixo do cabecalho | Cor / fonte | Dentro do bloco, sem estouro (scrollWidth = clientWidth) | Bloco 2 (h3 / atual / grupos) | `.empty-state` | Doc sem rolagem horizontal |
|---|---|---|---|---|---|---|---|---|
| 1440 | Versão v1.0.3 / sim | "Ainda não há mudanças publicadas nesta versão." | sim | rgb(107, 103, 96) / 14px/21px | sim (1047 = 1047) | Versão v1.0.2 / nao / Novidades 4, Melhorias 15, Correções 4, sem `.release-empty` | ausente | 1425 = 1425 |
| 1280 | idem | idem | sim | idem | sim (887 = 887) | idem | ausente | 1265 = 1265 |
| 1024 | idem | idem | sim | idem | sim (631 = 631) | idem | ausente | 1009 = 1009 |
| 768 | idem | idem | sim | idem | sim (390 = 390) | idem | ausente | 768 = 768 |
| 390 | idem | idem | sim | idem | sim (320 = 320) | idem | ausente | 390 = 390 |
| 320 | idem | idem | sim | idem | sim (250 = 250) | idem | ausente | 320 = 320 |

`h3` conferido por bytes: `56657273c3a36f2076312e302e33` = "Versão v1.0.3". `--text-muted` = `#6b6760` = `rgb(107, 103, 96)`, a mesma cor computada de um `.empty-state`.
