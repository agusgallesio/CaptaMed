# CaptaMed

Dashboard ejecutivo para clínicas que integra **Meta Ads** y el **CRM (Kommo)** en una sola vista, pensado para directores y ejecutivos: qué se invierte, cuántos leads llegan, cuántos agendan, cuántos asisten, cuántos se ganan o se pierden — y un **asistente de IA** para preguntarle a los datos en lenguaje natural.

## Funcionalidades

- **KPIs del período**: inversión, leads, CPL, agendados, asistencia, ganados, perdidos, abiertos, facturación y ROAS.
- **Funnel comercial**: Leads → Contactados → Agendados → Asistieron → Ganados, con tasas de conversión por etapa.
- **Tendencia diaria** de leads y agendamientos.
- **Tabla por campaña** (Meta Ads): inversión, leads, CPL, agendados, asistencia, ganados, facturación y ROAS.
- **Chat con IA** (Claude): el director pregunta "¿qué campaña conviene apagar?" o "¿dónde perdemos pacientes?" y recibe respuestas basadas en los datos reales del período seleccionado.
- **Modo demo**: sin credenciales de Meta/Kommo, la app genera datos realistas de una clínica para demos comerciales.

## Cómo correrlo

```bash
npm install
cp .env.example .env   # completá al menos ANTHROPIC_API_KEY
npm run dev
```

Abrí http://localhost:3000. Sin credenciales de Meta/Kommo verás el badge **"Datos de demostración"**.

## Variables de entorno

| Variable | Requerida | Descripción |
|---|---|---|
| `ANTHROPIC_API_KEY` | Para el chat | API key de Anthropic (console.anthropic.com) |
| `META_ACCESS_TOKEN` | Opcional | Token de sistema con permiso `ads_read` |
| `META_AD_ACCOUNT_ID` | Opcional | Cuenta publicitaria, ej. `act_1234567890` |
| `KOMMO_BASE_URL` | Opcional | Ej. `https://tuclinica.kommo.com` |
| `KOMMO_ACCESS_TOKEN` | Opcional | Token de larga duración de Kommo |
| `KOMMO_STATUS_CONTACTADO` / `_AGENDADO` / `_ASISTIO` | Opcional | IDs de estado del pipeline (separados por coma) |

Cuando **Meta y Kommo están configurados a la vez**, el dashboard usa datos reales; si falta cualquiera de los dos, usa el modo demo.

### Mapeo del pipeline de Kommo

Cada cuenta de Kommo tiene IDs de estado propios. Obtenelos con:

```
GET {KOMMO_BASE_URL}/api/v4/leads/pipelines
Authorization: Bearer {KOMMO_ACCESS_TOKEN}
```

y cargá en las variables `KOMMO_STATUS_*` los IDs que correspondan a cada etapa de tu embudo. Los estados `142` (ganado) y `143` (perdido) son estándar de Kommo y ya están contemplados.

La atribución lead → campaña se hace por el campo personalizado con `field_code = UTM_CAMPAIGN` (cargado por tu integración de formularios de Meta → Kommo).

## Arquitectura

```
src/
  app/
    page.tsx              # Dashboard (client)
    api/metrics/route.ts  # KPIs + funnel + campañas (Meta+Kommo o demo)
    api/chat/route.ts     # Asistente IA (Claude, streaming)
  components/             # KPIs, funnel, tendencia, tabla, chat
  lib/
    data/
      demo.ts             # Generador de datos demo determinístico
      meta.ts             # Conector Meta Marketing API (Graph v21)
      kommo.ts            # Conector Kommo API v4
      dashboard.ts        # Agregación y cálculo de métricas
    ai/context.ts         # System prompt + contexto de datos para Claude
```

El chat usa el modelo `claude-opus-4-8` con streaming. En cada consulta se inyectan los datos agregados del período (KPIs, funnel, campañas, tendencia) como contexto, de modo que las respuestas siempre reflejan lo que el director ve en pantalla.

## Roadmap sugerido

- Autenticación multi-clínica (una cuenta por cliente).
- Webhooks de Kommo para datos en tiempo real en lugar de polling.
- Alertas proactivas (CPL fuera de rango, caída de asistencia) por email/WhatsApp.
- Comparativa entre períodos y metas mensuales por clínica.
