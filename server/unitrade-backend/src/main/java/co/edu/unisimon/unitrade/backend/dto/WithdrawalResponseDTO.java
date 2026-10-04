package co.edu.unisimon.unitrade.backend.dto;

import java.math.BigDecimal;

public class WithdrawalResponseDTO {

    private Long transactionId;
    private Long userId;
    private BigDecimal withdrawnAmount;
    private BigDecimal newBalance;
    private String status;
    private String message;

    public WithdrawalResponseDTO() {
    }

    public WithdrawalResponseDTO(Long transactionId, Long userId, BigDecimal withdrawnAmount, BigDecimal newBalance, String status, String message) {
        this.transactionId = transactionId;
        this.userId = userId;
        this.withdrawnAmount = withdrawnAmount;
        this.newBalance = newBalance;
        this.status = status;
        this.message = message;
    }

    public Long getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(Long transactionId) {
        this.transactionId = transactionId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public BigDecimal getWithdrawnAmount() {
        return withdrawnAmount;
    }

    public void setWithdrawnAmount(BigDecimal withdrawnAmount) {
        this.withdrawnAmount = withdrawnAmount;
    }

    public BigDecimal getNewBalance() {
        return newBalance;
    }

    public void setNewBalance(BigDecimal newBalance) {
        this.newBalance = newBalance;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}