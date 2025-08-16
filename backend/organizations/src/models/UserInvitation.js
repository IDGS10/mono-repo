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
    expires_at.setDate(expires_at.getDate() + 7);
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

  static async checkEmailExists(email, organizationId) {
    const query = `
      SELECT id_invitation
      FROM user_invitations
      WHERE invited_email = $1 
        AND organization_id = $2
        AND status = 'pending'
    `;

    const result = await db.query(query, [email, organizationId]);
    return result.rows.length > 0;
  }
}

module.exports = UserInvitation;