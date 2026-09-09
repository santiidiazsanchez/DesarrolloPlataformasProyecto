# Justificación técnica realizada en este proyecto

## Plataforma y arquitectura (1.1, 1.2 y 1.3)

El proyecto presenta la primera interfaz de una plataforma para registrar y consultar incidentes de ciberseguridad. Relaciona usuarios, información y un proceso concreto: describir un evento, clasificarlo y revisar su detalle. Aplica el panorama del desarrollo en plataformas mediante una separación básica entre contenido, presentación y comportamiento. Se eligió una plataforma web por su acceso desde distintos navegadores. Una aplicación de escritorio requeriría instalación, mientras una híbrida añadiría empaquetado para otros entornos. Ninguna de esas necesidades forma parte de esta primera entrega.

En la arquitectura cliente-servidor, el navegador muestra la interfaz y el servidor procesa y almacena información. Este prototipo desarrolla la capa del cliente, conforme al alcance de la Unidad 1. Los nombres de los campos permiten preparar una futura petición POST para registrar incidentes y una petición GET para consultarlos. Actualmente, el registro modifica únicamente la página: no existe una API ni una base de datos. Los ejemplos y registros nuevos son temporales y se restablecen al recargar.

## Herramientas de desarrollo (1.4)

La solución contiene HTML, JavaScript y hojas CSS externas, editables con Visual Studio Code. El repositorio Git existente permite incorporar control de versiones. Tailwind CSS 4.3.3 se compila mediante su CLI y pnpm; las versiones quedan fijadas en package.json y pnpm-lock.yaml. La verificación utiliza Chrome y Edge, distintos anchos de pantalla, teclado y una auditoría automática con axe. Las capturas documentan comportamientos reales. El CSS compilado se entrega incluido: abrir index.html no requiere instalaciones ni internet.

## Semántica y formularios (1.5, 2.1 y 2.2)

HTML5 organiza el documento con header para la identidad, nav para la navegación, main para la operación principal, section para registro y listado, aside para ayuda y footer para identificar la unidad. Existe un único h1; los títulos h2 y h3 mantienen una jerarquía coherente. Cada incidente es un article. Su vista de detalle utiliza details y summary, controles nativos que permiten abrir y cerrar información con teclado, sin programar ventanas adicionales.

El formulario agrupa los datos mediante fieldset y legend. Cada control tiene un label asociado por for e id. Los tipos email, date y file corresponden al dato solicitado; select limita las opciones de clasificación y textarea permite describir lo sucedido. Las ayudas se relacionan mediante aria-describedby. La obligatoriedad se explica por escrito y la evidencia aparece identificada como opcional. Esta organización reduce ambigüedades al capturar la información.

## Validación y accesibilidad (2.3 y 2.4)

La validación nativa aplica required, minlength, maxlength y un límite de fecha. Comprueba campos vacíos, correo y longitudes. El JavaScript añade mensajes con setCustomValidity para títulos o descripciones insuficientes después de quitar espacios extremos, y para archivos con extensión o tamaño no admitidos. Los errores aparecen junto al campo, con aria-invalid. El archivo no se carga: únicamente se muestra su nombre. Estas comprobaciones del navegador deberán repetirse en el servidor cuando exista almacenamiento real.

Se aplican los principios WCAG de contenido perceptible, operable, comprensible y robusto mediante contraste, etiquetas, instrucciones y controles nativos. Las prioridades incluyen texto además de color. El enlace de salto permite llegar al contenido; el foco es visible y sigue el orden del documento. La confirmación del registro usa role="status". El candado proporcionado en cerrar.svg tiene relleno blanco y alt vacío por ser decorativo. Los datos ingresados se muestran con textContent, evitando interpretarlos como HTML. Las pruebas automáticas apoyan la revisión, pero no equivalen a una certificación integral de accesibilidad.

## CSS y diseño adaptable (3.1, 3.2 y 3.3)

La presentación se reparte entre tailwind.min.css, generado automáticamente, y estilos.css, que conserva los ajustes de formularios y accesibilidad. El modelo de caja utiliza padding, border y margin, con box-sizing: border-box. Las clases p-4, border y rounded-lg organizan las tarjetas. Flexbox se aplica con flex, flex-wrap y gap-4; Grid distribuye formulario y listado con grid y grid-cols-1. Se mantienen anchos flexibles y unidades rem.

El diseño parte del móvil: una columna y botón de ancho completo. Desde 768 píxeles, md:grid-cols-2 organiza dos paneles iguales; desde 1024 píxeles, lg:grid-cols-[1.15fr_1fr] amplía el formulario y lg:grid-cols-2 distribuye sus campos en dos columnas. Tailwind genera las media queries; estilos.css complementa la tipografía móvil. Se conserva el orden de lectura. Las evidencias muestran escritorio, tablet y móvil, incluyendo la comprobación del texto ampliado al 200 % sin desborde.

## Frameworks CSS (3.4)

Bootstrap ofrece componentes y una grilla preparada; Tailwind permite componer estilos mediante utilidades. Se aplica Tailwind directamente en el HTML para hacer visibles los fundamentos evaluados, conservando CSS propio para reglas específicas. Se omite Preflight para mantener la apariencia nativa de los controles. La compilación incluye solamente las clases utilizadas y permite funcionar sin CDN. Para actualizar los estilos después de editar las clases se ejecuta pnpm install y luego pnpm build. Bootstrap no se incorpora porque duplicaría la herramienta elegida.
