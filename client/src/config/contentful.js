/**
 * Contentful CMS Configuration
 * Para obtener tus credentials:
 * 1. Crea una cuenta en https://www.contentful.com/
 * 2. Ve a Settings > API Keys
 * 3. Copia tu Space ID y Content Delivery API token
 * 4. Reemplaza los valores en .env (ver .env.example)
 */

const CONTENTFUL_CONFIG = {
  spaceId: import.meta.env.VITE_CONTENTFUL_SPACE_ID || "TU_SPACE_ID_AQUI",
  accessToken:
    import.meta.env.VITE_CONTENTFUL_ACCESS_TOKEN || "TU_ACCESS_TOKEN_AQUI",
  environment: import.meta.env.VITE_CONTENTFUL_ENVIRONMENT || "master",
};

// URL de la API de Contentful
export const CONTENTFUL_API_URL = `https://cdn.contentful.com/spaces/${CONTENTFUL_CONFIG.spaceId}/entries`;

/**
 * Función para obtener conținut de Contentful
 * @param {string} contentType - Tipo de contenido (ej: "homePage", "fases", etc.)
 * @returns {Promise} Respuesta de Contentful
 */
export const fetchFromContentful = async (contentType) => {
  try {
    const response = await fetch(
      `${CONTENTFUL_API_URL}?content_type=${contentType}&access_token=${CONTENTFUL_CONFIG.accessToken}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Contentful API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching from Contentful:", error);
    return null;
  }
};

export default CONTENTFUL_CONFIG;
