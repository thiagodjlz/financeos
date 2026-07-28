-- Acentua os nomes das categorias semeadas pela V2 (dado exibido na tela).
-- Cada UPDATE e ancorado na linha semeada (nome + tipo + catalogo global) para nao tocar em
-- categoria criada pelo usuario, e a guarda not exists evita deixar duas linhas com o mesmo
-- nome+tipo numa base onde o usuario ja tenha criado a versao acentuada a mao.

update categories
set name = 'Salário'
where name = 'Salario'
  and type = 'INCOME'
  and user_id is null
  and parent_id is null
  and not exists (
    select 1 from categories c2
    where c2.name = 'Salário' and c2.type = 'INCOME' and c2.user_id is null and c2.parent_id is null
  );

update categories
set name = 'Cartão'
where name = 'Cartao'
  and type = 'EXPENSE'
  and user_id is null
  and parent_id is null
  and not exists (
    select 1 from categories c2
    where c2.name = 'Cartão' and c2.type = 'EXPENSE' and c2.user_id is null and c2.parent_id is null
  );

update categories
set name = 'Bebê'
where name = 'Bebe'
  and type = 'EXPENSE'
  and user_id is null
  and parent_id is null
  and not exists (
    select 1 from categories c2
    where c2.name = 'Bebê' and c2.type = 'EXPENSE' and c2.user_id is null and c2.parent_id is null
  );

update categories
set name = 'Empréstimo'
where name = 'Emprestimo'
  and type = 'EXPENSE'
  and user_id is null
  and parent_id is null
  and not exists (
    select 1 from categories c2
    where c2.name = 'Empréstimo' and c2.type = 'EXPENSE' and c2.user_id is null and c2.parent_id is null
  );
