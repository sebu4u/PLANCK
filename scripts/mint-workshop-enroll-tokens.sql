-- Mint opaque workshop enrollment tokens for marketing email campaigns
-- Run this script directly in Supabase SQL Editor or via psql
-- No CRON_SECRET required - tokens are stored in workshop_enroll_tokens table

-- Example 1: Generate a single enrollment token for one user + workshop
-- Replace with actual user_id and workshop_id
INSERT INTO public.workshop_enroll_tokens (token, user_id, workshop_id)
VALUES (
  gen_random_uuid()::text,
  'REPLACE_WITH_USER_UUID',
  'REPLACE_WITH_WORKSHOP_UUID'
)
RETURNING 
  token,
  user_id,
  workshop_id,
  expires_at,
  'https://www.planck.academy/api/pregatire/' || workshop_id || '/enroll?token=' || token as enroll_url;

-- Example 2: Batch generate tokens for multiple users for the same workshop
-- Useful for MailerLite campaigns - one token per user
-- Replace WORKSHOP_UUID with your workshop ID

/*
WITH target_users AS (
  SELECT 
    u.id as user_id,
    u.email
  FROM auth.users u
  WHERE u.email IN (
    'user1@example.com',
    'user2@example.com',
    'user3@example.com'
    -- Add more emails here
  )
)
INSERT INTO public.workshop_enroll_tokens (token, user_id, workshop_id)
SELECT 
  gen_random_uuid()::text,
  tu.user_id,
  'REPLACE_WITH_WORKSHOP_UUID'::uuid
FROM target_users tu
ON CONFLICT DO NOTHING
RETURNING 
  token,
  user_id,
  workshop_id,
  expires_at,
  (SELECT email FROM auth.users WHERE id = user_id) as user_email,
  'https://www.planck.academy/api/pregatire/' || workshop_id || '/enroll?token=' || token as enroll_url;
*/

-- Example 3: Generate tokens for all users who opted into Planck Week
-- (Replace with your actual lead/subscriber logic)

/*
WITH planck_week_users AS (
  SELECT DISTINCT
    pwl.email,
    u.id as user_id
  FROM public.planck_week_leads pwl
  JOIN auth.users u ON u.email = pwl.email
  WHERE pwl.subjects @> ARRAY['matematica']::text[]
    AND pwl.claimed_at IS NOT NULL
)
INSERT INTO public.workshop_enroll_tokens (token, user_id, workshop_id)
SELECT 
  gen_random_uuid()::text,
  pwu.user_id,
  'REPLACE_WITH_WORKSHOP_UUID'::uuid
FROM planck_week_users pwu
ON CONFLICT DO NOTHING
RETURNING 
  token,
  user_id,
  workshop_id,
  expires_at,
  (SELECT email FROM auth.users WHERE id = user_id) as user_email,
  'https://www.planck.academy/api/pregatire/' || workshop_id || '/enroll?token=' || token as enroll_url;
*/

-- Example 4: Check existing tokens for a workshop
/*
SELECT 
  t.token,
  t.user_id,
  u.email as user_email,
  t.workshop_id,
  w.title as workshop_title,
  t.created_at,
  t.used_at,
  t.expires_at,
  CASE 
    WHEN t.expires_at < now() THEN 'expired'
    WHEN t.used_at IS NOT NULL THEN 'used'
    ELSE 'active'
  END as status,
  'https://www.planck.academy/api/pregatire/' || t.workshop_id || '/enroll?token=' || t.token as enroll_url
FROM public.workshop_enroll_tokens t
JOIN auth.users u ON u.id = t.user_id
JOIN public.workshops w ON w.id = t.workshop_id
WHERE t.workshop_id = 'REPLACE_WITH_WORKSHOP_UUID'
ORDER BY t.created_at DESC;
*/

-- Example 5: Export tokens as CSV for MailerLite import
-- Copy this to CSV and import to MailerLite with columns: email, enroll_url
/*
SELECT 
  u.email,
  'https://www.planck.academy/api/pregatire/' || t.workshop_id || '/enroll?token=' || t.token as enroll_url
FROM public.workshop_enroll_tokens t
JOIN auth.users u ON u.id = t.user_id
WHERE t.workshop_id = 'REPLACE_WITH_WORKSHOP_UUID'
  AND t.expires_at > now()
ORDER BY u.email;
*/

-- Example 6: Revoke/delete tokens (if needed)
/*
DELETE FROM public.workshop_enroll_tokens
WHERE workshop_id = 'REPLACE_WITH_WORKSHOP_UUID'
  AND user_id = 'REPLACE_WITH_USER_UUID';
*/

-- Notes:
-- 1. Tokens expire after 7 days by default (set in expires_at column)
-- 2. Tokens are idempotent - can be used multiple times
-- 3. After first use, used_at is set but token remains valid until expires_at
-- 4. Workshop enrollment is free (no energy deduction)
-- 5. If workshop is full, max_seats is auto-bumped by +10
