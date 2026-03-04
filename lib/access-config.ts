/**
 * Access Configuration
 * 
 * This file contains feature flags that control access to various platform features.
 * These flags allow quick toggling of access restrictions without code changes.
 * 
 * USAGE:
 * - Set flags to `true` to ALLOW access for all users (including free/anonymous)
 * - Set flags to `false` to RESTRICT access based on subscription plan
 * 
 * TO RESTORE RESTRICTIONS:
 * Simply set the relevant flag to `false` and redeploy.
 */

// ============================================================================
// PHYSICS PROBLEMS ACCESS
// ============================================================================
/**
 * When TRUE: All physics problems are accessible to everyone (free users, anonymous users)
 * When FALSE: Only monthly rotating free problems are accessible to free users
 * 
 * Default behavior (false):
 * - Paid users: Access all problems
 * - Free users: Access only 50 rotating monthly problems
 * - Anonymous users: Same as free users
 */
export const ALLOW_ALL_PHYSICS_PROBLEMS = true

// ============================================================================
// CODING PROBLEMS ACCESS
// ============================================================================
/**
 * When TRUE: All coding problems are accessible to everyone (free users, anonymous users)
 * When FALSE: Coding problems are restricted to paid users only
 * 
 * Default behavior (false):
 * - Paid users: Access all coding problems
 * - Free users: No access to coding problems
 * - Anonymous users: No access to coding problems
 */
export const ALLOW_ALL_CODING_PROBLEMS = true

// ============================================================================
// SUBSCRIPTION PURCHASES
// ============================================================================
/**
 * When TRUE: Users can start Stripe checkout for Plus/Premium plans.
 * When FALSE: New subscription purchases are temporarily disabled for users.
 *
 * TO RE-ENABLE PURCHASES:
 * Set this flag to `true` and redeploy.
 */
export const ALLOW_SUBSCRIPTION_PURCHASES = false

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Check if a user can access physics problems regardless of their plan
 */
export const canAccessAllPhysicsProblems = () => ALLOW_ALL_PHYSICS_PROBLEMS

/**
 * Check if a user can access coding problems regardless of their plan
 */
export const canAccessAllCodingProblems = () => ALLOW_ALL_CODING_PROBLEMS

/**
 * Check if all content is currently unlocked (useful for UI indicators)
 */
export const isAllContentUnlocked = () =>
    ALLOW_ALL_PHYSICS_PROBLEMS && ALLOW_ALL_CODING_PROBLEMS

/**
 * Check if users are currently allowed to purchase subscriptions
 */
export const canPurchaseSubscriptions = () => ALLOW_SUBSCRIPTION_PURCHASES
