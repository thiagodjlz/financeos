# Leitura do print anexado na issue 48

Arquivo: `grafico-atual.png` (print do card "Evolucao anual" do Dashboard, estado atual em producao/local).

O que o print mostra:

- Card com titulo "Evolucao anual" e legenda no topo direito: **Receita** (verde), **Despesa** (vermelho), **Saldo** (azul, linha com marcadores).
- Eixo X com os 12 meses abreviados (Jan..Dez).
- Barras de Receita e Despesa lado a lado por mes.
- Linha azul de Saldo sobreposta as barras.

Problemas visiveis no print:

1. **Linha de Saldo errada (queixa principal da issue).** De Jan a Ago a linha fica na faixa baixa do grafico, colada na base; de Set a Dez ela salta para o topo do card e fica reta, **acima da maior barra do grafico**. Nos meses Set..Dez so existe barra de Receita (sem Despesa), entao o saldo deveria valer exatamente a altura da barra verde daquele mes — mas a linha esta desenhada muito acima dela. A escala/valor da serie de Saldo nao esta coerente com a escala das barras.
2. **Sem eixo Y, sem gridlines e sem nenhum valor numerico.** Nao ha como saber a que valores as barras e a linha se referem, nem a unidade (R$). A queixa "Adicione informacoes para deixar mais claro ao que se refere as informacoes" aponta para isso.
3. **Sem tooltip util ao passar o mouse.** A issue pede que, ao passar o mouse sobre as colunas, apareca o informativo real dos dados (Receita, Despesa e Saldo daquele mes, com valores formatados).
4. **Area do grafico mal aproveitada.** O plot ocupa so a metade direita do card; sobra uma grande faixa vazia a esquerda.
5. O titulo aparece como "Evolucao anual" (sem acento) no print.
