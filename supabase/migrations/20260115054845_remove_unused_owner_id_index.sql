/*
  # Remove unused owner_id index from plan_collaborators

  1. Performance Optimization
    - Removes unused index `idx_plan_collaborators_owner_id`
    - This index was not being used by any queries in the application
    - Reduces storage overhead and improves write performance

  2. Analysis
    - Application queries filter by:
      - `plan_id` (has index: idx_plan_collaborators_plan_id)
      - `collaborator_id` (has index: idx_plan_collaborators_collaborator_id)  
      - `collaborator_email` (has index: idx_plan_collaborators_collaborator_email)
    - No queries filter by `owner_id` directly
    - RLS policies check `owner_id` but benefit from other indexes
    - Foreign key on `owner_id` already provides referential integrity

  3. Important Notes
    - This change improves performance by reducing index maintenance overhead
    - All necessary queries remain fully indexed and performant
    - RLS security policies remain fully functional
*/

-- Drop the unused index on owner_id
DROP INDEX IF EXISTS idx_plan_collaborators_owner_id;