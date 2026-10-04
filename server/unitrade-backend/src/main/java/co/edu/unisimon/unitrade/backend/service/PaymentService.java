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

    private static final BigDecimal COMMISSION_RATE = new BigDecimal("0.12"); // RN-08: 12% comisión

    private final PaymentTransactionRepository transactionRepository;
    private final PaymentGateway paymentGateway;

    public PaymentService(PaymentTransactionRepository transactionRepository, PaymentGateway paymentGateway) {
        this.transactionRepository = transactionRepository;
        this.paymentGateway = paymentGateway;
    }

    @Transactional
    public PaymentResponseDTO processPayment(PaymentRequestDTO request) {
        // 1. Cálculo de comisión (RN-08: 12% para la plataforma, 88% para vendedor)
        BigDecimal grossAmount = request.getAmount();
        BigDecimal platformFee = grossAmount.multiply(COMMISSION_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal netSellerAmount = grossAmount.subtract(platformFee);

        // 2. Procesar pago en la pasarela mediante el Gateway
        PaymentGateway.PaymentGatewayResult gatewayResult = paymentGateway.processPayment(request);

        // 3. Crear entidad y guardar la transacción en PostgreSQL
        String status = gatewayResult.success() ? "COMPLETED" : "FAILED";

        PaymentTransaction transaction = new PaymentTransaction(
                request.getOrderId(),
                request.getBuyerId(),
                request.getSellerId(),
                grossAmount,
                platformFee,
                netSellerAmount,
                request.getPaymentMethod(),
                status,
                gatewayResult.transactionId()
        );

        PaymentTransaction savedTransaction = transactionRepository.save(transaction);

        // 4. Retornar DTO de respuesta
        return new PaymentResponseDTO(
                savedTransaction.getId(),
                savedTransaction.getOrderId(),
                savedTransaction.getGrossAmount(),
                savedTransaction.getPlatformFee(),
                savedTransaction.getNetSellerAmount(),
                savedTransaction.getStatus(),
                savedTransaction.getGatewayTransactionId(),
                gatewayResult.message()
        );
    }
}
