insert into categories (name, type, color, icon)
values
    ('Salario', 'INCOME', '#16A34A', 'wallet'),
    ('Extras', 'INCOME', '#0EA5E9', 'plus-circle'),
    ('Cartao', 'EXPENSE', '#DC2626', 'credit-card'),
    ('Casa', 'EXPENSE', '#7C3AED', 'home'),
    ('Carro', 'EXPENSE', '#EA580C', 'car'),
    ('Bebe', 'EXPENSE', '#DB2777', 'baby'),
    ('Mercado', 'EXPENSE', '#65A30D', 'shopping-cart'),
    ('Internet', 'EXPENSE', '#2563EB', 'wifi'),
    ('Celular', 'EXPENSE', '#0891B2', 'smartphone'),
    ('Emprestimo', 'EXPENSE', '#9333EA', 'landmark'),
    ('Investimentos', 'EXPENSE', '#475569', 'trending-up')
on conflict do nothing;
