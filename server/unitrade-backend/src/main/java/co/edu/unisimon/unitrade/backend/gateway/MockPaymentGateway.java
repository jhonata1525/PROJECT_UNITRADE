package co.edu.unisimon.unitrade.backend.gateway;

import co.edu.unisimon.unitrade.backend.dto.PaymentRequestDTO;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class MockPaymentGateway implements PaymentGateway {

    @Override
    public PaymentGatewayResult processPayment(PaymentRequestDTO request) {
        // Simulación de procesamiento de pasarela de pago exitoso
        String mockGatewayId = "GW-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return new PaymentGatewayResult(true, mockGatewayId, "Transacción aprobada por la pasarela simulada");
    }
}
