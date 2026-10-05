package com.petstore.service.service.impl;

import com.petstore.domain.entity.AccountingLedger;
import com.petstore.domain.entity.Order;
import com.petstore.domain.enums.LedgerTransactionType;
import com.petstore.service.repository.AccountingLedgerRepository;
import com.petstore.service.service.AccountingLedgerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AccountingLedgerServiceImpl implements AccountingLedgerService {

    private static final Logger log = LoggerFactory.getLogger(AccountingLedgerServiceImpl.class);

    private final AccountingLedgerRepository ledgerRepository;

    public AccountingLedgerServiceImpl(AccountingLedgerRepository ledgerRepository) {
        this.ledgerRepository = ledgerRepository;
    }

    @Override
    public AccountingLedger recordPayment(Order order) {
        AccountingLedger ledger = new AccountingLedger(
                LedgerTransactionType.PAYMENT,
                order,
                order.getOrderNumber(),
                order.getTotalAmount(),
                order.getPaymentMethod(),
                order.getCardBrand(),
                order.getCardLastFour(),
                order.getTransactionId(),
                "Checkout payment authorization"
        );
        AccountingLedger saved = ledgerRepository.save(ledger);
        log.info("Recorded PAYMENT ledger entry ID {} for order {}", saved.getId(), order.getOrderNumber());
        return saved;
    }

    @Override
    public AccountingLedger recordRefund(Order order, String reason) {
        String description = (reason != null && !reason.isBlank())
                ? "Order cancellation refund: " + reason.trim()
                : "Order cancellation refund";

        AccountingLedger ledger = new AccountingLedger(
                LedgerTransactionType.REFUND,
                order,
                order.getOrderNumber(),
                order.getTotalAmount(),
                order.getPaymentMethod(),
                order.getCardBrand(),
                order.getCardLastFour(),
                "REF-" + order.getTransactionId(),
                description
        );
        AccountingLedger saved = ledgerRepository.save(ledger);
        log.info("Recorded REFUND ledger entry ID {} for order {}", saved.getId(), order.getOrderNumber());
        return saved;
    }
}
