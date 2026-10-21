package br.com.financeos.reports;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

import br.com.financeos.dashboard.DashboardRepository;
import br.com.financeos.profiles.Screen;
import br.com.financeos.reports.TransactionReportResponse.Period;
import br.com.financeos.shared.AccessControl;
import br.com.financeos.shared.Action;
import br.com.financeos.shared.CurrentUser;
import br.com.financeos.transactions.FinancialTransaction;
import io.quarkus.security.Authenticated;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.UriInfo;

// GET de propósito: gerar o relatório não grava nada, então não entra na cobrança do AuditCoverageTest.
@Path("/transaction-reports")
@Produces(MediaType.APPLICATION_JSON)
@Authenticated
public class TransactionReportResource {

    // Mesmo início do saldo acumulado do Resumo (issue #113).
    static final LocalDate CURRENT_BALANCE_START = LocalDate.of(2026, 10, 1);

    private final TransactionReportRepository repository;
    private final DashboardRepository dashboardRepository;
    private final CurrentUser currentUser;
    private final AccessControl accessControl;
    private final CurrentDate currentDate;

    public TransactionReportResource(TransactionReportRepository repository, DashboardRepository dashboardRepository,
            CurrentUser currentUser, AccessControl accessControl, CurrentDate currentDate) {
        this.repository = repository;
        this.dashboardRepository = dashboardRepository;
        this.currentUser = currentUser;
        this.accessControl = accessControl;
        this.currentDate = currentDate;
    }

    @GET
    public TransactionReportResponse generate(@Context UriInfo uriInfo) throws Exception {
        accessControl.require(Screen.TRANSACTION_REPORTS, Action.VIEW);
        LocalDate today = currentDate.today();
        TransactionReportCriteria criteria = TransactionReportCriteria.fromQuery(uriInfo, today);

        List<FinancialTransaction> transactions = repository.search(currentUser.id(), criteria);
        boolean grouped = !criteria.groupBy().isEmpty();

        return new TransactionReportResponse(
                new Period(criteria.period(), criteria.period().label(), criteria.startDate(), criteria.endDate()),
                today,
                currentBalance(today),
                TransactionReportBuilder.totals(transactions),
                transactions.size(),
                TransactionReportBuilder.groups(transactions, criteria.groupBy()),
                grouped ? List.of() : TransactionReportBuilder.rows(transactions));
    }

    // Saldo atual (D7): receitas menos despesas pagas de 01/10/2026 até hoje, inclusive, sem os filtros.
    private BigDecimal currentBalance(LocalDate today) throws Exception {
        if (today.isBefore(CURRENT_BALANCE_START)) {
            return BigDecimal.ZERO.setScale(2);
        }

        return dashboardRepository.balanceBetween(currentUser.id(), CURRENT_BALANCE_START, today)
                .setScale(2, RoundingMode.HALF_UP);
    }
}
