const UserInvitation = require('../models/UserInvitation');
const Organization = require('../models/Organization');
const emailService = require('../services/emailService');
const userService = require('../services/userService');
const bcrypt = require('bcryptjs');

class InvitationController {
  static async create(req, res, next) {
    try {
      const userId = req.user.id;
      const { organization_id } = req.body;

      // FIND ORGANIZATION

      const organization = await Organization.findById(organization_id);
      if (!organization) {
        return res.status(404).json({
          error: 'Organización no encontrada'
        });
      }

      // PERMISSION - OWNER

      if (organization.owner_id !== userId) {
        return res.status(403).json({
          error: 'Solo el propietario puede enviar invitaciones'
        });
      }
      // VERIFICATION OF INVITATION SENT

      const emailExists = await UserInvitation.checkEmailExists(
        req.validatedData.invited_email,
        organization_id
      );
      if (emailExists) {
        return res.status(409).json({
          error: 'Este email ya tiene una invitación pendiente'
        });
      }

      // CREATE INVITATION

      const invitationData = {
        ...req.validatedData,
        organization_id,
        invited_by: userId
      };

      const invitation = await UserInvitation.create(invitationData);

      // SEND INVITATION
      try {
        await emailService.sendInvitation({
          to: invitation.invited_email,
          invitedName: invitation.invited_name,
          organizationName: organization.name,
          invitationToken: invitation.invitation_token,
          inviterName: req.user.name
        });
      } catch (emailError) {
        console.error('Error enviando email de invitación:', emailError);
      }

      res.status(201).json({
        message: 'Invitación enviada exitosamente',
        invitation: {
          id_invitation: invitation.id_invitation,
          invited_email: invitation.invited_email,
          invited_name: invitation.invited_name,
          invited_role: invitation.invited_role,
          status: invitation.status,
          expires_at: invitation.expires_at
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // GET API ORGNIZATION ID

  static async getByOrganization(req, res, next) {
    try {
      const { orgId } = req.params;
      const userId = req.user.id;

      const organization = await Organization.findById(orgId);
      if (!organization || organization.owner_id !== userId) {
        return res.status(403).json({
          error: 'No tienes acceso a esta organización'
        });
      }

      const invitations = await UserInvitation.findByOrganization(orgId);

      res.json({
        invitations: invitations.map(inv => ({
          id_invitation: inv.id_invitation,
          invited_email: inv.invited_email,
          invited_name: inv.invited_name,
          invited_role: inv.invited_role,
          status: inv.status,
          expires_at: inv.expires_at,
          created_at: inv.created_at
        }))
      });
    } catch (error) {
      next(error);
    }
  }

  // GET API TOKEN

  static async verifyToken(req, res, next) {
    try {
      const { token } = req.params;

      const invitation = await UserInvitation.findByToken(token);
      
      if (!invitation) {
        return res.status(404).json({
          error: 'Invitación no válida o expirada'
        });
      }

      res.json({
        invitation: {
          invited_name: invitation.invited_name,
          invited_email: invitation.invited_email,
          invited_role: invitation.invited_role,
          organization_name: invitation.organization_name,
          expires_at: invitation.expires_at
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // POST API TOKEN
  static async acceptInvitation(req, res, next) {
    try {
      const { token } = req.params;
      const { userData } = req.body;

      const invitation = await UserInvitation.findByToken(token);
      
      if (!invitation) {
        return res.status(404).json({
          error: 'Invitación no válida o expirada'
        });
      }

      console.log('Invitación encontrada:', {
        id: invitation.id_invitation,
        email: invitation.invited_email,
        organization: invitation.organization_name
      });

      // Verificar si el usuario ya existe en el sistema de seguridad
      const userExists = await userService.userExists(invitation.invited_email);
      
      let newUser = null;
      if (!userExists && userData) {
        // Validar que se proporcionen los datos necesarios
        if (!userData.password) {
          return res.status(400).json({
            error: 'Se requiere una contraseña para crear la cuenta'
          });
        }

        // Hash the password before sending to security service
        const hashedPassword = await bcrypt.hash(userData.password, 12);

        // Crear usuario en el sistema de seguridad
        try {
          const userPayload = {
            first_name: userData.first_name || invitation.invited_name?.split(' ')[0] || 'Usuario',
            last_name: userData.last_name || invitation.invited_name?.split(' ').slice(1).join(' ') || 'Invitado',
            email: invitation.invited_email,
            password_hash: hashedPassword,
            phone: userData.phone || '',
            role: invitation.invited_role,
            organization_id: invitation.organization_id,
            invited_by: invitation.invited_by,
            invited_name: invitation.invited_name
          };

          newUser = await userService.createFromInvitation(userPayload);
          
          console.log('✅ Usuario creado en sistema de seguridad:', newUser);
        } catch (userError) {
          console.error('❌ Error creando usuario:', userError);
          return res.status(500).json({
            error: 'Error al crear el usuario en el sistema',
            details: userError.message
          });
        }
      } else if (userExists) {
        console.log('ℹ️ Usuario ya existe en sistema de seguridad');
        // Obtener información del usuario existente
        newUser = await userService.getUserByEmail(invitation.invited_email);
      } else {
        console.log('⚠️ No se proporcionaron datos de usuario para crear cuenta');
      }

      // Marcar invitación como aceptada
      await UserInvitation.updateStatus(invitation.id_invitation, 'accepted');

      res.json({
        message: 'Invitación aceptada exitosamente',
        redirectTo: '/dashboard',
        user_created: !userExists,
        user_data: {
          email: invitation.invited_email,
          name: invitation.invited_name,
          role: invitation.invited_role,
          organization_name: invitation.organization_name,
          security_user_id: newUser?.id || null
        }
      });
    } catch (error) {
      console.error('Error aceptando invitación:', error);
      next(error);
    }
  }

  // POST API RESEND INVITATION
  static async resendInvitation(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const invitation = await UserInvitation.findById(id);
      if (!invitation) {
        return res.status(404).json({
          error: 'Invitación no encontrada'
        });
      }

      // VERIFY PERMISSION
      const organization = await Organization.findById(invitation.organization_id);
      if (!organization || organization.owner_id !== userId) {
        return res.status(403).json({
          error: 'No tienes permisos para reenviar esta invitación'
        });
      }

      // SEND INVITATION ONLY THE PENDING STATE
      if (invitation.status !== 'pending') {
        return res.status(400).json({
          error: 'Solo se pueden reenviar invitaciones pendientes'
        });
      }

      if (new Date(invitation.expires_at) < new Date()) {
        return res.status(400).json({
          error: 'La invitación ha expirado. Crea una nueva invitación.'
        });
      }

      // RESEND EMAIL
      try {
        await emailService.sendInvitation({
          to: invitation.invited_email,
          invitedName: invitation.invited_name,
          organizationName: organization.name,
          invitationToken: invitation.invitation_token,
          inviterName: req.user.name
        });

        res.json({
          message: 'Invitación reenviada exitosamente'
        });
      } catch (emailError) {
        console.error('Error reenviando email:', emailError);
        res.status(500).json({
          error: 'Error enviando el email. Intenta nuevamente.'
        });
      }
    } catch (error) {
      next(error);
    }
  }

  // PATCH API REVOKE INVITATION
  static async revoke(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const invitation = await UserInvitation.findById(id);
      if (!invitation) {
        return res.status(404).json({
          error: 'Invitación no encontrada'
        });
      }
      const organization = await Organization.findById(invitation.organization_id);
      if (!organization || organization.owner_id !== userId) {
        return res.status(403).json({
          error: 'No tienes permisos para revocar esta invitación'
        });
      }

      if (invitation.status !== 'pending') {
        return res.status(400).json({
          error: 'Solo se pueden revocar invitaciones pendientes'
        });
      }

      await UserInvitation.updateStatus(id, 'revoked');

      res.json({
        message: 'Invitación revocada exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE INVITATION ID
  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const invitation = await UserInvitation.findById(id);
      if (!invitation) {
        return res.status(404).json({
          error: 'Invitación no encontrada'
        });
      }

      const organization = await Organization.findById(invitation.organization_id);
      if (!organization || organization.owner_id !== userId) {
        return res.status(403).json({
          error: 'No tienes permisos para eliminar esta invitación'
        });
      }
      await UserInvitation.delete(id);

      res.json({
        message: 'Invitación eliminada exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  // GET API INVITATION ID
  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const invitation = await UserInvitation.findById(id);
      if (!invitation) {
        return res.status(404).json({
          error: 'Invitación no encontrada'
        });
      }
      const organization = await Organization.findById(invitation.organization_id);
      if (!organization || organization.owner_id !== userId) {
        return res.status(403).json({
          error: 'No tienes acceso a esta invitación'
        });
      }

      res.json({
        invitation: {
          id_invitation: invitation.id_invitation,
          invited_email: invitation.invited_email,
          invited_name: invitation.invited_name,
          invited_role: invitation.invited_role,
          status: invitation.status,
          expires_at: invitation.expires_at,
          created_at: invitation.created_at,
          updated_at: invitation.updated_at,
          organization_name: organization.name
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = InvitationController;