const nodemailer = require('nodemailer');
const config = require('../config/config');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.password
      }
    });
  }

  async sendInvitation({ to, invitedName, organizationName, invitationToken, inviterName }) {
    const invitationUrl = `${config.invitation.baseUrl}/invitations/accept/${invitationToken}`;

    const mailOptions = {
      from: config.email.from,
      to,
      subject: `Invitación a ${organizationName} - Ecosistema IoT`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">Ecosistema IoT</h1>
            <h2 style="color: #374151; margin-bottom: 20px;">¡Has sido invitado a ${organizationName}!</h2>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0 0 15px 0; color: #374151; font-size: 16px;">Hola <strong>${invitedName}</strong>,</p>
            
            <p style="margin: 0 0 15px 0; color: #374151;">
              <strong>${inviterName}</strong> te ha invitado a formar parte de 
              <strong>${organizationName}</strong> en nuestra plataforma de monitoreo ambiental IoT.
            </p>
          </div>
          
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <p style="margin: 0 0 10px 0; color: #374151;"><strong>Detalles de la invitación:</strong></p>
            <p style="margin: 0 0 5px 0; color: #374151;"><strong>Organización:</strong> ${organizationName}</p>
            <p style="margin: 0 0 5px 0; color: #374151;"><strong>Invitado por:</strong> ${inviterName}</p>
            <p style="margin: 0; color: #374151;"><strong>Email:</strong> ${to}</p>
          </div>
          
          <p style="color: #374151; margin-bottom: 30px;">
            Para aceptar la invitación y crear tu cuenta, haz clic en el siguiente botón:
          </p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${invitationUrl}" 
               style="display: inline-block; background-color: #2563eb; color: white; padding: 15px 35px; 
                      text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;
                      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              Aceptar Invitación
            </a>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 30px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>Importante:</strong> Esta invitación expirará en 7 días. 
              Si tienes problemas con el botón, copia y pega el siguiente enlace en tu navegador:
            </p>
            <p style="margin: 10px 0 0 0; word-break: break-all; color: #2563eb; font-family: monospace; font-size: 12px;">
              ${invitationUrl}
            </p>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 40px;">
            <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
              Este es un correo automático del sistema de Ecosistema IoT para Monitoreo Ambiental.<br>
              Si no esperabas esta invitación, puedes ignorar este mensaje.
            </p>
          </div>
        </div>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      return result;
    } catch (error) {
      console.error('Error enviando email de invitación:', error);
      throw error;
    }
  }

  async sendProjectNotification({ to, organizationName, projectName, status, reviewNotes }) {
    const statusText = status === 'approved' ? 'aprobado' : 'rechazado';
    const statusColor = status === 'approved' ? '#10b981' : '#ef4444';
    const statusBg = status === 'approved' ? '#ecfdf5' : '#fef2f2';
    
    const mailOptions = {
      from: config.email.from,
      to,
      subject: `Proyecto ${statusText} - ${projectName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">Ecosistema IoT</h1>
            <h2 style="color: ${statusColor}; margin-bottom: 20px;">Proyecto ${statusText.toUpperCase()}</h2>
          </div>
          
          <div style="background-color: ${statusBg}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor};">
            <p style="margin: 0 0 10px 0; color: #374151;"><strong>Detalles del proyecto:</strong></p>
            <p style="margin: 0 0 5px 0; color: #374151;"><strong>Proyecto:</strong> ${projectName}</p>
            <p style="margin: 0 0 5px 0; color: #374151;"><strong>Organización:</strong> ${organizationName}</p>
            <p style="margin: 0; color: #374151;"><strong>Estado:</strong> 
              <span style="color: ${statusColor}; font-weight: 600;">${statusText.toUpperCase()}</span>
            </p>
          </div>
          
          ${reviewNotes ? `
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; color: #856404;"><strong>Comentarios de revisión:</strong></p>
              <p style="margin: 0; color: #856404;">${reviewNotes}</p>
            </div>
          ` : ''}
          
          <p style="color: #374151; margin: 20px 0;">
            Puedes ver más detalles en tu dashboard de proyectos.
          </p>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 40px;">
            <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
              Este es un correo automático del sistema de Ecosistema IoT para Monitoreo Ambiental.
            </p>
          </div>
        </div>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      return result;
    } catch (error) {
      console.error('Error enviando email de notificación:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();