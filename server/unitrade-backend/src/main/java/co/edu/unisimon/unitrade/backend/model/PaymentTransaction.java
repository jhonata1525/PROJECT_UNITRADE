package co.edu.unisimon.unitrade.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_transactions")
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "buyer_id", nullable = false)
    private Long buyerId;

    @Column(name = "seller_id", nullable = false)
    private Long sellerId;

    @Column(name = "gross_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal grossAmount;

    @Column(name = "platform_fee", nullable = false, precision = 12, scale = 2)
    private BigDecimal platformFee;

    @Column(name = "net_seller_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal netSellerAmount;

    @Column(name = "payment_method", nullable = false)
    private String paymentMethod;

    @Column(nullable = false)
    private String status;

    @Column(name = "gateway_transaction_id")
    private String gatewayTransactionId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public PaymentTransaction() {
    }

    public PaymentTransaction(Long orderId, Long buyerId, Long sellerId, BigDecimal grossAmount,
                              BigDecimal platformFee, BigDecimal netSellerAmount,
                              String paymentMethod, String status, String gatewayTransactionId) {
        this.orderId = orderId;
        this.buyerId = buyerId;
        this.sellerId = sellerId;
        this.grossAmount = grossAmount;
        this.platformFee = platformFee;
        this.netSellerAmount = netSellerAmount;
        this.paymentMethod = paymentMethod;
        this.status = status;
        this.gatewayTransactionId = gatewayTransactionId;
        this.createdAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // Getters y Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}