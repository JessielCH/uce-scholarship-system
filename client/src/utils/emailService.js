import emailjs from "@emailjs/browser";

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
// URL base para el botón de la plantilla
const APP_URL = import.meta.env.VITE_APP_URL || "http://localhost:5173";

/**
 * Sends a status update notification using EmailJS.
 * Adjusted to match configuration: To Email {{email}} and From Name {{name}}
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
      name: toName, // Mapped to {{name}} in your EmailJS configuration
      email: toEmail, // Mapped to {{email}} in your EmailJS configuration
      status: newStatus, // For the template badge {{status}}
      notes: notes || "No additional observations.", // For {{notes}}
      action_url: APP_URL, // For the button link {{action_url}}
      date: new Date().toLocaleDateString(),
    };

    console.log(
      `📧 Sending email to ${toEmail} ({{email}}) as ${toName} ({{name}})...`,
    );

    // Send execution
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);

    console.log("✅ Email successfully sent via EmailJS");
    return true;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return false;
  }
};
