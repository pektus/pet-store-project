package com.petstore.service.service;

import com.petstore.domain.entity.AccountingLedger;
import com.petstore.domain.entity.Order;

public interface AccountingLedgerService {

    AccountingLedger recordPayment(Order order);

    AccountingLedger recordRefund(Order order, String reason);
}
