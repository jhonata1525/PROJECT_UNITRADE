package co.edu.unisimon.unitrade.backend.service;

import co.edu.unisimon.unitrade.backend.dto.PaymentRequestDTO;
import co.edu.unisimon.unitrade.backend.dto.PaymentResponseDTO;
import co.edu.unisimon.unitrade.backend.gateway.PaymentGateway;
import co.edu.unisimon.unitrade.backend.model.PaymentTransaction;
import co.edu.unisimon.unitrade.backend.repository.PaymentTransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class PaymentService {

    private final PaymentTransactionRepository paymentRepository;
    private final PaymentGateway paymentGateway;
    private final WalletService walletService;

    private static final BigDecimal COMMISSION_RATE = new BigDecimal("0.12");

    public PaymentService(PaymentTransactionRepository paymentRepository,
                          PaymentGateway paymentGateway,
                          WalletService walletService) {
        this.paymentRepository = paymentRepository;
        this.paymentGateway = paymentGateway;
        this.walletService = walletService;
    }

    @Transactional
    public PaymentResponseDTO processPayment(PaymentRequestDTO request) {
        // 1. Regla RN-08: Calcular comisión (12%) y monto neto del vendedor (88%)
        BigDecimal grossAmount = request.getAmount();
        BigDecimal platformFee = grossAmount.multiply(COMMISSION_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal netSellerAmount = grossAmount.subtract(platformFee);

        // 2. Procesar cobro mediante la pasarela de pagos
        String gatewayTxId = paymentGateway.processPayment(request);

        // 3. Persistir la transacción del pago en PostgreSQL
        PaymentTransaction transaction = new PaymentTransaction(
                request.getOrderId(),
                request.getBuyerId(),
                request.getSellerId(),
                grossAmount,
                platformFee,
                netSellerAmount,
                request.getPaymentMethod(),
                "COMPLETED",
                gatewayTxId
        );

        PaymentTransaction savedTx = paymentRepository.save(transaction);

        // 4. Integración HU-10: Acreditar automáticamente el 88% neto a la Billetera del vendedor
        walletService.creditSellerBalance(
                request.getSellerId(),
                netSellerAmount,
                "Abono por venta en orden #" + request.getOrderId()
        );

        // 5. Devolver DTO de respuesta
        return new PaymentResponseDTO(
                savedTx.getId(),
                savedTx.getOrderId(),
                savedTx.getGrossAmount(),
                savedTx.getPlatformFee(),
                savedTx.getNetSellerAmount(),
                savedTx.getStatus(),
                savedTx.getGatewayTransactionId(),
                "Pago procesado exitosamente y acreditado a la billetera virtual."
        );
    }
}