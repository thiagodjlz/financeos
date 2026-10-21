package br.com.financeos.reports;

import java.time.LocalDate;

import jakarta.enterprise.context.ApplicationScoped;

// "Hoje" do relatório (período relativo e Saldo atual) num bean próprio, trocado no teste por
// QuarkusMock, como o CurrentMonth do Resumo.
@ApplicationScoped
public class CurrentDate {

    public LocalDate today() {
        return LocalDate.now();
    }
}
