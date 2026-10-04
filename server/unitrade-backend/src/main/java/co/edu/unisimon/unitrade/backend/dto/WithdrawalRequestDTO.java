package co.edu.unisimon.unitrade.backend.dto;

import java.math.BigDecimal;

public class WithdrawalRequestDTO {
    private Long userId;
    private BigDecimal amount;
    private String financialEntity; // "Nequi", "Daviplata", "Banco"
    private String accountNumber;

    public WithdrawalRequestDTO() {}

    public WithdrawalRequestDTO(Long userId, BigDecimal amount, String financialEntity, String accountNumber) {
        this.userId = userId;
        this.amount = amount;
        this.financialEntity = financialEntity;
        this.accountNumber = accountNumber;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getFinancialEntity() { return financialEntity; }
    public void setFinancialEntity(String financialEntity) { this.financialEntity = financialEntity; }

    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }
}
