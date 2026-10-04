package co.edu.unisimon.unitrade.backend.gateway;

import co.edu.unisimon.unitrade.backend.dto.PaymentRequestDTO;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class MockPaymentGateway implements PaymentGateway {

    @Override
    public String processPayment(PaymentRequestDTO request) {
        return "GW-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}