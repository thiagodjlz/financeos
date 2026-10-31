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
    private static final YearMonth ACCUMULATION_START = YearMonth.of(2026, 10);

    private final DashboardRepository repository;
    private final CurrentUser currentUser;
    private final AccessControl accessControl;
    private final CurrentMonth currentMonth;

    public DashboardResource(DashboardRepository repository, CurrentUser currentUser, AccessControl accessControl,
            CurrentMonth currentMonth) {
        this.repository = repository;
        this.currentUser = currentUser;
        this.accessControl = accessControl;
        this.currentMonth = currentMonth;
    }

    // Os parâmetros são lidos do UriInfo, e não por @QueryParam Integer: a conversão falharia fora do
    // corpo do método em "?year=abc" e a resposta escaparia do BusinessExceptionMapper; e "?year="
    // (vazio) precisa ser distinguido de "year ausente", que tem outra mensagem.
    @GET
    @Path("/summary")
    public DashboardSummaryResponse summary(@Context UriInfo uriInfo) throws Exception {
        accessControl.require(Screen.DASHBOARD, Action.VIEW);
        YearMonth current = currentMonth.current();
        YearMonth period = resolvePeriod(queryParam(uriInfo, "year"), queryParam(uriInfo, "month"), current);
        LocalDate startDate = period.atDay(1);
        LocalDate endDate = period.atEndOfMonth();

        DashboardTotals totals = repository.totals(currentUser.id(), startDate, endDate);
        List<MonthlySummaryResponse> evolution = withPreviousBalance(
                repository.monthlyEvolution(currentUser.id(), period.getYear()), period.getYear(), current);
        MonthlySummaryResponse month = evolution.get(period.getMonthValue() - 1);

        return new DashboardSummaryResponse(
                new PeriodResponse(period.getYear(), period.getMonthValue(), startDate, endDate),
                totals.totalIncome(),
                totals.totalExpense(),
                month.balance(),
                month.previousBalance(),
                totals.paidExpense(),
                totals.pendingExpense(),
                percent(totals.paidExpense(), totals.totalIncome()),
                totals.transactionCount(),
                withSharePercent(repository.categoryBreakdown(currentUser.id(), startDate, endDate)),
                evolution);
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

    // O saldo anterior soma o resultado cru (receitas menos despesas pagas) de cada mês desde ACCUMULATION_START
    // até o mês corrente, inclusive. Somar o balance de cada mês, que já traz o anterior, contaria a mesma sobra
    // duas vezes (issue #117). Mês futuro não carrega os meses entre o corrente e ele (PA-7 da issue #113).
    private List<MonthlySummaryResponse> withPreviousBalance(List<MonthlySummaryResponse> months, int year,
            YearMonth current) throws Exception {
        YearMonth lastBeforeYear = YearMonth.of(year - 1, 12);
        YearMonth carriedUntil = lastBeforeYear.isBefore(current) ? lastBeforeYear : current;
        BigDecimal previous = carriedUntil.isBefore(ACCUMULATION_START)
                ? BigDecimal.ZERO
                : repository.balanceBetween(currentUser.id(), ACCUMULATION_START.atDay(1), carriedUntil.atEndOfMonth());

        List<MonthlySummaryResponse> result = new ArrayList<>(months.size());
        for (MonthlySummaryResponse month : months) {
            YearMonth yearMonth = YearMonth.of(month.year(), month.month());
            result.add(month.withPreviousBalance(previous));
            if (!yearMonth.isBefore(ACCUMULATION_START) && !yearMonth.isAfter(current)) {
                previous = previous.add(month.monthResult());
            }
        }

        return List.copyOf(result);
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
    private static YearMonth resolvePeriod(String year, String month, YearMonth current) {
        if (year == null && month == null) {
            return current;
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
