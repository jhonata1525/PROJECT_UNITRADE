package co.edu.unisimon.unitrade.backend.dto;

import java.math.BigDecimal;

public class WalletBalanceDTO {

    private Long userId;
    private BigDecimal balance;
    private String currency;

    public WalletBalanceDTO() {
    }

    public WalletBalanceDTO(Long userId, BigDecimal balance) {
        this.userId = userId;
        this.balance = balance;
        this.currency = "COP";
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public void setBalance(BigDecimal balance) {
        this.balance = balance;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }
}