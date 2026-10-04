package co.edu.unisimon.unitrade.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "billetera")
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "saldo_disponible", nullable = false, precision = 12, scale = 2)
    private BigDecimal balance;

    @Column(name = "moneda", nullable = false, length = 3)
    private String currency;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime updatedAt;

    public Wallet() {}

    public Wallet(Long userId, BigDecimal balance) {
        this.userId = userId;
        this.balance = balance;
        this.currency = "COP";
        this.updatedAt = LocalDateTime.now();
    }

    public Wallet(Long userId, BigDecimal balance, String currency) {
        this.userId = userId;
        this.balance = balance;
        this.currency = currency;
        this.updatedAt = LocalDateTime.now();
    }

    @PrePersist
    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
}