import emailjs from "@emailjs/browser";

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
// URL base para el botón de la plantilla
const APP_URL = import.meta.env.VITE_APP_URL || "http://localhost:5173";

/**
 * Envía una notificación de actualización de estado utilizando EmailJS.
 * Ajustado para coincidir con la configuración: To Email {{email}} y From Name {{name}}
 */
export const sendNotification = async (
  toName,
  toEmail,
  newStatus,
  notes = "",
) => {
  // Validación de variables de entorno
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.error(
      "❌ EmailJS environment variables are missing. Check your .env file",
    );
    return false;
  }

  try {
    const templateParams = {
      name: toName, // Mapeado a {{name}} en tu configuración de EmailJS
      email: toEmail, // Mapeado a {{email}} en tu configuración de EmailJS
      status: newStatus, // Para el badge de la plantilla {{status}}
      notes: notes || "Sin observaciones adicionales.", // Para {{notes}}
      action_url: APP_URL, // Para el link del botón {{action_url}}
      date: new Date().toLocaleDateString(),
    };

    console.log(
      `📧 Enviando correo a ${toEmail} ({{email}}) como ${toName} ({{name}})...`,
    );

    // Ejecución del envío
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);

    console.log("✅ Correo enviado con éxito a través de EmailJS");
    return true;
  } catch (error) {
    console.error("❌ Error al enviar el correo:", error);
    return false;
  }
};
