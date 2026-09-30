-- Excluir passou a apagar o lançamento (issue #104): os cancelados de antes saem, e o status Cancelado deixa de existir.
delete from transactions where status = 'CANCELED';

alter table transactions drop constraint transactions_status_check;
alter table transactions add constraint transactions_status_check
    check (status is null or status in ('PENDING', 'PAID'));
