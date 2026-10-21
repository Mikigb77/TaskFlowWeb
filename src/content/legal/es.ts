import type { LegalCopy } from "./types";

export const es: LegalCopy = {
  privacy: {
    title: "Política de privacidad de TaskFlow",
    description:
      "Política de privacidad de la app y la web de TaskFlow: cuenta, tareas, voz, archivos y derechos.",
    summary: [
      "No vendemos tus datos ni te mostramos anuncios.",
      "Tus palabras solo van a la IA de Google cuando pides a TaskFlow que las convierta en tareas.",
      "Puedes pedir una copia de tus datos o eliminarlos cuando quieras.",
    ],
    sections: [
      {
        id: "controller",
        title: "1. Responsable del tratamiento",
        company: true,
        paragraphs: [
          "GARBAR, IN-TEC, S.L. es la operadora de TaskFlow y responsable de los datos descritos aquí. TaskFlow es el nombre del producto. Esta política abarca la app, cuentas y servicios en la nube, invitaciones y recuperación de acceso, y taskflow.garbar.tech. La demostración web es independiente de las cuentas de la app.",
          "Esta información no solicita un consentimiento general. Las finalidades que lo necesiten deben contar con un permiso o consentimiento específico en el momento adecuado.",
          "Utiliza taskflow@garbar.tech para consultas generales y taskflow.support@garbar.tech para soporte, derechos de privacidad y eliminación de cuentas. Ambos llegan al buzón de la empresa. Los correos automáticos (invitaciones, códigos para confirmar el correo y recuperación de la contraseña) se envían desde taskflow.noreply@garbar.tech; ese remitente no se supervisa y las respuestas se dirigen a soporte. No necesitas utilizar un asunto o formulario concreto para ejercer tus derechos.",
        ],
        contact: "privacy",
      },
      {
        id: "data",
        title: "2. Datos que tratamos",
        bullets: [
          "Cuenta: correo electrónico, nombre opcional, zona horaria, identificador interno, tu contraseña, guardada de forma que no se puede volver a leer, y registros de acceso/sesión. Si entras con Google, recibimos tu identificador de Google, tu correo, si Google lo ha verificado y tu nombre de pila, que pasa a ser tu nombre en TaskFlow si no has puesto otro. No guardamos tu foto. Si te registras con contraseña, confirmas tu correo con un código de 6 cifras que caduca a los 30 minutos. No recibimos tu contraseña de Google ni solicitamos acceso a Gmail o Drive.",
          "Organización: tareas, notas, fechas, prioridades, pasos, repeticiones, historial de finalización, proyectos, grupos, asignaciones y cambios de sincronización. La app guarda copias locales y sincroniza el contenido de la cuenta con nuestro servidor.",
          "Archivos: los documentos o imágenes que seleccionas, nombre, tamaño, un código de control que detecta archivos dañados, titularidad y tarea relacionada. Se suben cuando utilizas la copia en la nube o el uso compartido. Pueden incluir datos personales o metadatos incrustados.",
          "Colaboración: miembros, roles, correos de invitación, remitentes y estado de aceptación. Si te invita alguien antes de registrarte, esa persona es la fuente de tus datos de invitación. Los usamos para tramitarla, no para incluirte en publicidad.",
          "Voz e IA: audio o texto enviado, el texto de lo que dijiste, tareas sugeridas, idioma, zona horaria, fecha de referencia y nombres pertinentes de proyectos/miembros para interpretar la petición. También contadores de uso y estado para aplicar límites.",
          "Suscripción: identificador de facturación opaco, producto, compra, renovación, caducidad, referencias de transacción y estado de acceso. RevenueCat y la tienda correspondiente tratan la información de suscripción. No recibimos los datos completos de tu tarjeta.",
          "Operación y soporte: IP y conexión, registros de peticiones/errores, la versión del teléfono y de la app que necesitan los componentes de nuestros proveedores, contadores de seguridad y mensajes que nos envías. El diagnóstico de captura contiene contadores y tiempos locales, no audio ni texto de tareas.",
        ],
      },
      {
        id: "purposes",
        title: "3. Finalidades y bases jurídicas",
        bullets: [
          "Contrato o medidas precontractuales que solicitas (art. 6.1.b RGPD): acceso, sincronización, archivos, las tareas sugeridas que pides, suscripciones, recuperación y soporte. Los datos obligatorios de cuenta son necesarios para esas funciones; grabar voz o adjuntar archivos es opcional.",
          "Interés legítimo (art. 6.1.f): seguridad, prevención de fraude y abuso, control de recursos, diagnóstico y envío de invitaciones iniciadas por otros usuarios. Ponderamos estos intereses con tus derechos; puedes oponerte cuando esta sea la base.",
          "Obligación legal (art. 6.1.c): conservación fiscal/contable cuando proceda, requerimientos lícitos y atención de derechos.",
          "Consentimiento (art. 6.1.a), si se pide separadamente para una finalidad opcional: puedes retirarlo sin afectar al tratamiento lícito anterior. Un permiso del dispositivo no autoriza usos ajenos a la función solicitada.",
        ],
        paragraphs: [
          "No vendemos datos personales, no instalamos rastreadores publicitarios ni usamos tus tareas para segmentar anuncios. No entrenamos un modelo propio con tus tareas. La IA propone títulos, fechas y prioridades para tu revisión; no toma decisiones con efectos jurídicos o similares significativos sobre ti.",
        ],
      },
      {
        id: "voice",
        title: "4. Voz, inteligencia artificial y datos sensibles",
        paragraphs: [
          "El micrófono se utiliza cuando eliges grabar y das permiso. La app puede conservar localmente grabaciones, texto y tareas sugeridas pendientes para recuperar una captura interrumpida. Se eliminan de esa captura cuando guardas o descartas todas sus tareas sugeridas, o cuando descartas la captura. Si tu teléfono puede reconocer la voz por sí solo, tu voz se convierte en texto en el propio teléfono y el audio no sale de él; solo se envían las palabras para crear las tareas. Si no puede, la grabación se envía para convertirla en texto en línea al terminar. Con Pro, lo que escribes para la IA se envía igual. El formulario de tareas nunca envía nada a la IA.",
          "Google procesa el audio/texto y el contexto pertinente para devolver tareas sugeridas y, si es una grabación, el texto de lo que dijiste. La app puede usar Gemini API de Google, con Vertex AI de Google Cloud como alternativa; la demo web utiliza Vertex AI. Google puede procesarlo fuera de la UE. Nuestro servidor no archiva grabaciones, pero esto no significa que Google no conserve datos de procesamiento o seguridad.",
          "El tratamiento contractual de Google depende del servicio y nivel de cuenta. Las condiciones de pago de Gemini API y las disposiciones para el EEE excluyen el uso de entradas/respuestas para mejorar productos de Google; los servicios gratuitos fuera de esas disposiciones pueden implicar mejora de modelos y revisión humana. Siguen siendo aplicables la conservación de seguridad y el procesamiento internacional. No prometemos retención cero ni tratamiento exclusivamente en la UE.",
          "TaskFlow es una herramienta de organización, no un historial clínico ni un asesor profesional. Evita enviar a la IA informes médicos, contraseñas, documentos de identidad u otros datos especialmente sensibles. No grabes a terceros ni subas sus datos sin una base legítima. Puedes escribir tareas manualmente. Revisa fechas, horas, asignaciones y notas antes de guardar.",
        ],
        links: [
          {
            label: "Condiciones de Gemini API",
            href: "https://ai.google.dev/gemini-api/terms",
          },
          {
            label: "Condiciones de tratamiento de Google Cloud",
            href: "https://cloud.google.com/terms/data-processing-addendum",
          },
        ],
      },
      {
        id: "sharing",
        title: "5. Contenido compartido y proveedores",
        paragraphs: [
          "Tu contenido personal no es público por defecto. Los miembros de un proyecto compartido ven tu nombre en las tareas que creas en él («Creada por») y en las que tienes asignadas; si no has dado un nombre, ven el principio de tu correo. También pueden ver solo las tareas de una persona. Lo que colocas en un proyecto compartido es accesible a sus miembros autorizados según sus roles. Los responsables del grupo administran el acceso. Los miembros pueden descargar copias; abandonar un grupo o eliminar la cuenta no borra remotamente esas copias independientes.",
          "Los proveedores reciben lo necesario para su función. Actúan como encargados bajo instrucciones o, para sus propias obligaciones de cuenta, pagos, seguridad o legales, como responsables independientes según corresponda.",
        ],
        bullets: [
          "Google Cloud: alojamiento, registros operativos, base temporal de la demo e IA de Vertex. Google también ofrece el inicio de sesión opcional.",
          "Neon: la base de datos de cuentas y contenido, y almacenamiento privado de archivos. La configuración actual de pruebas está en Frankfurt.",
          "Cloudflare: entrega de la web, seguridad de conexión y protección Turnstile contra bots en la demo.",
          "Resend: correos de invitación, de confirmación del correo y de recuperación, destinatario, mensaje y entrega. Nuestra integración no activa seguimiento de aperturas ni clics.",
          "Google Workspace (Gmail): recepción, almacenamiento y respuesta a consultas generales, conversaciones de soporte y solicitudes de privacidad o supresión, incluidos datos del remitente, mensajes y adjuntos que decidas enviar. El acceso se limita a personas autorizadas para atender esas solicitudes.",
          "RevenueCat: validación de suscripciones, acceso y datos de su componente en la app. Google Play tramita los pagos de la tienda cuando se activen compras reales. La app de pruebas utiliza compras sin cargo.",
          "Personal autorizado, asesores o autoridades: cuando sea necesario para soporte, obligaciones legales o formulación, ejercicio o defensa de reclamaciones.",
        ],
        links: [
          {
            label: "Privacidad de Neon",
            href: "https://neon.com/privacy-policy",
          },
          {
            label: "Privacidad de Cloudflare",
            href: "https://www.cloudflare.com/privacypolicy/",
          },
          {
            label: "Privacidad de Resend",
            href: "https://resend.com/legal/privacy-policy",
          },
          {
            label: "Privacidad de RevenueCat",
            href: "https://www.revenuecat.com/privacy/",
          },
          {
            label: "Privacidad de Google",
            href: "https://policies.google.com/privacy",
          },
        ],
      },
      {
        id: "transfers",
        title: "6. Transferencias internacionales",
        paragraphs: [
          "Una base de datos en la UE no implica que todo el tratamiento se limite a la UE. La IA de Google, el soporte y los servicios de suscripciones, correo y seguridad pueden implicar países fuera del Espacio Económico Europeo.",
          "Las transferencias fuera del EEE están sujetas al capítulo V del RGPD. Según el destinatario y el tratamiento, el mecanismo aplicable es una decisión de adecuación de la Comisión Europea o garantías como sus cláusulas contractuales tipo y las medidas adicionales necesarias. El Marco de Privacidad de Datos UE–EE. UU. solo se aplica a destinatarios certificados y tratamientos cubiertos. Escribe a taskflow.support@garbar.tech para conocer el mecanismo aplicable a tus datos y obtener copia de las garantías pertinentes.",
        ],
      },
      {
        id: "retention",
        title: "7. Conservación y supresión",
        bullets: [
          "Cuenta y contenido personal en la nube: se conservan mientras utilizas la cuenta, hasta que eliminas el contenido o la cuenta. Nunca borramos tus tareas por nuestra cuenta, estén hechas o no. Borrar un elemento puede dejar metadatos de sincronización; eliminar la cuenta suprime sus registros personales en la base de datos y sus sesiones.",
          "Adjuntos personales: la eliminación retira el acceso y solicita el borrado de los archivos almacenados. El borrado sigue a la transacción de base de datos; un fallo del almacenamiento requiere seguimiento. Los archivos de proyectos compartidos que continúan siguen disponibles para sus miembros, como se indica antes de confirmar.",
          "Contenido compartido: tareas, notas y archivos de proyectos compartidos que continúan se conservan hasta que un miembro autorizado los elimina o termina el espacio. Los traspasos de titularidad mostrados se ejecutan al confirmar; se retiran tu pertenencia, asignaciones y atribución identificativa de actividad. Contacta con soporte por datos personales dentro del contenido compartido conservado.",
          "Dispositivo: la eliminación confirmada desde la app borra su copia local de la cuenta y las capturas pendientes. Los demás dispositivos pierden el acceso y borran su copia al volver a contactar con el servicio. Exportaciones, descargas fuera del almacenamiento de la app y copias del dispositivo se eliminan aparte. Desinstalar no elimina la cuenta del servidor.",
          "Invitaciones y códigos: los códigos de invitación caducan a los siete días, y los de confirmación del correo y de recuperación, a los 30 minutos. La limpieza retira registros caducados de ejecución, sesiones y correo. El cuerpo del correo se vacía tras entrega o fallo/caducidad definitivos; el historial de invitaciones compartidas puede continuar sin vínculo con la cuenta del remitente eliminado.",
          "Registros operativos y soporte: los registros de nuestros servidores se guardan 30 días. El correo de soporte se conserva durante la gestión y, cuando sea necesario, durante el plazo aplicable a reclamaciones. Las evidencias de seguridad y auditorías obligatorias siguen sus finalidades y reglas específicas; el plazo de 30 días no se aplica a todos los registros de todos los proveedores.",
          "Obligaciones y facturación: solo se conserva, con acceso restringido, lo necesario para la obligación o reclamación aplicable. La documentación mercantil española puede exigir seis años y la fiscal generalmente cuatro, con excepciones o ampliaciones. Al eliminar tu cuenta, también pedimos a RevenueCat, la empresa que comprueba las suscripciones por nosotros, que borre su registro tuyo. Google Play conserva su propio registro de tus compras. Para incluir en una solicitud de supresión otros datos que guarden nuestros proveedores, escribe a soporte.",
          "Demo pública: las respuestas cifradas son accesibles durante 24 horas, las cuotas caducan a las 48 horas y la cookie de sesión dura hasta 30 días, según se explica abajo. La preferencia de tema se mantiene hasta que borras el almacenamiento del navegador, y la de idioma hasta un año.",
        ],
        paragraphs: [
          "Las copias de seguridad y recuperación caducan conforme a la ventana móvil de recuperación del proveedor; no se editan individualmente cuando se elimina un registro activo. La conservación se limita a esa ventana configurada, salvo una retención legal documentada. Los registros de seguridad o facturación del proveedor pueden tener conservación legal propia. Puedes pedir a soporte los plazos y excepciones aplicables a tu solicitud; explicaremos qué información permanece y por qué. La eliminación no implica un borrado instantáneo en todas las copias de seguridad o independientes.",
        ],
      },
      {
        id: "website",
        title: "8. Demo web, cookies y almacenamiento local",
        paragraphs: [
          "Demo en directo: no guardamos tu grabación. El texto y las tareas encontradas se guardan cifrados hasta 24 horas, para que volver a probar no gaste otro intento, y después se borran automáticamente. La demo en directo envía tu grabación o tu texto a Google solo cuando tocas Listo. Nada de ella se guarda en una cuenta de la app.",
          "Al abrir la demo se carga Cloudflare Turnstile, que recibe señales del navegador/conexión para prevenir abuso. Nuestra cookie necesaria __Host-tf-demo identifica una sesión firmada para los límites y dura hasta 30 días. Los límites por red usan una forma codificada de tu dirección de red, que sigue siendo un dato personal.",
          "Los registros de cuota de navegador/red caducan a las 48 horas y se ponen en cola de borrado. Los totales mensuales de uso, duración, tokens y coste estimado no contienen tareas ni grabaciones.",
          "taskflow-theme recuerda en almacenamiento local el tema que eliges hasta que lo eliminas. La dirección principal abre la web en el idioma de tu navegador si es español o catalán, y en inglés si no; nunca usamos tu ubicación para ello. Si eliges un idioma en el selector de idioma, la cookie taskflow-lang lo recuerda hasta un año, como el tema, para que la web se abra en ese idioma la próxima vez. No usamos cookies publicitarias ni analítica de marketing de terceros. La seguridad necesaria y la preferencia solicitada no se usan para publicidad. Puedes borrar datos del navegador; esto puede afectar a preferencias/demo y no elimina necesariamente registros de seguridad del servidor. Cualquier seguimiento no esencial futuro necesitará información y consentimiento propios.",
        ],
      },
      {
        id: "permissions",
        title: "9. Permisos y seguridad",
        paragraphs: [
          "La app solicita micrófono para grabar, notificaciones para recordatorios y los permisos pertinentes de archivos, fotos, cámara o calendario cuando eliges esas funciones. Los eventos de los calendarios del teléfono se muestran solo para consulta y se quedan en el teléfono: no se suben ni se envían a la IA. Puedes cambiar permisos en el sistema operativo; retirarlos no borra lo ya enviado.",
          "Utilizamos HTTPS, contraseñas guardadas de forma que no se pueden volver a leer, autenticación, comprobaciones de pertenencia, archivos privados y credenciales en servidor. TaskFlow no es una caja fuerte cifrada de extremo a extremo: nuestro servidor y los proveedores necesarios pueden tratar el contenido. También importan la seguridad del dispositivo, el acceso compartido y tus exportaciones.",
        ],
      },
      {
        id: "rights",
        title: "10. Tus derechos y contacto",
        paragraphs: [
          "Cuando proceda, puedes solicitar acceso, rectificación, supresión, limitación, portabilidad de datos tratados automáticamente por consentimiento/contrato y oposición al interés legítimo. Puedes retirar el consentimiento en que se base un tratamiento. Puedes reclamar ante la AEPD o tu autoridad competente sin tener que contactarnos antes.",
          "Escribe a taskflow.support@garbar.tech e identifica la cuenta y el derecho que ejercitas. Verificamos tu identidad de forma proporcionada y no pedimos contraseñas ni números de tarjeta. Respondemos normalmente en un mes natural desde la recepción de la solicitud; si procede ampliar hasta dos meses adicionales por complejidad o número de solicitudes, te lo explicamos durante el primer mes. El ejercicio es normalmente gratuito.",
          "Eliminar una cuenta no equivale a cancelar una suscripción de la tienda; la página de supresión explica ambas cosas. Si un deber legal o los derechos de terceros impiden eliminar algún dato, explicaremos el motivo y el plazo restante.",
        ],
        contact: "privacy",
        links: [
          {
            label: "Solicitar eliminación de cuenta",
            href: "/delete-account/",
          },
          {
            label: "AEPD — derechos y reclamaciones",
            href: "https://www.aepd.es/derechos-y-deberes/conoce-tus-derechos",
          },
        ],
      },
      {
        id: "age-changes",
        title: "11. Edad y cambios",
        paragraphs: [
          "La primera versión de TaskFlow está destinada exclusivamente a personas de 18 años o más, incluidas sus funciones de IA. Si crees que una persona menor de 18 años ha facilitado datos, contáctanos para que podamos valorar el caso y adoptar las medidas pertinentes, incluida la eliminación de la cuenta y los datos cuando corresponda.",
          "Actualizaremos el aviso al cambiar el servicio o sus usos de datos, indicando versión y fecha y comunicando los cambios relevantes cuando corresponda. Un nuevo aviso no autoriza retroactivamente un uso incompatible.",
        ],
      },
    ],
  },
  terms: {
    title: "Términos y condiciones de TaskFlow",
    description:
      "Términos y condiciones de TaskFlow: cuentas, proyectos compartidos, dictado, suscripciones y derechos de consumo.",
    summary: [
      "TaskFlow te ayuda a planificar; tú decides.",
      "Tu contenido sigue siendo tuyo.",
      "Se respetan tus derechos legales de consumo.",
    ],
    sections: [
      {
        id: "operator",
        title: "1. TaskFlow y estas condiciones",
        company: true,
        paragraphs: [
          "Estas condiciones describen la relación entre GARBAR, IN-TEC, S.L. y quien utiliza TaskFlow. TaskFlow es el producto, no una entidad jurídica distinta. Abarcan la app y sus servicios; la política de privacidad explica separadamente el uso de datos.",
          "La app actual es una prueba privada y la web ofrece una demo. No hay contratación de pago web ni descarga pública. Solo compras de prueba: no se cobra nada, y las suscripciones de prueba pueden renovarse o terminar antes que las reales. Las cláusulas de suscripciones reales solo se aplican cuando esa compra se ofrezca y se formalice.",
          "Antes de crear una cuenta pública o contratar, deben estar disponibles estas condiciones y la oferta aplicable. Visitar la web o recibir una invitación no genera una suscripción de pago.",
        ],
      },
      {
        id: "account",
        title: "2. Cuenta y requisitos",
        paragraphs: [
          "Facilita datos exactos, protege el acceso y avísanos si sospechas un uso no autorizado. No suplantes a otras personas ni eludas límites con cuentas ajenas. Podemos verificar razonablemente la titularidad cuando sea necesario.",
          "Debes tener al menos 18 años para utilizar TaskFlow en esta primera versión. Si actúas por una organización, debes estar autorizado. Cuando proceda, el contrato de encargo de tratamiento para equipos/empresas se acordará aparte; estas condiciones de consumo no lo sustituyen.",
        ],
      },
      {
        id: "service",
        title: "3. Alcance del servicio",
        paragraphs: [
          "TaskFlow ofrece organización de tareas/notas, calendarios, recordatorios, IA opcional, sincronización y proyectos compartidos cuando estén habilitados. Las funciones y límites de archivos o IA figuran en la app y la oferta contratada. Una demo o previsión no garantiza una función todavía no disponible.",
          "Algunas funciones requieren dispositivo compatible, conexión y permisos. Los cambios sin conexión se sincronizan cuando es posible. Los recordatorios dependen del sistema, batería y permisos; comprueba por otros medios los plazos importantes. No somos un servicio de emergencias, asesor médico ni alarma garantizada.",
          "Podemos mantener y actualizar el servicio por seguridad o funcionamiento. Proporcionaremos las actualizaciones exigibles y aviso razonable de cambios materiales del servicio contratado, con los derechos de cancelación/reembolso que procedan. No podemos retirar arbitrariamente funciones de pago.",
        ],
      },
      {
        id: "content",
        title: "4. Tu contenido y colaboración",
        paragraphs: [
          "Conservas los derechos sobre lo que añades. Nos autorizas únicamente a alojarlo, copiarlo, tratarlo, sincronizarlo y mostrarlo a ti y a las personas autorizadas, con los proveedores de la política de privacidad. No nos autorizas a venderlo ni a utilizarlo en publicidad.",
          "Comparte solo contenido con derechos y base legítima suficientes. Los responsables gestionan permisos en espacios compartidos. Las invitaciones necesitan aceptación y los miembros pueden conservar exportaciones. No utilices invitaciones para spam ni subas malware o contenido ilícito.",
          "No interfieras con el servicio, accedas sin autorización, revendas acceso ajeno ni eludas controles razonables de seguridad, tamaño o uso. Los límites contractuales de pago deben comunicarse antes de contratar.",
        ],
      },
      {
        id: "ai",
        title: "5. Sugerencias de la IA",
        paragraphs: [
          "La IA es opcional y envía entrada/contexto al proveedor descrito en la política. Puede omitir, interpretar mal o inventar detalles. Revisa título, fecha, hora, prioridad, notas y destinatarios antes de guardar o compartir. No es asesoramiento profesional ni garantía de exactitud.",
          "Eres responsable de tus instrucciones y del uso de las sugerencias revisadas. Esto no excluye nuestros deberes legales de calidad, seguridad o conformidad. No envíes información confidencial o especialmente sensible a la demo.",
        ],
      },
      {
        id: "subscription",
        title: "6. Planes, renovación y cancelación",
        paragraphs: [
          "Cuando se activen compras reales, antes de confirmar se indicarán plan, funciones/límites, precio total e impuestos aplicables, periodicidad, prueba y renovación automática. El precio válido es el de la oferta y la pantalla de contratación.",
          "La suscripción se renueva por el periodo informado hasta cancelarla según el canal de compra. Gestiónala o cancélala en la cuenta de Google Play con la que la compraste y respeta el plazo de renovación indicado. Cancelar normalmente evita nuevas renovaciones y mantiene el periodo pagado, sujeto a reembolsos y derechos legales. Borrar la app o la cuenta no cancela por sí mismo una suscripción de tienda.",
          "RevenueCat verifica el acceso y la tienda procesa el pago. Si se añade compra web, se identificarán proveedor y cancelación antes de contratar; actualmente no se cobran suscripciones web.",
          "Los cambios de precio se avisarán con antelación conforme a la ley y la tienda, con aprobación cuando sea necesaria y posibilidad de cancelar. Contáctanos por compras duplicadas o acceso pagado que no funciona; usar otro dispositivo compatible no debe obligarte a comprar el mismo acceso otra vez.",
        ],
      },
      {
        id: "withdrawal",
        title: "7. Desistimiento, reembolsos y conformidad",
        paragraphs: [
          "Los consumidores de España/UE disponen generalmente de 14 días naturales desde la contratación a distancia del servicio para desistir sin motivo. Entrar, descargar o empezar la suscripción no elimina por sí solo ese derecho. Si solicitas expresamente comenzar durante ese plazo, solo podrá exigirse una parte proporcional cuando se cumplan los requisitos legales.",
          "La excepción para servicios íntegramente ejecutados o contenido digital sin soporte físico solo opera cuando se cumplen sus requisitos, incluidos solicitud/consentimiento expresos, conocimiento y confirmación exigibles. Una suscripción continuada no se ejecuta íntegramente el primer día. La gestión de la tienda no elimina derechos imperativos.",
          "Comunica inequívocamente el desistimiento a nuestro contacto o usa el canal de la tienda. Incluye cuenta, fecha y referencia, nunca la tarjeta completa. El modelo siguiente es opcional. Si procede, reembolsaremos dentro del plazo legal, normalmente 14 días desde la notificación, por el medio original salvo acuerdo válido distinto.",
          "Modelo: A GARBAR, IN-TEC, S.L., en la dirección/contacto de esta página. Comunico que desisto de mi contrato de [plan/servicio TaskFlow], contratado el [fecha]. Cuenta o referencia: […]. Nombre y domicilio del consumidor: […]. Fecha: […]. Firma solo si se envía en papel.",
          "El servicio digital debe ser conforme al contrato. Si no lo es, pueden corresponder puesta en conformidad, reducción de precio o resolución/reembolso conforme a la normativa. No aplicamos una regla de ‘sin devoluciones’ que suprima esos derechos.",
        ],
        contact: "withdrawal",
      },
      {
        id: "ending",
        title: "8. Baja, suspensión y supresión",
        paragraphs: [
          "Puedes eliminar tu cuenta en Ajustes → Cuenta → Eliminar cuenta, o solicitar eliminación y ayuda en taskflow.support@garbar.tech sin acceder a la app. Revisa los datos personales que se borrarán y los traspasos de contenido compartido antes de confirmar. Exporta lo que quieras conservar; la exportación de tareas no incluye adjuntos y debes guardarlos aparte. Cancelar la suscripción y eliminar la cuenta son gestiones distintas: no tienes que comprar otro servicio ni cancelar antes de solicitar la supresión.",
          "Podemos restringir proporcionalmente el acceso ante incumplimiento grave, fraude, actividad ilícita o riesgo de seguridad. Cuando proceda, explicaremos el motivo y cómo reclamar o corregirlo; una urgencia de seguridad puede exigir actuar inmediatamente. Se mantienen los derechos legales de acceso y reembolso.",
          "Si dejamos de prestar el servicio, habrá aviso razonable, oportunidad adecuada para recuperar datos y reembolso legalmente exigible del servicio pagado no utilizado. No reservamos un derecho general a borrar contenido pagado sin aviso.",
        ],
        links: [
          {
            label: "Eliminar tu cuenta y datos asociados",
            href: "/delete-account/",
          },
          {
            label: "Derechos de privacidad y contacto",
            href: "/privacy/#rights",
          },
        ],
      },
      {
        id: "responsibility",
        title: "9. Responsabilidad y propiedad intelectual",
        paragraphs: [
          "El software, diseño y marcas pertenecen a sus titulares. Puedes utilizarlos para usar el servicio, sin adquirir su titularidad. Se mantienen las licencias de terceros y código abierto.",
          "Respondemos conforme a la ley. No excluimos responsabilidades legalmente irrenunciables, incluido fraude, dolo, daños personales protegidos y derechos imperativos de consumo o protección de datos. No imponemos una renuncia general ni un límite arbitrario de responsabilidad al consumidor.",
        ],
      },
      {
        id: "complaints",
        title: "10. Reclamaciones, ley y modificaciones",
        paragraphs: [
          "Dirige consultas y reclamaciones al contacto de la empresa. Facilitaremos constancia y responderemos dentro del plazo legal, como máximo un mes para reclamaciones de consumo. Puedes acudir a la autoridad de consumo o entidad competente de resolución de conflictos. No afirmamos adhesión a un arbitraje concreto sin confirmación.",
          "Se aplica la ley española sin privarte de las protecciones imperativas de tu residencia habitual cuando correspondan. Son competentes los tribunales previstos en las normas de consumo/jurisdicción; no te obligamos a litigar en nuestra ciudad.",
          "Identificaremos nuevas versiones y comunicaremos cambios contractuales relevantes antes de su eficacia cuando proceda. No alteran retroactivamente compras realizadas ni derechos adquiridos. Las versiones inglesa, española y catalana buscan el mismo significado; una diferencia no reducirá derechos imperativos.",
        ],
        contact: "privacy",
      },
    ],
  },
  legal: {
    title: "Aviso legal: la empresa detrás de TaskFlow",
    description:
      "Aviso legal e información de GARBAR, IN-TEC, S.L., operadora de TaskFlow.",
    summary: [
      "TaskFlow es el nombre del producto.",
      "GARBAR, IN-TEC, S.L. es la entidad operadora.",
      "Escríbenos a taskflow@garbar.tech.",
    ],
    sections: [
      {
        id: "company",
        title: "1. Datos de la entidad",
        company: true,
        paragraphs: [
          "GARBAR, IN-TEC, S.L., identificada arriba, opera taskflow.garbar.tech y el servicio TaskFlow. Este aviso facilita la información de la entidad conforme a la Ley 34/2002 de servicios de la sociedad de la información y comercio electrónico. TaskFlow es la marca del producto, no una entidad jurídica distinta.",
          "Para consultas generales, escribe a taskflow@garbar.tech. Para ayuda con la app, reclamaciones, derechos de privacidad o eliminación de cuentas, escribe a taskflow.support@garbar.tech. También puedes escribir al domicilio social indicado. Los mensajes automáticos utilizan taskflow.noreply@garbar.tech; dirige las consultas al correo de soporte.",
        ],
        contact: "privacy",
      },
      {
        id: "scope",
        title: "2. Información del sitio y producto",
        paragraphs: [
          "El sitio presenta TaskFlow y sus demostraciones opcionales. Solo son exigibles la disponibilidad, precios y funciones expresamente ofertados. La vista previa actual no vende suscripciones ni ofrece la app para descargar.",
          "Las condiciones regulan el servicio y la política de privacidad explica el tratamiento, las cookies necesarias y el almacenamiento local. Contacta para comunicar contenido ilícito, incidentes de seguridad o errores.",
        ],
      },
      {
        id: "rights",
        title: "3. Derechos y servicios externos",
        paragraphs: [
          "Contenido, software y marca pertenecen a sus titulares. Puedes usar la web para su finalidad y ejercer los derechos legales, sin suplantar a TaskFlow ni fingir su respaldo.",
          "Los enlaces externos identifican servicios de terceros y no excluyen nuestras propias obligaciones. Se mantienen los derechos de consumo y protección de datos.",
        ],
      },
    ],
  },
  "delete-account": {
    title: "Elimina tu cuenta de TaskFlow.",
    description: "Elimina desde la app o escribe a soporte sin iniciar sesión.",
    summary: [
      "Se eliminan tu cuenta y tus tareas, notas y archivos en todos tus dispositivos.",
      "Se queda para los demás lo que añadiste a proyectos compartidos, sin tu nombre.",
      "Eliminar tu cuenta no cancela TaskFlow Pro en Google Play.",
    ],
    sections: [
      {
        id: "in-app",
        title: "1. Eliminar desde la app",
        paragraphs: [
          "Abre Ajustes → Cuenta → Eliminar cuenta. La pantalla identifica la cuenta, cuenta las tareas, notas y archivos personales que se borrarán y muestra el contenido compartido que permanece y quién recibirá su titularidad. Puedes guardar antes una copia de tus tareas; los adjuntos no se incluyen en esa exportación y debes guardarlos aparte.",
          "Confirma con tu contraseña o con la misma cuenta de Google con la que iniciaste sesión. Necesitas conexión a internet. Abrir esta pantalla no elimina nada. Si cambia la titularidad compartida antes de confirmar, la app te pide revisar el plan actualizado. Cuando el servidor confirma la eliminación, se cierra tu sesión y aparece la confirmación; no se puede deshacer.",
        ],
      },
      {
        id: "request",
        title: "2. Solicitar por correo",
        paragraphs: [
          "Escribe a taskflow.support@garbar.tech, preferiblemente desde el correo de tu cuenta, e identifica la cuenta de TaskFlow que deseas eliminar. Puedes utilizar esta vía si has desinstalado la app, no puedes entrar, necesitas ayuda o quieres incluir datos en nuestros proveedores. No necesitas justificar la baja, comprar nada ni pagar por una solicitud ordinaria.",
          "Si ya no controlas el correo de la cuenta, explícalo para que verifiquemos tu identidad de forma proporcionada. No envíes contraseñas, números de tarjeta ni documentos de identidad salvo que se acuerde una verificación necesaria y segura.",
          "Abrir la aplicación de correo no envía la solicitud automáticamente. Esta página no elimina una cuenta de inmediato: revisa el mensaje y envíalo. Soporte de TaskFlow lo tramita en nombre de GARBAR, IN-TEC, S.L.",
        ],
        contact: "deletion",
      },
      {
        id: "scope",
        title: "3. Qué se elimina y qué permanece",
        bullets: [
          "Se elimina, en todos tus dispositivos: tu cuenta, tus tareas, notas y archivos y los proyectos que solo usas tú. También tu acceso, el vínculo con Google, las sesiones, tu pertenencia a proyectos y grupos, tus ajustes de avisos y tu recuento de dictados gratis. Además, pedimos a RevenueCat, la empresa que comprueba las suscripciones por nosotros, que borre su registro tuyo.",
          "Se queda para los demás: las tareas y archivos que añadiste a proyectos compartidos. Se quita tu nombre, también de «Creada por», pero lo que escribiste en ellos no cambia. Los proyectos y grupos que son tuyos pasan a otro miembro; la app te dice a quién antes de confirmar. Si dentro hay datos personales tuyos, escribe a soporte.",
          "La app no borra: el registro de tus compras que guarda Google Play, tus correos con soporte, los registros de seguridad ni las copias de seguridad, que caducan solas. Pide a soporte que borre lo que se pueda; te diremos qué hay que conservar, por qué y cuánto tiempo. No podemos borrar las copias que hayan guardado otras personas.",
        ],
      },
      {
        id: "timing",
        title: "4. Plazos y confirmación",
        paragraphs: [
          "En la app, tu cuenta se elimina en cuanto confirmas, y sus archivos justo después (si alguno no se puede borrar en ese momento, nos ocupamos después). Ves la confirmación en la app; no se envía ningún correo. Si la app muestra un error, no lo des por hecho: vuelve a intentarlo o escribe a soporte.",
          "Para solicitudes a soporte, respondemos normalmente en un mes natural desde su recepción. Una ampliación permitida de hasta dos meses adicionales por complejidad o numerosas solicitudes se explica dentro del primer mes. Verificamos la titularidad, suprimimos sin dilación indebida cuando corresponda y confirmamos el resultado. Si debe conservarse información, explicamos su finalidad, fundamento legal, plazo o criterios de conservación y cómo reclamar.",
          "El contenido compartido permanece para el espacio que continúa según lo explicado arriba. Las copias de seguridad caducan solas. Los registros restringidos necesarios para una obligación legal, investigación de seguridad o reclamación se conservan solo durante el plazo aplicable a esa finalidad. La política de privacidad detalla la conservación.",
        ],
        links: [
          {
            label: "Almacenamiento y conservación",
            href: "/privacy/#retention",
          },
        ],
      },
      {
        id: "subscription",
        title: "5. Suscripciones y copias del dispositivo",
        paragraphs: [
          "Eliminar tu cuenta no cancela TaskFlow Pro en Google Play. Cancela la renovación en la cuenta de la tienda donde compraste; contacta con soporte si necesitas ayuda. Cancelar no es requisito para pedir eliminación. Solo compras de prueba: no se realiza ningún cobro real.",
          "Guarda lo que quieras conservar antes. La app borra su propia copia local tras la eliminación confirmada y los demás dispositivos conectados lo hacen al volver a contactar con el servicio. Elimina aparte exportaciones, descargas externas y copias del dispositivo. Tu cuenta de Google no se elimina.",
        ],
        links: [
          {
            label: "Gestionar suscripciones de Google Play",
            href: "https://support.google.com/googleplay/answer/7018481",
          },
        ],
      },
      {
        id: "other-rights",
        title: "6. Otras solicitudes de privacidad",
        paragraphs: [
          "Puedes pedir acceso, copia, rectificación o supresión de datos concretos sin cerrar la cuenta. La política de privacidad explica tus derechos y cómo reclamar ante la AEPD o la autoridad de control competente.",
        ],
        links: [
          {
            label: "Leer la política de privacidad",
            href: "/privacy/#rights",
          },
        ],
      },
    ],
  },
};
