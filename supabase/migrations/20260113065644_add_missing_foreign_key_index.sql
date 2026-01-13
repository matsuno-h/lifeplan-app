/*
  # Add Missing Foreign Key Index

  ## 1. Problem
  The `plan_collaborators` table has a foreign key `plan_collaborators_owner_id_fkey` 
  without a covering index, which can lead to suboptimal query performance when:
  - Joining tables on owner_id
  - Deleting users (CASCADE operations need to find all related collaborators)
  - Filtering collaborators by owner

  ## 2. Solution
  Add index on `owner_id` column to improve query performance and support the foreign key efficiently.

  ## 3. Performance Impact
  - Speeds up queries filtering by owner_id
  - Improves CASCADE DELETE performance when users are deleted
  - Optimizes JOIN operations involving owner lookups
*/

-- Add index for owner_id foreign key
CREATE INDEX IF NOT EXISTS idx_plan_collaborators_owner_id ON plan_collaborators(owner_id);