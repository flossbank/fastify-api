module.exports = {
  succeeded: {
    body: '{\n' +
    '  "id": "evt_1GwfuHGsrQh1OWJ9P6om8WlB",\n' +
    '  "object": "event",\n' +
    '  "api_version": "2019-10-08",\n' +
    '  "created": 1592794872,\n' +
    '  "data": {\n' +
    '    "object": {\n' +
    '      "id": "pi_1GwfuFGsrQh1OWJ9dSe39ZDw",\n' +
    '      "object": "payment_intent",\n' +
    '      "amount": 2000,\n' +
    '      "amount_capturable": 0,\n' +
    '      "amount_received": 2000,\n' +
    '      "application": null,\n' +
    '      "application_fee_amount": null,\n' +
    '      "canceled_at": null,\n' +
    '      "cancellation_reason": null,\n' +
    '      "capture_method": "automatic",\n' +
    '      "charges": {\n' +
    '        "object": "list",\n' +
    '        "data": [\n' +
    '          {\n' +
    '            "id": "ch_1GwfuFGsrQh1OWJ9nOMl3pNu",\n' +
    '            "object": "charge",\n' +
    '            "amount": 2000,\n' +
    '            "amount_refunded": 0,\n' +
    '            "application": null,\n' +
    '            "application_fee": null,\n' +
    '            "application_fee_amount": null,\n' +
    '            "balance_transaction": "txn_1GwfuGGsrQh1OWJ9Fqm2rceX",\n' +
    '            "billing_details": {\n' +
    '              "address": {\n' +
    '                "city": null,\n' +
    '                "country": null,\n' +
    '                "line1": null,\n' +
    '                "line2": null,\n' +
    '                "postal_code": null,\n' +
    '                "state": null\n' +
    '              },\n' +
    '              "email": null,\n' +
    '              "name": null,\n' +
    '              "phone": null\n' +
    '            },\n' +
    '            "calculated_statement_descriptor": "FLOSSBANK",\n' +
    '            "captured": true,\n' +
    '            "created": 1592794871,\n' +
    '            "currency": "usd",\n' +
    '            "customer": "cus_HUsI9NcGHli9mq",\n' +
    '            "description": "(created by Stripe CLI)",\n' +
    '            "destination": null,\n' +
    '            "dispute": null,\n' +
    '            "disputed": false,\n' +
    '            "failure_code": null,\n' +
    '            "failure_message": null,\n' +
    '            "fraud_details": {\n' +
    '            },\n' +
    '            "invoice": null,\n' +
    '            "livemode": false,\n' +
    '            "metadata": {\n' +
    '            },\n' +
    '            "on_behalf_of": null,\n' +
    '            "order": null,\n' +
    '            "outcome": {\n' +
    '              "network_status": "approved_by_network",\n' +
    '              "reason": null,\n' +
    '              "risk_level": "normal",\n' +
    '              "risk_score": 15,\n' +
    '              "seller_message": "Payment complete.",\n' +
    '              "type": "authorized"\n' +
    '            },\n' +
    '            "paid": true,\n' +
    '            "payment_intent": "pi_1GwfuFGsrQh1OWJ9dSe39ZDw",\n' +
    '            "payment_method": "pm_1GwfuFGsrQh1OWJ92OQ30l7S",\n' +
    '            "payment_method_details": {\n' +
    '              "card": {\n' +
    '                "brand": "visa",\n' +
    '                "checks": {\n' +
    '                  "address_line1_check": null,\n' +
    '                  "address_postal_code_check": null,\n' +
    '                  "cvc_check": null\n' +
    '                },\n' +
    '                "country": "US",\n' +
    '                "exp_month": 6,\n' +
    '                "exp_year": 2021,\n' +
    '                "fingerprint": "mOTiOd7LTSLH2jcN",\n' +
    '                "funding": "credit",\n' +
    '                "installments": null,\n' +
    '                "last4": "4242",\n' +
    '                "network": "visa",\n' +
    '                "three_d_secure": null,\n' +
    '                "wallet": null\n' +
    '              },\n' +
    '              "type": "card"\n' +
    '            },\n' +
    '            "receipt_email": null,\n' +
    '            "receipt_number": null,\n' +
    '            "receipt_url": "https://pay.stripe.com/receipts/acct_1FTbwxGsrQh1OWJ9/ch_1GwfuFGsrQh1OWJ9nOMl3pNu/rcpt_HVhIMY68fzRFC5TStbSI9HtANTyvtN2",\n' +
    '            "refunded": false,\n' +
    '            "refunds": {\n' +
    '              "object": "list",\n' +
    '              "data": [\n' +
    '\n' +
    '              ],\n' +
    '              "has_more": false,\n' +
    '              "total_count": 0,\n' +
    '              "url": "/v1/charges/ch_1GwfuFGsrQh1OWJ9nOMl3pNu/refunds"\n' +
    '            },\n' +
    '            "review": null,\n' +
    '            "shipping": {\n' +
    '              "address": {\n' +
    '                "city": "San Francisco",\n' +
    '                "country": "US",\n' +
    '                "line1": "510 Townsend St",\n' +
    '                "line2": null,\n' +
    '                "postal_code": "94103",\n' +
    '                "state": "CA"\n' +
    '              },\n' +
    '              "carrier": null,\n' +
    '              "name": "Jenny Rosen",\n' +
    '              "phone": null,\n' +
    '              "tracking_number": null\n' +
    '            },\n' +
    '            "source": null,\n' +
    '            "source_transfer": null,\n' +
    '            "statement_descriptor": null,\n' +
    '            "statement_descriptor_suffix": null,\n' +
    '            "status": "succeeded",\n' +
    '            "transfer_data": null,\n' +
    '            "transfer_group": null\n' +
    '          }\n' +
    '        ],\n' +
    '        "has_more": false,\n' +
    '        "total_count": 1,\n' +
    '        "url": "/v1/charges?payment_intent=pi_1GwfuFGsrQh1OWJ9dSe39ZDw"\n' +
    '      },\n' +
    '      "client_secret": "pi_1GwfuFGsrQh1OWJ9dSe39ZDw_secret_bbbh2N3YLBfD1hy9R1TmrD2Gf",\n' +
    '      "confirmation_method": "automatic",\n' +
    '      "created": 1592794871,\n' +
    '      "currency": "usd",\n' +
    '      "customer": "cus_HUsI9NcGHli9mq",\n' +
    '      "description": "(created by Stripe CLI)",\n' +
    '      "invoice": null,\n' +
    '      "last_payment_error": null,\n' +
    '      "livemode": false,\n' +
    '      "metadata": {\n' +
    '      },\n' +
    '      "next_action": null,\n' +
    '      "on_behalf_of": null,\n' +
    '      "payment_method": "pm_1GwfuFGsrQh1OWJ92OQ30l7S",\n' +
    '      "payment_method_options": {\n' +
    '        "card": {\n' +
    '          "installments": null,\n' +
    '          "network": null,\n' +
    '          "request_three_d_secure": "automatic"\n' +
    '        }\n' +
    '      },\n' +
    '      "payment_method_types": [\n' +
    '        "card"\n' +
    '      ],\n' +
    '      "receipt_email": null,\n' +
    '      "review": null,\n' +
    '      "setup_future_usage": null,\n' +
    '      "shipping": {\n' +
    '        "address": {\n' +
    '          "city": "San Francisco",\n' +
    '          "country": "US",\n' +
    '          "line1": "510 Townsend St",\n' +
    '          "line2": null,\n' +
    '          "postal_code": "94103",\n' +
    '          "state": "CA"\n' +
    '        },\n' +
    '        "carrier": null,\n' +
    '        "name": "Jenny Rosen",\n' +
    '        "phone": null,\n' +
    '        "tracking_number": null\n' +
    '      },\n' +
    '      "source": null,\n' +
    '      "statement_descriptor": null,\n' +
    '      "statement_descriptor_suffix": null,\n' +
    '      "status": "succeeded",\n' +
    '      "transfer_data": null,\n' +
    '      "transfer_group": null\n' +
    '    }\n' +
    '  },\n' +
    '  "livemode": false,\n' +
    '  "pending_webhooks": 3,\n' +
    '  "request": {\n' +
    '    "id": "req_2QgBuGK9IpySSu",\n' +
    '    "idempotency_key": null\n' +
    '  },\n' +
    '  "type": "payment_intent.succeeded"\n' +
    '}',
    signature: 't=1592794876,v1=b6dca06f7aaaa5d37547b551c0bbf76c7ff99943576c360d7946dbb5beca8972,v0=2d5a8eedbdd59502787d88d71ebd5e08d0fb9f5900aa9b5178c33e9d33c08245'
  },
  created: {
    body: '{\n' +
    '  "id": "evt_1GwgIwGsrQh1OWJ9Nx8kyPwq",\n' +
    '  "object": "event",\n' +
    '  "api_version": "2019-10-08",\n' +
    '  "created": 1592796401,\n' +
    '  "data": {\n' +
    '    "object": {\n' +
    '      "id": "pi_1GwgIvGsrQh1OWJ9VlJo4amm",\n' +
    '      "object": "payment_intent",\n' +
    '      "amount": 2000,\n' +
    '      "amount_capturable": 0,\n' +
    '      "amount_received": 0,\n' +
    '      "application": null,\n' +
    '      "application_fee_amount": null,\n' +
    '      "canceled_at": null,\n' +
    '      "cancellation_reason": null,\n' +
    '      "capture_method": "automatic",\n' +
    '      "charges": {\n' +
    '        "object": "list",\n' +
    '        "data": [\n' +
    '\n' +
    '        ],\n' +
    '        "has_more": false,\n' +
    '        "total_count": 0,\n' +
    '        "url": "/v1/charges?payment_intent=pi_1GwgIvGsrQh1OWJ9VlJo4amm"\n' +
    '      },\n' +
    '      "client_secret": "pi_1GwgIvGsrQh1OWJ9VlJo4amm_secret_qGCOAf34el4hdgc2PZP47c10n",\n' +
    '      "confirmation_method": "automatic",\n' +
    '      "created": 1592796401,\n' +
    '      "currency": "usd",\n' +
    '      "customer": "cus_HUsI9NcGHli9mq",\n' +
    '      "description": "(created by Stripe CLI)",\n' +
    '      "invoice": null,\n' +
    '      "last_payment_error": null,\n' +
    '      "livemode": false,\n' +
    '      "metadata": {\n' +
    '      },\n' +
    '      "next_action": null,\n' +
    '      "on_behalf_of": null,\n' +
    '      "payment_method": null,\n' +
    '      "payment_method_options": {\n' +
    '        "card": {\n' +
    '          "installments": null,\n' +
    '          "network": null,\n' +
    '          "request_three_d_secure": "automatic"\n' +
    '        }\n' +
    '      },\n' +
    '      "payment_method_types": [\n' +
    '        "card"\n' +
    '      ],\n' +
    '      "receipt_email": null,\n' +
    '      "review": null,\n' +
    '      "setup_future_usage": null,\n' +
    '      "shipping": {\n' +
    '        "address": {\n' +
    '          "city": "San Francisco",\n' +
    '          "country": "US",\n' +
    '          "line1": "510 Townsend St",\n' +
    '          "line2": null,\n' +
    '          "postal_code": "94103",\n' +
    '          "state": "CA"\n' +
    '        },\n' +
    '        "carrier": null,\n' +
    '        "name": "Jenny Rosen",\n' +
    '        "phone": null,\n' +
    '        "tracking_number": null\n' +
    '      },\n' +
    '      "source": null,\n' +
    '      "statement_descriptor": null,\n' +
    '      "statement_descriptor_suffix": null,\n' +
    '      "status": "requires_payment_method",\n' +
    '      "transfer_data": null,\n' +
    '      "transfer_group": null\n' +
    '    }\n' +
    '  },\n' +
    '  "livemode": false,\n' +
    '  "pending_webhooks": 2,\n' +
    '  "request": {\n' +
    '    "id": "req_PirIEHVOnKbwRi",\n' +
    '    "idempotency_key": null\n' +
    '  },\n' +
    '  "type": "payment_intent.created"\n' +
    '}',
    signature: 't=1592794876,v1=99068c087b7187dbd4a0c1c6e0400361ee5966cdfd70f956969e9c215e450b72,v0=20e0b918d1a7a1165a77f166a2f1acbc89d59104a2749161ad63e3d0cd1094a5'
  }
}
