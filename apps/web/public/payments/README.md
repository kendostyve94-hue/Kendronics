# Payment brand assets

This folder stores payment logos used by the checkout UI.

Rules:
- Use only official brand kit files or provider-rendered payment elements.
- Do not add random image-search logos.
- Keep a fallback text/CSS mark in the UI when an official local asset is missing.

Current local assets:
- `paypal-logo-black.png`: PayPal official newsroom asset, source: `https://newsroom.paypal-corp.com/download/PayPal-Logo-Black-2024.zip`
- `visa-brandmark-blue.png`: Visa official domain asset, source: `https://usa.visa.com/dam/VCOM/global/about-visa/images/visa-brandmark-blue-1960x622.png`
- `google-pay-mark.svg`: Google Pay official developer asset, source: `https://developers.google.com/static/pay/api/download-assets/Google-Pay-Acceptance.zip`

Local transparent vector marks pending final brand-kit replacement:
- `mastercard-mark.svg`
- `amex-mark.svg`
- `apple-pay-mark.svg`
- `bank-transfer-mark.svg`

Mobile Money source images and production badges:
- `orange-money-source.png`: Google Play app icon source.
- `wave-source.png`: Google Play app icon source.
- `moov-money-source.png`: Google Play app icon source.
- `mtn-mobile-money-source.png`: logo image source.
- `orange-money-badge-v2.svg`, `wave-badge-v2.svg`, `moov-money-badge-v2.svg`, `mtn-momo-badge-v2.svg`: local round acceptance badges built from the source images above.
- Older `*-mark.svg` files are kept only as fallback references.

Pending official assets:
- Mastercard acceptance mark: use Mastercard brand center resources and follow their usage terms.
- American Express: use American Express merchant / brand resources.
- Apple Pay: prefer official payment buttons or marks according to Apple guidelines.
- Orange Money, Wave, Moov Money, MTN Mobile Money: add only official operator-provided brand files or approved merchant assets.
