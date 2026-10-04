package co.edu.unisimon.unitrade.backend.gateway;

import co.edu.unisimon.unitrade.backend.dto.PaymentRequestDTO;

public interface PaymentGateway {
    PaymentGatewayResult processPayment(PaymentRequestDTO request);

    record PaymentGatewayResult(boolean success, String transactionId, String message) {}
}
