alter table public.shipments
add column ai_delay_risk double precision default 0.0,
add column ai_delay_reason text;
