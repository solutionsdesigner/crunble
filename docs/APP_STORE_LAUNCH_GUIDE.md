# Cronble App Store Launch & Distribution Guide
*Ethical, Compliant, and Secure iOS Deployment Manual*

---

## Executive Summary & Configuration Spec

| Property | Value |
| :--- | :--- |
| **App Name** | **Cronble** |
| **Subtitle** | Daily Itinerary & Timeline AI |
| **Bundle ID** | `com.cronble.ai` |
| **Primary Language** | English (U.S.) |
| **Primary Category** | Productivity |
| **Secondary Category** | Utilities / Lifestyle |
| **SKU** | `CRONBLE-IOS-001` |
| **Export Compliance** | `ITSAppUsesNonExemptEncryption: false` (Standard HTTPS encryption exempt under Category 5, Part 2) |
| **Capacitor Scheme** | `https` (Secure scheme default) |
| **Apple Review Guideline** | Full compliance with **Guideline 3.1.2(c)** (Auto-Renewable Subscriptions) |

---

## Phase 1: Native Containerization in Google AI Studio

### 1.1 Web Asset Compilation
- Web build compiled to `dist/` using Vite and Tailwind CSS.
- Mobile viewport constraints configured in `index.html`:
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="format-detection" content="telephone=no" />
  <meta name="theme-color" content="#faf7f2" />
  ```
- Safe-area insets (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`) implemented across base CSS and modals to support Apple Dynamic Island, notch, and home indicator.

### 1.2 Capacitor Configuration (`capacitor.config.json`)
```json
{
  "appId": "com.cronble.ai",
  "appName": "Cronble",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "server": {
    "iosScheme": "https",
    "androidScheme": "https",
    "allowNavigation": [
      "localhost",
      "*.run.app",
      "*.googleapis.com"
    ]
  },
  "ios": {
    "contentInset": "automatic",
    "preferredContentMode": "mobile",
    "limitsNavigationsToAppBoundDomains": true,
    "scheme": "Cronble"
  }
}
```

### 1.3 App Icons & Native Assets
Generated via `scripts/generate-app-icons.js` and synced to `ios/App/App/Assets.xcassets/AppIcon.appiconset`:
- `icon-1024.png`: 1024x1024 (App Store Marketing Icon, opaque RGB, no alpha)
- `icon-60@3x.png`: 180x180 (iPhone App Icon @3x)
- `icon-60@2x.png`: 120x120 (iPhone App Icon @2x)
- `icon-40@3x.png`: 120x120 (iPhone Spotlight @3x)
- `icon-40@2x.png`: 80x80 (iPhone Spotlight @2x)
- `icon-29@3x.png`: 87x87 (iPhone Settings @3x)
- `icon-29@2x.png`: 58x58 (iPhone Settings @2x)
- `icon-20@3x.png`: 60x60 (iPhone Notification @3x)
- `icon-20@2x.png`: 40x40 (iPhone Notification @2x)
- `icon-83.5@2x.png`: 167x167 (iPad Pro @2x)
- `icon-76@2x.png`: 152x152 (iPad App @2x)
- `icon-76.png`: 76x76 (iPad App @1x)
- `icon-40.png`: 40x40 (iPad Spotlight @1x)
- `icon-29.png`: 29x29 (iPad Settings @1x)
- `icon-20.png`: 20x20 (iPad Notification @1x)
- Valid `Contents.json` asset catalog manifest.

### 1.4 Native Permissions & Export Compliance (`Info.plist`)
In `ios/App/App/Info.plist`:
- `NSCameraUsageDescription`: *"Cronble uses the camera to scan task agendas, document schedule notes, and capture timeline attachments."*
- `NSPhotoLibraryUsageDescription`: *"Cronble accesses your photo library to import schedule images and task reference files."*
- `NSMicrophoneUsageDescription`: *"Cronble uses the microphone to enable voice-dictated reschedule instructions and audio schedule input."*
- `ITSAppUsesNonExemptEncryption`: `<false/>` (Qualifies under standard HTTPS TLS 1.3 exemption).

---

## Phase 2: Codemagic CI/CD Pipeline & YAML Architecture

The file `codemagic.yaml` is configured with the `ios-app-store` workflow:
- **Runner**: `instance_type: mac_mini_m2`
- **Environment**:
  - `XCODE_PROJECT`: `ios/App/App.xcodeproj`
  - `XCODE_WORKSPACE`: `ios/App/App.xcworkspace`
  - `XCODE_SCHEME`: `App`
  - `BUNDLE_ID`: `com.cronble.ai`
- **Build Sequence**:
  1. `npm ci --legacy-peer-deps || npm install`
  2. `npm run build`
  3. Conditional `npx cap add ios` & `npx cap sync ios` + icon catalog sync
  4. Apple profile association via `xcode-project use-profiles`
  5. Automated Dynamic Versioning:
     - Querying App Store Connect for the highest TestFlight build number: `app-store-connect get-latest-testflight-build-number "$BUNDLE_ID"`
     - Incrementing build number and applying via `agvtool new-version -all` and `sed` fallback on `project.pbxproj`
  6. Native IPA build: `xcode-project build-ipa --workspace "$XCODE_WORKSPACE" --scheme "$XCODE_SCHEME"`
- **Artifacts**: `build/ios/ipa/*.ipa`, `/tmp/xcodebuild_logs/*.log`
- **Publishing**: `submit_to_testflight: true`, `beta_groups: ["Internal Testers"]`

---

## Phase 3: GitHub Version Control & Repository Onboarding

### 3.1 Sanitized `.gitignore`
The `.gitignore` explicitly blocks all secrets, private keys, and signing artifacts:
```gitignore
node_modules/
dist/
build/
*.ipa
DerivedData/
*.p8
*.p12
*.cer
*.mobileprovision
AuthKey_*.p8
apple_keys/
```

### 3.2 Git Initialization & Onboarding Steps
1. Initialize local repository:
   ```bash
   git init
   git branch -M main
   git add .
   git commit -m "feat(appstore): complete App Store containerization for Cronble"
   ```
2. Connect to GitHub remote:
   ```bash
   git remote add origin https://github.com/your-org/cronble-ios.git
   git push -u origin main
   ```
3. Connect Codemagic to GitHub:
   - Go to Codemagic Dashboard > Add Application > Select GitHub.
   - Authorize the `cronble-ios` repository.
   - Webhook triggers are automatically configured for pushes to `main`.

---

## Phase 4: Apple Developer & Codemagic Code Signing Setup

### 4.1 App Store Connect API Key Creation
1. Log into **App Store Connect** > **Users and Access** > **Integrations** > **App Store Connect API**.
2. Click **+** (Generate API Key).
3. Set Name to `Codemagic CI Key`, and select Role: **App Manager** (or Admin).
4. Download the private key file (`AuthKey_XXXXXXXXXX.p8`). Note: This file can only be downloaded once.
5. Record:
   - **Key ID**: (e.g., `2X9R4274ND`)
   - **Issuer ID**: (e.g., `69a6de70-XXXX-XXXX-XXXX-4d89b33a525d`)

### 4.2 Register Key in Codemagic
1. In Codemagic, navigate to **Teams** > **Team Settings** > **Integrations** > **App Store Connect**.
2. Enter:
   - Key Name: `codemagic_api_key`
   - Issuer ID: `<Your Issuer ID>`
   - Key ID: `<Your Key ID>`
   - Private Key: Paste entire contents of `AuthKey_XXXXXXXXXX.p8`.
3. Save integration.

### 4.3 Apple Developer Portal Setup
1. Go to **developer.apple.com** > **Certificates, Identifiers & Profiles** > **Identifiers**.
2. Register App ID:
   - Description: `Cronble Itinerary`
   - Bundle ID (Explicit): `com.cronble.ai`
3. Enable Capabilities:
   - `In-App Purchase`
   - `Push Notifications`
4. Automatic Signing in Codemagic:
   - Codemagic automatically provisions distribution certificates and profiles via `xcode-project use-profiles`.

---

## Phase 5: App Store Connect Listing & Guideline 3.1.2(c) Subscriptions

### 5.1 Create App Record in App Store Connect
- **Platform**: iOS
- **Name**: `Cronble`
- **Primary Language**: English (U.S.)
- **Bundle ID**: `com.cronble.ai`
- **SKU**: `CRONBLE-IOS-001`
- **User Access**: Full Access

### 5.2 Auto-Renewing Subscriptions Configuration
Navigate to **App Store Connect** > **Cronble** > **In-App Purchases** > **Subscriptions**:

1. **Create Subscription Group**:
   - Reference Name: `Cronble Premium Membership`
   - Subscription Group Display Name: `Cronble Premium`

2. **Configure Products**:

| Field | Product 1 | Product 2 |
| :--- | :--- | :--- |
| **Product Reference Name** | Cronble Pro 3-Month | Cronble Pro Plus 3-Month |
| **Product ID** | `com.cronble.ai.pro.3m` | `com.cronble.ai.proplus.3m` |
| **Subscription Duration** | 3 Months | 3 Months |
| **Price Tier / Retail** | $29.99 ($9.99/mo equivalent) | $49.99 ($16.66/mo equivalent) |
| **Localized Display Title** | Cronble Pro (3 Months) | Cronble Pro Plus (3 Months) |
| **Localized Description** | Automated schedule optimization, unlimited timeline tasks, and smart timezone conversion. | Priority AI reschedule reasoning, multimodal schedule scanner, VIP concierge support. |

### 5.3 App Store Description & Guideline 3.1.2(c) Compliance Text
Paste this copy into your App Store Description:

```markdown
Cronble is an intelligent daily itinerary and timeline progression assistant designed for executives, students, and busy professionals who value clarity, focus, and chronological flow.

Visualize your day with high-contrast active progression indicators, toggle timezones effortlessly, and optimize your schedule using natural language AI instructions.

AUTO-RENEWABLE SUBSCRIPTION DETAILS (App Store Guideline 3.1.2c):
• Titles of Auto-Renewing Subscriptions:
  1. Cronble Pro (3 Months) - $29.99 (Equivalent to $9.99/month, billed every 3 months)
  2. Cronble Pro Plus (3 Months) - $49.99 (Equivalent to $16.66/month, billed every 3 months)
• Length of Subscriptions: 3 Months
• Prices: $29.99 for Cronble Pro; $49.99 for Cronble Pro Plus
• Payment will be charged to your Apple ID account at confirmation of purchase.
• Subscription automatically renews unless cancelled at least 24 hours before the end of the current billing cycle.
• Your account will be charged for renewal within 24 hours prior to the end of the current 3-month period.
• Subscriptions may be managed by the user and auto-renewal may be turned off by going to your Apple ID Account Settings after purchase.
• Any unused portion of a free trial period, if offered, will be forfeited when purchasing a subscription.

LEGAL & PRIVACY LINKS:
• Terms of Use (EULA): In-app via Legal & Subscriptions tab or standard Apple EULA at:
  https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
• Privacy Policy: In-app via Legal & Subscriptions tab or at:
  https://cronble.ai/privacy
```

### 5.4 App Review Information & Notes for Apple Reviewers
Enter this text in **App Review Information** > **Notes**:

```text
Dear Apple Review Team,

Thank you for reviewing Cronble! Below are the testing instructions and compliance notes for your review:

1. DEMO CREDENTIALS:
- App Unlock Secret Code: 20260730
  (Enter this password on the initial lock wall screen to unlock the application)
- Demo Account Email: reviewer@cronble.ai
- Demo Account Password: AppleReview2026!

2. GUIDELINE 3.1.2(c) IN-APP EVIDENCE:
- Tap "subscriptions (3.1.2c)" or "terms (EULA)" in the bottom footer of any view, or open the top-right user menu to inspect our complete StoreKit subscription modal.
- The subscription group "Cronble Premium Membership" includes:
  • Cronble Pro (3 Months) - $29.99
  • Cronble Pro Plus (3 Months) - $49.99
- All mandatory disclosures (subscription title, length, price, unit prices, auto-renewal terms, account management instructions, and functional links to the Privacy Policy and Terms of Use / Apple standard EULA) are prominently displayed both above and below the purchase buttons.
- A functional "Restore Purchases" button is integrated and provides immediate feedback.

3. AI SCHEDULE RESCHEDULE & DISCLAIMER:
- In the task table, tapping "Reschedule" opens our AI Task Rescheduler.
- Users are clearly notified that AI results may be inaccurate, must be reviewed by the user, the user is responsible for the results, and sensitive/biometric data must not be submitted.

4. EXPORT COMPLIANCE:
- ITSAppUsesNonExemptEncryption is set to false in Info.plist as Cronble uses only standard HTTPS encryption exempt from export documentation under Category 5 Part 2.

If you have any questions during review, please reach out directly to the developer team at thesolutionsdesigner@gmail.com.
```

---

## Phase 6: TestFlight Validation & Submission Workflow

### 6.1 TestFlight Build Processing
1. Trigger the `ios-app-store` workflow in Codemagic (either by pushing to `main` or clicking **Start new build**).
2. Codemagic will build the `.ipa`, sign it with Apple distribution credentials, and upload it directly to TestFlight.
3. In App Store Connect, go to **TestFlight** > **iOS Builds**.
4. Once processing completes (usually 5–15 minutes), the build automatically enters the **Internal Testers** group.

### 6.2 Physical Device Smoke Testing Checklist
Before submitting for App Store Review, verify on a physical iOS device via TestFlight:
- [x] **Password Wall**: Enter `20260730` to unlock the app.
- [x] **Safe-Area Layout**: Verify header and footer content does not clip against Dynamic Island / notch or home bar.
- [x] **Timeline View**: Smooth momentum scrolling, active progress dot, and clear task status.
- [x] **Reschedule Modal**: Tap "reschedule" beside any task. Verify smooth mobile scrolling up and down through instructions and chips.
- [x] **Guideline 3.1.2(c) Subscriptions**: Tap "subscriptions (3.1.2c)" in footer. Test selecting plans and StoreKit sandbox sheet.
- [x] **Legal Links**: Test opening Terms of Use (EULA) and Privacy Policy tabs. Verify external Apple Standard EULA link.
- [x] **Restore Purchases**: Tap "Restore Purchases" and verify confirmation status.
- [x] **Notifications**: Enable task alerts in the user menu and verify permissions dialog.

### 6.3 Submitting for App Store Review
1. Go to **App Store** > **iOS App** > **1.0.0 Prepare for Submission**.
2. Select the TestFlight build (e.g., Build 1).
3. Attach required screenshots:
   - iPhone 6.9" Display (iPhone 16 Pro Max: 1320 x 2868 px or 1290 x 2796 px)
   - iPhone 6.5" Display (iPhone 14 Plus / 11 Pro Max: 1242 x 2688 px or 1284 x 2778 px)
   - iPad Pro 13" (2064 x 2752 px)
4. Confirm In-App Purchases: Ensure `com.cronble.ai.pro.3m` and `com.cronble.ai.proplus.3m` are attached to the submission.
5. Paste App Store Description, Reviewer Notes, and demo credentials.
6. Click **Add for Review** > **Submit to App Review**.

### 6.4 Handling Review Inquiries & Rejections (Resolution Templates)

#### Scenario A: Guideline 3.1.2(c) Inquiry
> *"We noticed your app offers auto-renewable subscriptions. Please ensure that all terms are clearly presented in the binary and description."*

**Response Template**:
```text
Hello Apple Review Team,

Thank you for your feedback. We have verified that all auto-renewable subscription terms strictly comply with Guideline 3.1.2(c):

1. The subscription titles ("Cronble Pro 3-Month", "Cronble Pro Plus 3-Month"), length (3 months), pricing ($29.99 and $49.99), and unit price equivalents ($9.99/mo and $16.66/mo) are clearly displayed both in our App Store Description and within our in-app purchase modal.
2. In-app, users can tap "subscriptions (3.1.2c)" in the persistent footer of any screen to view all terms, auto-renewal policies, and the "Restore Purchases" button.
3. Functional in-app links to our Terms of Use (EULA) and Privacy Policy, including Apple's standard EULA link (https://www.apple.com/legal/internet-services/itunes/dev/stdeula/), are placed directly beneath the subscription options.

We welcome any further guidance and thank you for your review.
```

#### Scenario B: Guideline 2.1 - Information Needed / Demo Account
> *"We were unable to access the app or verify subscription features."*

**Response Template**:
```text
Hello Apple Review Team,

To access all features and test subscription flows:
1. Enter the app unlock secret "20260730" on the initial lock screen.
2. You can sign in using our test reviewer credentials:
   Email: reviewer@cronble.ai
   Password: AppleReview2026!
3. Tap "subscriptions (3.1.2c)" in the footer to access and test the sandbox StoreKit subscription sheets and restoration flow.

Please let us know if we can provide any additional assistance.
```
