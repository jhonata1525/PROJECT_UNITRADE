package co.edu.unisimon.unitrade.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transacciones_retiro")
public class WalletTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "billetera_id", nullable = false)
    private Long walletId;

    @Column(name = "usuario_id", nullable = false)
    private Long userId;

    @Column(name = "monto", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "tipo_entidad", nullable = false) // Nequi, Daviplata, Banco
    private String financialEntity;

    @Column(name = "numero_cuenta", nullable = false)
    private String accountNumber;

    @Column(name = "estado", nullable = false) // PROCESADO / TRANSFERIDO
    private String status;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime createdAt;

    public WalletTransaction() {}

    public WalletTransaction(Long walletId, Long userId, BigDecimal amount, String financialEntity, String accountNumber, String status) {
        this.walletId = walletId;
        this.userId = userId;
        this.amount = amount;
        this.financialEntity = financialEntity;
        this.accountNumber = accountNumber;
        this.status = status;
        this.createdAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getWalletId() { return walletId; }
    public Long getUserId() { return userId; }
    public BigDecimal getAmount() { return amount; }
    public String getFinancialEntity() { return financialEntity; }
    public String getAccountNumber() { return accountNumber; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}