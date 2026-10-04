package co.edu.unisimon.unitrade.backend.service;

import co.edu.unisimon.unitrade.backend.dto.WalletBalanceDTO;
import co.edu.unisimon.unitrade.backend.dto.WithdrawalRequestDTO;
import co.edu.unisimon.unitrade.backend.dto.WithdrawalResponseDTO;
import co.edu.unisimon.unitrade.backend.model.Wallet;
import co.edu.unisimon.unitrade.backend.model.WalletTransaction;
import co.edu.unisimon.unitrade.backend.repository.WalletRepository;
import co.edu.unisimon.unitrade.backend.repository.WalletTransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class WalletService {

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;

    public WalletService(WalletRepository walletRepository, WalletTransactionRepository walletTransactionRepository) {
        this.walletRepository = walletRepository;
        this.walletTransactionRepository = walletTransactionRepository;
    }

    @Transactional(readOnly = true)
    public WalletBalanceDTO getBalance(Long userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseGet(() -> new Wallet(userId, BigDecimal.ZERO, "COP"));
        return new WalletBalanceDTO(wallet.getUserId(), wallet.getBalance());
    }

    @Transactional
    public void creditSellerBalance(Long sellerId, BigDecimal amount, String description) {
        Wallet wallet = walletRepository.findByUserId(sellerId)
                .orElseGet(() -> walletRepository.save(new Wallet(sellerId, BigDecimal.ZERO, "COP")));

        wallet.setBalance(wallet.getBalance().add(amount));
        walletRepository.save(wallet);
    }

    @Transactional
    public WithdrawalResponseDTO withdraw(WithdrawalRequestDTO request) {
        Wallet wallet = walletRepository.findByUserId(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("La billetera del usuario no existe."));

        if (wallet.getBalance().compareTo(request.getAmount()) < 0) {
            throw new IllegalArgumentException("Saldo insuficiente para realizar el retiro.");
        }

        wallet.setBalance(wallet.getBalance().subtract(request.getAmount()));
        walletRepository.save(wallet);

        WalletTransaction transaction = new WalletTransaction(
                wallet.getId(),
                request.getUserId(),
                request.getAmount(),
                request.getFinancialEntity(),
                request.getAccountNumber(),
                "PROCESADO"
        );
        WalletTransaction savedTx = walletTransactionRepository.save(transaction);

        return new WithdrawalResponseDTO(
                savedTx.getId(),
                wallet.getUserId(),
                request.getAmount(),
                wallet.getBalance(),
                "PROCESADO",
                "Retiro a " + request.getFinancialEntity() + " (" + request.getAccountNumber() + ") procesado con éxito."
        );
    }
}