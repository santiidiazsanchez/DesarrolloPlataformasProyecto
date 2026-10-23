# Manual de usuario

Plataforma de incidentes de ciberseguridad · versión 1.0.0 · 23 de octubre de 2026

Dirección: https://incidentes-web-0eqn.onrender.com

La plataforma sirve para registrar incidentes de seguridad y seguir su estado hasta que se resuelven. Cada persona ve solo las acciones que su rol permite:

| Rol | Puede |
| --- | --- |
| Analista | Consultar y registrar incidentes |
| Supervisor | Consultar y actualizar incidentes |
| Administrador | Consultar, registrar, actualizar y eliminar |

Cuentas de demostración: `analista@incidentes.local`, `supervisor@incidentes.local` y `admin@incidentes.local`. Las contraseñas están en el informe de entrega. Los datos son ficticios: no registres información real ni contraseñas.

## 1. Iniciar sesión

**Objetivo:** entrar a la plataforma con tu cuenta.
**Antes:** tener correo y contraseña.

1. Abre la dirección de la plataforma. Verás el candado de conexión segura en el navegador.
2. Escribe tu correo y tu contraseña.
3. Presiona **Ingresar**.

**Resultado:** aparece el panel con tu nombre y rol arriba a la derecha.

![Inicio de sesión](../evidencias/Unidad%208/17-login-produccion.png)

**Si algo falla:**
- *Correo o contraseña incorrectos.* Revisa los datos. El mensaje es el mismo para cualquier error, por seguridad.
- Después de 5 intentos fallidos debes esperar 15 minutos.
- Si la primera carga tarda cerca de un minuto, el servidor estaba en reposo; espera y vuelve a intentar.

## 2. Consultar y filtrar incidentes

**Objetivo:** encontrar un incidente y revisar sus datos.
**Antes:** haber iniciado sesión con cualquier rol.

1. En **Incidentes reportados** verás 10 incidentes por página.
2. Usa **Filtrar por prioridad** y **Filtrar por estado**. Se pueden combinar.
3. Presiona **Ver detalle** en una tarjeta para leer la descripción, el correo de contacto y la evidencia.
4. Usa **Anterior** y **Siguiente** para cambiar de página, y **Actualizar** para volver a consultar.

**Resultado:** la lista y el contador muestran solo los incidentes que cumplen los filtros.

![Panel del analista](../evidencias/Unidad%208/18-panel-analista.png)

**Si algo falla:** si aparece *No hay incidentes con estos filtros*, vuelve a "Todas las prioridades" y "Todos los estados". Si la consulta falla, presiona **Reintentar consulta**.

![Filtro sin resultados](../evidencias/Unidad%208/19c-filtros.png)

## 3. Registrar un incidente

**Objetivo:** dejar constancia de un incidente nuevo.
**Antes:** iniciar sesión como analista o administrador.

1. En **Registrar un incidente** completa los campos:
   - **Título:** entre 5 y 100 caracteres; no puede repetirse.
   - **Tipo de incidente:** phishing, malware, acceso no autorizado, fallo de disponibilidad o vulnerabilidad.
   - **Fecha del incidente:** no puede ser futura.
   - **Prioridad:** alta si hay un servicio detenido o información expuesta; media si la afectación es parcial; baja si el impacto es menor.
   - **Estado:** normalmente "Registrado".
   - **Descripción:** entre 30 y 1000 caracteres, con los hechos observados.
   - **Correo de contacto.**
   - **Evidencia (opcional):** un PNG, JPG o PDF de hasta 2 MB. Solo se guarda el nombre del archivo.
2. Presiona **Registrar incidente**.

**Resultado:** aparece el mensaje *INC-006 registrado correctamente.* (con el código que corresponda) y el incidente se ve al final de la lista.

![Incidente registrado](../evidencias/Unidad%208/21-registro-analista.png)

**Si algo falla:**
- El navegador avisa sobre el campo antes de enviar, por ejemplo si el título tiene menos de 5 caracteres.
- Si la plataforma rechaza los datos, aparece *Revisa los campos marcados en el formulario.* y cada campo muestra su mensaje. Lo escrito no se borra.
- Si el título ya existe, cámbialo para distinguir el caso.

![Validación del formulario](../evidencias/Unidad%208/20-validacion.png)

## 4. Actualizar el seguimiento

**Objetivo:** cambiar el estado u otros datos de un incidente.
**Antes:** iniciar sesión como supervisor o administrador.

1. El supervisor ve **Actualizar el seguimiento** en lugar del formulario de registro. En la lista, presiona **Editar** en el incidente.
2. El formulario se llena con sus datos. Cambia el **Estado** (por ejemplo, a "En revisión" o "Resuelto") o lo que haga falta.
3. Presiona **Guardar cambios**, o **Cancelar edición** para salir sin guardar.

![Panel del supervisor](../evidencias/Unidad%208/19-panel-supervisor.png)

![Edición del supervisor](../evidencias/Unidad%208/22-edicion-supervisor.png)

**Resultado:** aparece *INC-006 actualizado.* y la tarjeta muestra el nuevo estado. El cambio se conserva aunque el servidor se reinicie.

![Estado actualizado](../evidencias/Unidad%208/22b-estado-en-revision.png)

## 5. Eliminar un incidente

**Objetivo:** quitar un incidente registrado por error.
**Antes:** iniciar sesión como administrador.

1. Presiona **Eliminar** en la tarjeta del incidente.
2. Confirma en el mensaje *¿Eliminar INC-001: …?* (con el código y el título del incidente).

**Resultado:** aparece *INC-001 eliminado.* y el incidente sale de la lista. No se puede deshacer.

![Confirmación](../evidencias/Unidad%208/26-confirmar-eliminacion.png)

![Panel del administrador](../evidencias/Unidad%208/27-panel-admin.png)

**Si algo falla:** si tu rol cambió mientras usabas la plataforma, verás *Tus permisos cambiaron: la vista se actualizó con tu rol actual.* y el botón desaparece.

## 6. Cerrar sesión

Presiona **Cerrar sesión** arriba a la derecha. La sesión también termina sola a los 30 minutos o al cerrar la pestaña; entonces verás *Tu sesión terminó. Inicia sesión de nuevo.* Si estabas llenando el formulario, al volver a entrar con la misma cuenta aparece *Recuperamos los datos que no se guardaron. Revísalos y vuelve a enviarlos.*

## 7. Usar desde el celular

La plataforma se adapta a pantallas pequeñas: el formulario y la lista se ubican uno debajo del otro.

| Formulario | Lista y ayuda |
| --- | --- |
| ![Vista en celular, formulario](../evidencias/Unidad%208/29-movil.png) | ![Vista en celular, lista](../evidencias/Unidad%208/29b-movil.png) |

## 8. Ayuda dentro de la plataforma

Al final del panel, **Antes de registrar** resume cómo elegir la prioridad y qué puede hacer cada rol. **Ver guía visual para reconocer phishing** muestra un correo de ejemplo con las cuatro señales más comunes.

![Ayuda](../evidencias/Unidad%208/30-ayuda.png)

## Problemas frecuentes

| Problema | Qué hacer |
| --- | --- |
| La página tarda casi un minuto la primera vez | El servidor gratuito estaba en reposo. Espera y recarga |
| *No se pudo conectar con la API* | Revisa tu conexión y vuelve a intentar en un minuto |
| No veo el botón Eliminar o Editar | Tu rol no tiene ese permiso |
| *Demasiados intentos de inicio de sesión* | Espera 15 minutos |
| El formulario no se envía | Lee el aviso del navegador o el mensaje debajo de cada campo |
