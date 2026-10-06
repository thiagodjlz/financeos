package br.com.financeos.dashboard;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Year;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import br.com.financeos.dashboard.DashboardRepository.DashboardTotals;
import br.com.financeos.profiles.Screen;
import br.com.financeos.shared.AccessControl;
import br.com.financeos.shared.Action;
import br.com.financeos.shared.CurrentUser;
import br.com.financeos.transactions.TransactionType;
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
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private final DashboardRepository repository;
    private final CurrentUser currentUser;
    private final AccessControl accessControl;

    public DashboardResource(DashboardRepository repository, CurrentUser currentUser, AccessControl accessControl) {
        this.repository = repository;
        this.currentUser = currentUser;
        this.accessControl = accessControl;
    }

    // Os parâmetros são lidos do UriInfo, e não por @QueryParam Integer: a conversão falharia fora do
    // corpo do método em "?year=abc" e a resposta escaparia do BusinessExceptionMapper; e "?year="
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
                percent(totals.paidExpense(), totals.totalIncome()),
                totals.transactionCount(),
                withSharePercent(repository.categoryBreakdown(currentUser.id(), startDate, endDate)),
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

    private static List<CategoryBreakdownResponse> withSharePercent(List<CategoryBreakdownResponse> items) {
        Map<TransactionType, BigDecimal> totalsByType = items.stream()
                .collect(Collectors.groupingBy(CategoryBreakdownResponse::type,
                        Collectors.reducing(BigDecimal.ZERO, CategoryBreakdownResponse::totalAmount, BigDecimal::add)));

        return items.stream()
                .map(item -> item.withSharePercent(percent(item.totalAmount(), totalsByType.get(item.type()))))
                .toList();
    }

    // Uma casa com HALF_UP: o front só formata, e 29,25% tem de aparecer como 29,3% (HALF_EVEN daria 29,2%).
    private static BigDecimal percent(BigDecimal part, BigDecimal whole) {
        if (whole == null || whole.signum() == 0) {
            return null;
        }

        return part.multiply(HUNDRED).divide(whole, 1, RoundingMode.HALF_UP);
    }

    // A checagem do mês vem antes da do ano de propósito: ano fixo em teste/URL antiga com mês inválido
    // tem de continuar respondendo o erro de mês, mesmo quando aquele ano deixar de ser o corrente.
    private static YearMonth resolvePeriod(String year, String month) {
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

        return YearMonth.of(parsedYear, parsedMonth);
    }

    private static String queryParam(UriInfo uriInfo, String name) {
        List<String> values = uriInfo.getQueryParameters().get(name);

        if (values == null || values.isEmpty()) {
            return null;
        }

        return values.get(0) == null ? "" : values.get(0);
    }

    // A mensagem da NumberFormatException ("For input string: ...") não pode virar texto de tela:
    // o valor inválido vira null e quem responde é a mensagem em português do chamador.
    private static Integer parseNumber(String value) {
        try {
            return Integer.valueOf(value.trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
