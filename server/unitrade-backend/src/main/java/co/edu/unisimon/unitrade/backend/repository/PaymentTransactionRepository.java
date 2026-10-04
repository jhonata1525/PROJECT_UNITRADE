package co.edu.unisimon.unitrade.backend.repository;

import co.edu.unisimon.unitrade.backend.model.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    List<PaymentTransaction> findByBuyerId(Long buyerId);
    List<PaymentTransaction> findBySellerId(Long sellerId);
}