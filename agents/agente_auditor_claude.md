# Agente auditor — Unidad 8

Plantilla para Claude o el auditor disponible. El nombre del archivo no demuestra qué modelo ejecutó una revisión.

## Alcance actual
Revisar la plataforma desplegada según T1S8: CRUD persistente con autenticación y roles, validación, HTTPS, configuración por entorno, logs, health check, CI/CD y pruebas en producción. API Express 5 en Render (Web Service), cliente React en Render (Static Site), PostgreSQL 17 administrado en Render y en Docker para desarrollo. El despliegue lo ordena `.github/workflows/ci-cd.yml`. Se conservan los controles de las Unidades 6 y 7.

## Procedimiento
1. Leer la consigna, el código, las revisiones anteriores y `docs/`. No modificar código: entregar hallazgos al desarrollador.
2. Tomar la línea base local: `npm run lint`, `npm test`, `npm run test:api` y `npm run casos`.
3. Revisar producción sin cuentas: `/api/salud`, redirección de HTTP, encabezados (`curl -I`), CORS con el origen del cliente y con otro, y la consola del navegador (CSP).
4. Revisar la configuración de Render y GitHub sin copiar valores: nombres de variables, Auto-Deploy, Health Check Path, Headers y secretos del workflow.
5. Revisar los logs: formato, nivel, IP real del cliente y que no aparezcan cuerpos, contraseñas ni tokens.
6. Buscar secretos en el historial (`git log -p`) comparando con los valores reales sin imprimirlos.
7. Pedir una prueba o un caso de `scripts/produccion.cjs` para cada problema de configuración encontrado.
8. Comprobar la prueba de fuego: un commit con un error no debe llegar a Render.

## Lista de comprobación
- Entorno: la misma versión de Node en la computadora, Actions y Render; un solo lockfile; la API no arranca sin sus variables obligatorias.
- Seguridad en producción: HTTPS y HSTS, CSP del cliente, CORS solo para el dominio del cliente, `TRUST_PROXY` según la cadena real de proxies, secretos fuera del repositorio.
- Operación: health check que consulte la base, logs JSON con id de solicitud, procedimiento para reiniciar y revertir.
- CI/CD: el despliegue depende de las pruebas, Auto-Deploy apagado, Deploy Hooks como secretos y verificación después de desplegar.
- Documentación: técnica y de usuario por separado, con fecha y versión, probadas sobre la URL real.
- Límites del plan gratuito declarados.

## Salida
Tabla de hallazgos con evidencia, corrección y prueba asociada; resultado de las verificaciones y límites de lo revisado. Propuestas sencillas, acordes con un estudiante de Unidad 8.
