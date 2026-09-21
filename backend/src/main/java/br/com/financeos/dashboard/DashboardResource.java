package br.com.financeos.dashboard;

import java.time.LocalDate;
import java.time.Year;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

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
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.UriInfo;

@Path("/dashboard")
@Produces(MediaType.APPLICATION_JSON)
@Authenticated
public class DashboardResource {

    private static final int MIN_YEAR = 1000;
    private static final int MAX_YEAR = 9999;

    private final DashboardRepository repository;
    private final CurrentUser currentUser;
    private final AccessControl accessControl;

    public DashboardResource(DashboardRepository repository, CurrentUser currentUser, AccessControl accessControl) {
        this.repository = repository;
        this.currentUser = currentUser;
        this.accessControl = accessControl;
    }

    // Os parametros sao lidos do UriInfo, e nao por @QueryParam Integer: a conversao falharia fora do
    // corpo do metodo em "?year=abc" e a resposta escaparia do BusinessExceptionMapper; e "?year="
    // (vazio) precisa ser distinguido de "year ausente", que tem outra mensagem.
    @GET
    @Path("/summary")
    public DashboardSummaryResponse summary(@Context UriInfo uriInfo) throws Exception {
        accessControl.require(Screen.DASHBOARD, Action.VIEW);
        YearMonth period = resolvePeriod(queryParam(uriInfo, "year"), queryParam(uriInfo, "month"));
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

    @GET
    @Path("/periods")
    public List<AvailablePeriodResponse> periods() throws Exception {
        accessControl.require(Screen.DASHBOARD, Action.VIEW);

        List<AvailablePeriodResponse> periods = new ArrayList<>(repository.availablePeriods(currentUser.id()));
        int currentYear = Year.now().getValue();

        if (periods.stream().noneMatch(period -> period.year() == currentYear)) {
            int position = 0;
            while (position < periods.size() && periods.get(position).year() > currentYear) {
                position++;
            }
            periods.add(position, new AvailablePeriodResponse(currentYear, List.of()));
        }

        return List.copyOf(periods);
    }

    // A checagem do mes vem antes da do ano de proposito: ano fixo em teste/URL antiga com mes invalido
    // tem de continuar respondendo o erro de mes, mesmo quando aquele ano deixar de ser o corrente.
    private YearMonth resolvePeriod(String year, String month) throws Exception {
        if (year == null && month == null) {
            return YearMonth.now();
        }

        if (year == null || month == null) {
            throw new BadRequestException("Informe o ano e o mês juntos.");
        }

        Integer parsedMonth = parseNumber(month);
        if (parsedMonth == null || parsedMonth < 1 || parsedMonth > 12) {
            throw new BadRequestException("O mês deve estar entre 1 e 12.");
        }

        Integer parsedYear = parseNumber(year);
        if (parsedYear == null || parsedYear < MIN_YEAR || parsedYear > MAX_YEAR) {
            throw new BadRequestException("O ano informado é inválido.");
        }

        if (parsedYear != Year.now().getValue()
                && !repository.hasTransactionsInYear(currentUser.id(), parsedYear)) {
            throw new BadRequestException("Não há lançamentos no ano informado.");
        }

        return YearMonth.of(parsedYear, parsedMonth);
    }

    private static String queryParam(UriInfo uriInfo, String name) {
        List<String> values = uriInfo.getQueryParameters().get(name);

        if (values == null || values.isEmpty()) {
            return null;
        }

        return values.get(0) == null ? "" : values.get(0);
    }

    // A mensagem da NumberFormatException ("For input string: ...") nao pode virar texto de tela:
    // o valor invalido vira null e quem responde e a mensagem em portugues do chamador.
    private static Integer parseNumber(String value) {
        try {
            return Integer.valueOf(value.trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
