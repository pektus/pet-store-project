package com.petstore.service.repository;

import com.petstore.domain.entity.AccountingLedger;
import com.petstore.domain.enums.LedgerTransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Repository
public interface AccountingLedgerRepository extends JpaRepository<AccountingLedger, Long>, JpaSpecificationExecutor<AccountingLedger> {

    List<AccountingLedger> findByOrderNumber(String orderNumber);

    List<AccountingLedger> findByCreatedAtBetweenOrderByCreatedAtAsc(Instant start, Instant end);

    @Query("SELECT COALESCE(SUM(al.amount), 0) FROM AccountingLedger al WHERE al.transactionType = :type AND al.createdAt >= :start AND al.createdAt <= :end")
    BigDecimal sumAmountByTransactionTypeAndDateRange(@Param("type") LedgerTransactionType type,
                                                      @Param("start") Instant start,
                                                      @Param("end") Instant end);

    long countByTransactionTypeAndCreatedAtBetween(LedgerTransactionType type, Instant start, Instant end);
}
