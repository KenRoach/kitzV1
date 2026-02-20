# AI Battery Policy

## Credit Budget
- **Daily**: ≤ 5 credits
- **Weekly**: ≤ 15 credits
- **Monthly**: ≤ 30 credits
- **Per run**: 1 credit (default), up to 3 for complex multi-tool runs

## ROI Threshold
- Actions must project ≥ 2x ROI to consume credits
- Revenue-generating actions (orders, storefronts) get priority
- Read-only operations cost 0 credits

## Graceful Degradation
When battery depleted:
1. System switches to manual mode
2. Read operations still work (0 credits)
3. Write/create operations are blocked
4. Founder is notified to recharge

## Recharge Policy
- Founder-approved only
- Recharge amount: 10, 25, 50, or 100 credits
- Via WhatsApp: "Kitz: recharge 50"
