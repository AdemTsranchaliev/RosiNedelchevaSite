# Stripe Checkout setup

Hosted Checkout is already wired. The session is created in [backend/Services/StripeService.cs](backend/Services/StripeService.cs). There is no Stripe SDK in this project, so `ui_mode` is `hosted_page`. If Stripe rejects that value, the HTTP API expects `hosted` instead.

`payment_method_collection` is not sent. It applies only when `mode` is `subscription`, and this product is a one-time payment.

## Values to Replace

`mode`, `success_url`, `cancel_url`, and `line_items` are not placeholders. They already follow the real order. Do not replace them with a sample Price ID.

**Files containing these values:**

- [backend/Services/StripeService.cs](backend/Services/StripeService.cs)

| Field | Current value | What to set |
| --- | --- | --- |
| mode | `payment` | Keep `payment`. The deck is a one-time purchase. |
| success_url | `{Stripe:SiteUrl}/porachka/uspeh/?session_id={CHECKOUT_SESSION_ID}` | Keep this path. `Stripe:SiteUrl` is `http://localhost:3001` in development. |
| cancel_url | `{Stripe:SiteUrl}/porachka/?payment=cancelled` | Keep this path. |
| line_items | One line for the goods and, when needed, one line for Econt shipping. Amounts are in cents for that order. | Keep the dynamic amounts. Do not switch this to `price_...`. |

These fields stay as well, because the existing order flow reads them. They are not Checkout Studio options:

| Field | Current value | Why it stays |
| --- | --- | --- |
| customer_email | Email from the checkout form | The Stripe page opens with that email filled in. |
| client_reference_id | Order number | Ties the Stripe payment to the order. |
| metadata.orderId / metadata.orderNumber | Id and number of the saved order | The return page and the webhook use them to mark the order paid. |

## Configured Parameters

These match the Checkout Studio settings.

**Files containing these parameters:**

- [backend/Services/StripeService.cs](backend/Services/StripeService.cs)

| Parameter | Value |
| --- | --- |
| ui_mode | `hosted_page` |
| billing_address_collection | `auto` |
| phone_number_collection.enabled | `false` |
| automatic_tax.enabled | `false` |
| allow_promotion_codes | `false` |
| submit_type | `pay` |
| locale | `bg` |
| payment_method_options.card.restrictions.brands_blocked | `discover_global_network` |
| integration_identifier | `hosted_web_0001` |
| origin_context | `web` |

## Setup and next steps

The API reads configuration from `Stripe:SecretKey`, `Stripe:WebhookSecret`, and `Stripe:SiteUrl`. The same values can be environment variables named `Stripe__SecretKey`, `Stripe__WebhookSecret`, and `Stripe__SiteUrl`. Do not commit the secret key.

Locally:

```bash
cd backend
dotnet user-secrets set "Stripe:SecretKey" "sk_test_..."
dotnet user-secrets set "Stripe:WebhookSecret" "whsec_..."
```

`sk_test_...` is the secret key from [Stripe API keys](https://dashboard.stripe.com/test/apikeys). `whsec_...` is the signing secret from `stripe listen --forward-to localhost:5080/api/stripe/webhook`, or from a webhook endpoint whose URL is `https://<api-host>/api/stripe/webhook` and whose event is `checkout.session.completed`.

Restart the API after saving the keys.

No new application files were added for this step. The checkout call was already in `StripeService`.

### How it works

1. The customer chooses **С карта** and submits the order.
2. The API saves the order as unpaid and opens a hosted Stripe page for that exact total, with the email already filled in.
3. Stripe sends the customer to `/porachka/uspeh/` after payment, or back to `/porachka/?payment=cancelled` if they stop.
4. The success page and the webhook both mark the order paid. Cash on delivery never opens Stripe.

### Test mode

Use test mode and card `4242 4242 4242 4242`, any future date, and any CVC.

### After that

- Put the live secret key and the live webhook secret on the server when you leave test mode.
- Set `Stripe__SiteUrl` to the public site address.
- Logo and color `#8f7350` are set in Stripe under Settings → Branding.

Support: https://support.stripe.com  
Docs: https://docs.stripe.com/mcp
