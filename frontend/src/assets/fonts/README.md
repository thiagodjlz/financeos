# Inter (self-hosted)

Fonte usada pelo redesign da issue #35. Servida pelo proprio app — sem CDN, sem dependencia npm — para que o ambiente Docker local funcione offline.

## Arquivos

| Arquivo | Subset | Tamanho | `unicode-range` |
|---|---|---|---|
| `inter-latin.woff2` | latin | 48 KB | `U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD` |
| `inter-latin-ext.woff2` | latin-ext | 85 KB | `U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF` |

Sao **fontes variaveis**: cada arquivo cobre todos os pesos de 400 a 800 usados no design, por isso o `@font-face` declara `font-weight: 400 800` em vez de um arquivo por peso.

## Origem

Baixados de `fonts.gstatic.com` (Google Fonts, Inter v20) em 2026-07-27. Inter e distribuida sob a SIL Open Font License 1.1.

Para atualizar, pegue as URLs `.woff2` dos blocos `/* latin */` e `/* latin-ext */` de:

```bash
curl -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36" "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
```
