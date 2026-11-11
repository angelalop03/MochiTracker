-- Aviso para preguntar si ha llegado la regla cuando se esperaba.
-- Solo amplía los tipos de aviso que se pueden registrar.

alter table public.notification_log drop constraint notification_log_kind_check;
alter table public.notification_log
  add constraint notification_log_kind_check check (kind in ('daily', 'phase_change', 'period_check'));
