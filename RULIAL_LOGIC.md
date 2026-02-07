## RULIAL LOGIC: DETERMINISTIC FINANCIAL STATE
### Tuma Taxi - Mozambique Edition

---

## OVERVIEW

**Rulial Logic** is the deterministic financial state system powering Tuma Taxi's commission calculations, driver payouts, and immutable ledger entries. The system ensures complete financial integrity through cryptographic transaction hashing and precision decimal arithmetic.

**Key Principles:**
- ✓ Deterministic: Same inputs always produce same outputs
- ✓ Immutable: All transactions are cryptographically sealed with SHA256 hashes
- ✓ Precise: Decimal.js arithmetic eliminates floating-point errors
- ✓ Auditable: Full ledger trail with automatic validation

---

## ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│            RIDE COMPLETION EVENT                            │
│  (Driver: MATCHED → ARRIVED → IN_PROGRESS → COMPLETED)      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│     RULIAL LOGIC: calculateCommission()                      │
│                                                              │
│  Input: driverId, finalFareMZN, metrics                      │
│  ├─ metrics.weeklyRidesCompleted: int                        │
│  ├─ metrics.rating: float (1.0 - 5.0)                        │
│  └─ metrics.currentTier: BRONZE | SILVER | GOLD              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│     TIER DETERMINATION (Highest Match Wins)                  │
│                                                              │
│  GOLD:  weeklyRides ≥ 100 OR rating ≥ 4.9                   │
│         └─ Commission: 12% + Instant Payout Access          │
│                                                              │
│  SILVER: weeklyRides ≥ 50 OR rating ≥ 4.8                    │
│          └─ Commission: 15%                                  │
│                                                              │
│  BRONZE: Default                                             │
│          └─ Commission: 17%                                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│     MZN CALCULATION (Decimal.js Precision)                   │
│                                                              │
│  Commission = finalFareMZN × (commissionRate / 100)          │
│  DriverPayout = finalFareMZN - Commission                    │
│  txHash = SHA256(driverId + fare + rate + timestamp)         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│     LEDGER ENTRIES (Immutable Records)                       │
│                                                              │
│  [CREDIT] Driver Account: +driverPayoutMZN                   │
│           txHash: <immutable hash>                           │
│           reason: RIDE_PAYOUT                                │
│                                                              │
│  [CREDIT] Platform Account: +commissionMZN                   │
│           txHash: <immutable hash>                           │
│           reason: COMMISSION                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## COMMISSION TIERS

### BRONZE (Default - 17%)
**Criteria:**
- All new drivers start at BRONZE
- No special requirements

**Example:**
```
Ride Fare: 500.00 MZN
Commission Rate: 17%
─────────────────────
Commission: 85.00 MZN
Driver Payout: 415.00 MZN
```

### SILVER (15%)
**Criteria (either/or):**
- Completed ≥ 50 rides in current week, OR
- Maintains ≥ 4.8 star rating

**Benefits:**
- Reduced commission by 2%
- Approximately 51.95 MZN more per 500 MZN ride vs BRONZE

**Example:**
```
Ride Fare: 500.00 MZN
Commission Rate: 15%
─────────────────────
Commission: 75.00 MZN
Driver Payout: 425.00 MZN
Savings vs BRONZE: 10.00 MZN (+2.4%)
```

### GOLD (12%)
**Criteria (either/or):**
- Completed ≥ 100 rides in current week, OR
- Maintains ≥ 4.9 star rating

**Benefits:**
- Lowest commission at 12%
- Instant payout access (no waiting period)
- Approximately 103.95 MZN more per 500 MZN ride vs BRONZE

**Example:**
```
Ride Fare: 500.00 MZN
Commission Rate: 12%
─────────────────────
Commission: 60.00 MZN
Driver Payout: 440.00 MZN
Savings vs BRONZE: 25.00 MZN (+6.0%)
Instant Payout: ✓ ENABLED
```

---

## FINANCIAL PRECISION

### Why Decimal.js?
JavaScript's native `Number` type uses IEEE 754 floating-point, which causes rounding errors:

```javascript
// ❌ WRONG (using Number)
0.1 + 0.2 === 0.3  // false! (0.30000000000000004)

// ✓ CORRECT (using Decimal.js)
new Decimal(0.1).plus(0.2).equals(0.3)  // true
```

In financial systems, these errors accumulate catastrophically.

### MZN Precision
All MZN amounts are stored and calculated with **exactly 2 decimal places**:
- Database: `DECIMAL(12, 2)` in PostgreSQL
- Calculations: `Decimal.js` with `toDecimalPlaces(2, ROUND_HALF_UP)`
- Display: Formatted via `formatCurrencyMZN()`

**Example Calculation:**
```typescript
const fare = new Decimal('500.00');
const rate = 17;

const commission = fare
  .times(new Decimal(rate))
  .dividedBy(100)
  .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
// Result: 85.00 (exact, no floating-point errors)
```

---

## TRANSACTION HASHING (Immutability)

Every ledger entry is sealed with an immutable SHA256 hash:

```
txHash = SHA256(
  driverId + 
  fareAmount + 
  commissionRate + 
  timestamp
)
```

**Properties:**
- ✓ Deterministic: Same inputs → same hash
- ✓ Immutable: Changing any field = different hash
- ✓ Secure: SHA256 cryptographic strength
- ✓ Auditable: Detect tampering instantly

**Example:**
```typescript
const txHash = generateTxHash(
  'driver_abc123',
  new Decimal('500.00'),
  17,
  new Date('2026-01-31T10:30:00Z')
);
// Result: a7f2e1b8c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8

// Any change = different hash:
generateTxHash(
  'driver_abc123',
  new Decimal('500.01'),  // Changed by 1 cent!
  17,
  new Date('2026-01-31T10:30:00Z')
);
// Result: x9y2z1b8c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8
```

---

## LEDGER ENTRY STRUCTURE

Every financial transaction creates an immutable ledger entry:

```typescript
interface RulialLedger {
  // Identity
  id: string (cuid)
  userId: string
  
  // Transaction Details
  type: 'CREDIT' | 'DEBIT'
  reason: 'RIDE_PAYOUT' | 'COMMISSION' | 'BONUS' | 'REFUND' | 'WITHDRAWAL' | 'SYSTEM_ADJUST'
  amountMZN: Decimal (12, 2)
  
  // Immutable Reference
  txHash: string (SHA256, UNIQUE)
  rideId: string (optional, links to Ride)
  
  // Balance Snapshot
  balanceBeforeMZN: Decimal (12, 2)
  balanceAfterMZN: Decimal (12, 2)
  
  // Metadata & Verification
  description: string
  metadata: JSON
  isVerified: boolean
  verifiedAt: DateTime
  
  createdAt: DateTime (immutable)
  updatedAt: DateTime
}
```

**Indexes for Performance:**
- `userId`: Fast driver history lookups
- `reason`: Filter by transaction type
- `createdAt`: Time-range queries
- `txHash`: Integrity verification (UNIQUE)

---

## WORKFLOW: RIDE COMPLETION

### Step 1: Driver Completes Ride
```
Ride Status: IN_PROGRESS → COMPLETED
completedAt: 2026-01-31T14:30:00Z
finalFareMZN: 500.00
```

### Step 2: Calculate Commission
```typescript
const commission = calculateCommission(
  'driver_abc123',
  new Decimal('500.00'),
  {
    weeklyRidesCompleted: 45,    // Not enough for SILVER
    rating: 4.75,                 // Not high enough for SILVER
    currentTier: 'BRONZE'
  }
);

// Result:
{
  commissionRate: 17.0,
  finalFareMZN: 500.00,
  commissionMZN: 85.00,
  driverPayoutMZN: 415.00,
  appliedTier: 'BRONZE',
  reason: 'BRONZE tier (default) → 17% commission',
  instantPayoutEligible: false
}
```

### Step 3: Create Ledger Entries
```typescript
const [payoutEntry, commissionEntry] = createRideLedgerEntries({
  driverId: 'driver_abc123',
  rideId: 'ride_xyz789',
  finalFareMZN: 500.00,
  commissionMZN: 85.00,
  driverPayoutMZN: 415.00,
  currentBalanceMZN: 1200.50,
  commissionRate: 17
});

// Payout Entry (Driver Credit):
{
  userId: 'driver_abc123',
  type: 'CREDIT',
  reason: 'RIDE_PAYOUT',
  amountMZN: 415.00,
  txHash: '<sha256 hash>',
  rideId: 'ride_xyz789',
  balanceBeforeMZN: 1200.50,
  balanceAfterMZN: 1615.50,  // 1200.50 + 415.00
  isVerified: true,
  createdAt: 2026-01-31T14:30:00Z
}

// Commission Entry (Platform):
{
  userId: 'SYSTEM_PLATFORM',
  type: 'CREDIT',
  reason: 'COMMISSION',
  amountMZN: 85.00,
  txHash: '<different sha256 hash>',
  rideId: 'ride_xyz789',
  balanceBeforeMZN: 0.00,
  balanceAfterMZN: 85.00,
  isVerified: true,
  createdAt: 2026-01-31T14:30:00Z
}
```

### Step 4: Update Driver Wallet
```sql
UPDATE DriverProfile
SET walletBalanceMZN = 1615.50
WHERE userId = 'driver_abc123'
```

---

## TIER TRANSITIONS

### Weekly Reset (Sunday Midnight CAT)
Every Sunday at 00:00 (Africa/Maputo), the weekly ride counter resets:

```typescript
export async function resetWeeklyCounters(driverId: string) {
  const now = getNowMaputo();  // Current time in Maputo
  
  const driver = await db.driverProfile.update({
    where: { userId: driverId },
    data: {
      weeklyRidesCompleted: 0,
      lastWeekReset: now
    }
  });
  
  // Auto-evaluate new tier based on rating
  await evaluateDriverTier(driverId);
}
```

### Tier Evaluation Logic
```typescript
function evaluateDriverTier(metrics: DriverMetrics): DriverTier {
  // Check GOLD first (highest)
  if (metrics.weeklyRidesCompleted >= 100 || metrics.rating >= 4.9) {
    return 'GOLD';
  }
  
  // Then SILVER
  if (metrics.weeklyRidesCompleted >= 50 || metrics.rating >= 4.8) {
    return 'SILVER';
  }
  
  // Default to BRONZE
  return 'BRONZE';
}
```

---

## AUDIT & VALIDATION

### Ledger Validation
Every ledger entry is validated for:
1. **Amount Validity**: Non-negative, max 2 decimals
2. **Balance Integrity**: balanceAfter = balanceBefore ± amount
3. **Transaction Hash**: SHA256 match

```typescript
const validation = validateLedgerEntry(entry);
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
  // ❌ Entry rejected
}
```

### Audit Report
Generate complete audit trail:
```typescript
const entries = await db.rulialLedger.findMany({
  where: { userId: driverId }
});

const report = auditLedgerEntries(entries);

console.log(generateAuditSummary(report));

/*
═══════════════════════════════════════════════════
         RULIAL LEDGER AUDIT REPORT
═══════════════════════════════════════════════════

Total Credits:     MZN 12,500.00
Total Debits:      MZN 0.00
Net Balance:       MZN 12,500.00
Entry Count:       25

Status:            ✓ VALID

═══════════════════════════════════════════════════
*/
```

---

## MOZAMBIQUE LOCALIZATION

### Currency: MZN (Mozambican Metical)
- **Code:** MZN
- **Symbol:** MT
- **Decimal Places:** 2
- **Format:** `1.234,56 MT` (Portuguese format)

### Timezone: Africa/Maputo
- **UTC Offset:** UTC+2
- **No Daylight Saving:** Mozambique does not observe DST
- **Week Boundaries:** Sunday 00:00 - Saturday 23:59 CAT

### Language: pt-MZ (Portuguese, Mozambique)
All labels and messages in Brazilian/Mozambique Portuguese.

### 3G Optimization
Network-optimized for low-bandwidth environments:
- Image quality: 60%
- Location updates: 30-second intervals
- Request timeout: 15 seconds
- Batch API requests: Enabled

---

## API ENDPOINTS (Future Implementation)

```typescript
// POST /api/rides/calculate-commission
// Calculate commission for a ride
{
  "driverId": "driver_abc123",
  "finalFareMZN": 500.00,
  "metrics": {
    "weeklyRidesCompleted": 45,
    "rating": 4.75,
    "currentTier": "BRONZE"
  }
}
→ CommissionOutput

// POST /api/ledger/create-entry
// Create immutable ledger entry
{
  "userId": "driver_abc123",
  "type": "CREDIT",
  "reason": "RIDE_PAYOUT",
  "amountMZN": 415.00,
  "currentBalanceMZN": 1200.50,
  "rideId": "ride_xyz789"
}
→ LedgerEntry

// GET /api/ledger/:userId
// Get driver's complete ledger history
→ LedgerEntry[]

// POST /api/ledger/:userId/audit
// Generate audit report
→ LedgerAuditReport
```

---

## ERROR HANDLING

### Validation Errors
```typescript
// ❌ Invalid amount
calculateCommission('driver_abc', -500, metrics);
// Error: "Fare amount cannot be negative"

// ❌ Invalid rating
calculateCommission('driver_abc', 500, { rating: 6.0, ... });
// Error: "Driver rating must be between 1.0 and 5.0"

// ❌ Insufficient balance
createLedgerEntry({
  type: 'DEBIT',
  amountMZN: 1000,
  currentBalanceMZN: 500
});
// Error: "Insufficient balance. Current: MZN 500.00, Requested debit: MZN 1,000.00"
```

---

## EXAMPLE: DRIVER EARNINGS BREAKDOWN

**Driver Profile:**
- Name: Manuel Silva
- Tier: SILVER
- Weekly Rides: 65 (≥ 50 threshold)
- Rating: 4.82

**This Week's Rides:**
```
Ride 1: 300.00 MZN → Commission 45.00 → Payout 255.00
Ride 2: 450.00 MZN → Commission 67.50 → Payout 382.50
Ride 3: 200.00 MZN → Commission 30.00 → Payout 170.00
Ride 4: 550.00 MZN → Commission 82.50 → Payout 467.50
Ride 5: 380.00 MZN → Commission 57.00 → Payout 323.00
──────────────────────────────────────────────────
Total: 1,880.00 MZN → Commission 282.00 (15%) → Payout 1,598.00
```

**Earnings Summary:**
```
Gross Earnings:           1,880.00 MZN
Platform Commission:       -282.00 MZN (15%)
Net Driver Payout:       1,598.00 MZN
Average Ride:              376.00 MZN
Average Payout:            319.60 MZN
──────────────────────────────────────────
Tier Status:               SILVER ✓
Commission Rate:           15%
Next Goal (GOLD):          35 more rides or +0.08 rating
```

---

## CONCLUSION

The Rulial Logic system ensures that:
1. ✓ All commissions are calculated deterministically
2. ✓ All transactions are immutably recorded
3. ✓ All amounts are precisely calculated without floating-point errors
4. ✓ All entries are auditable and verifiable
5. ✓ All financial data is optimized for Mozambique's market and infrastructure

For questions or implementation details, refer to:
- [commission.ts](../commission.ts) - Commission calculation
- [ledger.ts](../ledger.ts) - Ledger management
- [utils.ts](../utils.ts) - Utility functions
- [mozambique.ts](../../localization/mozambique.ts) - Localization
