const UserInvitation = require('../models/UserInvitation');
const Organization = require('../models/Organization');
const emailService = require('../services/emailService');

class InvitationController {
  static async create(req, res, next) {
    try {
      const userId = req.user.id;
      const { organization_id } = req.body;

      const organization = await Organization.findById(organization_id);
      if (!organization) {
        return res.status(404).json({
          error: 'Organización no encontrada'
        });
      }

      if (organization.owner_id !== userId) {
        return res.status(403).json({
          error: 'Solo el propietario puede enviar invitaciones'
        });
      }
      const emailExists = await UserInvitation.checkEmailExists(
        req.validatedData.invited_email,
        organization_id
      );
      

      if (emailExists) {
        return res.status(409).json({
          error: 'Este email ya tiene una invitación pendiente'
        });
      }

      const invitationData = {
        ...req.validatedData,
        organization_id,
        invited_by: userId
      };

      const invitation = await UserInvitation.create(invitationData);

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
      await UserInvitation.updateStatus(invitation.id_invitation, 'accepted');

      res.json({
        message: 'Invitación aceptada exitosamente',
        redirectTo: '/dashboard'
      });
    } catch (error) {
      next(error);
    }
  }
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

      await UserInvitation.updateStatus(id, 'revoked');

      res.json({
        message: 'Invitación revocada exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = InvitationController;