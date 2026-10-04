package co.edu.unisimon.unitrade.backend.gateway;

import co.edu.unisimon.unitrade.backend.dto.PaymentRequestDTO;

public interface PaymentGateway {
    String processPayment(PaymentRequestDTO request);
}