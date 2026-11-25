-- Día 10 (incidente "Pude registrar dos productos con el mismo SKU").
-- La regla anterior, unique (user_id, sku), distingue mayúsculas: 'CUA-100' y 'cua-100'
-- contaban como SKUs distintos. Este índice hace que el SKU sea único por usuario
-- sin importar mayúsculas ni espacios al inicio o al final, aunque alguien inserte
-- directo por la API sin pasar por la web.
-- Antes de aplicarlo hay que resolver las filas que ya incumplen la regla
-- (si no, el índice falla con "could not create unique index").
create unique index if not exists productos_user_sku_normalizado_unico
  on public.productos (user_id, upper(btrim(sku)));
