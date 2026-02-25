# Kitz Deck System -- Sample Presentations

> **Purpose:** Production-quality reference examples that demonstrate excellent presentation design using the Kitz deck system. These serve as gold-standard templates for AI-generated content and as documentation for the `deck_create` tool's output quality.
>
> **Slide Types:** `title` | `content` | `stats` | `comparison` | `quote` | `cta`
>
> **SlideSpec Interface:**
> ```typescript
> interface SlideSpec {
>   title: string;
>   type: 'title' | 'content' | 'stats' | 'comparison' | 'quote' | 'cta';
>   bullets?: string[];
>   stats?: Array<{ label: string; value: string }>;
>   leftColumn?: string[];
>   rightColumn?: string[];
>   quoteText?: string;
>   attribution?: string;
>   ctaText?: string;
> }
> ```

---

## Table of Contents

1. [Example 1: Digital Marketing Fundamentals (Educational, 12 slides)](#example-1-digital-marketing-fundamentals-for-small-business)
2. [Example 2: Sales Pipeline Workshop (Workshop, 15 slides)](#example-2-building-your-first-sales-pipeline)
3. [Example 3: Q1 2026 Growth Strategy (Internal Strategy, 10 slides)](#example-3-q1-2026-growth-strategy--techstart-solutions)

---

## Example 1: Digital Marketing Fundamentals for Small Business

**Title:** "Fundamentos de Marketing Digital para Tu Negocio"
**Audience:** Small business owners in Latin America who are new to digital marketing
**Tone:** Conversational, encouraging, practical -- like a knowledgeable friend explaining things over coffee
**Total Duration:** 45 minutes
**Slide Count:** 12

### Presentation Overview

This educational deck is designed for a live workshop or webinar where small business owners learn the basics of digital marketing. It balances instruction with real examples relevant to the LatAm market, and closes with actionable next steps. The narrative arc moves from "why digital marketing matters" through specific channels to a case study that makes it tangible, then empowers attendees with an exercise before sending them off with resources.

---

#### Slide 1: Title
**Type:** `title`
**Duration:** 1 minute
**Layout:** centered

**Content:**

```
Title: "Fundamentos de Marketing Digital para Tu Negocio"
Subtitle: "De cero a presencia digital en 45 minutos"
Presenter: [Nombre del Presentador]
Date: [Fecha]
```

**SlideSpec:**
```json
{
  "title": "Fundamentos de Marketing Digital para Tu Negocio",
  "type": "title"
}
```

**Speaker Notes:**
Buenos dias a todos. Hoy vamos a hablar de algo que puede transformar tu negocio: el marketing digital. No necesitas ser experto en tecnologia ni tener un gran presupuesto. Lo que necesitas es una estrategia clara y las herramientas correctas. Al final de esta sesion, vas a tener un plan concreto para empezar.

**Design Notes:**
Use brand primary color for the title. Clean, minimal layout. Business name and tagline rendered via the brand kit. No background imagery -- let the typography carry the slide. Consider a subtle gradient from `purple-50` to `white` as background.

---

#### Slide 2: The Hook -- Search Engine Statistic
**Type:** `stats`
**Duration:** 2 minutes
**Layout:** centered

**Content:**

```
Title: "Tus clientes ya te estan buscando"

Stats:
- 93% -- "de las experiencias en linea comienzan con un buscador"
- 78% -- "de las busquedas locales en celular resultan en una compra dentro de 24 horas"
- 46% -- "de todas las busquedas en Google tienen intencion local"
```

**SlideSpec:**
```json
{
  "title": "Tus clientes ya te estan buscando",
  "type": "stats",
  "stats": [
    { "label": "de experiencias online empiezan en un buscador", "value": "93%" },
    { "label": "de busquedas locales terminan en compra en 24h", "value": "78%" },
    { "label": "de busquedas en Google son locales", "value": "46%" }
  ]
}
```

**Speaker Notes:**
Quiero que piensen en esto: casi todas las personas que buscan algo en internet empiezan en Google. Y casi la mitad de esas busquedas son para algo local -- un restaurante, un mecanico, una tienda de ropa. Si tu negocio no aparece cuando alguien busca lo que tu vendes, estas dejando dinero sobre la mesa. Y no estamos hablando de un futuro lejano -- el 78% de esas busquedas locales desde un celular resultan en una compra ese mismo dia.

**Design Notes:**
Large, bold numbers in brand primary color against white cards. Each stat should feel impactful. The numbers should be the largest text element on the slide (36px+). Use the `stats` type rendering with its grid layout. Subtle shadow on each stat card.

---

#### Slide 3: Agenda -- Learning Objectives
**Type:** `content`
**Duration:** 1 minute
**Layout:** left-aligned

**Content:**

```
Title: "Lo que vamos a aprender hoy"

Bullets:
1. Entender como tus clientes te encuentran en linea -- y como puedes influir en eso
2. Crear una estrategia de redes sociales que no te consuma todo el dia
3. Usar email marketing para convertir seguidores en clientes que pagan
4. Configurar tu Perfil de Google Business para aparecer en busquedas locales
```

**SlideSpec:**
```json
{
  "title": "Lo que vamos a aprender hoy",
  "type": "content",
  "bullets": [
    "Entender como tus clientes te encuentran en linea -- y como puedes influir en eso",
    "Crear una estrategia de redes sociales que no te consuma todo el dia",
    "Usar email marketing para convertir seguidores en clientes que pagan",
    "Configurar tu Perfil de Google Business para aparecer en busquedas locales"
  ]
}
```

**Speaker Notes:**
Este es nuestro plan para los proximos 45 minutos. No vamos a cubrir todo el marketing digital -- eso seria imposible. Nos vamos a enfocar en las cuatro areas que tienen el mayor impacto para negocios pequenos. La idea es que salgas de aqui con al menos una accion concreta que puedas implementar esta misma semana.

**Design Notes:**
Numbered list with bullet accent color. Each item should have adequate vertical spacing (10px+ padding) for readability. Use the `content` type bullet rendering. Keep text size at 18px for legibility.

---

#### Slide 4: Understanding Your Customer Online
**Type:** `content`
**Duration:** 5 minutes
**Layout:** left-aligned

**Content:**

```
Title: "Entendiendo a Tu Cliente en Linea"

Bullets:
- El viaje del cliente: Descubrimiento -> Investigacion -> Comparacion -> Compra -> Recomendacion
- Tu cliente busca en Google, pregunta en WhatsApp, revisa tus redes, y compara precios -- todo en 10 minutos
- El 72% de los consumidores en LatAm investigan en linea antes de comprar localmente
- Pregunta clave: "Si un cliente busca lo que yo vendo, que encuentra?"
- Ejercicio rapido: Busca tu propio negocio en Google ahora mismo -- que ves?
```

**SlideSpec:**
```json
{
  "title": "Entendiendo a Tu Cliente en Linea",
  "type": "content",
  "bullets": [
    "El viaje: Descubrimiento > Investigacion > Comparacion > Compra > Recomendacion",
    "Tu cliente busca en Google, pregunta en WhatsApp, revisa tus redes y compara -- en 10 minutos",
    "72% de consumidores en LatAm investigan en linea antes de comprar localmente",
    "Pregunta clave: Si un cliente busca lo que yo vendo, que encuentra?",
    "Ejercicio rapido: Busca tu propio negocio en Google ahora mismo"
  ]
}
```

**Speaker Notes:**
Antes de hablar de herramientas, necesitamos entender como piensa tu cliente. El viaje del cliente ya no es lineal -- la persona puede descubrir tu negocio en Instagram, verificar tus resenas en Google, preguntarle a un amigo por WhatsApp, y regresar a comprarte una semana despues. Lo importante es estar presente en cada uno de esos puntos de contacto. Les voy a pedir que hagan algo ahora mismo: busquen su propio negocio en Google desde su celular. Que aparece? Eso es exactamente lo que ven sus clientes potenciales.

**Design Notes:**
The first bullet should feel like a flow diagram even in text form. Use arrow characters or em-dashes to show progression. Highlight the "72%" stat in brand accent color to draw attention. The "Ejercicio rapido" bullet should be visually distinct -- consider italic or a different color to signal interactivity.

---

#### Slide 5: Social Media Strategy That Works
**Type:** `content`
**Duration:** 5 minutes
**Layout:** left-aligned

**Content:**

```
Title: "Estrategia de Redes Sociales que Funciona"

Bullets:
- Regla del 80/20: 80% contenido de valor (tips, detras de camaras, historias) / 20% venta directa
- No necesitas estar en todas las plataformas -- elige 1 o 2 donde estan tus clientes
- Instagram: ideal para negocios visuales (comida, moda, belleza, diseno)
- Facebook: comunidades locales, grupos, marketplace -- sigue siendo el rey en LatAm
- WhatsApp Business: el canal de conversion mas poderoso en la region
- Frecuencia ideal: 3-5 publicaciones por semana, 1-2 stories diarias
```

**SlideSpec:**
```json
{
  "title": "Estrategia de Redes Sociales que Funciona",
  "type": "content",
  "bullets": [
    "Regla 80/20: 80% contenido de valor (tips, historias) / 20% venta directa",
    "No necesitas estar en todas partes -- elige 1-2 plataformas donde estan tus clientes",
    "Instagram: ideal para negocios visuales (comida, moda, belleza, diseno)",
    "Facebook: comunidades locales, grupos, marketplace -- el rey en LatAm",
    "WhatsApp Business: el canal de conversion mas poderoso de la region",
    "Frecuencia ideal: 3-5 posts por semana, 1-2 stories al dia"
  ]
}
```

**Speaker Notes:**
El error mas comun que veo es negocios que intentan estar en todas las redes sociales y terminan haciendo todo a medias. Es mucho mejor dominar una o dos plataformas que tener presencia mediocre en cinco. En Latinoamerica, Facebook sigue siendo enormemente importante -- especialmente los grupos locales y el marketplace. Instagram es imprescindible si tu producto es visual. Y WhatsApp Business es probablemente la herramienta mas subutilizada: es donde la gente ya pasa su tiempo y donde se cierran las ventas. La regla del 80/20 es fundamental: si solo publicas ofertas, la gente te deja de seguir. Pero si les das valor, cuando publiques una oferta, van a prestar atencion.

**Design Notes:**
The "80/20" text should be bold and in the accent color. Consider using a slightly larger font for the first bullet as it is the key takeaway. Platform names (Instagram, Facebook, WhatsApp) could be in bold. Keep enough whitespace between bullets for scanning.

---

#### Slide 6: Email Marketing Basics
**Type:** `comparison`
**Duration:** 5 minutes
**Layout:** split

**Content:**

```
Title: "Email Marketing: Tu Arma Secreta"

Left Column (Lo que SI funciona):
- Emails de bienvenida con un descuento del primer pedido
- Newsletter semanal con contenido util + 1 oferta
- Seguimiento automatico despues de una compra
- Asuntos cortos y personalizados (menos de 50 caracteres)
- Un solo llamado a la accion claro por email

Right Column (Lo que NO funciona):
- Enviar emails sin permiso (spam = multas + reputacion danada)
- Emails solo con ofertas sin valor agregado
- Enviar todos los dias (fatiga = desuscripciones)
- Asuntos enganiosos o con MAYUSCULAS EXCESIVAS
- Diseno recargado que no se ve bien en celular
```

**SlideSpec:**
```json
{
  "title": "Email Marketing: Tu Arma Secreta",
  "type": "comparison",
  "leftColumn": [
    "Emails de bienvenida con descuento del primer pedido",
    "Newsletter semanal: contenido util + 1 oferta",
    "Seguimiento automatico post-compra",
    "Asuntos cortos y personalizados (<50 caracteres)",
    "Un solo llamado a la accion claro"
  ],
  "rightColumn": [
    "Enviar sin permiso (spam = multas + mala reputacion)",
    "Emails solo con ofertas, sin valor",
    "Enviar diario (fatiga = desuscripciones)",
    "Asuntos enganiosos o con MAYUSCULAS",
    "Diseno recargado que no funciona en celular"
  ]
}
```

**Speaker Notes:**
El email marketing tiene el retorno de inversion mas alto de cualquier canal digital: por cada dolar que inviertes, recuperas en promedio 36. Pero la clave es hacerlo bien. A la izquierda tienen lo que funciona, a la derecha lo que no. El consejo mas importante: empieza con un email de bienvenida automatico. Cuando alguien se suscribe, ese es tu momento de mayor atencion. Un email de bienvenida tiene una tasa de apertura del 82% -- comparado con el 20% de un email normal. Aprovechalo con un descuento o algo de valor inmediato.

**Design Notes:**
Use the `comparison` type with clear visual separation between columns. Left column header in success/green color ("Lo que SI funciona"), right column in warning/amber color ("Lo que NO funciona"). The two-column grid should have balanced spacing. Items should align horizontally for easy scanning.

---

#### Slide 7: Google Business Profile
**Type:** `content`
**Duration:** 5 minutes
**Layout:** left-aligned

**Content:**

```
Title: "Google Business Profile: Tu Vitrina Digital Gratuita"

Bullets:
- Es GRATIS y apareces en Google Maps y busquedas locales automaticamente
- Los negocios con perfil completo reciben 7x mas clicks que los incompletos
- Agrega: fotos de calidad (minimo 10), horarios actualizados, numero de WhatsApp
- Responde TODAS las resenas -- las positivas con agradecimiento, las negativas con solucion
- Publica actualizaciones semanales (ofertas, eventos, nuevos productos)
- Tip profesional: Pide a cada cliente satisfecho que te deje una resena con estrella
```

**SlideSpec:**
```json
{
  "title": "Google Business Profile: Tu Vitrina Digital Gratuita",
  "type": "content",
  "bullets": [
    "GRATIS: apareces en Google Maps y busquedas locales automaticamente",
    "Perfiles completos reciben 7x mas clicks que los incompletos",
    "Agrega: fotos de calidad (min. 10), horarios, numero de WhatsApp",
    "Responde TODAS las resenas -- positivas y negativas",
    "Publica actualizaciones semanales (ofertas, eventos, productos nuevos)",
    "Tip pro: Pide a cada cliente satisfecho una resena con estrella"
  ]
}
```

**Speaker Notes:**
Si solo pudieran hacer una cosa de todo lo que hablemos hoy, les diria: creen o completen su Perfil de Negocio en Google. Es la herramienta mas poderosa y subestimada para negocios locales, y es completamente gratuita. Cuando alguien busca "panaderia cerca de mi" o "mecanico en [su ciudad]", Google muestra un mapa con tres resultados. Si tu perfil esta completo -- con fotos, horarios, resenas -- tienes siete veces mas probabilidad de aparecer ahi. Siete veces. Y las resenas son oro: el 88% de las personas confian en resenas en linea tanto como en recomendaciones personales.

**Design Notes:**
"GRATIS" should be bold and in success/green color to immediately catch attention. The "7x" statistic should be large or bold. The "Tip profesional" bullet should be visually distinct, perhaps with a different icon or accent color, to signal that it is a bonus insight.

---

#### Slide 8: Case Study -- Cafe Luna
**Type:** `quote`
**Duration:** 5 minutes
**Layout:** centered

**Content:**

```
Quote: "Empezamos con 12 seguidores en Instagram y vendiamos 40 cafes al dia. En 8 meses, con una estrategia digital consistente, llegamos a 4,200 seguidores, 120 resenas de 5 estrellas en Google, y triplicamos nuestras ventas. No gastamos un solo centavo en publicidad pagada."

Attribution: "Maria Elena Rodriguez, fundadora de Cafe Luna -- Medellin, Colombia"
```

**SlideSpec:**
```json
{
  "title": "Caso de Exito: Cafe Luna",
  "type": "quote",
  "quoteText": "Empezamos con 12 seguidores en Instagram y vendiamos 40 cafes al dia. En 8 meses, con una estrategia digital consistente, llegamos a 4,200 seguidores, 120 resenas de 5 estrellas en Google, y triplicamos nuestras ventas. No gastamos un solo centavo en publicidad pagada.",
  "attribution": "Maria Elena Rodriguez, fundadora de Cafe Luna -- Medellin, Colombia"
}
```

**Speaker Notes:**
Les quiero contar la historia de Cafe Luna, una cafeteria pequena en Medellin. Maria Elena abrio su cafe con un presupuesto minimo y cero experiencia en marketing digital. Lo que hizo fue simple pero consistente: publicaba 4 fotos por semana en Instagram mostrando el proceso de preparacion del cafe, contestaba cada mensaje en WhatsApp en menos de 5 minutos, y le pedia a cada cliente satisfecho que le dejara una resena en Google. No uso publicidad pagada -- todo fue organico. En 8 meses, su negocio se transformo completamente. Esto no es magia. Es estrategia consistente, paso a paso.

**Design Notes:**
Use the `quote` type rendering: large quotation marks in brand primary color, italic quote text at 24px, attribution in secondary color below. This should feel like a testimonial that builds credibility. The centered layout with generous whitespace makes it feel premium and lets the story breathe.

---

#### Slide 9: Exercise -- Map Your Digital Presence
**Type:** `content`
**Duration:** 5 minutes
**Layout:** left-aligned

**Content:**

```
Title: "Ejercicio: Mapa de Tu Presencia Digital"

Bullets:
- Paso 1: Anota todos los lugares donde tu negocio aparece en linea (Google, redes, directorios)
- Paso 2: Para cada uno, calificalo del 1 al 5 (1 = abandonado, 5 = optimizado y activo)
- Paso 3: Identifica los 2 canales con mayor potencial que hoy estan debajo de 3
- Paso 4: Esos 2 canales son tu prioridad para las proximas 4 semanas
- Tiempo: 3 minutos -- empiecen ahora, yo les ayudo con dudas
```

**SlideSpec:**
```json
{
  "title": "Ejercicio: Mapa de Tu Presencia Digital",
  "type": "content",
  "bullets": [
    "Paso 1: Anota todos los lugares donde tu negocio aparece en linea",
    "Paso 2: Califica cada uno del 1-5 (1=abandonado, 5=optimizado)",
    "Paso 3: Identifica 2 canales con mayor potencial que estan debajo de 3",
    "Paso 4: Esos 2 canales son tu prioridad para las proximas 4 semanas",
    "Tiempo: 3 minutos -- empiecen ahora"
  ]
}
```

**Speaker Notes:**
Vamos a pasar de la teoria a la practica. Quiero que tomen 3 minutos para hacer este ejercicio. No tiene que ser perfecto -- solo necesitan una foto honesta de donde estan hoy. Piensen en Google, Instagram, Facebook, WhatsApp Business, su sitio web si tienen uno, directorios locales, paginas amarillas en linea. Pongan un numero al lado de cada uno. Los dos canales que esten mas bajos pero que tengan mayor potencial para su tipo de negocio -- esos son los que vamos a atacar primero. La clave no es hacer todo, es hacer lo correcto.

**Design Notes:**
The numbered steps should feel like a clear worksheet. Consider a slightly different background (very light gray or brand-50) to signal that this is an interactive moment, not a lecture slide. Each "Paso" label should be bold. A small timer icon or clock reference near the "3 minutos" instruction would reinforce urgency.

---

#### Slide 10: Common Mistakes -- Top 5 Digital Marketing Fails
**Type:** `content`
**Duration:** 3 minutes
**Layout:** left-aligned

**Content:**

```
Title: "5 Errores que Matan tu Marketing Digital"

Bullets:
- #1 Inconsistencia: Publicar 10 veces una semana y desaparecer por un mes
- #2 No medir resultados: Si no sabes que funciona, estas adivinando y gastando
- #3 Copiar a la competencia: Tu cliente quiere autenticidad, no una copia
- #4 Ignorar a WhatsApp: En LatAm, el 95% de los smartphones tienen WhatsApp -- tu canal de cierre esta ahi
- #5 No pedir la venta: Contenido sin llamado a la accion es entretenimiento, no marketing
```

**SlideSpec:**
```json
{
  "title": "5 Errores que Matan tu Marketing Digital",
  "type": "content",
  "bullets": [
    "#1 Inconsistencia: Publicar 10 veces una semana y desaparecer un mes",
    "#2 No medir: Si no sabes que funciona, estas adivinando",
    "#3 Copiar a la competencia: Tu cliente quiere autenticidad",
    "#4 Ignorar WhatsApp: 95% de smartphones en LatAm lo tienen -- es tu canal de cierre",
    "#5 No pedir la venta: Sin llamado a la accion, es entretenimiento, no marketing"
  ]
}
```

**Speaker Notes:**
Antes de cerrar, quiero asegurarme de que no cometan estos errores que veo una y otra vez. El numero uno es, por lejos, la inconsistencia. No importa si publicas contenido perfecto si lo haces una vez al mes. Es mejor publicar algo bueno tres veces por semana que algo perfecto una vez al mes. El numero cuatro es especialmente importante para nosotros en Latinoamerica: WhatsApp no es solo una app de mensajes, es tu mostrador de ventas. Tratenlo como tal.

**Design Notes:**
Each numbered error should feel like a warning. Consider using the error/red accent color for the numbers (#1 through #5) to create visual urgency. The explanatory text after each number should be in normal weight. The title itself ("5 Errores que Matan") should convey seriousness.

---

#### Slide 11: Key Takeaways
**Type:** `stats`
**Duration:** 2 minutes
**Layout:** centered

**Content:**

```
Title: "Tus 4 Acciones de Esta Semana"

Stats:
- "1" -- "Completa tu Perfil de Google Business (hoy mismo)"
- "2" -- "Elige tus 2 canales principales y crea un calendario de contenido"
- "3" -- "Configura WhatsApp Business con catalogo y mensaje de bienvenida"
- "4" -- "Mide tus resultados cada viernes: seguidores, mensajes, ventas"
```

**SlideSpec:**
```json
{
  "title": "Tus 4 Acciones de Esta Semana",
  "type": "stats",
  "stats": [
    { "label": "Completa tu Perfil de Google Business (hoy mismo)", "value": "1" },
    { "label": "Elige 2 canales y crea un calendario de contenido", "value": "2" },
    { "label": "Configura WhatsApp Business con catalogo y bienvenida", "value": "3" },
    { "label": "Mide resultados cada viernes: seguidores, mensajes, ventas", "value": "4" }
  ]
}
```

**Speaker Notes:**
Quiero que salgan de aqui con exactamente cuatro cosas que hacer esta semana. No son opcionales -- son las cuatro acciones mas impactantes que pueden tomar hoy. La numero uno es la mas urgente porque es gratuita y tiene impacto inmediato. La numero cuatro es la que separa a los negocios que crecen de los que se estancan: medir. Si cada viernes revisan sus numeros por 15 minutos, en un mes van a saber exactamente que les funciona y que no.

**Design Notes:**
Use the `stats` grid layout but with numbers 1-4 instead of percentages. Each stat card should feel like a commitment card. Brand primary color background on the number cards with white text. The action text beneath each number should be concise but specific. This is the "take away" slide so it should feel conclusive and actionable.

---

#### Slide 12: Resources and Next Steps
**Type:** `cta`
**Duration:** 1 minute
**Layout:** centered

**Content:**

```
Title: "Recursos y Siguientes Pasos"
CTA: "Empieza ahora con Kitz -- tu asistente de marketing digital"

Additional info:
- Guia PDF gratuita: "30 Dias de Marketing Digital" (link)
- Comunidad WhatsApp para resolver dudas
- Sesion de seguimiento: Jueves proximo a las 10am
```

**SlideSpec:**
```json
{
  "title": "Recursos y Siguientes Pasos",
  "type": "cta",
  "ctaText": "Empieza ahora con Kitz -- tu asistente de marketing digital"
}
```

**Speaker Notes:**
Gracias por su tiempo y su atencion. Les voy a compartir tres recursos: una guia PDF con un plan de marketing digital de 30 dias paso a paso, un grupo de WhatsApp donde pueden hacer preguntas y compartir sus avances, y una sesion de seguimiento la proxima semana donde vamos a revisar su progreso. Kitz puede ayudarles a automatizar mucho de lo que hablamos hoy -- desde crear contenido hasta programar envios y gestionar sus clientes. Usen el link en pantalla para probarlo. Mucho exito.

**Design Notes:**
Use the `cta` type rendering with the call-to-action button prominently centered. Brand primary color on the button. Include contact email and phone from the brand kit below the CTA. The overall feel should be warm, inviting, and action-oriented -- not pushy.

---
---

## Example 2: Building Your First Sales Pipeline

**Title:** "Taller: Construye Tu Primer Pipeline de Ventas"
**Audience:** New business owners setting up their sales process for the first time
**Tone:** Energetic, hands-on, step-by-step -- workshop energy with frequent interaction
**Total Duration:** 90 minutes
**Slide Count:** 15

### Presentation Overview

This workshop deck is designed for an interactive 90-minute session where participants build a real sales pipeline from scratch. The structure alternates between instruction, exercises, and debriefs. Each participant should leave with a completed pipeline mapped out and ready to implement in Kitz CRM. The tone is high-energy and practical, with zero theory that does not translate to action.

---

#### Slide 1: Title
**Type:** `title`
**Duration:** 2 minutes
**Layout:** centered

**Content:**

```
Title: "Construye Tu Primer Pipeline de Ventas"
Subtitle: "Taller practico -- 90 minutos para transformar como vendes"
Presenter: [Nombre del Facilitador]
Date: [Fecha]
```

**SlideSpec:**
```json
{
  "title": "Construye Tu Primer Pipeline de Ventas",
  "type": "title"
}
```

**Speaker Notes:**
Bienvenidos al taller. Hoy no vamos a hablar de teoria -- vamos a construir. Al final de estos 90 minutos, cada uno de ustedes va a tener un pipeline de ventas completo y funcional, listo para cargar en su CRM. Vamos a trabajar juntos, vamos a compartir ideas, y van a salir de aqui con un sistema de ventas que funciona. Preparen papel, lapiz, y su laptop o celular con Kitz abierto.

**Design Notes:**
Bold, energetic title. The subtitle should communicate "workshop" energy. Consider brand primary for the title with a slightly larger font (44px+). The word "Taller practico" could be in a badge-style accent above the main title.

---

#### Slide 2: Workshop Objectives
**Type:** `stats`
**Duration:** 2 minutes
**Layout:** centered

**Content:**

```
Title: "Al Final del Taller, Vas a Tener:"

Stats:
- "1" -- "Un pipeline de 5 etapas personalizado para tu negocio"
- "2" -- "Checklist de calificacion para no perder tiempo con prospectos frios"
- "3" -- "Un mini-propuesta lista para usar y un script de cierre"
```

**SlideSpec:**
```json
{
  "title": "Al Final del Taller, Vas a Tener:",
  "type": "stats",
  "stats": [
    { "label": "Un pipeline de 5 etapas personalizado para tu negocio", "value": "1" },
    { "label": "Checklist de calificacion para filtrar prospectos frios", "value": "2" },
    { "label": "Mini-propuesta lista para usar + script de cierre", "value": "3" }
  ]
}
```

**Speaker Notes:**
Quiero ser muy claro con lo que van a lograr hoy. No son promesas vagas -- son tres entregables concretos. Numero uno: un pipeline completo con cinco etapas adaptadas a su negocio especifico. Numero dos: un checklist que les va a ahorrar horas porque van a dejar de perseguir prospectos que nunca van a comprar. Y numero tres: una propuesta basica y un script de cierre que pueden usar manana mismo. Todo esto lo vamos a construir juntos, paso a paso.

**Design Notes:**
Three large numbered cards in brand primary. Each deliverable should feel tangible and valuable. The numbers should be visually prominent. This slide sets expectations and creates excitement.

---

#### Slide 3: Agenda -- 90-Minute Schedule
**Type:** `content`
**Duration:** 1 minute
**Layout:** left-aligned

**Content:**

```
Title: "Agenda: 90 Minutos que Cambian Tu Forma de Vender"

Bullets:
- 0:00 - 0:10 -- Introduccion y el framework del Pipeline de 5 Etapas
- 0:10 - 0:25 -- Etapa 1: Generacion de Leads + Ejercicio 1
- 0:25 - 0:35 -- Debrief grupal y compartir fuentes de leads
- 0:35 - 0:50 -- Etapas 2-3: Contacto y Calificacion + Ejercicio 2
- 0:50 - 1:00 -- Debrief: revision entre pares del checklist
- 1:00 - 1:15 -- Etapas 4-5: Propuesta y Cierre + Ejercicio 3
- 1:15 - 1:25 -- Debrief: practica de pitch
- 1:25 - 1:30 -- Sintesis: tu pipeline completo + plan de accion
```

**SlideSpec:**
```json
{
  "title": "Agenda: 90 Minutos que Cambian Tu Forma de Vender",
  "type": "content",
  "bullets": [
    "0:00-0:10 -- Intro + Framework del Pipeline de 5 Etapas",
    "0:10-0:25 -- Etapa 1: Generacion de Leads + Ejercicio",
    "0:25-0:35 -- Debrief grupal: compartir fuentes de leads",
    "0:35-0:50 -- Etapas 2-3: Contacto y Calificacion + Ejercicio",
    "0:50-1:00 -- Debrief: revision entre pares",
    "1:00-1:15 -- Etapas 4-5: Propuesta y Cierre + Ejercicio",
    "1:15-1:25 -- Debrief: practica de pitch",
    "1:25-1:30 -- Sintesis + Plan de accion semanal"
  ]
}
```

**Speaker Notes:**
Asi se ve nuestro mapa para la proxima hora y media. Noten el patron: concepto, ejercicio, debrief. Vamos a repetir este ciclo tres veces. Cada vez que terminemos un ejercicio, van a compartir lo que crearon con el grupo. No se preocupen por hacerlo perfecto -- lo importante es hacerlo. Van a iterar y mejorar despues. El objetivo es salir con algo funcional, no algo bonito.

**Design Notes:**
Use a clear timeline layout. Time stamps should be bold or in a monospace-style treatment. "Ejercicio" labels should be highlighted in a distinct color (like brand accent or info blue) to visually distinguish hands-on segments from instruction segments. Even spacing between items.

---

#### Slide 4: The 5-Stage Pipeline Framework
**Type:** `content`
**Duration:** 5 minutes
**Layout:** left-aligned

**Content:**

```
Title: "El Pipeline de 5 Etapas"

Bullets:
- LEAD: Alguien muestra interes -- te escribe, visita tu pagina, pregunta un precio
- CONTACTO: Tu primera conversacion real -- respondes, te presentas, escuchas
- CALIFICACION: Determinas si esta persona puede y quiere comprar (presupuesto, necesidad, timing)
- PROPUESTA: Presentas tu solucion con precio, plazos, y entregables claros
- CIERRE: El prospecto dice si, firma, y paga -- o dice no, y aprendes por que
```

**SlideSpec:**
```json
{
  "title": "El Pipeline de 5 Etapas",
  "type": "content",
  "bullets": [
    "LEAD -- Alguien muestra interes: te escribe, visita tu pagina, pregunta precio",
    "CONTACTO -- Primera conversacion real: respondes, te presentas, escuchas",
    "CALIFICACION -- Puede y quiere comprar? (presupuesto, necesidad, timing)",
    "PROPUESTA -- Tu solucion con precio, plazos y entregables claros",
    "CIERRE -- Dice si y paga, o dice no y aprendes por que"
  ]
}
```

**Speaker Notes:**
Este es el corazon del taller. Cada venta que han hecho o van a hacer pasa por estas cinco etapas, lo sepan o no. La diferencia entre un negocio que vende de manera predecible y uno que depende de la suerte es que el primero tiene consciencia de en que etapa esta cada prospecto. Piensen en su pipeline como un embudo: entran muchos leads arriba, pero solo los mejores llegan al cierre. Y eso esta bien -- el objetivo no es cerrar a todos, es cerrar a los correctos. Vamos a ir etapa por etapa y van a construir cada parte.

**Design Notes:**
Each stage name (LEAD, CONTACTO, etc.) should be uppercase and bold in brand primary. The description follows in normal weight. Consider a visual progression feel -- perhaps numbers or a subtle arrow pattern to show flow from one stage to the next. This is the core framework slide, so it should feel foundational and reference-worthy.

---

#### Slide 5: Stage 1 -- Lead Generation
**Type:** `comparison`
**Duration:** 5 minutes
**Layout:** split

**Content:**

```
Title: "Etapa 1: De Donde Vienen Tus Leads?"

Left Column (Fuentes Organicas -- $0):
- Recomendaciones de clientes existentes
- Publicaciones en redes sociales
- Perfil de Google Business
- Grupos de WhatsApp y comunidades
- Contenido de valor (blog, videos, tips)

Right Column (Fuentes Pagadas -- $$$):
- Anuncios en Facebook/Instagram
- Google Ads (busquedas locales)
- Publicidad en directorios locales
- Alianzas con negocios complementarios
- Eventos y ferias del sector
```

**SlideSpec:**
```json
{
  "title": "Etapa 1: De Donde Vienen Tus Leads?",
  "type": "comparison",
  "leftColumn": [
    "Recomendaciones de clientes existentes",
    "Publicaciones en redes sociales",
    "Perfil de Google Business",
    "Grupos de WhatsApp y comunidades",
    "Contenido de valor (blog, videos, tips)"
  ],
  "rightColumn": [
    "Anuncios en Facebook/Instagram",
    "Google Ads para busquedas locales",
    "Publicidad en directorios locales",
    "Alianzas con negocios complementarios",
    "Eventos y ferias del sector"
  ]
}
```

**Speaker Notes:**
Antes de hacer el primer ejercicio, necesitan entender las dos categorias de fuentes de leads. A la izquierda, las fuentes organicas: no cuestan dinero pero requieren tiempo y consistencia. A la derecha, las pagadas: requieren presupuesto pero pueden dar resultados mas rapidos. Para la mayoria de negocios pequenos, las recomendaciones son la fuente numero uno -- pero el problema es que son impredecibles. El objetivo es diversificar para que no dependan de una sola fuente. Noten que las alianzas con negocios complementarios estan en "pagadas" pero en realidad pueden ser intercambios de valor, no necesariamente dinero.

**Design Notes:**
Use the `comparison` two-column grid. Left column header: "Fuentes Organicas -- $0" in success/green. Right column header: "Fuentes Pagadas -- $$$" in info/blue. Items should align nicely with consistent vertical spacing. This sets up the exercise that follows.

---

#### Slide 6: Exercise 1 -- List Your Lead Sources
**Type:** `content`
**Duration:** 5 minutes
**Layout:** left-aligned

**Content:**

```
Title: "Ejercicio 1: Tus 5 Fuentes de Leads"

Bullets:
- Toma 4 minutos para listar tus 5 principales fuentes de leads actuales
- Para cada fuente, anota: cuantos leads te genera al mes (aproximado)
- Marca con estrella la fuente que te da los clientes de mejor calidad
- Identifica 1 fuente nueva que podrias activar esta semana
- Formato: Nombre de fuente | Leads/mes | Calidad (Alta/Media/Baja) | Nueva?
```

**SlideSpec:**
```json
{
  "title": "Ejercicio 1: Tus 5 Fuentes de Leads",
  "type": "content",
  "bullets": [
    "4 minutos: lista tus 5 principales fuentes de leads actuales",
    "Para cada fuente, anota cuantos leads genera al mes (aprox.)",
    "Marca con estrella la fuente de mejor calidad de clientes",
    "Identifica 1 fuente nueva que podrias activar esta semana",
    "Formato: Fuente | Leads/mes | Calidad (Alta/Media/Baja)"
  ]
}
```

**Speaker Notes:**
Es hora de trabajar. Tienen 4 minutos. No piensen demasiado -- escriban lo primero que les venga a la mente. Si no saben cuantos leads les genera una fuente, pongan un estimado. Lo importante es hacerse consciente de donde vienen sus clientes hoy. Yo voy a estar caminando para ayudar si alguien se atora. Empiecen ahora.

**Design Notes:**
Exercise slides should have a distinct visual treatment -- consider a light info-blue or brand-50 background tint to differentiate from instructional slides. The "4 minutos" should be bold and prominent. A simple table format suggestion in the last bullet helps structure the output.

---

#### Slide 7: Debrief -- Share and Compare
**Type:** `content`
**Duration:** 5 minutes
**Layout:** left-aligned

**Content:**

```
Title: "Debrief: Que Descubrieron?"

Bullets:
- Levante la mano: quien tiene mas de 50% de sus leads de una sola fuente?
- Riesgo de concentracion: si esa fuente desaparece, que pasa con tu negocio?
- Patron comun: las recomendaciones son la fuente #1 pero la menos predecible
- Compartan: que fuente nueva les gustaria probar? (vamos a escuchar 3-4 ideas)
- Insight clave: el mejor pipeline tiene minimo 3 fuentes activas de leads
```

**SlideSpec:**
```json
{
  "title": "Debrief: Que Descubrieron?",
  "type": "content",
  "bullets": [
    "Levanten la mano: mas de 50% de leads vienen de una sola fuente?",
    "Riesgo de concentracion: si esa fuente desaparece, que pasa?",
    "Patron comun: recomendaciones = fuente #1 pero la menos predecible",
    "Compartan: que fuente nueva quieren probar? (3-4 ideas del grupo)",
    "Insight clave: un buen pipeline tiene minimo 3 fuentes activas"
  ]
}
```

**Speaker Notes:**
Vamos a hacer un chequeo rapido. Levanten la mano los que descubrieron que mas de la mitad de sus leads vienen de una sola fuente. Si, miren a su alrededor -- la mayoria. Eso es normal pero es riesgoso. Imaginen que esa fuente desaparece manana. Por eso diversificar es tan importante. Ahora quiero escuchar de tres o cuatro personas: que fuente nueva identificaron que podrian activar esta semana? Compartamos ideas porque lo que funciona para un tipo de negocio puede inspirar a otro.

**Design Notes:**
Debrief slides should feel conversational and open. Consider a lighter design treatment than instructional slides. The first bullet with "Levante la mano" signals interaction. Use normal weight for most text, with the "Insight clave" bullet in bold to make the takeaway stand out.

---

#### Slide 8: Stages 2-3 -- Contact and Qualify
**Type:** `content`
**Duration:** 8 minutes
**Layout:** left-aligned

**Content:**

```
Title: "Etapas 2-3: Contacto y Calificacion"

Bullets:
- CONTACTO: Tu respuesta en los primeros 5 minutos aumenta la probabilidad de venta en un 400%
- Script de primer contacto: "Hola [Nombre], gracias por tu interes en [Producto]. Me encantaria entender que estas buscando para ver si podemos ayudarte. Tienes 5 minutos para platicar?"
- CALIFICACION -- Las 4 preguntas BANT:
  - Budget (Presupuesto): Tienen el dinero para comprar?
  - Authority (Autoridad): Esta persona toma la decision?
  - Need (Necesidad): Tienen un problema real que tu resuelves?
  - Timeline (Tiempo): Necesitan la solucion ahora o en 6 meses?
- Si no pasan 3 de 4 BANT: agradece, ofrece valor, y sigue adelante -- no pierdas tiempo
```

**SlideSpec:**
```json
{
  "title": "Etapas 2-3: Contacto y Calificacion",
  "type": "content",
  "bullets": [
    "CONTACTO: Responder en <5 min aumenta probabilidad de venta en 400%",
    "Script: Hola [Nombre], gracias por tu interes. Me encantaria entender que buscas. Tienes 5 min?",
    "CALIFICACION con BANT: Budget, Authority, Need, Timeline",
    "Budget: Tienen presupuesto? Authority: Toman la decision?",
    "Need: Tienen un problema real? Timeline: Lo necesitan ahora?",
    "Regla: Si no pasan 3 de 4 BANT, agradece y sigue adelante"
  ]
}
```

**Speaker Notes:**
Ahora vamos al contacto y la calificacion, que son las etapas donde la mayoria de los negocios pierden mas tiempo y dinero. El dato de los 5 minutos es real y transformador: si alguien te escribe interesado y tu le respondes en menos de 5 minutos, tienes cuatro veces mas probabilidad de cerrar esa venta comparado con responder una hora despues. Por eso herramientas como Kitz con respuestas automaticas en WhatsApp son tan valiosas. Ahora, la calificacion: BANT es un framework clasico porque funciona. Las cuatro preguntas son simples pero poderosas. Si un prospecto no pasa tres de cuatro, no es que sea mala persona -- simplemente no es tu cliente ideal en este momento. Agradece, ofrece algo de valor, y enfoca tu energia en los que si califican.

**Design Notes:**
This is a dense slide -- use clear visual hierarchy. "CONTACTO" and "CALIFICACION" should be bold headers in brand primary. The script should be in italics or a slightly different style to show it is a template. BANT letters should be bold. Consider slightly smaller font for the BANT details to fit without crowding.

---

#### Slide 9: Exercise 2 -- Qualification Checklist
**Type:** `content`
**Duration:** 7 minutes
**Layout:** left-aligned

**Content:**

```
Title: "Ejercicio 2: Tu Checklist de Calificacion"

Bullets:
- Crea tu propio checklist de calificacion personalizado para tu negocio
- Usa BANT como base pero adaptalo: que preguntas especificas necesitas hacer?
- Ejemplo para un disenador web: "Tienes contenido listo o necesitas copywriting?"
- Ejemplo para un restaurante de catering: "Para cuantas personas es el evento?"
- Escribe minimo 5 preguntas que separen a un prospecto caliente de uno frio
- Tiempo: 5 minutos -- escriban sus preguntas ahora
```

**SlideSpec:**
```json
{
  "title": "Ejercicio 2: Tu Checklist de Calificacion",
  "type": "content",
  "bullets": [
    "Crea tu checklist de calificacion personalizado para tu negocio",
    "Usa BANT como base pero adaptalo con preguntas especificas",
    "Ej. disenador web: Tienes contenido listo o necesitas copywriting?",
    "Ej. catering: Para cuantas personas? Que fecha? Interior o exterior?",
    "Escribe minimo 5 preguntas que separan prospecto caliente de frio",
    "Tiempo: 5 minutos"
  ]
}
```

**Speaker Notes:**
Segundo ejercicio. Esta vez quiero que piensen especificamente en su negocio. Las preguntas BANT son genericas a proposito -- su trabajo es traducirlas a preguntas que tengan sentido para lo que ustedes venden. Si son consultores, quizas la pregunta de presupuesto es "Han trabajado con un consultor antes?" Si venden comida, quizas es "Para cuando lo necesitan?" Escriban minimo 5 preguntas. Estas preguntas van a formar parte de su proceso de ventas y van a ahorrales horas cada semana al filtrar prospectos que nunca iban a comprar. Cinco minutos, empiecen.

**Design Notes:**
Exercise slide treatment with light background tint. Examples should be in italics to distinguish from instructions. The "5 minutos" timer indication should be visually prominent. Keep the layout clean and scannable.

---

#### Slide 10: Debrief -- Peer Review
**Type:** `content`
**Duration:** 5 minutes
**Layout:** left-aligned

**Content:**

```
Title: "Debrief: Revision Entre Pares"

Bullets:
- Voltea con la persona a tu lado y comparte tu checklist
- Pregunta clave: "Si yo fuera tu prospecto, estas preguntas me harian sentir escuchado o interrogado?"
- Ajusta el tono: las preguntas de calificacion deben sentirse como conversacion, no como formulario
- Agrega al menos 1 pregunta que te sugirio tu companero
- Recuerda: calificar no es rechazar -- es respetar el tiempo de ambos
```

**SlideSpec:**
```json
{
  "title": "Debrief: Revision Entre Pares",
  "type": "content",
  "bullets": [
    "Comparte tu checklist con la persona a tu lado",
    "Pregunta: Estas preguntas hacen sentir escuchado o interrogado?",
    "Ajusta el tono: calificacion = conversacion, no formulario",
    "Agrega 1 pregunta que te sugirio tu companero",
    "Calificar no es rechazar -- es respetar el tiempo de ambos"
  ]
}
```

**Speaker Notes:**
Ahora quiero que se volteen con la persona que tienen al lado y compartan su checklist. La pregunta que quiero que le hagan a su companero es: si tu fueras mi prospecto y yo te hiciera estas preguntas, te sentirias escuchado o te sentirias interrogado? Esta es la diferencia entre un vendedor que califica y uno que ahuyenta. Las mejores preguntas de calificacion no se sienten como preguntas de calificacion -- se sienten como interes genuino. Ajusten su lista basandose en lo que les diga su companero.

**Design Notes:**
Lighter treatment for debrief. The quote in the second bullet could be styled differently (perhaps in italics) to emphasize it as a reflection question. Keep the design open and conversational.

---

#### Slide 11: Stages 4-5 -- Propose and Close
**Type:** `comparison`
**Duration:** 7 minutes
**Layout:** split

**Content:**

```
Title: "Etapas 4-5: Propuesta y Cierre"

Left Column (La Propuesta que Cierra):
- Repite el problema del cliente en SUS palabras
- Presenta tu solucion como "asi es como resolvemos esto"
- Incluye exactamente: que, cuando, cuanto, y que pasa despues
- Ofrece 2-3 opciones de precio (ancla el valor con la opcion mas alta)
- Deadline claro: "Esta propuesta es valida hasta [fecha]"

Right Column (5 Tecnicas de Cierre):
- Cierre directo: "Empezamos la proxima semana?"
- Cierre alternativa: "Prefieres el plan basico o el premium?"
- Cierre de urgencia: "Este precio aplica solo hasta el viernes"
- Cierre de resumen: "Entonces necesitas X, Y, Z -- y eso es exactamente lo que incluye"
- Cierre de riesgo cero: "Si no ves resultados en 30 dias, te devuelvo tu dinero"
```

**SlideSpec:**
```json
{
  "title": "Etapas 4-5: Propuesta y Cierre",
  "type": "comparison",
  "leftColumn": [
    "Repite el problema del cliente en SUS palabras",
    "Presenta tu solucion: asi es como resolvemos esto",
    "Incluye: que, cuando, cuanto, y que pasa despues",
    "2-3 opciones de precio (ancla con la opcion alta)",
    "Deadline: Esta propuesta es valida hasta [fecha]"
  ],
  "rightColumn": [
    "Directo: Empezamos la proxima semana?",
    "Alternativa: Prefieres el plan basico o el premium?",
    "Urgencia: Este precio aplica solo hasta el viernes",
    "Resumen: Necesitas X, Y, Z -- eso es lo que incluye",
    "Riesgo cero: Si no ves resultados en 30 dias, devolucion"
  ]
}
```

**Speaker Notes:**
Llegamos al momento de la verdad: proponer y cerrar. A la izquierda, la estructura de una propuesta que funciona. El punto mas importante es el primero: repite el problema del cliente usando sus propias palabras. Esto demuestra que escuchaste y entendiste. A la derecha, cinco tecnicas de cierre. Ninguna es manipuladora -- todas son formas respetuosas de facilitar la decision. Mi favorita para negocios nuevos es el cierre de riesgo cero: si ofreces una garantia, eliminas la barrera principal que es el miedo. Vamos a practicar esto en el siguiente ejercicio.

**Design Notes:**
Two-column layout with clear headers. Left: "La Propuesta que Cierra" in brand primary. Right: "5 Tecnicas de Cierre" in brand accent. Bold the technique names (Directo, Alternativa, etc.) in the right column. This is a reference-heavy slide that participants will want to photograph.

---

#### Slide 12: Exercise 3 -- Draft a Mini-Proposal
**Type:** `content`
**Duration:** 7 minutes
**Layout:** left-aligned

**Content:**

```
Title: "Ejercicio 3: Tu Mini-Propuesta en 5 Lineas"

Bullets:
- Linea 1 -- El problema: "Entiendo que tu necesitas..."
- Linea 2 -- La solucion: "Lo que propongo es..."
- Linea 3 -- El entregable: "Concretamente, vas a recibir..."
- Linea 4 -- La inversion: "La inversion es de $X, que incluye..."
- Linea 5 -- El siguiente paso: "Para empezar, solo necesitamos..."
- Bonus: elige 1 tecnica de cierre de la lista anterior y agregala al final
- Tiempo: 5 minutos -- escriban su propuesta ahora
```

**SlideSpec:**
```json
{
  "title": "Ejercicio 3: Tu Mini-Propuesta en 5 Lineas",
  "type": "content",
  "bullets": [
    "Linea 1 -- El problema: Entiendo que necesitas...",
    "Linea 2 -- La solucion: Lo que propongo es...",
    "Linea 3 -- El entregable: Vas a recibir...",
    "Linea 4 -- La inversion: La inversion es $X, que incluye...",
    "Linea 5 -- Siguiente paso: Para empezar, solo necesitamos...",
    "Bonus: agrega 1 tecnica de cierre al final",
    "Tiempo: 5 minutos"
  ]
}
```

**Speaker Notes:**
Ultimo ejercicio y es el mas importante. Quiero que escriban una propuesta real en cinco lineas. No tiene que ser perfecta ni extensa -- tiene que ser clara. Si pueden explicar su propuesta en cinco lineas, pueden explicarla en una llamada de WhatsApp de 2 minutos. Si necesitan 3 paginas para explicar su oferta, algo esta mal. Usen un cliente real que tengan en mente, o inventen un escenario tipico. Y al final, agreguen una tecnica de cierre. Cinco minutos, adelante.

**Design Notes:**
Exercise slide with numbered lines that function as a template. Each "Linea X" label should be bold in brand primary. The fill-in prompts ("Entiendo que necesitas...") should be in italics or a lighter color to show they are templates, not final text. The "Bonus" line should feel like a reward.

---

#### Slide 13: Debrief -- Practice Pitch
**Type:** `content`
**Duration:** 5 minutes
**Layout:** left-aligned

**Content:**

```
Title: "Debrief: Practica Tu Pitch"

Bullets:
- Parate con tu companero y lee tu mini-propuesta en voz alta
- Tu companero es el prospecto -- que le falta para decir "si"?
- Cronometro: tu pitch debe tomar maximo 60 segundos
- Feedback que buscas: "Me quedo claro?" y "Te genera confianza?"
- Itera: ajusta tu propuesta basandote en la retroalimentacion
```

**SlideSpec:**
```json
{
  "title": "Debrief: Practica Tu Pitch",
  "type": "content",
  "bullets": [
    "Lee tu mini-propuesta en voz alta a tu companero",
    "Tu companero es el prospecto -- que falta para decir si?",
    "Maximo 60 segundos -- si toma mas, hay que cortar",
    "Feedback: Me quedo claro? Te genera confianza?",
    "Ajusta tu propuesta con la retroalimentacion"
  ]
}
```

**Speaker Notes:**
Esta es la parte divertida. Parense con su companero, miren a los ojos, y lean su propuesta como si fuera una conversacion real. No como si estuvieran leyendo un documento. Sesenta segundos maximo. Si toma mas, es que falta claridad. El feedback que buscan es simple: le quedo claro que ofreces, cuanto cuesta, y que sigue? Y la pregunta de confianza: despues de escuchar esto, le darias tu dinero a esta persona? Si la respuesta es no, pregunten por que y ajusten. Este ejercicio vale oro porque es la version en miniatura de cada llamada de ventas que van a hacer.

**Design Notes:**
Energetic design for this debrief. The "60 segundos" should be visually prominent -- perhaps in a larger font or with a timer/clock icon. This is a high-energy moment in the workshop. Keep the slide clean so the focus is on the human interaction happening in the room.

---

#### Slide 14: Synthesis -- Your Complete Pipeline
**Type:** `stats`
**Duration:** 3 minutes
**Layout:** centered

**Content:**

```
Title: "Tu Pipeline Completo"

Stats:
- "5" -- "Fuentes de leads identificadas (Ejercicio 1)"
- "5+" -- "Preguntas de calificacion listas (Ejercicio 2)"
- "1" -- "Mini-propuesta probada y refinada (Ejercicio 3)"
- "5" -- "Etapas del pipeline: Lead > Contacto > Calificacion > Propuesta > Cierre"
```

**SlideSpec:**
```json
{
  "title": "Tu Pipeline Completo",
  "type": "stats",
  "stats": [
    { "label": "Fuentes de leads identificadas (Ejercicio 1)", "value": "5" },
    { "label": "Preguntas de calificacion listas (Ejercicio 2)", "value": "5+" },
    { "label": "Mini-propuesta probada y refinada (Ejercicio 3)", "value": "1" },
    { "label": "Etapas del pipeline completas: Lead a Cierre", "value": "5" }
  ]
}
```

**Speaker Notes:**
Miren lo que acaban de construir en 90 minutos. Tienen fuentes de leads identificadas y cuantificadas. Tienen un checklist de calificacion que les va a ahorrar horas de perseguir prospectos frios. Tienen una mini-propuesta que ya practicaron y refinaron. Y tienen el framework de cinco etapas que conecta todo. Esto no es teoria -- esto es un sistema de ventas funcional. Ahora solo falta ponerlo en practica y cargarlo en su CRM.

**Design Notes:**
Celebration moment. Use brand primary color stat cards with large numbers. This slide should feel like a milestone -- showing participants how much they accomplished. The four cards should be balanced and satisfying visually.

---

#### Slide 15: Action Plan -- This Week
**Type:** `cta`
**Duration:** 3 minutes
**Layout:** centered

**Content:**

```
Title: "Plan de Accion: Esta Semana"
CTA: "Configura tu pipeline en Kitz CRM -- empieza gratis hoy"

Additional context (in speaker notes, not on slide):
- Accion 1: Carga tus 5 fuentes de leads y prospectos actuales en Kitz CRM
- Accion 2: Configura respuestas automaticas en WhatsApp Business (script de contacto)
- Accion 3: Envia tu primera mini-propuesta a un prospecto real antes del viernes
```

**SlideSpec:**
```json
{
  "title": "Plan de Accion: Esta Semana",
  "type": "cta",
  "ctaText": "Configura tu pipeline en Kitz CRM -- empieza gratis hoy"
}
```

**Speaker Notes:**
Tres acciones para esta semana. Numero uno: abran Kitz CRM y carguen sus prospectos actuales. Pongan a cada uno en la etapa correcta del pipeline. Les va a tomar 20 minutos y van a tener visibilidad inmediata de su situacion de ventas. Numero dos: configuren WhatsApp Business con el script de contacto que vimos hoy -- esa respuesta de 5 minutos. Numero tres, la mas importante: envien su mini-propuesta a un prospecto real antes del viernes. No la semana que viene, no el mes que viene -- este viernes. El pipeline solo funciona si lo usan. Gracias por su energia y su participacion hoy. Nos vemos en la sesion de seguimiento.

**Design Notes:**
Strong CTA slide with the button prominently centered. Brand primary on the button, white text. Include contact information from brand kit below. The three actions are delivered verbally, keeping the slide clean and focused on the single call to action. The CTA button text should be clear, specific, and low-barrier ("empieza gratis").

---
---

## Example 3: Q1 2026 Growth Strategy -- TechStart Solutions

**Title:** "Estrategia de Crecimiento Q1 2026 -- TechStart Solutions"
**Audience:** Leadership team and department heads (8-12 people)
**Tone:** Authoritative, data-driven, clear -- executive-level communication
**Total Duration:** 30 minutes
**Slide Count:** 10

### Presentation Overview

This internal strategy deck presents the Q1 2026 growth plan for a fictional LatAm-based SaaS company that serves small businesses. It demonstrates how to communicate strategic decisions to a leadership team with data, analysis, and clear ownership. The deck moves from results to analysis to recommendation to execution, following a classic Minto Pyramid structure (answer first, then supporting evidence).

---

#### Slide 1: Title
**Type:** `title`
**Duration:** 1 minute
**Layout:** centered

**Content:**

```
Title: "Estrategia de Crecimiento Q1 2026"
Subtitle: "TechStart Solutions -- Reunion de Liderazgo"
Date: "Enero 8, 2026"
Confidential: "Documento Confidencial -- Solo Uso Interno"
```

**SlideSpec:**
```json
{
  "title": "Estrategia de Crecimiento Q1 2026",
  "type": "title"
}
```

**Speaker Notes:**
Buenos dias, equipo. Hoy vamos a revisar nuestra estrategia de crecimiento para el primer trimestre de 2026. Voy a empezar con un resumen de donde estamos, luego vamos a analizar el mercado, evaluar nuestras opciones, y terminar con el plan de ejecucion y los KPIs que vamos a medir. Les pido que guarden sus preguntas para el final de cada seccion para que podamos cubrir todo en 30 minutos.

**Design Notes:**
Clean executive title slide. Company name in brand primary color. Subtitle in secondary color. Confidentiality notice in small text (12px) at the bottom in gray. No decorative elements -- pure typography. This should feel serious and professional.

---

#### Slide 2: Executive Summary
**Type:** `content`
**Duration:** 3 minutes
**Layout:** left-aligned

**Content:**

```
Title: "Resumen Ejecutivo: 4 Prioridades Estrategicas"

Bullets:
- Crecimiento Product-Led: Lanzar plan freemium para reducir CAC de $85 a $45 y triplicar pipeline de leads
- Alianzas Estrategicas: Firmar 3 partnerships con cámaras de comercio y asociaciones PyME en Colombia, Mexico y Panama
- Expansion de producto: Lanzar modulo de facturacion electronica (obligatorio en Colombia y Mexico) como driver de conversion
- Retencion y expansion: Reducir churn mensual de 4.2% a 2.8% con programa de onboarding asistido por AI
```

**SlideSpec:**
```json
{
  "title": "Resumen Ejecutivo: 4 Prioridades Estrategicas",
  "type": "content",
  "bullets": [
    "Product-Led Growth: Plan freemium para reducir CAC de $85 a $45, triplicar pipeline",
    "Alianzas Estrategicas: 3 partnerships con camaras de comercio en CO, MX, PA",
    "Expansion: Modulo de facturacion electronica (obligatorio en CO/MX) como conversion driver",
    "Retencion: Reducir churn de 4.2% a 2.8% con onboarding asistido por AI"
  ]
}
```

**Speaker Notes:**
Aqui esta el resumen de lo que vamos a proponer. Cuatro prioridades para Q1. La primera y mas importante es el movimiento hacia Product-Led Growth: queremos que el producto se venda solo a traves de un plan gratuito que demuestre valor antes de pedir dinero. La segunda es aprovechar alianzas con camaras de comercio para acceder a su base de miembros. La tercera responde a una oportunidad regulatoria: la facturacion electronica se vuelve obligatoria en Colombia y Mexico, y nosotros podemos ser la solucion mas accesible. Y la cuarta es atacar nuestro punto debil: el churn. Vamos a ver los datos que sustentan cada una de estas prioridades.

**Design Notes:**
Answer-first format. Each priority should have a clear label (bold) followed by the specifics. Use brand primary for the priority names. This is the most important slide -- if anyone only sees one slide, this is it. Numbers should be precise and specific ($85, $45, 4.2%, 2.8%) to convey data-driven decision-making.

---

#### Slide 3: Current State -- Q4 2025 Results
**Type:** `stats`
**Duration:** 3 minutes
**Layout:** centered

**Content:**

```
Title: "Estado Actual: Resultados Q4 2025"

Stats:
- $245K -- "Ingresos Recurrentes Mensuales (MRR)"
- 340 -- "Clientes Activos"
- 72 -- "NPS (Net Promoter Score)"
- 4.2% -- "Churn Mensual"
- $85 -- "Costo de Adquisicion (CAC)"
- $720 -- "Valor de Vida del Cliente (LTV)"
```

**SlideSpec:**
```json
{
  "title": "Estado Actual: Resultados Q4 2025",
  "type": "stats",
  "stats": [
    { "label": "MRR (Ingresos Recurrentes)", "value": "$245K" },
    { "label": "Clientes Activos", "value": "340" },
    { "label": "NPS (Net Promoter Score)", "value": "72" },
    { "label": "Churn Mensual", "value": "4.2%" },
    { "label": "CAC (Costo de Adquisicion)", "value": "$85" },
    { "label": "LTV (Valor de Vida)", "value": "$720" }
  ]
}
```

**Speaker Notes:**
Estos son nuestros numeros de cierre de Q4. Lo positivo: el MRR crecio 18% respecto a Q3, llegamos a 340 clientes activos, y nuestro NPS de 72 esta en el rango de "excelente" -- nuestros clientes nos quieren. Lo que necesita atencion: el churn de 4.2% mensual significa que perdemos 14 clientes al mes. Si no lo arreglamos, estamos llenando un balde con agujeros. Y el CAC de $85 es sostenible con nuestro LTV de $720, pero queremos bajarlo significativamente para poder escalar. La relacion LTV/CAC es de 8.5x, que es saludable, pero queremos llevar el CAC a $45 para acelerar el crecimiento sin necesitar mas capital.

**Design Notes:**
Six stat cards in a 3x2 grid. MRR, Clientes, and NPS should feel positive -- consider success/green accent on the values. Churn should have a warning/amber accent to signal it needs attention. CAC in neutral. LTV in brand primary. The grid layout creates a dashboard feel appropriate for executive reporting.

---

#### Slide 4: Market Analysis -- Competitor Comparison
**Type:** `comparison`
**Duration:** 3 minutes
**Layout:** split

**Content:**

```
Title: "Analisis de Mercado: Competidores Principales"

Left Column (TechStart vs. Competidores -- Fortalezas):
- TechStart: AI nativa + WhatsApp integrado + $29/mes (precio mas bajo)
- Alegra (Colombia): $45/mes, fuerte en contabilidad, debil en CRM y marketing
- Bind ERP (Mexico): $60/mes, robusto en ERP, sin herramientas de marketing ni AI
- Holded (Espana): $35/mes, buen diseno, sin enfoque en LatAm ni WhatsApp

Right Column (Oportunidad):
- Ningun competidor ofrece: AI generativa + CRM + facturacion + marketing en una plataforma
- Gap de mercado: 11M de PyMEs en LatAm sin software de gestion (solo 8% digitalizadas)
- Ventaja regulatoria: facturacion electronica obligatoria crea urgencia de adopcion
- Precio: podemos ser 40% mas baratos con margenes saludables gracias a AI
```

**SlideSpec:**
```json
{
  "title": "Analisis de Mercado: Competidores Principales",
  "type": "comparison",
  "leftColumn": [
    "TechStart: AI nativa + WhatsApp + $29/mes (precio mas bajo)",
    "Alegra (CO): $45/mes, fuerte en contabilidad, debil en CRM/marketing",
    "Bind ERP (MX): $60/mes, robusto ERP, sin marketing ni AI",
    "Holded (ES): $35/mes, buen diseno, sin enfoque LatAm ni WhatsApp"
  ],
  "rightColumn": [
    "Nadie ofrece: AI + CRM + facturacion + marketing en 1 plataforma",
    "11M de PyMEs en LatAm sin software de gestion (8% digitalizadas)",
    "Facturacion electronica obligatoria crea urgencia de adopcion",
    "Podemos ser 40% mas baratos gracias a eficiencia de AI"
  ]
}
```

**Speaker Notes:**
Veamos el panorama competitivo. A la izquierda, los tres principales competidores y como nos comparamos. Alegra domina contabilidad en Colombia pero no tiene CRM ni herramientas de marketing. Bind es fuerte en Mexico pero es caro y no tiene AI. Holded tiene buen diseno pero es una empresa espanola sin verdadero enfoque en LatAm. A la derecha, la oportunidad: ninguno de estos competidores ofrece lo que nosotros ofrecemos -- una plataforma todo-en-uno con AI nativa, CRM, facturacion y marketing. Y el mercado es enorme: hay 11 millones de PyMEs en Latinoamerica que todavia no usan software de gestion. Solo el 8% esta digitalizado. La facturacion electronica obligatoria en Colombia y Mexico va a forzar a millones de negocios a buscar una solucion, y nosotros podemos ser la opcion mas accesible.

**Design Notes:**
The `comparison` layout works well here as competitive analysis. Left column header: "Panorama Competitivo". Right column header: "Nuestra Oportunidad". Competitor names should be bold. Price points should stand out visually. The "11M" and "8%" numbers in the right column should be emphasized. This slide is information-dense but the two-column format keeps it scannable.

---

#### Slide 5: Strategic Options
**Type:** `content`
**Duration:** 3 minutes
**Layout:** left-aligned

**Content:**

```
Title: "3 Opciones de Crecimiento Evaluadas"

Bullets:
- Opcion A -- Crecimiento Agresivo vía Paid Acquisition:
  Invertir $150K en ads (Facebook, Google). Pros: resultados rapidos. Contras: CAC sube a $120, insostenible sin Series A, dependencia de plataformas externas.

- Opcion B -- Product-Led Growth + Alianzas Estrategicas [RECOMENDADA]:
  Plan freemium + partnerships con camaras de comercio. Pros: CAC baja a $45, crecimiento organico sostenible, branding. Contras: mas lento (3-6 meses para traccion), requiere inversion en onboarding.

- Opcion C -- Expansion Geografica Directa:
  Abrir operaciones en Brasil. Pros: mercado 3x mas grande. Contras: requiere $200K+ en localizacion, nuevo equipo, regulaciones diferentes, diluye foco.
```

**SlideSpec:**
```json
{
  "title": "3 Opciones de Crecimiento Evaluadas",
  "type": "content",
  "bullets": [
    "Opcion A -- Paid Acquisition: $150K en ads. Rapido pero CAC sube a $120, insostenible sin Series A",
    "Opcion B -- Product-Led + Alianzas [RECOMENDADA]: Freemium + partnerships. CAC baja a $45, sostenible",
    "Opcion C -- Expansion a Brasil: Mercado 3x mas grande pero $200K+ en localizacion, diluye foco"
  ]
}
```

**Speaker Notes:**
Evaluamos tres caminos. La Opcion A es la mas obvia: meter dinero en publicidad pagada. El problema es que con nuestra caja actual, estariamos apostando todo a un canal que no controlamos. Si Facebook cambia su algoritmo o los costos suben, estamos atrapados. La Opcion C es tentadora porque Brasil es un mercado enorme, pero el costo de localizacion, la barrera del idioma, y las regulaciones diferentes consumirian todos nuestros recursos. La Opcion B es la que recomendamos: combinar Product-Led Growth con alianzas estrategicas. Es mas lenta, si, pero es sostenible, reduce nuestro CAC dramaticamente, y construye un motor de crecimiento que se alimenta solo. Vamos a profundizar en la siguiente diapositiva.

**Design Notes:**
Three clear options with visual hierarchy. "RECOMENDADA" next to Option B should be in a badge-style treatment (success/green background, bold text). Options A and C should be slightly muted compared to B. The pros/cons structure within each bullet should have clear visual separation.

---

#### Slide 6: Recommended Strategy Deep Dive
**Type:** `content`
**Duration:** 4 minutes
**Layout:** left-aligned

**Content:**

```
Title: "Estrategia Recomendada: Product-Led Growth + Alianzas"

Bullets:
- Pilar 1 -- Plan Freemium: CRM basico + 1 usuario + 50 contactos gratis. Conversion esperada a pago: 12% en 90 dias
- Pilar 2 -- Onboarding AI: Asistente inteligente que guia al usuario nuevo por configuracion, primer contacto, y primera venta en <48 horas
- Pilar 3 -- Facturacion Electronica: Modulo gratuito para cumplimiento regulatorio, gateway a features premium
- Pilar 4 -- Alianzas: 3 partnerships firmados en Q1 (Camara de Comercio de Bogota, CANACO Mexico, Camara de Comercio de Panama)
- Pilar 5 -- Programa de Referidos: Clientes actuales refieren nuevos usuarios a cambio de 1 mes gratis. Target: 30% de nuevos clientes via referral
- Inversion total Q1: $35K (producto: $15K, partnerships: $10K, marketing contenido: $10K)
```

**SlideSpec:**
```json
{
  "title": "Estrategia: Product-Led Growth + Alianzas",
  "type": "content",
  "bullets": [
    "Freemium: CRM basico + 1 usuario + 50 contactos gratis. Conversion: 12% en 90 dias",
    "Onboarding AI: Asistente guia configuracion y primera venta en <48h",
    "Facturacion Electronica: Modulo gratis para cumplimiento, gateway a premium",
    "Alianzas: 3 partnerships en Q1 (Bogota, Mexico, Panama)",
    "Referidos: 1 mes gratis por referral. Target: 30% nuevos clientes via referral",
    "Inversion total Q1: $35K (producto $15K, alianzas $10K, contenido $10K)"
  ]
}
```

**Speaker Notes:**
Aqui esta el detalle de la estrategia. Cinco pilares que trabajan juntos. El plan freemium es el motor principal: le damos a la gente un CRM funcional gratis, y cuando necesitan mas contactos, mas usuarios, o features avanzadas como automatizaciones, pasan a pago. La tasa de conversion de 12% es conservadora -- herramientas como Slack y Dropbox han logrado 15-20% con este modelo. El onboarding AI es critico porque el freemium solo funciona si el usuario experimenta valor rapidamente. Si se registran y no entienden el producto en 48 horas, se van. La facturacion electronica es nuestra jugada regulatoria: es una necesidad obligatoria, la ofrecemos gratis, y una vez que el negocio esta usando Kitz para facturar, la barrera de salida es alta. Las alianzas nos dan acceso a cientos de miles de PyMEs a traves de instituciones que ya tienen su confianza. Y los referidos aprovechan nuestro NPS de 72. La inversion total es de $35K -- una fraccion de lo que costaria la Opcion A.

**Design Notes:**
Each "Pilar" should be bold in brand primary with the detail in normal weight. The "Inversion total" bullet at the end should be visually distinct -- perhaps with a separator line above it or a different background treatment. This is the most important strategic slide, so it should be thorough but scannable.

---

#### Slide 7: Execution Roadmap -- 12-Week Timeline
**Type:** `content`
**Duration:** 3 minutes
**Layout:** left-aligned

**Content:**

```
Title: "Roadmap de Ejecucion: 12 Semanas"

Bullets:
- Semanas 1-2 (Ene 8-21): Desarrollar plan freemium + flujo de registro. Iniciar conversaciones con camaras de comercio
- Semanas 3-4 (Ene 22 - Feb 4): Lanzar beta del plan freemium con 50 usuarios. Firmar primer partnership (Bogota)
- Semanas 5-6 (Feb 5-18): Iterar onboarding AI basandose en datos de beta. Lanzar modulo de facturacion electronica Colombia
- Semanas 7-8 (Feb 19 - Mar 4): Lanzamiento publico del freemium. Activar programa de referidos. Firmar partnership Mexico
- Semanas 9-10 (Mar 5-18): Escalar adquisicion via partnerships. Lanzar facturacion electronica Mexico. Medir y optimizar conversion freemium-a-pago
- Semanas 11-12 (Mar 19-31): Firmar partnership Panama. Revision completa de KPIs. Preparar estrategia Q2 basada en datos de Q1
```

**SlideSpec:**
```json
{
  "title": "Roadmap de Ejecucion: 12 Semanas",
  "type": "content",
  "bullets": [
    "Sem 1-2 (Ene 8-21): Desarrollar freemium + iniciar conversaciones con camaras",
    "Sem 3-4 (Ene 22 - Feb 4): Beta freemium (50 usuarios) + firmar Bogota",
    "Sem 5-6 (Feb 5-18): Iterar onboarding AI + lanzar facturacion CO",
    "Sem 7-8 (Feb 19 - Mar 4): Lanzamiento publico freemium + referidos + firmar MX",
    "Sem 9-10 (Mar 5-18): Escalar via partnerships + facturacion MX + optimizar conversion",
    "Sem 11-12 (Mar 19-31): Firmar PA + revision KPIs + preparar estrategia Q2"
  ]
}
```

**Speaker Notes:**
Este es nuestro timeline de ejecucion semana a semana. Las primeras cuatro semanas son de construccion y validacion -- desarrollamos el plan freemium, lo probamos con 50 usuarios, y firmamos el primer partnership. Las semanas cinco a ocho son el lanzamiento: salimos al publico, activamos referidos, y expandimos los partnerships. Las ultimas cuatro semanas son de escalamiento y optimizacion. Noten que la facturacion electronica se lanza primero en Colombia porque es donde tenemos mas clientes y donde la regulacion es mas urgente. Mexico viene cuatro semanas despues. Cada hito tiene un responsable que veremos en la siguiente diapositiva.

**Design Notes:**
Timeline-style layout. Each time block should be clearly delineated. "Semanas X-Y" labels should be bold in brand primary. Consider alternating background tints (very subtle) for each time block to create visual separation. Dates in parentheses help ground the timeline in reality.

---

#### Slide 8: Resource Requirements
**Type:** `stats`
**Duration:** 2 minutes
**Layout:** centered

**Content:**

```
Title: "Recursos Necesarios"

Stats:
- "$35K" -- "Presupuesto Total Q1"
- "2" -- "Contrataciones Nuevas: 1 Growth Marketer + 1 Customer Success"
- "40%" -- "Tiempo de Ingenieria dedicado (2 de 5 devs por 12 semanas)"
- "3" -- "Partnerships a cerrar (Bogota, Mexico, Panama)"
```

**SlideSpec:**
```json
{
  "title": "Recursos Necesarios",
  "type": "stats",
  "stats": [
    { "label": "Presupuesto Total Q1", "value": "$35K" },
    { "label": "Contrataciones: 1 Growth Marketer + 1 CS", "value": "2" },
    { "label": "Tiempo de Ingenieria (2 de 5 devs, 12 sem)", "value": "40%" },
    { "label": "Partnerships a cerrar (CO, MX, PA)", "value": "3" }
  ]
}
```

**Speaker Notes:**
Estos son los recursos que necesitamos. El presupuesto de $35K se desglosa en: $15K para desarrollo de producto, $10K para eventos y viajes de partnerships, y $10K para creacion de contenido y marketing organico. Las dos contrataciones son criticas: necesitamos un Growth Marketer dedicado al funnel freemium y un Customer Success para el programa de onboarding. En ingenieria, vamos a dedicar dos de nuestros cinco desarrolladores al freemium, la facturacion electronica, y el onboarding AI. Los otros tres siguen con el roadmap de producto regular. Los partnerships requieren presencia fisica, por lo que hay viajes a Bogota, Ciudad de Mexico, y Ciudad de Panama incluidos en el presupuesto.

**Design Notes:**
Four stat cards in brand primary with white text. Each card should feel like a "resource request" that leadership needs to approve. The "$35K" should be the largest and most prominent number. Clear, executive-friendly presentation of what is needed.

---

#### Slide 9: Success Metrics -- KPIs with Targets
**Type:** `stats`
**Duration:** 3 minutes
**Layout:** centered

**Content:**

```
Title: "Metricas de Exito: KPIs Q1 2026"

Stats:
- "$320K" -- "MRR Target (de $245K actual -- crecimiento de 31%)"
- "600" -- "Clientes Activos Target (de 340 actuales -- 76% crecimiento)"
- "2.8%" -- "Churn Mensual Target (de 4.2% actual)"
- "$45" -- "CAC Target (de $85 actual -- reduccion de 47%)"
- "12%" -- "Conversion Freemium a Pago (meta a 90 dias)"
```

**SlideSpec:**
```json
{
  "title": "Metricas de Exito: KPIs Q1 2026",
  "type": "stats",
  "stats": [
    { "label": "MRR Target (hoy $245K, +31%)", "value": "$320K" },
    { "label": "Clientes Activos (hoy 340, +76%)", "value": "600" },
    { "label": "Churn Mensual (hoy 4.2%)", "value": "2.8%" },
    { "label": "CAC (hoy $85, -47%)", "value": "$45" },
    { "label": "Conversion Freemium-a-Pago (90 dias)", "value": "12%" }
  ]
}
```

**Speaker Notes:**
Estas son las cinco metricas con las que vamos a medir el exito de Q1. El MRR de $320K representa un crecimiento de 31%, que es agresivo pero alcanzable si ejecutamos bien el freemium y los partnerships. Los 600 clientes activos incluyen tanto pagos como freemium que convirtieron. El churn de 2.8% es nuestro target mas importante para la salud del negocio a largo plazo -- cada punto porcentual que bajamos el churn tiene un impacto compuesto enorme. El CAC de $45 es el resultado directo del modelo Product-Led: cuando el producto se vende solo, el costo de adquisicion baja drasticamente. Y el 12% de conversion freemium-a-pago es nuestra hipotesis principal -- si no lo logramos, revisamos la estrategia en semana 8. Vamos a revisar estos numeros cada dos semanas en nuestro scorecard.

**Design Notes:**
Five stat cards -- this is the most dense stat slide. Consider a 3-over-2 grid layout. Each card should show the target prominently with the current/delta in smaller text below. Use success/green accent for improvement metrics (MRR up, clients up) and a directional indicator. The churn and CAC targets should show downward arrows or be in a different color to indicate "lower is better." This is a slide the team will reference repeatedly.

---

#### Slide 10: Next Steps -- Immediate Actions
**Type:** `cta`
**Duration:** 2 minutes
**Layout:** centered

**Content:**

```
Title: "Siguientes Pasos Inmediatos"
CTA: "Aprobacion del presupuesto y contrataciones -- Votar hoy"

Context (delivered in speaker notes):
- Accion 1: [Responsable: Carlos, CTO] Iniciar diseno tecnico del plan freemium -- deadline Ene 15
- Accion 2: [Responsable: Ana, Head of Growth] Agendar reuniones con camaras de comercio -- deadline Ene 12
- Accion 3: [Responsable: Diana, CFO] Aprobar presupuesto de $35K y abrir posiciones de contratacion -- deadline Ene 10
```

**SlideSpec:**
```json
{
  "title": "Siguientes Pasos Inmediatos",
  "type": "cta",
  "ctaText": "Aprobacion: presupuesto $35K + 2 contrataciones -- votemos hoy"
}
```

**Speaker Notes:**
Tres acciones inmediatas con responsable y deadline. Carlos: necesito que tu equipo empiece el diseno tecnico del freemium esta semana, con un sprint planning listo para el 15 de enero. Ana: quiero reuniones agendadas con las tres camaras de comercio antes del viernes 12. Y Diana: necesitamos la aprobacion formal del presupuesto y las dos posiciones abiertas en los portales de empleo antes del 10 de enero. Lo unico que necesito de este equipo hoy es el voto de aprobacion para el presupuesto y las contrataciones. Los numeros los sustentamos, la estrategia esta clara, y el timing es ahora. Con la facturacion electronica obligatoria entrando en vigor en abril en Colombia, cada semana que esperemos es una semana de ventaja que le damos a la competencia. Les pido su voto.

**Design Notes:**
Strong closing CTA. The button should feel like a decision point, not a soft suggestion. "Votemos hoy" creates urgency. The three actions with owners and deadlines are delivered verbally to keep the slide focused on the single decision being requested. Brand primary button with contact information below. Clean, authoritative finish.

---
---

## Appendix: SlideSpec JSON -- Complete Decks

For integration testing and as reference data for the `deck_create` tool, here are the complete `SlideSpec[]` arrays for each example.

### Example 1: Full SlideSpec Array

```json
[
  {
    "title": "Fundamentos de Marketing Digital para Tu Negocio",
    "type": "title"
  },
  {
    "title": "Tus clientes ya te estan buscando",
    "type": "stats",
    "stats": [
      { "label": "de experiencias online empiezan en un buscador", "value": "93%" },
      { "label": "de busquedas locales terminan en compra en 24h", "value": "78%" },
      { "label": "de busquedas en Google son locales", "value": "46%" }
    ]
  },
  {
    "title": "Lo que vamos a aprender hoy",
    "type": "content",
    "bullets": [
      "Entender como tus clientes te encuentran en linea -- y como puedes influir en eso",
      "Crear una estrategia de redes sociales que no te consuma todo el dia",
      "Usar email marketing para convertir seguidores en clientes que pagan",
      "Configurar tu Perfil de Google Business para aparecer en busquedas locales"
    ]
  },
  {
    "title": "Entendiendo a Tu Cliente en Linea",
    "type": "content",
    "bullets": [
      "El viaje: Descubrimiento > Investigacion > Comparacion > Compra > Recomendacion",
      "Tu cliente busca en Google, pregunta en WhatsApp, revisa tus redes y compara -- en 10 minutos",
      "72% de consumidores en LatAm investigan en linea antes de comprar localmente",
      "Pregunta clave: Si un cliente busca lo que yo vendo, que encuentra?",
      "Ejercicio rapido: Busca tu propio negocio en Google ahora mismo"
    ]
  },
  {
    "title": "Estrategia de Redes Sociales que Funciona",
    "type": "content",
    "bullets": [
      "Regla 80/20: 80% contenido de valor (tips, historias) / 20% venta directa",
      "No necesitas estar en todas partes -- elige 1-2 plataformas donde estan tus clientes",
      "Instagram: ideal para negocios visuales (comida, moda, belleza, diseno)",
      "Facebook: comunidades locales, grupos, marketplace -- el rey en LatAm",
      "WhatsApp Business: el canal de conversion mas poderoso de la region",
      "Frecuencia ideal: 3-5 posts por semana, 1-2 stories al dia"
    ]
  },
  {
    "title": "Email Marketing: Tu Arma Secreta",
    "type": "comparison",
    "leftColumn": [
      "Emails de bienvenida con descuento del primer pedido",
      "Newsletter semanal: contenido util + 1 oferta",
      "Seguimiento automatico post-compra",
      "Asuntos cortos y personalizados (<50 caracteres)",
      "Un solo llamado a la accion claro"
    ],
    "rightColumn": [
      "Enviar sin permiso (spam = multas + mala reputacion)",
      "Emails solo con ofertas, sin valor",
      "Enviar diario (fatiga = desuscripciones)",
      "Asuntos enganiosos o con MAYUSCULAS",
      "Diseno recargado que no funciona en celular"
    ]
  },
  {
    "title": "Google Business Profile: Tu Vitrina Digital Gratuita",
    "type": "content",
    "bullets": [
      "GRATIS: apareces en Google Maps y busquedas locales automaticamente",
      "Perfiles completos reciben 7x mas clicks que los incompletos",
      "Agrega: fotos de calidad (min. 10), horarios, numero de WhatsApp",
      "Responde TODAS las resenas -- positivas y negativas",
      "Publica actualizaciones semanales (ofertas, eventos, productos nuevos)",
      "Tip pro: Pide a cada cliente satisfecho una resena con estrella"
    ]
  },
  {
    "title": "Caso de Exito: Cafe Luna",
    "type": "quote",
    "quoteText": "Empezamos con 12 seguidores en Instagram y vendiamos 40 cafes al dia. En 8 meses, con una estrategia digital consistente, llegamos a 4,200 seguidores, 120 resenas de 5 estrellas en Google, y triplicamos nuestras ventas. No gastamos un solo centavo en publicidad pagada.",
    "attribution": "Maria Elena Rodriguez, fundadora de Cafe Luna -- Medellin, Colombia"
  },
  {
    "title": "Ejercicio: Mapa de Tu Presencia Digital",
    "type": "content",
    "bullets": [
      "Paso 1: Anota todos los lugares donde tu negocio aparece en linea",
      "Paso 2: Califica cada uno del 1-5 (1=abandonado, 5=optimizado)",
      "Paso 3: Identifica 2 canales con mayor potencial que estan debajo de 3",
      "Paso 4: Esos 2 canales son tu prioridad para las proximas 4 semanas",
      "Tiempo: 3 minutos -- empiecen ahora"
    ]
  },
  {
    "title": "5 Errores que Matan tu Marketing Digital",
    "type": "content",
    "bullets": [
      "#1 Inconsistencia: Publicar 10 veces una semana y desaparecer un mes",
      "#2 No medir: Si no sabes que funciona, estas adivinando",
      "#3 Copiar a la competencia: Tu cliente quiere autenticidad",
      "#4 Ignorar WhatsApp: 95% de smartphones en LatAm lo tienen -- es tu canal de cierre",
      "#5 No pedir la venta: Sin llamado a la accion, es entretenimiento, no marketing"
    ]
  },
  {
    "title": "Tus 4 Acciones de Esta Semana",
    "type": "stats",
    "stats": [
      { "label": "Completa tu Perfil de Google Business (hoy mismo)", "value": "1" },
      { "label": "Elige 2 canales y crea un calendario de contenido", "value": "2" },
      { "label": "Configura WhatsApp Business con catalogo y bienvenida", "value": "3" },
      { "label": "Mide resultados cada viernes: seguidores, mensajes, ventas", "value": "4" }
    ]
  },
  {
    "title": "Recursos y Siguientes Pasos",
    "type": "cta",
    "ctaText": "Empieza ahora con Kitz -- tu asistente de marketing digital"
  }
]
```

### Example 2: Full SlideSpec Array

```json
[
  {
    "title": "Construye Tu Primer Pipeline de Ventas",
    "type": "title"
  },
  {
    "title": "Al Final del Taller, Vas a Tener:",
    "type": "stats",
    "stats": [
      { "label": "Un pipeline de 5 etapas personalizado para tu negocio", "value": "1" },
      { "label": "Checklist de calificacion para filtrar prospectos frios", "value": "2" },
      { "label": "Mini-propuesta lista para usar + script de cierre", "value": "3" }
    ]
  },
  {
    "title": "Agenda: 90 Minutos que Cambian Tu Forma de Vender",
    "type": "content",
    "bullets": [
      "0:00-0:10 -- Intro + Framework del Pipeline de 5 Etapas",
      "0:10-0:25 -- Etapa 1: Generacion de Leads + Ejercicio",
      "0:25-0:35 -- Debrief grupal: compartir fuentes de leads",
      "0:35-0:50 -- Etapas 2-3: Contacto y Calificacion + Ejercicio",
      "0:50-1:00 -- Debrief: revision entre pares",
      "1:00-1:15 -- Etapas 4-5: Propuesta y Cierre + Ejercicio",
      "1:15-1:25 -- Debrief: practica de pitch",
      "1:25-1:30 -- Sintesis + Plan de accion semanal"
    ]
  },
  {
    "title": "El Pipeline de 5 Etapas",
    "type": "content",
    "bullets": [
      "LEAD -- Alguien muestra interes: te escribe, visita tu pagina, pregunta precio",
      "CONTACTO -- Primera conversacion real: respondes, te presentas, escuchas",
      "CALIFICACION -- Puede y quiere comprar? (presupuesto, necesidad, timing)",
      "PROPUESTA -- Tu solucion con precio, plazos y entregables claros",
      "CIERRE -- Dice si y paga, o dice no y aprendes por que"
    ]
  },
  {
    "title": "Etapa 1: De Donde Vienen Tus Leads?",
    "type": "comparison",
    "leftColumn": [
      "Recomendaciones de clientes existentes",
      "Publicaciones en redes sociales",
      "Perfil de Google Business",
      "Grupos de WhatsApp y comunidades",
      "Contenido de valor (blog, videos, tips)"
    ],
    "rightColumn": [
      "Anuncios en Facebook/Instagram",
      "Google Ads para busquedas locales",
      "Publicidad en directorios locales",
      "Alianzas con negocios complementarios",
      "Eventos y ferias del sector"
    ]
  },
  {
    "title": "Ejercicio 1: Tus 5 Fuentes de Leads",
    "type": "content",
    "bullets": [
      "4 minutos: lista tus 5 principales fuentes de leads actuales",
      "Para cada fuente, anota cuantos leads genera al mes (aprox.)",
      "Marca con estrella la fuente de mejor calidad de clientes",
      "Identifica 1 fuente nueva que podrias activar esta semana",
      "Formato: Fuente | Leads/mes | Calidad (Alta/Media/Baja)"
    ]
  },
  {
    "title": "Debrief: Que Descubrieron?",
    "type": "content",
    "bullets": [
      "Levanten la mano: mas de 50% de leads vienen de una sola fuente?",
      "Riesgo de concentracion: si esa fuente desaparece, que pasa?",
      "Patron comun: recomendaciones = fuente #1 pero la menos predecible",
      "Compartan: que fuente nueva quieren probar? (3-4 ideas del grupo)",
      "Insight clave: un buen pipeline tiene minimo 3 fuentes activas"
    ]
  },
  {
    "title": "Etapas 2-3: Contacto y Calificacion",
    "type": "content",
    "bullets": [
      "CONTACTO: Responder en <5 min aumenta probabilidad de venta en 400%",
      "Script: Hola [Nombre], gracias por tu interes. Me encantaria entender que buscas. Tienes 5 min?",
      "CALIFICACION con BANT: Budget, Authority, Need, Timeline",
      "Budget: Tienen presupuesto? Authority: Toman la decision?",
      "Need: Tienen un problema real? Timeline: Lo necesitan ahora?",
      "Regla: Si no pasan 3 de 4 BANT, agradece y sigue adelante"
    ]
  },
  {
    "title": "Ejercicio 2: Tu Checklist de Calificacion",
    "type": "content",
    "bullets": [
      "Crea tu checklist de calificacion personalizado para tu negocio",
      "Usa BANT como base pero adaptalo con preguntas especificas",
      "Ej. disenador web: Tienes contenido listo o necesitas copywriting?",
      "Ej. catering: Para cuantas personas? Que fecha? Interior o exterior?",
      "Escribe minimo 5 preguntas que separan prospecto caliente de frio",
      "Tiempo: 5 minutos"
    ]
  },
  {
    "title": "Debrief: Revision Entre Pares",
    "type": "content",
    "bullets": [
      "Comparte tu checklist con la persona a tu lado",
      "Pregunta: Estas preguntas hacen sentir escuchado o interrogado?",
      "Ajusta el tono: calificacion = conversacion, no formulario",
      "Agrega 1 pregunta que te sugirio tu companero",
      "Calificar no es rechazar -- es respetar el tiempo de ambos"
    ]
  },
  {
    "title": "Etapas 4-5: Propuesta y Cierre",
    "type": "comparison",
    "leftColumn": [
      "Repite el problema del cliente en SUS palabras",
      "Presenta tu solucion: asi es como resolvemos esto",
      "Incluye: que, cuando, cuanto, y que pasa despues",
      "2-3 opciones de precio (ancla con la opcion alta)",
      "Deadline: Esta propuesta es valida hasta [fecha]"
    ],
    "rightColumn": [
      "Directo: Empezamos la proxima semana?",
      "Alternativa: Prefieres el plan basico o el premium?",
      "Urgencia: Este precio aplica solo hasta el viernes",
      "Resumen: Necesitas X, Y, Z -- eso es lo que incluye",
      "Riesgo cero: Si no ves resultados en 30 dias, devolucion"
    ]
  },
  {
    "title": "Ejercicio 3: Tu Mini-Propuesta en 5 Lineas",
    "type": "content",
    "bullets": [
      "Linea 1 -- El problema: Entiendo que necesitas...",
      "Linea 2 -- La solucion: Lo que propongo es...",
      "Linea 3 -- El entregable: Vas a recibir...",
      "Linea 4 -- La inversion: La inversion es $X, que incluye...",
      "Linea 5 -- Siguiente paso: Para empezar, solo necesitamos...",
      "Bonus: agrega 1 tecnica de cierre al final",
      "Tiempo: 5 minutos"
    ]
  },
  {
    "title": "Debrief: Practica Tu Pitch",
    "type": "content",
    "bullets": [
      "Lee tu mini-propuesta en voz alta a tu companero",
      "Tu companero es el prospecto -- que falta para decir si?",
      "Maximo 60 segundos -- si toma mas, hay que cortar",
      "Feedback: Me quedo claro? Te genera confianza?",
      "Ajusta tu propuesta con la retroalimentacion"
    ]
  },
  {
    "title": "Tu Pipeline Completo",
    "type": "stats",
    "stats": [
      { "label": "Fuentes de leads identificadas (Ejercicio 1)", "value": "5" },
      { "label": "Preguntas de calificacion listas (Ejercicio 2)", "value": "5+" },
      { "label": "Mini-propuesta probada y refinada (Ejercicio 3)", "value": "1" },
      { "label": "Etapas del pipeline completas: Lead a Cierre", "value": "5" }
    ]
  },
  {
    "title": "Plan de Accion: Esta Semana",
    "type": "cta",
    "ctaText": "Configura tu pipeline en Kitz CRM -- empieza gratis hoy"
  }
]
```

### Example 3: Full SlideSpec Array

```json
[
  {
    "title": "Estrategia de Crecimiento Q1 2026",
    "type": "title"
  },
  {
    "title": "Resumen Ejecutivo: 4 Prioridades Estrategicas",
    "type": "content",
    "bullets": [
      "Product-Led Growth: Plan freemium para reducir CAC de $85 a $45, triplicar pipeline",
      "Alianzas Estrategicas: 3 partnerships con camaras de comercio en CO, MX, PA",
      "Expansion: Modulo de facturacion electronica (obligatorio en CO/MX) como conversion driver",
      "Retencion: Reducir churn de 4.2% a 2.8% con onboarding asistido por AI"
    ]
  },
  {
    "title": "Estado Actual: Resultados Q4 2025",
    "type": "stats",
    "stats": [
      { "label": "MRR (Ingresos Recurrentes)", "value": "$245K" },
      { "label": "Clientes Activos", "value": "340" },
      { "label": "NPS (Net Promoter Score)", "value": "72" },
      { "label": "Churn Mensual", "value": "4.2%" },
      { "label": "CAC (Costo de Adquisicion)", "value": "$85" },
      { "label": "LTV (Valor de Vida)", "value": "$720" }
    ]
  },
  {
    "title": "Analisis de Mercado: Competidores Principales",
    "type": "comparison",
    "leftColumn": [
      "TechStart: AI nativa + WhatsApp + $29/mes (precio mas bajo)",
      "Alegra (CO): $45/mes, fuerte en contabilidad, debil en CRM/marketing",
      "Bind ERP (MX): $60/mes, robusto ERP, sin marketing ni AI",
      "Holded (ES): $35/mes, buen diseno, sin enfoque LatAm ni WhatsApp"
    ],
    "rightColumn": [
      "Nadie ofrece: AI + CRM + facturacion + marketing en 1 plataforma",
      "11M de PyMEs en LatAm sin software de gestion (8% digitalizadas)",
      "Facturacion electronica obligatoria crea urgencia de adopcion",
      "Podemos ser 40% mas baratos gracias a eficiencia de AI"
    ]
  },
  {
    "title": "3 Opciones de Crecimiento Evaluadas",
    "type": "content",
    "bullets": [
      "Opcion A -- Paid Acquisition: $150K en ads. Rapido pero CAC sube a $120, insostenible sin Series A",
      "Opcion B -- Product-Led + Alianzas [RECOMENDADA]: Freemium + partnerships. CAC baja a $45, sostenible",
      "Opcion C -- Expansion a Brasil: Mercado 3x mas grande pero $200K+ en localizacion, diluye foco"
    ]
  },
  {
    "title": "Estrategia: Product-Led Growth + Alianzas",
    "type": "content",
    "bullets": [
      "Freemium: CRM basico + 1 usuario + 50 contactos gratis. Conversion: 12% en 90 dias",
      "Onboarding AI: Asistente guia configuracion y primera venta en <48h",
      "Facturacion Electronica: Modulo gratis para cumplimiento, gateway a premium",
      "Alianzas: 3 partnerships en Q1 (Bogota, Mexico, Panama)",
      "Referidos: 1 mes gratis por referral. Target: 30% nuevos clientes via referral",
      "Inversion total Q1: $35K (producto $15K, alianzas $10K, contenido $10K)"
    ]
  },
  {
    "title": "Roadmap de Ejecucion: 12 Semanas",
    "type": "content",
    "bullets": [
      "Sem 1-2 (Ene 8-21): Desarrollar freemium + iniciar conversaciones con camaras",
      "Sem 3-4 (Ene 22 - Feb 4): Beta freemium (50 usuarios) + firmar Bogota",
      "Sem 5-6 (Feb 5-18): Iterar onboarding AI + lanzar facturacion CO",
      "Sem 7-8 (Feb 19 - Mar 4): Lanzamiento publico freemium + referidos + firmar MX",
      "Sem 9-10 (Mar 5-18): Escalar via partnerships + facturacion MX + optimizar conversion",
      "Sem 11-12 (Mar 19-31): Firmar PA + revision KPIs + preparar estrategia Q2"
    ]
  },
  {
    "title": "Recursos Necesarios",
    "type": "stats",
    "stats": [
      { "label": "Presupuesto Total Q1", "value": "$35K" },
      { "label": "Contrataciones: 1 Growth Marketer + 1 CS", "value": "2" },
      { "label": "Tiempo de Ingenieria (2 de 5 devs, 12 sem)", "value": "40%" },
      { "label": "Partnerships a cerrar (CO, MX, PA)", "value": "3" }
    ]
  },
  {
    "title": "Metricas de Exito: KPIs Q1 2026",
    "type": "stats",
    "stats": [
      { "label": "MRR Target (hoy $245K, +31%)", "value": "$320K" },
      { "label": "Clientes Activos (hoy 340, +76%)", "value": "600" },
      { "label": "Churn Mensual (hoy 4.2%)", "value": "2.8%" },
      { "label": "CAC (hoy $85, -47%)", "value": "$45" },
      { "label": "Conversion Freemium-a-Pago (90 dias)", "value": "12%" }
    ]
  },
  {
    "title": "Siguientes Pasos Inmediatos",
    "type": "cta",
    "ctaText": "Aprobacion: presupuesto $35K + 2 contrataciones -- votemos hoy"
  }
]
```

---

## Slide Type Usage Summary

| Slide Type    | Example 1 | Example 2 | Example 3 | Total Uses | Best For |
|---------------|-----------|-----------|-----------|------------|----------|
| `title`       | 1         | 1         | 1         | 3          | Opening slide, branding |
| `content`     | 6         | 9         | 4         | 19         | Bullets, lists, instructions |
| `stats`       | 2         | 2         | 3         | 7          | Numbers, KPIs, action items |
| `comparison`  | 1         | 2         | 1         | 4          | Pros/cons, do/don't, competitors |
| `quote`       | 1         | 0         | 0         | 1          | Testimonials, case studies |
| `cta`         | 1         | 1         | 1         | 3          | Closing, call-to-action |

### Key Patterns Observed

1. **`content` is the workhorse** -- used for nearly everything from agendas to concepts to exercises
2. **`stats` works for action items too** -- not just numbers; numbered action steps render well in stat cards
3. **`comparison` excels at do/don't** -- the two-column layout naturally suits pros/cons and feature comparisons
4. **`quote` is powerful but rare** -- one strong testimonial per deck is enough; more dilutes impact
5. **Every deck ends with `cta`** -- always close with a specific, actionable next step
6. **`title` is always first** -- establishes brand, context, and credibility immediately

---

## Design Guidelines for AI-Generated Decks

When the `deck_create` tool generates content via Claude Sonnet, the AI should follow these principles derived from the examples above:

1. **Start with the answer** -- Do not build up to the conclusion. State the key message early (especially for strategy decks).
2. **One idea per slide** -- If a slide has more than 6 bullets, consider splitting it.
3. **Statistics need context** -- A number alone means nothing. Always pair with "compared to what" or "why this matters."
4. **Speaker notes add depth** -- The slide shows the headline; the notes tell the story. Speaker notes should contain the reasoning, examples, and transitions that do not fit on the slide.
5. **Exercises need clear structure** -- Time limit, step-by-step format, and expected output format.
6. **Close with one action** -- The CTA slide should ask for exactly one thing. If there are multiple next steps, deliver them verbally or on the preceding slide.
7. **LatAm relevance** -- WhatsApp is not optional; it is the primary business communication channel. Reference local platforms, currencies, and regulations (ITBMS, facturacion electronica).
8. **Spanish by default** -- When the brand kit language is `es` or the brief is in Spanish, generate all content in Spanish. Use Latin American Spanish conventions.
