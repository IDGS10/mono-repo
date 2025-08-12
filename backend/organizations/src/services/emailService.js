const nodemailer = require("nodemailer");
const config = require("../config/config");

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
    });
  }

  async sendInvitation({
    to,
    invitedName,
    organizationName,
    invitationToken,
    inviterName,
  }) {
    const invitationUrl = new URL(
      `/organizations/components/acceptinvitation/${invitationToken}`,
      config.invitation.baseUrl
    ).toString();

    const mailOptions = {
      from: config.email.from,
      to,
      subject: `Invitación a ${organizationName} - Ecosistema IoT`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>¡Has sido invitado a ${organizationName}!</h2>
          
          <p>Hola ${invitedName},</p>
          
          <p>${inviterName} te ha invitado a formar parte de <strong>${organizationName}</strong> en nuestra plataforma de monitoreo ambiental IoT.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Organización:</strong> ${organizationName}</p>
            <p><strong>Invitado por:</strong> ${inviterName}</p>
          </div>
          
          <p>Para aceptar la invitación y crear tu cuenta, haz clic en el siguiente enlace:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Aceptar Invitación
            </a>
          </div>
          
          <p><small>Esta invitación expirará en 1 día. Si tienes problemas con el enlace, 
          copia y pega la siguiente URL en tu navegador:</small></p>
          <p><small>${invitationUrl}</small></p>
          
          
        </div>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log("Email de invitación enviado:", result.messageId);
      return result;
    } catch (error) {
      console.error("Error enviando email de invitación:", error);
      throw error;
    }
  }

  async sendProjectNotification({
    to,
    organizationName,
    projectName,
    status,
    reviewNotes,
  }) {
    const statusText = status === "approved" ? "aprobado" : "rechazado";
    const statusColor = status === "approved" ? "#28a745" : "#dc3545";

    const mailOptions = {
      from: config.email.from,
      to,
      subject: `Proyecto ${statusText} - ${projectName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${statusColor};">Proyecto ${statusText}</h2>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Proyecto:</strong> ${projectName}</p>
            <p><strong>Organización:</strong> ${organizationName}</p>
            <p><strong>Estado:</strong> <span style="color: ${statusColor};">${statusText.toUpperCase()}</span></p>
          </div>
          
          ${
            reviewNotes
              ? `
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Comentarios:</strong></p>
              <p>${reviewNotes}</p>
            </div>
          `
              : ""
          }
          
          <p>Puedes ver más detalles en tu dashboard de proyectos.</p>
          
          <hr style="margin: 30px 0;">
          <p><small>Este es un correo automático del sistema de Ecosistema IoT para Monitoreo Ambiental.</small></p>
        </div>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log("Email de notificación enviado:", result.messageId);
      return result;
    } catch (error) {
      console.error("Error enviando email de notificación:", error);
      throw error;
    }
  }
}

module.exports = new EmailService();
