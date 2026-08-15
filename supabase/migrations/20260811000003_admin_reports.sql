create table public.reports (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    category text not null check (category in ('Financial', 'Operations', 'Fleet', 'Analytics')),
    period text not null,
    status text not null check (status in ('ready', 'processing', 'scheduled')) default 'ready',
    size_bytes bigint default 0,
    file_data jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_by uuid references auth.users(id) on delete set null
);

-- RLS policies
alter table public.reports enable row level security;

create policy "Admins can do everything on reports" on public.reports
    for all using (
        exists (
            select 1 from public.user_roles ur 
            where ur.user_id = auth.uid() 
            and ur.role = 'admin'
        )
    );
