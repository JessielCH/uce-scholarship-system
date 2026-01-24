import emailjs from "@emailjs/browser";

// Accedemos a las variables de entorno de Vite
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export const sendNotification = async (
  toName,
  toEmail,
  newStatus,
  notes = "",
) => {
  // Validación de seguridad: Verificar que las keys existan
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.error(
      "❌ Faltan las variables de entorno de EmailJS. Revisa tu archivo .env",
    );
    return false;
  }

  try {
    const templateParams = {
      to_name: toName,
      to_email: toEmail,
      status: newStatus, // Asegúrate de que tu template en EmailJS use {{status}}
      notes: notes, // Asegúrate de que tu template use {{notes}}
      date: new Date().toLocaleDateString(),
    };

    console.log(
      `📧 Enviando correo a ${toEmail} usando servicio: ${SERVICE_ID}...`,
    );

    // Ejecución real
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);

    console.log("✅ Correo enviado exitosamente via EmailJS");
    return true;
  } catch (error) {
    console.error("❌ Error enviando correo:", error);
    // No lanzamos error para no romper el flujo de la UI, solo logueamos
    return false;
  }
};
