package co.edu.unisimon.unitrade.backend.dto;

import java.math.BigDecimal;

public class WithdrawalRequestDTO {

    private Long userId;
    private BigDecimal amount;
    private String bankAccountNumber;

    public WithdrawalRequestDTO() {
    }

    public WithdrawalRequestDTO(Long userId, BigDecimal amount, String bankAccountNumber) {
        this.userId = userId;
        this.amount = amount;
        this.bankAccountNumber = bankAccountNumber;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getBankAccountNumber() {
        return bankAccountNumber;
    }

    public void setBankAccountNumber(String bankAccountNumber) {
        this.bankAccountNumber = bankAccountNumber;
    }
}
