package com.petstore.service.service.impl;

import com.petstore.domain.entity.AccountingLedger;
import com.petstore.domain.entity.Order;
import com.petstore.domain.enums.CardBrand;
import com.petstore.domain.enums.LedgerTransactionType;
import com.petstore.domain.enums.PaymentMethod;
import com.petstore.service.repository.AccountingLedgerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountingLedgerServiceImplTest {

    @Mock
    private AccountingLedgerRepository ledgerRepository;

    @InjectMocks
    private AccountingLedgerServiceImpl ledgerService;

    private Order testOrder;

    @BeforeEach
    void setUp() {
        testOrder = new Order();
        testOrder.setId(10L);
        testOrder.setOrderNumber("ORD-20261005-999");
        testOrder.setTotalAmount(new BigDecimal("249.99"));
        testOrder.setPaymentMethod(PaymentMethod.CREDIT_CARD);
        testOrder.setCardBrand(CardBrand.VISA);
        testOrder.setCardLastFour("4242");
        testOrder.setTransactionId("TXN-EMUL-1001");
    }

    @Test
    void recordPayment_createsAndSavesPaymentLedgerEntry() {
        when(ledgerRepository.save(any(AccountingLedger.class))).thenAnswer(i -> i.getArgument(0));

        AccountingLedger result = ledgerService.recordPayment(testOrder);

        ArgumentCaptor<AccountingLedger> captor = ArgumentCaptor.forClass(AccountingLedger.class);
        verify(ledgerRepository).save(captor.capture());
        AccountingLedger captured = captor.getValue();

        assertThat(captured.getTransactionType()).isEqualTo(LedgerTransactionType.PAYMENT);
        assertThat(captured.getOrderNumber()).isEqualTo("ORD-20261005-999");
        assertThat(captured.getAmount()).isEqualByComparingTo("249.99");
        assertThat(captured.getExternalReference()).isEqualTo("TXN-EMUL-1001");
        assertThat(captured.getCardBrand()).isEqualTo(CardBrand.VISA);
        assertThat(captured.getCardLastFour()).isEqualTo("4242");
    }

    @Test
    void recordRefund_createsAndSavesRefundLedgerEntry() {
        when(ledgerRepository.save(any(AccountingLedger.class))).thenAnswer(i -> i.getArgument(0));

        AccountingLedger result = ledgerService.recordRefund(testOrder, "Customer cancelled item");

        ArgumentCaptor<AccountingLedger> captor = ArgumentCaptor.forClass(AccountingLedger.class);
        verify(ledgerRepository).save(captor.capture());
        AccountingLedger captured = captor.getValue();

        assertThat(captured.getTransactionType()).isEqualTo(LedgerTransactionType.REFUND);
        assertThat(captured.getOrderNumber()).isEqualTo("ORD-20261005-999");
        assertThat(captured.getAmount()).isEqualByComparingTo("249.99");
        assertThat(captured.getExternalReference()).isEqualTo("REF-TXN-EMUL-1001");
        assertThat(captured.getDescription()).contains("Customer cancelled item");
    }
}
