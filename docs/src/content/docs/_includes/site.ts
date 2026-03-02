const baseUrl = import.meta.env.BASE_URL ?? '/';
const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
const site = import.meta.env.SITE ?? '';

export const BASE_URL = normalizedBaseUrl;
export const PROJECT_PATH = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
export const PROJECT_BASE_URL = site ? `${site}${PROJECT_PATH}` : PROJECT_PATH;
