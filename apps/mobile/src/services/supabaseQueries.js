// Compatibility barrel for existing imports.
//
// New code should import from the domain module that owns the operation:
// @/services/supabase/profile
// @/services/supabase/health
// @/services/supabase/community

export * from './supabase/profile';
export * from './supabase/hydration';
export * from './supabase/health';
export * from './supabase/medications';
export * from './supabase/appointments';
export * from './supabase/streak';
export * from './supabase/drug-info';
export * from './supabase/goals';
export * from './supabase/facilities';
export * from './supabase/emergency-contacts';
export * from './supabase/community';
export * from './supabase/education';
