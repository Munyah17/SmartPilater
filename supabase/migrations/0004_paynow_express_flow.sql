-- ============================================================================
-- SmartPilater · Paynow Express checkout
--
-- Paynow's "remotetransaction" (Express/mobile) API pushes a USSD PIN
-- prompt directly to the payer's phone — no redirect to a Paynow-hosted
-- page. That makes it a push rail, not scan-to-pay; correct the flow
-- metadata set in 0001_init.sql.
-- ============================================================================

update payment_providers set flow = 'push' where id = 'paynow';
