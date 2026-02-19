# Tuma Taxi — Product Roadmap & Vision

**USA-based team · Launch in Mozambique · Driver- and people-first.**

---

## Mission

Build a profitable ride-hailing platform that puts more money back into Mozambique and its people, with fair commissions and performance tiers (Bronze/Silver/Gold), while competing with incumbents (e.g. Yango Pro) that exploit drivers and riders.

---

## Testing Setup (Now)

- **Driver auto-approve for real-time testing:** In `.env.local` set `NEXT_PUBLIC_DEV_AUTO_APPROVE=true` so new drivers skip “A aguardar aprovação” and go straight to the dashboard. Driver and rider can then test request → match → accept flow in sync (Lyft/Uber-style).
- Keep this **false** in production; approval stays manual or via your verification flow.

---

## Client Expectations (Lyft/Uber-Level Sync)

### Rider side

- See **how long** until driver arrives (ETA).
- See **how far** the driver is (distance).
- See **who is near** (nearby drivers, optional).
- Real-time position updates when a ride is matched (driver moving toward pickup).

### Driver side

- **Bonus areas** (high-demand zones) visible on map or list.
- **Default lead to bonus areas** when going online or when idle, so drivers are guided to where demand is.
- Real-time ride requests (already in place via Realtime); see rider location and trip details.

### Both

- Stay in sync: rider sees driver ETA/distance; driver sees pickup/dropoff and can navigate. Same idea as Lyft/Uber.

---

## Mozambique-First

- **Launch market:** Mozambique (e.g. Maputo first).
- **Payments:** M-Pesa integration (API/codes pending). When available, integrate so riders pay and drivers get paid in MZN via M-Pesa; keep current ledger/commission logic in place.
- **Localization:** PT-MZ, MZN, Africa/Maputo timezone already in use; extend as needed (e.g. Chapas, Boda, local addresses).

---

## Tiers & Commissions (DoorDash-Style)

Schema already supports:

- **Bronze** — Default; 17% commission.
- **Silver** — e.g. 50+ rides/week OR 4.8+ rating → 15% commission.
- **Gold** — e.g. 100+ rides/week OR 4.9+ rating → 12% commission + instant payout.

**Delivery:** Use `DriverProfile.currentTier`, `RulialLedger`, and existing commission fields; add weekly ride/rating rules and tier upgrades so drivers see and feel the benefit (more money in their pocket).

---

## Roadmap (Order of Work)

| Phase | What | Notes |
|-------|------|--------|
| **Now** | Real-time driver–rider testing | `NEXT_PUBLIC_DEV_AUTO_APPROVE=true`; test request → match → accept. |
| **Next** | Rider: ETA + distance to driver | After MATCHED, show “Driver X min away” / “Y km”; driver location or ETA from backend. |
| **Next** | Driver: bonus areas + default to bonus areas | Define zones (e.g. GeoJSON or center+radius); show on driver map; “Go to bonus area” or default suggested position when going online. |
| **Next** | Live map sync | Rider and driver see each other’s position (or ETA) in real time (Realtime or polling). |
| **Later** | M-Pesa | Integrate when API/codes available; rider pay + driver payout in MZN. |
| **Later** | Tier logic & instant payout | Silver/Gold rules; instant payout for Gold; surface in driver app. |

---

## Summary

- **Testing:** Use `NEXT_PUBLIC_DEV_AUTO_APPROVE=true` so drivers are approved and you can run real-time driver–rider tests.
- **Vision:** Lyft/Uber-style sync (ETA, distance, who’s near for rider; bonus areas and default lead for driver), Mozambique launch, M-Pesa when ready, Bronze/Silver/Gold tiers to put more money in drivers’ hands and outcompete incumbents.
- This doc is the single place to align the client’s expectations with what we build and deliver.
