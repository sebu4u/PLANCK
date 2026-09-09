# Workshop Enrollment Token Generation

Two ways to generate one-click workshop enrollment links for marketing emails:

## Option 1: HMAC Tokens (requires CRON_SECRET)

If you have access to `CRON_SECRET` or `WORKSHOP_CONFIRM_SECRET` in your environment:

```typescript
import { mintEnrollToken } from "@/lib/pregatire/confirm-token"

const token = mintEnrollToken(userId, workshopId)
const enrollUrl = `https://www.planck.academy/api/pregatire/${workshopId}/enroll?token=${encodeURIComponent(token)}`
```

**Pros**: No database writes, cryptographically signed  
**Cons**: Requires secret in environment (not available on ops machines)

## Option 2: Opaque DB Tokens (no secret required) ✅

Generate tokens directly in the database using SQL (see `mint-workshop-enroll-tokens.sql`).

**Pros**: No secret required, can run from Supabase SQL Editor  
**Cons**: Requires database INSERT access

### Quick Start

1. Open Supabase SQL Editor
2. Run one of the example queries from `mint-workshop-enroll-tokens.sql`
3. Copy the generated `enroll_url` values
4. Import to MailerLite as custom field or use in email template

### Example Workflow for MailerLite Campaign

```sql
-- Step 1: Generate tokens for all target users
WITH target_users AS (
  SELECT id as user_id, email
  FROM auth.users
  WHERE email IN (
    'user1@example.com',
    'user2@example.com'
  )
)
INSERT INTO public.workshop_enroll_tokens (token, user_id, workshop_id)
SELECT 
  gen_random_uuid()::text,
  tu.user_id,
  '550e8400-e29b-41d4-a716-446655440000'::uuid  -- Your workshop ID
FROM target_users tu
RETURNING 
  (SELECT email FROM auth.users WHERE id = user_id) as email,
  'https://www.planck.academy/api/pregatire/' || workshop_id || '/enroll?token=' || token as enroll_url;
```

**Step 2**: Copy results to CSV with columns: `email`, `enroll_url`

**Step 3**: Import to MailerLite as subscribers with custom field `enroll_url`

**Step 4**: Use `{$enroll_url}` in email template button/link

### Token Properties

- **Expiration**: 7 days from creation (configurable in migration)
- **Idempotent**: Can be used multiple times (first use sets `used_at`)
- **Free enrollment**: No energy deduction
- **Auto-capacity**: Bumps workshop `max_seats` by +10 if full
- **Security**: Service role only (RLS policy)

### Checking Token Status

```sql
SELECT 
  t.token,
  u.email,
  w.title as workshop,
  t.created_at,
  t.used_at,
  t.expires_at,
  CASE 
    WHEN t.expires_at < now() THEN 'expired'
    WHEN t.used_at IS NOT NULL THEN 'used'
    ELSE 'active'
  END as status
FROM public.workshop_enroll_tokens t
JOIN auth.users u ON u.id = t.user_id
JOIN public.workshops w ON w.id = t.workshop_id
WHERE t.workshop_id = 'YOUR_WORKSHOP_ID'
ORDER BY t.created_at DESC;
```

### Revoking Tokens

```sql
DELETE FROM public.workshop_enroll_tokens
WHERE token = 'token-to-revoke';
```

## Token Format Detection

The enroll route automatically detects token type:

- **Contains `:`** → HMAC token (format: `userId:workshopId:signature`)
- **No `:`** → Opaque token (lookup in `workshop_enroll_tokens` table)

Both token types work with the same endpoint: `/api/pregatire/[workshopId]/enroll?token=...`
