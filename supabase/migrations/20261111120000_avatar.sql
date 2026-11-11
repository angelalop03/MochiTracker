-- Foto de perfil: uno de los Mochis predeterminados. Sin subir imágenes.

alter table public.profiles
  add column avatar text
  check (avatar is null or avatar in ('clasico', 'invierno', 'primavera', 'verano', 'otono', 'dormilon', 'gatito', 'estrella'));
