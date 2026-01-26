import emailjs from "@emailjs/browser";

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export const sendNotification = async (
  toName,
  toEmail,
  newStatus,
  notes = "",
) => {
  // Validation environment variables
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.error(
      "❌ EmailJS environment variables are missing. Check your .env file",
    );
    return false;
  }

  try {
    const templateParams = {
      to_name: toName,
      to_email: toEmail,
      status: newStatus, // Make sure your EmailJS template uses {{status}}
      notes: notes, // Make sure your template uses {{notes}}
      date: new Date().toLocaleDateString(),
    };

    console.log(
      `📧 Sending mail to ${toEmail} using service: ${SERVICE_ID}...`,
    );

    // Actual execution
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);

    console.log("✅ Email sent successfully via EmailJS");
    return true;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    // We don't throw an error so as not to break the UI flow, we just log
    return false;
  }
};
