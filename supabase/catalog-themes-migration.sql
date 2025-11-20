-- Add catalog theme columns to profiles table
-- These columns store the selected theme ID for each catalog type

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS catalog_theme_physics TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS catalog_theme_info TEXT DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.catalog_theme_physics IS 'Selected theme ID for physics catalog (cursuri page). Values: default, theme-1, theme-2, theme-3, theme-4';
COMMENT ON COLUMN public.profiles.catalog_theme_info IS 'Selected theme ID for informatica catalog (probleme page). Values: default, theme-1, theme-2, theme-3, theme-4';

