import { META_KEYS } from "./data/meta";
import { GOOGLE_KEYS } from "./data/google";
import { KOMMO_KEYS } from "./data/kommo";

export type ProviderId = "meta" | "google" | "kommo";

export interface FieldDef {
  key: string;
  label: string;
  /** Campo secreto: se muestra enmascarado y nunca se devuelve su valor. */
  secret: boolean;
  placeholder?: string;
  optional?: boolean;
  help?: string;
}

export interface ProviderDef {
  id: ProviderId;
  nombre: string;
  descripcion: string;
  fields: FieldDef[];
  /** Claves mínimas que deben estar para considerarlo conectado. */
  requeridas: string[];
}

export const PROVIDERS: ProviderDef[] = [
  {
    id: "meta",
    nombre: "Meta Ads",
    descripcion: "Campañas e inversión de Facebook/Instagram (Marketing API).",
    requeridas: [...META_KEYS],
    fields: [
      {
        key: "META_ACCESS_TOKEN",
        label: "Access Token",
        secret: true,
        placeholder: "EAAB...",
        help: "Token de usuario de sistema con permiso ads_read (no vence).",
      },
      {
        key: "META_AD_ACCOUNT_ID",
        label: "ID de cuenta publicitaria",
        secret: false,
        placeholder: "act_1234567890",
      },
    ],
  },
  {
    id: "google",
    nombre: "Google Ads",
    descripcion: "Campañas de búsqueda y PMax (Google Ads API).",
    requeridas: [
      "GOOGLE_ADS_DEVELOPER_TOKEN",
      "GOOGLE_ADS_CLIENT_ID",
      "GOOGLE_ADS_CLIENT_SECRET",
      "GOOGLE_ADS_REFRESH_TOKEN",
      "GOOGLE_ADS_CUSTOMER_ID",
    ],
    fields: [
      { key: "GOOGLE_ADS_DEVELOPER_TOKEN", label: "Developer Token", secret: true },
      { key: "GOOGLE_ADS_CLIENT_ID", label: "OAuth Client ID", secret: false },
      { key: "GOOGLE_ADS_CLIENT_SECRET", label: "OAuth Client Secret", secret: true },
      { key: "GOOGLE_ADS_REFRESH_TOKEN", label: "Refresh Token", secret: true },
      { key: "GOOGLE_ADS_CUSTOMER_ID", label: "Customer ID (sin guiones)", secret: false, placeholder: "1234567890" },
      {
        key: "GOOGLE_ADS_LOGIN_CUSTOMER_ID",
        label: "Login Customer ID (MCC)",
        secret: false,
        optional: true,
        help: "Solo si accedés vía una cuenta administradora (MCC).",
      },
    ],
  },
  {
    id: "kommo",
    nombre: "CRM — Kommo",
    descripcion: "Leads y etapas del pipeline comercial (Kommo API v4).",
    requeridas: ["KOMMO_BASE_URL", "KOMMO_ACCESS_TOKEN"],
    fields: [
      { key: "KOMMO_BASE_URL", label: "URL de la cuenta", secret: false, placeholder: "https://tuclinica.kommo.com" },
      { key: "KOMMO_ACCESS_TOKEN", label: "Access Token (larga duración)", secret: true },
      {
        key: "KOMMO_STATUS_CONTACTADO",
        label: "IDs etapa Contactado/Respondió",
        secret: false,
        optional: true,
        placeholder: "12345,12346",
        help: "IDs de estado del pipeline (separados por coma). Ver GET /api/v4/leads/pipelines.",
      },
      { key: "KOMMO_STATUS_AGENDADO", label: "IDs etapa Agendado", secret: false, optional: true, placeholder: "12347" },
      { key: "KOMMO_STATUS_ASISTIO", label: "IDs etapa Asistió", secret: false, optional: true, placeholder: "12348" },
    ],
  },
];

export const ALL_KEYS: string[] = [...META_KEYS, ...GOOGLE_KEYS, ...KOMMO_KEYS];

export function providerById(id: string): ProviderDef | undefined {
  return PROVIDERS.find((p) => p.id === id);
}
