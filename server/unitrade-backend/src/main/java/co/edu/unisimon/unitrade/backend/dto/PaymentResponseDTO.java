package co.edu.unisimon.unitrade.backend.dto;

import java.math.BigDecimal;

public class PaymentResponseDTO {

    private Long transactionId;
    private Long orderId;
    private BigDecimal grossAmount;
    private BigDecimal platformFee;
    private BigDecimal netSellerAmount;
    private String status;
    private String gatewayTransactionId;
    private String message;

    public PaymentResponseDTO() {
    }

    public PaymentResponseDTO(Long transactionId, Long orderId, BigDecimal grossAmount, BigDecimal platformFee, BigDecimal netSellerAmount, String status, String gatewayTransactionId, String message) {
        this.transactionId = transactionId;
        this.orderId = orderId;
        this.grossAmount = grossAmount;
        this.platformFee = platformFee;
        this.netSellerAmount = netSellerAmount;
        this.status = status;
        this.gatewayTransactionId = gatewayTransactionId;
        this.message = message;
    }

    public Long getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(Long transactionId) {
        this.transactionId = transactionId;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public BigDecimal getGrossAmount() {
        return grossAmount;
    }

    public void setGrossAmount(BigDecimal grossAmount) {
        this.grossAmount = grossAmount;
    }

    public BigDecimal getPlatformFee() {
        return platformFee;
    }

    public void setPlatformFee(BigDecimal platformFee) {
        this.platformFee = platformFee;
    }

    public BigDecimal getNetSellerAmount() {
        return netSellerAmount;
    }

    public void setNetSellerAmount(BigDecimal netSellerAmount) {
        this.netSellerAmount = netSellerAmount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getGatewayTransactionId() {
        return gatewayTransactionId;
    }

    public void setGatewayTransactionId(String gatewayTransactionId) {
        this.gatewayTransactionId = gatewayTransactionId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
