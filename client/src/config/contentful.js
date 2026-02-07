/**
 * Contentful CMS Configuration
 */

const CONTENTFUL_CONFIG = {
  spaceId: import.meta.env.VITE_CONTENTFUL_SPACE_ID || "TU_SPACE_ID_AQUI",
  accessToken:
    import.meta.env.VITE_CONTENTFUL_ACCESS_TOKEN || "TU_ACCESS_TOKEN_AQUI",
  environment: import.meta.env.VITE_CONTENTFUL_ENVIRONMENT || "master",
};

export const CONTENTFUL_API_URL = `https://cdn.contentful.com/spaces/${CONTENTFUL_CONFIG.spaceId}/entries`;

/**
 *
 * @param {string} contentType
 * @returns {Promise}
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
