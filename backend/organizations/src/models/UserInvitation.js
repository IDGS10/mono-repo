const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class UserInvitation {
  static async create(data) {
    const {
      organization_id,
      invited_email,
      invited_name,
      invited_role,
      invited_by
    } = data;

    const invitation_token = uuidv4();
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 7); // EXPIRATION IN 7 DAYS

    const query = `
      INSERT INTO user_invitations (
        organization_id, invited_email, invited_name, invited_role,
        invitation_token, expires_at, invited_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      organization_id, invited_email, invited_name, invited_role,
      invitation_token, expires_at, invited_by
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findByToken(token) {
    const query = `
      SELECT 
        ui.*,
        o.name as organization_name
      FROM user_invitations ui
      INNER JOIN organizations o ON ui.organization_id = o.id_organization
      WHERE ui.invitation_token = $1
        AND ui.status = 'pending'
        AND ui.expires_at > CURRENT_TIMESTAMP
    `;
    
    const result = await db.query(query, [token]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT *
      FROM user_invitations
      WHERE id_invitation = $1
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
  static async findByOrganization(organizationId) {
    const query = `
      SELECT *
      FROM user_invitations
      WHERE organization_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await db.query(query, [organizationId]);
    return result.rows;
  }

  static async updateStatus(id, status) {
    const query = `
      UPDATE user_invitations
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id_invitation = $2
      RETURNING *
    `;

    const result = await db.query(query, [status, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = `
      DELETE FROM user_invitations
      WHERE id_invitation = $1
      RETURNING *
    `;

    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async checkEmailExists(email, organizationId) {
    const query = `
      SELECT id_invitation
      FROM user_invitations
      WHERE invited_email = $1 
        AND organization_id = $2
        AND status = 'pending'
        AND expires_at > CURRENT_TIMESTAMP

    `;

    const result = await db.query(query, [email, organizationId]);
    return result.rows.length > 0;
  }

  static async findExpiredInvitations() {
    const query = `
      UPDATE user_invitations
      SET status = 'expired', updated_at = CURRENT_TIMESTAMP
      WHERE status = 'pending' 
        AND expires_at <= CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await db.query(query);
    return result.rows;
  }

  static async getInvitationStats(organizationId) {
    const query = `
      SELECT 
        status,
        COUNT(*) as count
      FROM user_invitations
      WHERE organization_id = $1
      GROUP BY status
    `;

    const result = await db.query(query, [organizationId]);
    return result.rows;
  }

  static async findByEmail(email) {
    const query = `
      SELECT 
        ui.*,
        o.name as organization_name
      FROM user_invitations ui
      INNER JOIN organizations o ON ui.organization_id = o.id_organization
      WHERE ui.invited_email = $1
      ORDER BY ui.created_at DESC
    `;
    
    const result = await db.query(query, [email]);
    return result.rows;
  }

  static async findPendingWithOrganization(organizationId) {
    const query = `
      SELECT 
        ui.*,
        o.name as organization_name,
        o.organization_type_id
      FROM user_invitations ui
      INNER JOIN organizations o ON ui.organization_id = o.id_organization
      WHERE ui.organization_id = $1
        AND ui.status = 'pending'
        AND ui.expires_at > CURRENT_TIMESTAMP
      ORDER BY ui.created_at DESC
    `;
    
    const result = await db.query(query, [organizationId]);
    return result.rows;
  }

  static async cleanupExpiredInvitations() {
    const query = `
      UPDATE user_invitations
      SET status = 'expired', updated_at = CURRENT_TIMESTAMP
      WHERE status = 'pending' 
        AND expires_at <= CURRENT_TIMESTAMP
      RETURNING id_invitation, invited_email, organization_id
    `;

    const result = await db.query(query);
    return result.rows;
  }

  static async renewInvitation(id) {
    const invitation_token = uuidv4();
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 7);

    const query = `
      UPDATE user_invitations
      SET 
        invitation_token = $1,
        expires_at = $2,
        status = 'pending',
        updated_at = CURRENT_TIMESTAMP
      WHERE id_invitation = $3
      RETURNING *
    `;

    const result = await db.query(query, [invitation_token, expires_at, id]);
    return result.rows[0];
  }
  static async getGeneralStats() {
    const query = `
      SELECT 
        status,
        COUNT(*) as count,
        COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
      FROM user_invitations
      GROUP BY status
      ORDER BY count DESC
    `;

    const result = await db.query(query);
    return result.rows;
  }
}

module.exports = UserInvitation;