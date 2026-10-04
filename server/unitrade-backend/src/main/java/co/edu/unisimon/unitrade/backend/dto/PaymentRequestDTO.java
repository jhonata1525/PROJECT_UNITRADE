package co.edu.unisimon.unitrade.backend.dto;

import java.math.BigDecimal;

public class PaymentRequestDTO {

    private Long orderId;
    private Long buyerId;
    private Long sellerId;
    private BigDecimal amount;
    private String paymentMethod;
    private String paymentToken;

    public PaymentRequestDTO() {
    }

    public PaymentRequestDTO(Long orderId, Long buyerId, Long sellerId, BigDecimal amount, String paymentMethod, String paymentToken) {
        this.orderId = orderId;
        this.buyerId = buyerId;
        this.sellerId = sellerId;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.paymentToken = paymentToken;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public Long getBuyerId() {
        return buyerId;
    }

    public void setBuyerId(Long buyerId) {
        this.buyerId = buyerId;
    }

    public Long getSellerId() {
        return sellerId;
    }

    public void setSellerId(Long sellerId) {
        this.sellerId = sellerId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getPaymentToken() {
        return paymentToken;
    }

    public void setPaymentToken(String paymentToken) {
        this.paymentToken = paymentToken;
    }
}