## Stripe Support Reply Template

Use this template when replying to Stripe's notification about full card numbers in API requests.

Subject: Re: Card data passed to Stripe API (Request Id: req_BYbrcMmiDUt6KD)

Hello Stripe Support,

Thank you for the notification.

We reviewed our integration and confirmed that PLANCK uses only Stripe-hosted flows:

- Stripe Checkout Sessions for subscription purchase
- Stripe Billing Portal for subscription management

Our backend does not collect or send raw card details (`number`, `exp_month`, `exp_year`, `cvc`) to Stripe API endpoints.

We also added an explicit server-side guard in our checkout route to reject any payload that contains raw card-related fields, to prevent regressions.

Given this, we suspect the flagged request may have come from a manual test or another environment using test credentials.

Could you please confirm whether this case can be considered resolved for our current integration?

Best regards,
PLANCK team

