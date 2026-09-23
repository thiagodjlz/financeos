# CA11 — Sobreposicao do botao "Voltar ao topo" por tela

Medido em 2026-09-22 no build servido em `http://localhost` (Chrome 153 headless via CDP). As respostas de `/api/*` foram substituidas **so dentro da sessao do navegador** por dados sinteticos volumosos (60 lancamentos, 30 categorias, 25 usuarios, 8 perfis — 30 na passada "massa maior" —, Central com 5 areas e Novidades com 3 versoes); nada chegou ao backend, nenhuma chamada nao-GET ocorreu. Viewports: 1440x900 (desktop, `hover: hover`) e 390x844 (mobile, toque, `hover: none`).

Metodo: pagina rolada ate o fim (`scrollHeight - innerHeight`), 500 ms de espera, `getBoundingClientRect` do botao contra todo `button, a[href], input, select, textarea, [role=button], [tabindex]>=0, summary, label` visivel. "Durante a rolagem" = varredura de 301 px ate o fim em passos de 60 px (contagem = em quantas posicoes o controle ficou sob o botao). Retangulo = `left,top,right,bottom` em px do viewport.

| Tela | Largura | Rolagem max. (px) | Botao visivel no fim | Retangulo do botao | Coberto no fim | Folga < 8 px no fim | Coberto durante a rolagem |
|---|---|---|---|---|---|---|---|
| Resumo | 1440 | 384 | sim | 1361,836,1401,876 | nenhum | — | nenhum |
| Lançamentos | 1440 | 3618 | sim | 1361,836,1401,876 | nenhum | — | Editar (53x), Cancelar (53x) de 55 posicoes |
| Categorias | 1440 | 1163 | sim | 1361,836,1401,876 | nenhum | — | nenhum |
| Usuários | 1440 | 873 | sim | 1361,836,1401,876 | nenhum | — | Desativar (14x) |
| Perfis | 1440 | 1000 (massa maior) | sim | 1361,836,1401,876 | nenhum | Excluir [1295,798,1362,830] — 6 px acima, 1 px de sobreposicao horizontal | Excluir (15x, 1 px de largura) |
| Documentação | 1440 | 1279 (massa maior) | sim | 1361,836,1401,876 | nenhum | — | nenhum |
| Novidades por versão | 1440 | 250 (900 de altura) / 670 (480 de altura) | nao a 900 (rolagem <= 300); sim a 480 | 1361,416,1401,456 (a 480) | nenhum | — | nenhum |
| Resumo | 390 | 1279 | sim | 330,784,374,828 | nenhum | — | grafico "Evolução anual" (focavel, 1x) |
| Lançamentos | 390 | 22854 | sim | 330,784,374,828 | nenhum | — | nenhum |
| Categorias | 390 | 8042 | sim | 330,784,374,828 | nenhum | — | nenhum |
| Usuários | 390 | 8027 | sim | 330,784,374,828 | nenhum | — | nenhum |
| Perfis | 390 | 2518 | sim | 330,784,374,828 | nenhum | — | chaves de permissao (Alterar/Excluir em Categorias, Usuários, Perfis; Ver Documentação; Ver Novidades) e Salvar/Cancelar do formulario |
| Documentação | 390 | 606 (3922 com massa maior) | sim | 330,784,374,828 | nenhum | — | nenhum |
| Novidades por versão | 390 | 394 | sim | 330,784,374,828 | nenhum | — | nenhum |

Na primeira passada, Perfis e Documentação a 1440 nao rolavam (rolagem 0 — botao nunca aparece); foram remedidas com massa maior (30 perfis; areas da Central 3x mais longas).

## Sobreposicao durante a rolagem (amostras)

| Tela | Largura | scrollY | Controle coberto | Retangulo do controle | Area coberta |
|---|---|---|---|---|---|
| Lançamentos | 1440 | 700 | "Editar" / "Cancelar" da linha no pe da janela | 1311,809,1372,841 / 1380,809,1458,841 | 11x5 / 21x5 |
| Lançamentos | 1440 | 1500 | idem | 1311,814,1372,846 / 1380,814,1458,846 | 11x10 / 21x10 |
| Lançamentos | 1440 | 2600 | idem | 1311,846,1372,878 / 1380,846,1458,878 | 11x30 / 21x30 |
| Usuários | 1440 | 700 | "Desativar" | 1340,831,1424,863 | 40x27 (o botao inteiro na largura) |
| Perfis | 1440 | 400 | "Excluir" | 1295,828,1362,860 | 1x24 |
| Perfis | 390 | 900 | chaves "Alterar em Perfis" / "Excluir em Perfis" | 296,761,340,805 / 296,817,340,861 | 10x21 / 10x11 |
| Perfis | 390 | 1500 | "Salvar" do formulario | 35,826,355,870 | 25x2 |
| Resumo | 390 | 301 | grafico "Evolução anual" (svg focavel) | 35,592,355,832 | 25x44 |

Conclusao: **nenhum conflito com a pagina rolada ate o fim**, nas 7 telas, a 1440 e 390 px. Ha sobreposicao **transitoria** enquanto a pagina esta rolada no meio: o controle que passa pelo canto inferior direito da janela fica sob o botao ate rolar mais um pouco. Nao foi corrigido (decisao do usuario, spec "Fora de escopo").
