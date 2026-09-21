package br.com.financeos.dashboard;

import java.util.List;

public record AvailablePeriodResponse(
        int year,
        List<Integer> months) {
}
