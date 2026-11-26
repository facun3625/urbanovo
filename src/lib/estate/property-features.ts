export const ORIENTATIONS = ["Norte", "Noreste", "Este", "Sudeste", "Sur", "Sudoeste", "Oeste", "Noroeste"] as const;
export const PET_POLICIES = ["Permitidas", "No permitidas"] as const;
export const CREDIT_OPTIONS = ["Sí", "No"] as const;
export const FLOOR_PLAN_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;
export const MAX_FLOOR_PLAN_SIZE = 8 * 1024 * 1024;

// Fotos nuevas que se pueden subir de una vez al guardar una propiedad. El
// navegador las achica antes de mandarlas (ver property-images-manager).
export const MAX_PHOTOS_PER_SAVE = 30;
