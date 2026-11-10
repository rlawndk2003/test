alter table public.readings
add column if not exists value double precision;

notify pgrst, 'reload schema';
