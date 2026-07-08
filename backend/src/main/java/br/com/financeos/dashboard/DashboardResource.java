package br.com.financeos.dashboard;

import java.time.LocalDate;
import java.time.YearMonth;

import br.com.financeos.dashboard.DashboardRepository.DashboardTotals;
import br.com.financeos.profiles.Screen;
import br.com.financeos.shared.AccessControl;
import br.com.financeos.shared.Action;
import br.com.financeos.shared.CurrentUser;
import io.quarkus.security.Authenticated;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

@Path("/dashboard")
@Produces(MediaType.APPLICATION_JSON)
@Authenticated
public class DashboardResource {

    private final DashboardRepository repository;
    private final CurrentUser currentUser;
    private final AccessControl accessControl;

    public DashboardResource(DashboardRepository repository, CurrentUser currentUser, AccessControl accessControl) {
        this.repository = repository;
        this.currentUser = currentUser;
        this.accessControl = accessControl;
    }

    @GET
    @Path("/summary")
    public DashboardSummaryResponse summary(@QueryParam("year") Integer year, @QueryParam("month") Integer month)
            throws Exception {
        accessControl.require(Screen.DASHBOARD, Action.VIEW);
        YearMonth period = resolvePeriod(year, month);
        LocalDate startDate = period.atDay(1);
        LocalDate endDate = period.atEndOfMonth();

        DashboardTotals totals = repository.totals(currentUser.id(), startDate, endDate);

        return new DashboardSummaryResponse(
                new PeriodResponse(period.getYear(), period.getMonthValue(), startDate, endDate),
                totals.totalIncome(),
                totals.totalExpense(),
                totals.totalIncome().subtract(totals.paidExpense()),
                totals.paidExpense(),
                totals.pendingExpense(),
                totals.transactionCount(),
                repository.categoryBreakdown(currentUser.id(), startDate, endDate),
                repository.monthlyEvolution(currentUser.id(), period.getYear()));
    }

    private static YearMonth resolvePeriod(Integer year, Integer month) {
        if (year == null && month == null) {
            return YearMonth.now();
        }

        if (year == null || month == null) {
            throw new BadRequestException("year and month must be provided together");
        }

        if (month < 1 || month > 12) {
            throw new BadRequestException("month must be between 1 and 12");
        }

        return YearMonth.of(year, month);
    }
}
