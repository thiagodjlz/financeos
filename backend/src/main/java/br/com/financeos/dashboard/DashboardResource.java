package br.com.financeos.dashboard;

import java.time.LocalDate;
import java.time.YearMonth;

import br.com.financeos.dashboard.DashboardRepository.DashboardTotals;
import br.com.financeos.shared.DevUser;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

@Path("/dashboard")
@Produces(MediaType.APPLICATION_JSON)
public class DashboardResource {

    private final DashboardRepository repository;

    public DashboardResource(DashboardRepository repository) {
        this.repository = repository;
    }

    @GET
    @Path("/summary")
    public DashboardSummaryResponse summary(@QueryParam("year") Integer year, @QueryParam("month") Integer month)
            throws Exception {
        YearMonth period = resolvePeriod(year, month);
        LocalDate startDate = period.atDay(1);
        LocalDate endDate = period.atEndOfMonth();

        DashboardTotals totals = repository.totals(DevUser.ID, startDate, endDate);

        return new DashboardSummaryResponse(
                new PeriodResponse(period.getYear(), period.getMonthValue(), startDate, endDate),
                totals.totalIncome(),
                totals.totalExpense(),
                totals.totalIncome().subtract(totals.totalExpense()),
                totals.paidExpense(),
                totals.pendingExpense(),
                totals.transactionCount(),
                repository.categoryBreakdown(DevUser.ID, startDate, endDate),
                repository.monthlyEvolution(DevUser.ID, period.getYear()));
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
