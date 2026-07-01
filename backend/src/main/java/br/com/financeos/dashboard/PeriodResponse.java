package br.com.financeos.dashboard;

import java.time.LocalDate;

public record PeriodResponse(
        int year,
        int month,
        LocalDate startDate,
        LocalDate endDate) {
}
