package br.com.financeos.dashboard;

import java.time.YearMonth;

import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class CurrentMonth {

    public YearMonth current() {
        return YearMonth.now();
    }
}
