grant select on table public.readings to anon;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'readings'
      and policyname = 'Allow anon to read readings'
  ) then
    create policy "Allow anon to read readings"
      on public.readings
      for select
      to anon
      using (true);
  end if;
end
$$;
