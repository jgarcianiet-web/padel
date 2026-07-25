-- Circuito Pádel — datos de arranque del directorio de clubes (OPCIONAL).
--
-- Estos clubes son inventados y solo sirven para que la app tenga algo que
-- enseñar el primer día: sustitúyelos por los clubes reales de tu zona antes
-- de abrir la liga. Lo que de verdad importa aquí es `pistas_individuales`,
-- porque la liga individual solo puede celebrarse en clubes con al menos una.

insert into public.clubes
  (nombre, ciudad, direccion, pistas_dobles, pistas_individuales, indoor, notas)
values
  ('Club de ejemplo Norte',  'Madrid', 'Calle de ejemplo, 1',  8, 1, true,
   'EJEMPLO — sustituir. La pista individual se reserva por teléfono.'),
  ('Club de ejemplo Centro', 'Madrid', 'Avenida de ejemplo, 22', 6, 0, false,
   'EJEMPLO — sustituir.'),
  ('Club de ejemplo Sur',    'Madrid', 'Plaza de ejemplo, 3',   10, 2, true,
   'EJEMPLO — sustituir.')
on conflict (nombre, ciudad) do nothing;
