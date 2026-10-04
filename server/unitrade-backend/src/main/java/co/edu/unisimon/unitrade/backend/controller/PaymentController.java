package co.edu.unisimon.unitrade.backend.controller;

import co.edu.unisimon.unitrade.backend.dto.PaymentRequestDTO;
import co.edu.unisimon.unitrade.backend.dto.PaymentResponseDTO;
import co.edu.unisimon.unitrade.backend.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/checkout")
    public ResponseEntity<PaymentResponseDTO> checkout(@RequestBody PaymentRequestDTO request) {
        PaymentResponseDTO response = paymentService.processPayment(request);
        return ResponseEntity.ok(response);
    }
}
