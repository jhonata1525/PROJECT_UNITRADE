package co.edu.unisimon.unitrade.backend.controller;

import co.edu.unisimon.unitrade.backend.dto.WalletBalanceDTO;
import co.edu.unisimon.unitrade.backend.dto.WithdrawalRequestDTO;
import co.edu.unisimon.unitrade.backend.dto.WithdrawalResponseDTO;
import co.edu.unisimon.unitrade.backend.service.WalletService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wallet")
@CrossOrigin(origins = "*")
public class WalletController {

    private final WalletService walletService;

    public WalletController(WalletService walletService) {
        this.walletService = walletService;
    }

    @GetMapping("/balance/{userId}")
    public ResponseEntity<WalletBalanceDTO> getBalance(@PathVariable Long userId) {
        WalletBalanceDTO balance = walletService.getBalance(userId);
        return ResponseEntity.ok(balance);
    }

    @PostMapping("/withdraw")
    public ResponseEntity<?> withdraw(@RequestBody WithdrawalRequestDTO request) {
        try {
            WithdrawalResponseDTO response = walletService.withdraw(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}