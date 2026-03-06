# Apple — Tech Provider Knowledge Base

## Company Overview
- **Founded**: 1976 by Steve Jobs, Steve Wozniak, Ronald Wayne (Cupertino, CA)
- **Ticker**: AAPL (NASDAQ)
- **Revenue**: ~$391B (FY2024)
- **CEO**: Tim Cook
- **Employees**: ~164,000
- **Market cap**: ~$3T+ (trades #1/#2 with Microsoft)

## Product Portfolio

### Mac (Business Computers)
- **MacBook Air**: M3/M4 chip, fanless, 13"/15". Starting ~$1,099. Best value business laptop
- **MacBook Pro**: M4 Pro/Max/Ultra, 14"/16". Professional workstation laptop. Starting ~$1,599
- **Mac mini**: M4/M4 Pro desktop. Compact, powerful. Starting ~$599
- **Mac Studio**: M4 Max/Ultra. Creative/AI workstation. Starting ~$1,999
- **Mac Pro**: M2 Ultra, tower form factor, PCIe expansion. Starting ~$6,999
- **iMac**: M4, 24" 4.5K display, AIO desktop. Starting ~$1,299
- **Apple Silicon advantage**: M-series chips — unified memory, industry-leading performance-per-watt, 18-24hr battery (laptops)

### iPad (Business Tablets)
- **iPad Pro**: M4 chip, OLED, Apple Pencil Pro, Magic Keyboard. Starting ~$999
- **iPad Air**: M2 chip, 11"/13". Starting ~$599
- **iPad (10th gen)**: A14 chip. Starting ~$349
- **iPad mini**: A17 Pro chip. Starting ~$499

### iPhone (Business Mobile)
- **iPhone 16 Pro/Pro Max**: A18 Pro, always-on display, Action Button, USB-C. Starting ~$999/$1,199
- **iPhone 16/16 Plus**: A18, USB-C. Starting ~$799/$899
- **iPhone SE**: Budget option. Starting ~$429

### Services (Business-Relevant)
- **Apple Business Manager (ABM)**: Zero-touch device enrollment, app/content distribution, managed Apple IDs
- **Apple Business Essentials**: SMB device management + iCloud storage + AppleCare ($2.99-$12.99/user/mo)
- **iCloud+**: Cloud storage, Custom Email Domain, Private Relay, Hide My Email
- **Apple Intelligence**: On-device AI (writing tools, image gen, Siri upgrades, notification summaries)

### Peripherals
- **Apple displays**: Studio Display (27" 5K, $1,599), Pro Display XDR (32" 6K, $4,999)
- **AirPods Pro**: Active noise cancellation, spatial audio, business call quality
- **Magic accessories**: Keyboard, Mouse, Trackpad (USB-C)
- **Apple TV 4K**: Conference room display (AirPlay)
- **Vision Pro**: Spatial computing headset ($3,499) — immersive productivity/presentations

## SMB Programs & Relevance
- **Apple Business Essentials**: All-in-one SMB device management (MDM, storage, support)
- **Apple Financial Services**: Leasing through CIT/partners, trade-in (Apple Trade In)
- **Apple at Work**: apple.com/business — resources for deploying Apple in business
- **Employee Choice Programs**: Apple devices as employee benefit (reduces shadow IT)
- **Apple Business Connect**: Free business listing on Apple Maps, branded place cards
- **AppleCare for Enterprise**: 24/7 support, on-site service, account management (for large fleets)

## Channel & Partner Program
- **Apple Authorized Resellers**: B2B resellers (Connection, CDW, Insight, SHI)
- **Apple Consultants Network (ACN)**: Independent consultants for SMB Apple deployments
- **Authorized Service Providers (AASP)**: Certified repair centers
- **Distribution**: Ingram Micro, TD SYNNEX (Apple-authorized)
- **No traditional partner program**: Apple doesn't have tiered partner programs like Dell/HP/Lenovo. Relies on reseller/consultant model
- **Apple Business Manager**: Free portal for IT admins — integrates with any MDM (Jamf, Intune, Mosyle, Kandji)

## LatAm Presence
- **Retail stores**: Mexico City (2 stores), limited LatAm retail presence
- **Online stores**: Apple.com available in Mexico, Brazil, Colombia, Chile, Argentina (local pricing + financing)
- **Authorized resellers**: iShop (LatAm chain), MacStore, iPoint, local resellers
- **Apple Pay**: Available in Mexico, Brazil, Colombia, Costa Rica, Panama
- **Support**: Spanish/Portuguese phone + chat support
- **Pricing premium**: Apple products typically 20-40% more expensive in LatAm vs US (import taxes)
- **iPhone dominance**: iPhone has 20-35% market share in LatAm (varies by country; higher in urban/business segments)

## APIs & Integration Points
- **Apple Business Manager API (ABM)**: Device enrollment, VPP app assignment, managed Apple ID
- **MDM protocol**: Apple's MDM framework (any MDM vendor can manage Apple devices)
- **Apple Push Notification Service (APNs)**: Push notifications for apps + MDM commands
- **Sign in with Apple**: OAuth 2.0 identity provider (privacy-focused SSO)
- **Apple Pay API**: Payment processing integration (Web, iOS, watchOS)
- **MapKit / Apple Maps Server API**: Maps, geocoding, directions, place search
- **App Store Connect API**: App management, TestFlight, analytics, subscriptions
- **CloudKit**: Backend-as-a-service for Apple ecosystem apps
- **HealthKit / ResearchKit**: Health data APIs (relevant for health-tech SMBs)
- **Shortcuts / Automator**: On-device automation (user-facing, not enterprise API)

## Pricing Benchmarks (SMB, USD, 2024-2025)
| Product | Starting Price |
|---------|---------------|
| MacBook Air 13" M3 (8GB, 256GB) | ~$1,099 |
| MacBook Pro 14" M4 Pro (18GB, 512GB) | ~$1,999 |
| Mac mini M4 (16GB, 256GB) | ~$599 |
| iMac 24" M4 (16GB, 256GB) | ~$1,299 |
| iPad Air 11" M2 (128GB) | ~$599 |
| iPhone 16 Pro (128GB) | ~$999 |
| Apple Business Essentials (per device/mo) | $2.99-$12.99 |
| AppleCare+ for Mac (MacBook Air, annual) | ~$99/yr |
| Studio Display | ~$1,599 |

## Key Differentiators
- **Apple Silicon**: Industry-best performance-per-watt, unified memory architecture, long battery life
- **Ecosystem integration**: Mac + iPhone + iPad + Watch + AirPods = seamless handoff, continuity, AirDrop
- **Privacy-first**: On-device processing, App Tracking Transparency, Mail Privacy Protection, Private Relay
- **Security by design**: T2/M-series Secure Enclave, FileVault encryption, Gatekeeper, XProtect — lowest malware rate of any major OS
- **Longevity**: 7+ years of macOS/iOS updates, high resale value (TCO advantage)
- **Employee satisfaction**: Consistently rated #1 in employee device preference (reduces IT tickets)
- **Apple Intelligence**: On-device AI that doesn't send data to cloud

## Security & Compliance
- **Hardware security**: Secure Enclave, Secure Boot, hardware-verified boot chain
- **FileVault**: Full-disk encryption (enabled by default on M-series)
- **Gatekeeper + XProtect**: App notarization, real-time malware detection
- **Lockdown Mode**: Extreme security for high-risk users
- **Managed Device Attestation**: Hardware-backed device identity
- **Platform SSO**: Entra ID / Okta single sign-on at macOS login
- **Compliance**: SOC 2 (Apple services), ISO 27001/27018, HIPAA (iCloud), PCI-DSS (Apple Pay)
- **FIPS 140-3**: Apple corecrypto module validated
