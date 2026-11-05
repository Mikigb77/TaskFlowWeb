import type { LegalCopy } from "./types";

export const ca: LegalCopy = {
  privacy: {
    title: "Política de privacitat de TaskFlow",
    description:
      "Política de privacitat de l’app i el web de TaskFlow: compte, tasques, veu, fitxers i drets.",
    summary: [
      "No venem les teves dades ni et mostrem anuncis.",
      "Les teves paraules només van a la IA de Google quan demanes a TaskFlow que les entengui: per afegir, cercar o canviar tasques, per demanar recordatoris amb les teves paraules o per fer notes d’una reunió que graves.",
      "Pots demanar una còpia de les teves dades o suprimir-les quan vulguis.",
    ],
    sections: [
      {
        id: "controller",
        title: "1. Responsable del tractament",
        company: true,
        paragraphs: [
          "GARBAR, IN-TEC, S.L. és l’operadora de TaskFlow i responsable de les dades descrites aquí. TaskFlow és el nom del producte. Aquesta política cobreix l’app, comptes i serveis al núvol, invitacions i recuperació d’accés, i taskflow.garbar.tech. La demostració web és independent dels comptes de l’app.",
          "Aquest avís no demana un consentiment general. Les finalitats que el necessitin han de disposar d’un permís o consentiment específic en el moment adequat.",
          "Utilitza taskflow@garbar.tech per a consultes generals i taskflow.support@garbar.tech per a suport, drets de privacitat i supressió de comptes. Tots dos arriben a la bústia de l’empresa. Els correus automàtics (invitacions, codis per confirmar el correu i recuperació de la contrasenya) s’envien des de taskflow.noreply@garbar.tech; aquest remitent no se supervisa i les respostes es dirigeixen a suport. No cal utilitzar un assumpte o formulari concret per exercir els drets.",
        ],
        contact: "privacy",
      },
      {
        id: "data",
        title: "2. Dades que tractem",
        bullets: [
          "Compte: correu, nom opcional, zona horària, identificador intern, la contrasenya, desada de manera que no es pot tornar a llegir, i registres d’accés/sessió. Si entres amb Google, rebem l’identificador de Google, el correu, si Google l’ha verificat i el teu nom de pila, que passa a ser el teu nom a TaskFlow si no n’has posat cap. No desem la foto. Si et registres amb contrasenya, confirmes el correu amb un codi de 6 xifres que caduca als 30 minuts. No rebem la contrasenya de Google ni demanem accés a Gmail o Drive.",
          "Organització: tasques, notes, dates, recordatoris, prioritats, passos, repeticions, historial de finalització, projectes, grups, assignacions i canvis de sincronització. L’app desa còpies locals i sincronitza el contingut del compte amb el servidor.",
          "Fitxers: documents o imatges que selecciones, nom, mida, un codi de control que detecta fitxers malmesos, titularitat i tasca relacionada. Els fitxers que adjuntes es pugen al compte en desar la tasca. Poden contenir dades personals o metadades incrustades.",
          "Col·laboració: membres, rols, correus d’invitació, remitents i acceptació. Si algú et convida abans de registrar-te, aquesta persona és la font de les dades de la invitació. Les utilitzem per tramitar-la, no per enviar publicitat.",
          "Veu i IA: àudio o text enviat, el text del que has dit, tasques i canvis suggerits, idioma, zona horària, data de referència i noms pertinents de projectes/membres. Amb Pro, una reunió que graves: el seu àudio, el text del que s’hi ha dit i les notes fetes a partir d’aquest text. També comptadors d’ús i estat per aplicar límits.",
          "Subscripció: identificador de facturació opac, producte, compra, renovació, caducitat, referències i estat d’accés. RevenueCat i la botiga tracten la informació de subscripció. No rebem les dades completes de la targeta.",
          "Operació i suport: IP/connexió, registres de peticions/errors, la versió del telèfon i de l’app que necessiten els components dels nostres proveïdors, comptadors de seguretat i missatges que ens envies. El diagnòstic de captura conté comptadors i temps locals, no àudio ni text de tasques.",
        ],
      },
      {
        id: "purposes",
        title: "3. Finalitats i bases jurídiques",
        bullets: [
          "Contracte o mesures precontractuals que demanes (art. 6.1.b RGPD): accés, sincronització, fitxers, les tasques suggerides que demanes, subscripcions, recuperació i suport. Les dades obligatòries són necessàries per a aquestes funcions; veu i adjunts són opcionals.",
          "Interès legítim (art. 6.1.f): seguretat, prevenció de frau/abús, control de recursos, diagnòstic i invitacions iniciades per altres usuaris. Ponderem aquests interessos amb els teus drets; pots oposar-t’hi quan aquesta sigui la base.",
          "Obligació legal (art. 6.1.c): conservació fiscal/comptable quan correspongui, requeriments lícits i atenció de drets.",
          "Consentiment (art. 6.1.a), si es demana separadament per a una finalitat opcional: el pots retirar sense afectar el tractament lícit anterior. Un permís del dispositiu no autoritza usos aliens a la funció.",
        ],
        paragraphs: [
          "No venem dades personals, no instal·lem rastrejadors publicitaris ni utilitzem tasques per segmentar anuncis. No entrenem un model propi amb les teves tasques. La IA proposa títols, dates i prioritats perquè els revisis; no pren decisions amb efectes jurídics o semblants significatius sobre tu.",
        ],
      },
      {
        id: "voice",
        title: "4. Veu, intel·ligència artificial i dades sensibles",
        paragraphs: [
          "El micròfon s’utilitza quan tries gravar i dones permís. L’app pot conservar localment gravacions, text i tasques suggerides pendents per recuperar una captura interrompuda. Es retiren d’aquella captura quan deses o descartes totes les tasques suggerides, o quan descartes la captura. Si el telèfon pot reconèixer la veu tot sol, la veu es converteix en text al mateix telèfon i l’àudio no en surt; només s’envien les paraules. Si no pot, la gravació s’envia per convertir-la en text en línia en acabar. Amb Pro, el que escrius per a la IA i els recordatoris que demanes amb les teves paraules s’envien igual. Sense Pro, el formulari de tasques no envia mai res a la IA.",
          "Amb Pro pots gravar una reunió per tenir-ne notes. Mentre graves, l’app envia l’àudio en parts d’uns cinc minuts i desa cada part al telèfon fins que el nostre servidor la rep. El nostre servidor demana a Google que converteixi cada part en text i després n’esborra l’àudio. Quan han arribat totes les parts, el text es converteix en notes (un resum, tasques pendents, decisions i preguntes obertes), que l’app desa com una nota normal. Després el nostre servidor esborra el text de la reunió. Pro inclou fins a 20 hores de reunions al mes.",
          "Google processa l’àudio/text i el context pertinent per retornar tasques i canvis suggerits i, si és una gravació, el text del que has dit i, si és una reunió, les seves notes. L’app i la demo web fan servir Vertex AI de Google Cloud. Google ho pot processar fora de la UE. El servidor no arxiva gravacions, però això no vol dir que Google no conservi dades de processament o seguretat.",
          "Segons les condicions de Google Cloud, Google no fa servir el que enviem a Vertex AI per entrenar els seus models sense el nostre permís. Google pot conservar algunes dades durant un temps limitat, per a memòria cau, seguretat i prevenció d’abusos, i processar-les fora de la UE. No prometem retenció zero ni tractament exclusiu a la UE.",
          "TaskFlow és una eina d’organització, no un historial clínic ni un assessor professional. Evita enviar informes mèdics, contrasenyes, documents d’identitat o altres dades especialment sensibles a la IA. Avisa les persones d’una reunió abans de gravar-la, i no gravis tercers ni pugis les seves dades sense base legítima. Pots escriure tasques manualment. Revisa dates, hores, assignacions i notes abans de desar.",
        ],
        links: [
          {
            label: "Condicions específiques de Google Cloud, amb Vertex AI",
            href: "https://cloud.google.com/terms/service-terms",
          },
          {
            label: "Condicions de tractament de Google Cloud",
            href: "https://cloud.google.com/terms/data-processing-addendum",
          },
        ],
      },
      {
        id: "sharing",
        title: "5. Compartició i proveïdors",
        paragraphs: [
          "El contingut personal no és públic per defecte. Els membres d’un projecte compartit veuen el teu nom a les tasques que hi crees («Creada per»), a les que tens assignades i a l’«Activitat» de cada tasca, al costat de cada canvi que hi has fet i la data; si no has donat cap nom, veuen l’inici del teu correu. També poden veure només les tasques d’una persona. Els recordatoris no es comparteixen: cada persona té els seus. El contingut d’un projecte compartit és accessible als membres autoritzats segons el rol. Els responsables gestionen l’accés. Els membres poden descarregar còpies; sortir del grup o suprimir el compte no les esborra remotament.",
          "Els proveïdors reben les dades necessàries per a la seva funció. Poden actuar com a encarregats sota instruccions o responsables independents per a les seves pròpies obligacions de compte, pagament, seguretat o legals.",
        ],
        bullets: [
          "Google Cloud: allotjament, registres operatius, base temporal de la demo i IA de Vertex. Google també ofereix l’inici de sessió opcional.",
          "Neon: la base de dades de comptes i contingut, i fitxers privats. La configuració de proves actual és a Frankfurt.",
          "Cloudflare: lliurament del web, seguretat de connexió i Turnstile contra bots a la demo.",
          "Resend: correus d’invitació, de confirmació del correu i de recuperació, destinatari, missatge i lliurament. La integració no activa seguiment d’obertures ni clics.",
          "Google Workspace (Gmail): recepció, emmagatzematge i resposta a consultes generals, converses de suport i sol·licituds de privacitat o supressió, incloent-hi dades del remitent, missatges i adjunts que decideixis enviar. L’accés es limita a persones autoritzades per atendre aquestes sol·licituds.",
          "RevenueCat: validació de subscripcions, accés i dades del seu component a l’app. Google Play tramita els pagaments de la botiga quan s’activin compres reals. L’app de proves utilitza compres sense càrrec.",
          "Personal autoritzat, assessors o autoritats: quan calgui per a suport, obligacions legals o formulació, exercici o defensa de reclamacions.",
        ],
        links: [
          {
            label: "Privacitat de Neon",
            href: "https://neon.com/privacy-policy",
          },
          {
            label: "Privacitat de Cloudflare",
            href: "https://www.cloudflare.com/privacypolicy/",
          },
          {
            label: "Privacitat de Resend",
            href: "https://resend.com/legal/privacy-policy",
          },
          {
            label: "Privacitat de RevenueCat",
            href: "https://www.revenuecat.com/privacy/",
          },
          {
            label: "Privacitat de Google",
            href: "https://policies.google.com/privacy",
          },
        ],
      },
      {
        id: "transfers",
        title: "6. Transferències internacionals",
        paragraphs: [
          "Una base de dades a la UE no implica que tot el tractament es limiti a la UE. La IA de Google, el suport i serveis de subscripció, correu i seguretat poden implicar països de fora de l’Espai Econòmic Europeu.",
          "Les transferències fora de l’EEE estan subjectes al capítol V del RGPD. Segons el destinatari i el tractament, el mecanisme aplicable és una decisió d’adequació de la Comissió Europea o garanties com les seves clàusules contractuals tipus i les mesures addicionals necessàries. El Marc de Privacitat de Dades UE–EUA només s’aplica a destinataris certificats i tractaments coberts. Escriu a taskflow.support@garbar.tech per conèixer el mecanisme aplicable a les teves dades i obtenir còpia de les garanties pertinents.",
        ],
      },
      {
        id: "retention",
        title: "7. Conservació i supressió",
        bullets: [
          "Compte i contingut personal al núvol: es conserven mentre tinguis el compte. No esborrem mai les teves tasques pel nostre compte, fetes o no. Una tasca, nota o projecte que esborres desapareix dels teus dispositius i se’n suprimeixen els fitxers, però el nostre servidor en conserva la resta, oculta, fins que suprimeixis el compte (si era en un projecte compartit, es queda amb aquell projecte). Suprimir el compte elimina els registres personals de la base de dades i les sessions.",
          "Adjunts personals: la supressió retira l’accés i demana l’esborrament dels fitxers emmagatzemats. L’esborrament segueix la transacció de base de dades; una fallada d’emmagatzematge requereix seguiment. Els fitxers dels projectes compartits que continuen segueixen disponibles per als membres, tal com s’indica abans de confirmar.",
          "Contingut compartit: tasques, notes i fitxers de projectes compartits que continuen es conserven fins que un membre autoritzat els elimina o finalitza l’espai. Els traspassos de titularitat mostrats s’executen en confirmar; es retiren la pertinença, les assignacions i l’atribució identificativa d’activitat. Contacta amb suport per dades personals dins del contingut compartit conservat.",
          "Reunions gravades: el nostre servidor esborra l’àudio de cada part quan ja és text, i el text de la reunió quan l’app n’ha desat les notes. Una reunió que no s’acaba mai s’esborra 30 dies després de rebre’n l’última part. Una gravació que atures però no acabes es converteix en una nota al telèfon al cap de 7 dies. Descartar una reunió l’esborra alhora del telèfon i del nostre servidor. Suprimir el compte n’esborra les reunions.",
          "Dispositiu: la supressió confirmada des de l’app esborra la còpia local del compte i les captures pendents. Els altres dispositius perden l’accés i esborren la còpia en tornar a contactar amb el servei. Exportacions, descàrregues fora de l’emmagatzematge de l’app i còpies del dispositiu s’eliminen a part. Desinstal·lar no suprimeix el compte del servidor.",
          "Invitacions i codis: els codis d’invitació caduquen als set dies, i els de confirmació del correu i de recuperació, als 30 minuts. La neteja retira registres caducats d’execució, sessions i correu. El cos del correu es buida després de l’entrega o fallada/caducitat definitives; l’historial d’invitacions compartides pot continuar sense vincle amb el compte del remitent suprimit.",
          "Registres operatius i suport: els registres dels nostres servidors es conserven 30 dies. El correu de suport es conserva durant la gestió i, quan calgui, durant el termini aplicable a reclamacions. Les evidències de seguretat i auditories obligatòries segueixen les seves finalitats i regles específiques; el termini de 30 dies no s’aplica a tots els registres de tots els proveïdors.",
          "Obligacions i facturació: només es conserva, amb accés restringit, allò necessari per a l’obligació o reclamació aplicable. La documentació mercantil espanyola pot exigir sis anys i la fiscal generalment quatre, amb excepcions o ampliacions. En suprimir el compte, també demanem a RevenueCat, l’empresa que comprova les subscripcions per nosaltres, que esborri el registre que té de tu. Google Play conserva el seu propi registre de les teves compres. Per incloure en una sol·licitud de supressió altres dades que guardin els nostres proveïdors, escriu a suport.",
          "Demo pública: les respostes xifrades són accessibles durant 24 hores, les quotes caduquen a les 48 hores i la galeta de sessió dura fins a 30 dies, segons s’explica a continuació. La preferència de tema es manté fins que esborres l’emmagatzematge del navegador, i la d’idioma fins a un any.",
        ],
        paragraphs: [
          "Les còpies de seguretat i recuperació caduquen segons la finestra mòbil de recuperació del proveïdor; no s’editen individualment quan s’elimina un registre actiu. La conservació es limita a aquesta finestra configurada, llevat d’una retenció legal documentada. Els registres de seguretat o facturació del proveïdor poden tenir conservació legal pròpia. Pots demanar a suport els terminis i excepcions aplicables a la sol·licitud; explicarem quina informació roman i per què. La supressió no implica un esborrament instantani a totes les còpies de seguretat o independents.",
        ],
      },
      {
        id: "website",
        title: "8. Demo web, galetes i emmagatzematge local",
        paragraphs: [
          "Demo en directe: no desem la gravació. El text i les tasques trobades es desen xifrats fins a 24 hores, perquè tornar-ho a provar no gasti un altre intent, i després s’esborren automàticament. La demo en directe envia la gravació o el text a Google només quan toques Fet, o quan una gravació arriba al seu límit d’un minut. Res d’ella es desa en un compte de l’app.",
          "En obrir-la es carrega Turnstile, que rep senyals del navegador/connexió per prevenir abús. La galeta necessària __Host-tf-demo identifica una sessió signada per als límits i dura fins a 30 dies. Els límits per xarxa fan servir una forma codificada de la teva adreça de xarxa, que continua sent una dada personal.",
          "Les quotes de navegador/xarxa caduquen a les 48 hores i es posen en cua de supressió. Els totals mensuals d’ús, durada, tokens i cost no contenen tasques ni gravacions.",
          "taskflow-theme recorda localment el tema que tries fins que l’esborres. L’adreça principal i la de la pàgina de supressió obren el web en l’idioma del navegador si és castellà o català, i en anglès si no; no fem servir mai la teva ubicació per a això. Si tries un idioma al selector d’idioma, la galeta taskflow-lang el recorda fins a un any, com el tema, perquè el web s’obri en aquest idioma la propera vegada. No hi ha galetes publicitàries ni analítica de màrqueting de tercers. La seguretat necessària i la preferència demanada no s’utilitzen per a publicitat. Pots esborrar dades del navegador, afectant preferències/demo però no necessàriament registres del servidor. Qualsevol seguiment futur no essencial necessitarà informació i consentiment propis.",
        ],
      },
      {
        id: "permissions",
        title: "9. Permisos i seguretat",
        paragraphs: [
          "Demanem micròfon per gravar, notificacions per recordar i els permisos pertinents de fitxers, fotos, càmera o calendari quan tries aquestes funcions. Els esdeveniments dels calendaris del telèfon es mostren només per consultar-los i es queden al telèfon: no es pugen ni s’envien a la IA. Pots canviar permisos al sistema; revocar-los no esborra dades ja enviades.",
          "Utilitzem HTTPS, contrasenyes desades de manera que no es poden tornar a llegir, autenticació, comprovacions de pertinença, fitxers privats i credencials al servidor. TaskFlow no és una caixa forta amb xifratge d’extrem a extrem: servidor i proveïdors necessaris poden tractar el contingut. També importen seguretat del dispositiu, accessos compartits i exportacions.",
        ],
      },
      {
        id: "rights",
        title: "10. Drets i contacte",
        paragraphs: [
          "Quan correspongui, pots demanar accés, rectificació, supressió, limitació, portabilitat de dades tractades automàticament per consentiment/contracte i oposició a l’interès legítim. Pots retirar el consentiment que fonamenta un tractament. Pots reclamar a l’AEPD o autoritat competent sense haver-nos contactat abans.",
          "Escriu a taskflow.support@garbar.tech i identifica el compte i el dret exercit. Verifiquem la identitat proporcionalment, sense demanar contrasenya ni targeta. Normalment responem en un mes natural des de la recepció de la sol·licitud; una ampliació legal de fins a dos mesos addicionals per complexitat o nombre s’explica dins del primer mes. L’exercici és normalment gratuït.",
          "Suprimir el compte no cancel·la la subscripció de botiga; la pàgina de supressió explica totes dues gestions. Si una obligació legal o drets de tercers impedeixen esborrar alguna dada, explicarem el motiu i termini.",
        ],
        contact: "privacy",
        links: [
          {
            label: "Demanar la supressió del compte",
            href: "/delete-account/",
          },
          {
            label: "AEPD — drets i reclamacions",
            href: "https://www.aepd.es/derechos-y-deberes/conoce-tus-derechos",
          },
        ],
      },
      {
        id: "age-changes",
        title: "11. Edat i actualitzacions",
        paragraphs: [
          "La primera versió de TaskFlow s’adreça exclusivament a persones de 18 anys o més, incloses les funcions d’IA. Si creus que una persona menor de 18 anys ha facilitat dades, contacta’ns per valorar el cas i prendre les mesures oportunes, inclosa la supressió del compte i les dades quan correspongui.",
          "Actualitzarem l’avís quan canviïn el servei o l’ús de dades, indicant versió/data i avisant dels canvis rellevants quan correspongui. Un nou avís no autoritza retroactivament un ús incompatible.",
        ],
      },
    ],
  },
  terms: {
    title: "Termes i condicions de TaskFlow",
    description:
      "Termes i condicions de TaskFlow: compte, projectes compartits, dictat, subscripcions i drets de consum.",
    summary: [
      "TaskFlow t’ajuda a planificar; tu decideixes.",
      "El contingut continua sent teu.",
      "Es respecten els teus drets legals de consum.",
    ],
    sections: [
      {
        id: "operator",
        title: "1. TaskFlow i aquestes condicions",
        company: true,
        paragraphs: [
          "Descriuen la relació entre GARBAR, IN-TEC, S.L. i qui utilitza TaskFlow, que és el producte i no una entitat jurídica diferent. Cobreixen l’app i serveis; la política de privacitat explica les dades separadament.",
          "L’app actual és una prova privada i el web ofereix una demo, sense contractació de pagament web ni descàrrega pública. Només compres de prova: no es cobra res, i les subscripcions de prova poden renovar-se o acabar abans que les reals. Les clàusules de pagament real només s’apliquen quan s’ofereix i es formalitza la compra.",
          "Abans de crear un compte públic o contractar, cal poder revisar condicions i oferta. Visitar el web o rebre una invitació no crea una subscripció de pagament.",
        ],
      },
      {
        id: "account",
        title: "2. Compte i requisits",
        paragraphs: [
          "Dona dades correctes, protegeix l’accés i avisa d’usos no autoritzats. No suplantis ningú ni eludeixis límits amb comptes aliens. Podem verificar raonablement la titularitat.",
          "Has de tenir almenys 18 anys per utilitzar TaskFlow en aquesta primera versió. Cal autorització per actuar per una organització. Si correspon, el contracte d’encàrrec de tractament d’equips/empreses s’acorda separadament; aquestes condicions no el substitueixen.",
        ],
      },
      {
        id: "service",
        title: "3. Abast del servei",
        paragraphs: [
          "TaskFlow ofereix tasques/notes, calendaris, recordatoris, IA opcional, sincronització i projectes compartits quan estiguin habilitats. Funcions i límits consten a l’app i l’oferta. Una demo o previsió no garanteix una funció futura.",
          "Algunes funcions requereixen dispositiu compatible, connexió i permisos. Els canvis sense connexió se sincronitzen quan és possible. Els recordatoris depenen del sistema, bateria i permisos; comprova terminis importants per altres mitjans. No som emergències, assessor mèdic ni alarma garantida.",
          "Podem mantenir i actualitzar el servei per seguretat o funcionament. Donarem les actualitzacions exigibles i avís raonable de canvis materials, amb els drets de cancel·lació/reemborsament que pertoquin. No podem retirar arbitràriament funcions pagades.",
        ],
      },
      {
        id: "content",
        title: "4. Contingut i col·laboració",
        paragraphs: [
          "Mantens els drets del que afegeixes. Ens permets només allotjar, copiar, tractar, sincronitzar i mostrar el contingut a tu i persones autoritzades, amb els proveïdors descrits. No permet vendre’l ni utilitzar-lo en publicitat.",
          "Comparteix contingut amb drets i base legítima. Els responsables gestionen permisos, les invitacions necessiten acceptació i els membres poden conservar exportacions. No facis spam ni pugis programari maliciós o contingut il·lícit.",
          "No interfereixis amb el servei, accedeixis sense autorització, revenguis accés aliè ni eludeixis controls raonables. Els límits contractuals de pagament s’han d’informar abans de la compra.",
        ],
      },
      {
        id: "ai",
        title: "5. Suggeriments de la IA",
        paragraphs: [
          "La IA opcional envia entrada/context al proveïdor descrit. Pot ometre, malinterpretar o inventar. Revisa títol, data, hora, prioritat, notes, projecte i destinataris abans de desar/compartir. No és assessorament ni garantia d’exactitud.",
          "Ets responsable de les instruccions i de l’ús dels suggeriments revisats, sense excloure els nostres deures de qualitat, seguretat i conformitat. No enviïs dades confidencials o especialment sensibles a la demo.",
        ],
      },
      {
        id: "subscription",
        title: "6. Plans, renovació i cancel·lació",
        paragraphs: [
          "Quan hi hagi compres reals, abans de confirmar es mostraran pla, funcions/límits, preu total i impostos, període, prova i renovació automàtica. El preu és el de l’oferta i la pantalla de contractació.",
          "La subscripció es renova fins a cancel·lar-la segons el canal. Gestiona-la o cancel·la-la al compte de Google Play amb què la vas comprar, respectant-ne el termini indicat. Cancel·lar normalment evita renovacions i manté el període pagat, subjecte a reemborsaments i drets legals. Desinstal·lar l’app o suprimir el compte no cancel·la per si sol una subscripció de botiga.",
          "RevenueCat verifica accés i la botiga cobra. Si s’afegeix compra web, s’identificaran proveïdor i cancel·lació abans de contractar; actualment no es cobren subscripcions web.",
          "Els canvis de preu s’avisaran conforme a la llei i botiga, amb aprovació quan calgui i oportunitat de cancel·lar. Contacta per duplicats o accés pagat que falla; usar un altre dispositiu compatible no obliga a recomprar el mateix accés.",
        ],
      },
      {
        id: "withdrawal",
        title: "7. Desistiment, reemborsament i conformitat",
        paragraphs: [
          "Els consumidors d’Espanya/UE disposen generalment de 14 dies naturals des de la contractació a distància per desistir sense motiu. Entrar, descarregar o començar no suprimeix per si sol aquest dret. Si demanes expressament començar durant el termini, només es pot exigir una part proporcional amb els requisits legals complerts.",
          "L’excepció per a servei íntegrament executat o contingut digital sense suport físic només opera amb tots els requisits, inclosos petició/consentiment expressos, coneixement i confirmació exigibles. Una subscripció continuada no s’executa íntegrament el primer dia. La botiga no elimina drets imperatius.",
          "Comunica inequívocament el desistiment al contacte o canal de la botiga, indicant compte, data i referència, mai targeta completa. El model és opcional. Si correspon, es reemborsa dins del termini legal, normalment 14 dies des de la notificació, pel mitjà original llevat d’acord vàlid diferent.",
          "Model: A GARBAR, IN-TEC, S.L., a l’adreça/contacte d’aquesta pàgina. Comunico el desistiment del contracte de [pla/servei TaskFlow], contractat el [data]. Compte/referència: […]. Nom i domicili del consumidor: […]. Data: […]. Signatura només en paper.",
          "El servei digital ha de ser conforme. Si no ho és, pots tenir dret a posada en conformitat, reducció del preu o resolució/reemborsament. Cap regla de ‘sense devolucions’ suprimeix aquests drets.",
        ],
        contact: "withdrawal",
      },
      {
        id: "ending",
        title: "8. Baixa, suspensió i supressió",
        paragraphs: [
          "Pots suprimir el compte a Configuració → Compte → Suprimeix el compte, o demanar-ne la supressió i ajuda a taskflow.support@garbar.tech sense accedir a l’app. Revisa les dades personals que s’esborraran i els traspassos de contingut compartit abans de confirmar. Exporta allò que vulguis conservar; l’exportació de tasques no inclou adjunts i els has de desar a part. Cancel·lar la subscripció i suprimir el compte són gestions diferents: no has de comprar cap servei ni cancel·lar abans de demanar la supressió.",
          "Podem restringir proporcionalment l’accés per incompliment greu, frau, activitat il·lícita o risc. Quan correspongui, expliquem motiu i via de reclamació/correcció; una urgència pot requerir actuació immediata. Es mantenen drets d’accés i reemborsament.",
          "Si tanquem el servei, donarem avís raonable, oportunitat de recuperar dades i reemborsament exigible del servei pagat no utilitzat. No reservem un dret general d’esborrar contingut pagat sense avís.",
        ],
        links: [
          {
            label: "Suprimir el compte i les dades associades",
            href: "/delete-account/",
          },
          {
            label: "Drets de privacitat i contacte",
            href: "/privacy/#rights",
          },
        ],
      },
      {
        id: "responsibility",
        title: "9. Responsabilitat i propietat intel·lectual",
        paragraphs: [
          "Programari, disseny i marques pertanyen als titulars. Pots utilitzar-los per al servei, sense adquirir-ne titularitat. Es mantenen les llicències de tercers i codi obert.",
          "Responem segons la llei. No excloem responsabilitats irrenunciables, inclosos frau, dol, danys personals protegits i drets imperatius de consum/dades. No imposem renúncies generals ni límits arbitraris al consumidor.",
        ],
      },
      {
        id: "complaints",
        title: "10. Reclamacions, llei i canvis",
        paragraphs: [
          "Envia consultes o reclamacions al contacte de l’empresa. En donarem constància i resposta dins del termini legal, com a màxim un mes en consum. Pots acudir a autoritats de consum o entitats competents de resolució. No afirmem adhesió a arbitratge sense confirmació.",
          "S’aplica la llei espanyola sense privar-te de proteccions imperatives de la residència habitual. Són competents els tribunals previstos legalment, sense obligar-te a litigar a la nostra ciutat.",
          "Identificarem versions i comunicarem canvis materials abans de l’eficàcia quan pertoqui. No alteren retroactivament compres ni drets adquirits. Les versions anglesa, espanyola i catalana volen dir el mateix; una diferència no reduirà drets imperatius.",
        ],
        contact: "privacy",
      },
    ],
  },
  legal: {
    title: "Avís legal: l’empresa darrere de TaskFlow",
    description:
      "Avís legal i informació de GARBAR, IN-TEC, S.L., operadora de TaskFlow.",
    summary: [
      "TaskFlow és el nom del producte.",
      "GARBAR, IN-TEC, S.L. és l’operadora.",
      "Escriu-nos a taskflow@garbar.tech.",
    ],
    sections: [
      {
        id: "company",
        title: "1. Dades de l’entitat",
        company: true,
        paragraphs: [
          "GARBAR, IN-TEC, S.L., identificada a dalt, opera taskflow.garbar.tech i el servei TaskFlow. Aquest avís facilita la informació de l’entitat d’acord amb la Llei 34/2002 de serveis de la societat de la informació i comerç electrònic. TaskFlow és la marca del producte, no una entitat jurídica diferent.",
          "Per a consultes generals, escriu a taskflow@garbar.tech. Per a ajuda amb l’app, reclamacions, drets de privacitat o supressió de comptes, escriu a taskflow.support@garbar.tech. També pots escriure al domicili social indicat. Els missatges automàtics utilitzen taskflow.noreply@garbar.tech; dirigeix les consultes al correu de suport.",
        ],
        contact: "privacy",
      },
      {
        id: "scope",
        title: "2. Web i producte",
        paragraphs: [
          "El lloc presenta TaskFlow i demostracions opcionals. Només són exigibles disponibilitat, preus i funcions expressament oferts. La vista prèvia actual no ven subscripcions ni ofereix l’app per descarregar.",
          "Les condicions regulen el servei i la política explica dades, galetes necessàries i emmagatzematge local. Contacta per contingut il·lícit, incidents o errors.",
        ],
      },
      {
        id: "rights",
        title: "3. Drets i serveis externs",
        paragraphs: [
          "Contingut, programari i marca pertanyen als titulars. Pots utilitzar el web per a la finalitat prevista i exercir drets legals, sense suplantar TaskFlow ni fingir-ne suport.",
          "Els enllaços externs identifiquen serveis de tercers; no exclouen les nostres obligacions. Es mantenen drets de consum i protecció de dades.",
        ],
      },
    ],
  },
  "delete-account": {
    title: "Suprimeix el teu compte de TaskFlow.",
    description:
      "Suprimeix el compte des de l’app o escriu a suport sense iniciar sessió.",
    summary: [
      "Es suprimeixen el compte i les teves tasques, notes i fitxers a tots els dispositius.",
      "Es queda per als altres el que vas afegir a projectes compartits, sense el teu nom.",
      "Suprimir el compte no cancel·la TaskFlow Pro a Google Play.",
    ],
    sections: [
      {
        id: "in-app",
        title: "1. Suprimir des de l’app",
        paragraphs: [
          "Obre Configuració → Compte → Suprimeix el compte. La pantalla identifica el compte, compta les tasques, notes i fitxers personals que s’esborraran i mostra el contingut compartit que roman i qui en rebrà la titularitat. Pots desar abans una còpia de les tasques; els adjunts no s’inclouen en aquesta exportació i els has de desar a part.",
          "Confirma amb la contrasenya o amb el mateix compte de Google amb què has iniciat sessió. Cal connexió a internet. Obrir aquesta pantalla no suprimeix res. Si la titularitat compartida canvia abans de confirmar, l’app demana revisar el pla actualitzat. Quan el servidor confirma la supressió, es tanca la sessió i apareix la confirmació; no es pot desfer.",
        ],
      },
      {
        id: "request",
        title: "2. Sol·licitar per correu",
        paragraphs: [
          "Escriu a taskflow.support@garbar.tech, preferiblement des del correu del compte, i identifica el compte de TaskFlow que vols suprimir. Pots fer servir aquesta via si has desinstal·lat l’app, no pots entrar-hi, necessites ajuda o vols incloure dades en els nostres proveïdors. No cal justificar la baixa, comprar res ni pagar per una sol·licitud ordinària.",
          "Si ja no controles el correu del compte, explica-ho perquè en verifiquem la titularitat de manera proporcionada. No enviïs contrasenyes, números de targeta ni documents d’identitat tret que s’acordi una verificació necessària i segura.",
          "Obrir l’aplicació de correu no envia la sol·licitud automàticament. Aquesta pàgina no suprimeix cap compte immediatament: revisa el missatge i envia’l. Suport de TaskFlow el tramita en nom de GARBAR, IN-TEC, S.L.",
        ],
        contact: "deletion",
      },
      {
        id: "scope",
        title: "3. Què se suprimeix i què es queda",
        bullets: [
          "Se suprimeix, a tots els dispositius: el compte, les teves tasques, notes i fitxers i els projectes que només fas servir tu. També l’accés, el vincle amb Google, les sessions, la pertinença a projectes i grups, les preferències d’avisos i el recompte de dictats gratuïts. A més, demanem a RevenueCat, l’empresa que comprova les subscripcions per nosaltres, que esborri el registre que té de tu.",
          "Es queda per als altres: les tasques, les notes i els fitxers que vas afegir a projectes compartits. Se’n treu el teu nom, també de «Creada per», però el que hi vas escriure no canvia. Els projectes i grups que són teus passen a un altre membre; l’app et diu a qui abans de confirmar. Si a dins hi ha dades personals teves, escriu a suport.",
          "L’app no suprimeix: el registre de les teves compres que guarda Google Play, els correus amb suport, els registres de seguretat ni les còpies de seguretat, que caduquen soles. Demana a suport que suprimeixi el que es pugui; et direm què s’ha de conservar, per què i durant quant de temps. No podem suprimir les còpies que hagin desat altres persones.",
        ],
      },
      {
        id: "timing",
        title: "4. Terminis i confirmació",
        paragraphs: [
          "A l’app, el compte se suprimeix tan bon punt confirmes, i els fitxers just després (si algun no es pot suprimir en aquell moment, ens n’ocupem després). Veus la confirmació a l’app; no s’envia cap correu. Si l’app mostra un error, no ho donis per fet: torna-ho a provar o escriu a suport.",
          "Per a sol·licituds a suport, normalment responem en un mes natural des de la recepció. Una ampliació permesa de fins a dos mesos addicionals per complexitat o nombroses sol·licituds s’explica dins del primer mes. Verifiquem la titularitat, suprimim sense dilació indeguda quan correspon i confirmem el resultat. Si cal conservar informació, expliquem la finalitat, el fonament legal, el termini o criteris de conservació i com reclamar.",
          "El contingut compartit roman per a l’espai que continua segons s’ha explicat. Les còpies de seguretat caduquen soles. Els registres restringits necessaris per a una obligació legal, investigació de seguretat o reclamació es conserven només durant el termini aplicable a la finalitat. La política de privacitat detalla la conservació.",
        ],
        links: [
          {
            label: "Emmagatzematge i conservació",
            href: "/privacy/#retention",
          },
        ],
      },
      {
        id: "subscription",
        title: "5. Subscripcions i còpies del dispositiu",
        paragraphs: [
          "Suprimir el compte no cancel·la TaskFlow Pro a Google Play. Cancel·la la renovació al compte de la botiga on has comprat; contacta amb suport si cal ajuda. Cancel·lar no és requisit per demanar supressió. Només compres de prova: no es fa cap cobrament real.",
          "Desa allò que vulguis conservar abans. L’app esborra la seva còpia local després de la supressió confirmada i els altres dispositius connectats ho fan en tornar a contactar amb el servei. Elimina a part exportacions, descàrregues externes i còpies del dispositiu. El compte de Google no se suprimeix.",
        ],
        links: [
          {
            label: "Gestionar subscripcions de Google Play",
            href: "https://support.google.com/googleplay/answer/7018481",
          },
        ],
      },
      {
        id: "other-rights",
        title: "6. Altres sol·licituds de privacitat",
        paragraphs: [
          "Pots demanar accés, còpia, rectificació o supressió de dades concretes sense tancar el compte. La política de privacitat explica els drets i com reclamar davant l’AEPD o l’autoritat de control competent.",
        ],
        links: [
          {
            label: "Llegir la política de privacitat",
            href: "/privacy/#rights",
          },
        ],
      },
    ],
  },
};
