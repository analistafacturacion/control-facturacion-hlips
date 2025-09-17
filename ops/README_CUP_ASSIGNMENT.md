Instrucciones para agregar la nueva tabla `cup_assignment` y probar los endpoints /api/cup-assignments

1) Crear la tabla en la base de datos de producción
   - Conéctate a la DB Postgres (por ejemplo usando psql o el panel de la plataforma) y ejecuta:
     \i ops/sql/create_cup_assignment_table.sql

   - Alternativamente copia/pega el contenido de `ops/sql/create_cup_assignment_table.sql` y ejecútalo.

2) Reiniciar el servicio backend en la plataforma de despliegue (Render u otra) para asegurarte que el proceso carga las nuevas entidades.

3) Probar los endpoints (desde tu máquina o Postman):
   - Listar: GET https://<TU_HOST>/api/cup-assignments
   - Crear: POST https://<TU_HOST>/api/cup-assignments
     Body JSON ejemplo:
     {
       "cupId": 1,
       "aseguradoraId": 2,
       "sedeId": 3,
       "notas": "Asignación inicial"
     }

   - Obtener por id: GET https://<TU_HOST>/api/cup-assignments/1
   - Actualizar: PUT https://<TU_HOST>/api/cup-assignments/1
   - Eliminar: DELETE https://<TU_HOST>/api/cup-assignments/1

4) Verificar en la base de datos que la fila se creó correctamente:
   SELECT * FROM cup_assignment LIMIT 10;

Notas:
- El modelo guarda solo ids (cupId, aseguradoraId, sedeId) como enteros. Si deseas relaciones TypeORM completas (FOREIGN KEYs y joins automáticos), puedo actualizar la entidad para tener relaciones con Aseguradora, Sede y Cup.
- Si tu despliegue usa migraciones TypeORM en lugar de ejecutar SQL manualmente, puedo generar una migración TypeORM en `src/migration`.

Adicional: la tabla `cup` debe existir antes de insertar o consultar CUPS. Si al probar ves errores como `relation "cup" does not exist`, ejecuta primero:

  \i ops/sql/create_cup_table.sql

y luego ejecuta `ops/sql/create_cup_assignment_table.sql` si aún no existe.

Después reinicia el backend y vuelve a probar.
