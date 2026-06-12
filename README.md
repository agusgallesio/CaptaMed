# CaptaMed

Dashboard ejecutivo para clínicas que integra **Meta Ads**, **Google Ads** y el **CRM (Kommo)** en una sola vista, pensado para directores y ejecutivos: qué se invierte, cuántos leads llegan, cuántos responden, agendan, asisten, se ganan o se pierden — y un **asistente de IA** para preguntarle a los datos en lenguaje natural.

## Secciones

- **Resumen**: KPIs del período, embudo, tendencia diaria, tabla de campañas y últimos leads del CRM.
- **Campañas**: rendimiento por plataforma (Meta / Google Ads), comparativa entre plataformas, filtro por plataforma y detalle por campaña (inversión, CTR, leads, CPL, agendados, asistencia, ganados, venta, ROAS).
- **Rentabilidad**: venta total, inversión, RO$ (ganancia neta), ROAS, ROI, ticket promedio, CPL, costo por agenda, costo por asistencia y CAC; desglose por plataforma y por campaña.
- **Embudo**: Leads → Respondieron → Agendaron → Asistieron → Ganados con tasas de conversión por etapa, y **proyección del mes en curso** (etapas, inversión y venta) según el ritmo de los días transcurridos.
- **Asistente de IA** (drawer disponible en todas las secciones): el director pregunta "¿qué conviene más, Meta o Google?" o "¿cómo cierra la proyección del mes?" y recibe respuestas basadas en los datos del rango seleccionado.

Todas las secciones (y el chat) se filtran con un **rango de fechas libre** (desde/hasta) con presets: 7/30/90 días, este mes, mes pasado.

## Cómo correrlo

```bash
npm install
cp .env.example .env   # completá al menos ANTHROPIC_API_KEY
npm run dev
```

Abrí http://localhost:3000. Sin credenciales de Meta/Kommo verás el badge **"Datos de demostración"** (la demo genera 365 días de historia, con Google Ads activo los últimos ~7 meses).

## Variables de entorno

| Variable | Requerida | Descripción |
|---|---|---|
| `ANTHROPIC_API_KEY` | Para el chat (opción A) | API key de Anthropic (console.anthropic.com) — mejor calidad de análisis |
| `GEMINI_API_KEY` | Para el chat (opción B, **gratis**) | API key de Google AI Studio (aistudio.google.com), sin tarjeta |
| `GEMINI_MODEL` | Opcional | Default `gemini-2.5-flash` |
| `AI_PROVIDER` | Opcional | `anthropic` o `gemini` para forzar el proveedor si tenés ambas keys |
| `META_ACCESS_TOKEN` | Opcional | Token de sistema con permiso `ads_read` |
| `META_AD_ACCOUNT_ID` | Opcional | Cuenta publicitaria, ej. `act_1234567890` |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Opcional | Token de desarrollador (API Center de Google Ads) |
| `GOOGLE_ADS_CLIENT_ID` / `GOOGLE_ADS_CLIENT_SECRET` | Opcional | Credenciales OAuth2 (Google Cloud Console) |
| `GOOGLE_ADS_REFRESH_TOKEN` | Opcional | Refresh token del usuario con acceso a la cuenta |
| `GOOGLE_ADS_CUSTOMER_ID` | Opcional | ID de la cuenta sin guiones, ej. `1234567890` |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | Opcional | ID del MCC si se accede vía cuenta administradora |
| `KOMMO_BASE_URL` | Opcional | Ej. `https://tuclinica.kommo.com` |
| `KOMMO_ACCESS_TOKEN` | Opcional | Token de larga duración de Kommo |
| `KOMMO_STATUS_CONTACTADO` / `_AGENDADO` / `_ASISTIO` | Opcional | IDs de estado del pipeline (separados por coma) |

**Modo real**: se activa cuando **Meta y Kommo** están configurados a la vez; Google Ads se suma automáticamente si también tiene credenciales. Si falta Meta o Kommo, la app corre en modo demo.

### Mapeo del pipeline de Kommo

Cada cuenta de Kommo tiene IDs de estado propios. Obtenelos con:

```
GET {KOMMO_BASE_URL}/api/v4/leads/pipelines
Authorization: Bearer {KOMMO_ACCESS_TOKEN}
```

y cargá en las variables `KOMMO_STATUS_*` los IDs que correspondan a cada etapa de tu embudo. Los estados `142` (ganado) y `143` (perdido) son estándar de Kommo y ya están contemplados.

La atribución lead → campaña se hace por el campo personalizado con `field_code = UTM_CAMPAIGN` (cargado por tu integración de formularios → Kommo), que debe contener el **ID de campaña** de Meta o Google.

## Arquitectura

```
src/
  app/
    page.tsx                # Resumen
    campanas/page.tsx       # Campañas (Meta + Google, filtro por plataforma)
    rentabilidad/page.tsx   # Rentabilidad (RO$, ROAS, ROI, ticket, CAC...)
    embudo/page.tsx         # Embudo + proyección del mes
    api/metrics/route.ts    # Métricas agregadas (?from=&to=)
    api/chat/route.ts       # Asistente IA (Claude, streaming)
  components/
    AppShell.tsx            # Sidebar + header con rango de fechas + drawer de chat
    DateRangeContext.tsx    # Rango de fechas compartido entre secciones
    ...                     # KPIs, embudo, tendencia, tablas, chat
  lib/
    data/
      demo.ts               # Generador demo determinístico (365 días)
      meta.ts               # Conector Meta Marketing API (Graph v21)
      google.ts             # Conector Google Ads API (REST + GAQL)
      kommo.ts              # Conector Kommo API v4
      dashboard.ts          # Agregación, rentabilidad y proyección de mes
    ai/context.ts           # System prompt + contexto de datos para Claude
```

El chat usa el modelo `claude-opus-4-8` con streaming. En cada consulta se inyectan los datos agregados del rango seleccionado (KPIs, rentabilidad, plataformas, embudo, campañas, proyección) como contexto, de modo que las respuestas siempre reflejan lo que el director ve en pantalla.

## Roadmap sugerido

- Autenticación multi-clínica (una cuenta por cliente).
- Webhooks de Kommo para datos en tiempo real en lugar de polling.
- Alertas proactivas (CPL fuera de rango, caída de asistencia) por email/WhatsApp.
- Comparativa entre períodos y metas mensuales por clínica.
