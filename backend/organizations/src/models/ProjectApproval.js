const db = require('../config/database');

class ProjectApproval {
  static async create(organizationId, temporalProjectId, projectData) { //CREATE PROJECT APPROVAL HERE JSON RECEIVED - ´RPJECTS MOPULE
    const query = `
      INSERT INTO project_approvals (organization_id, temporal_project_id, project_data)   
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await db.query(query, [organizationId, temporalProjectId, JSON.stringify(projectData)]);
    return result.rows[0];
  }

  static async findPendingByOrganization(organizationId) { // FIND PENDING PROJECTS
    const query = `
      SELECT 
        temporal_id,
        temporal_project_id,
        project_data,
        status,
        created_at
      FROM project_approvals
      WHERE organization_id = $1 AND status = 'pending'
      ORDER BY created_at ASC
    `;
    
    const result = await db.query(query, [organizationId]);
    return result.rows;
  }

  static async findByTemporalId(temporalId) {
    const query = `
      SELECT *
      FROM project_approvals
      WHERE temporal_id = $1
    `;
    
    const result = await db.query(query, [temporalId]);
    return result.rows[0];
  }

  static async findByTemporalProjectId(temporalProjectId) {
    const query = `
      SELECT *
      FROM project_approvals
      WHERE temporal_project_id = $1
    `;
    
    const result = await db.query(query, [temporalProjectId]);
    return result.rows[0];
  }

  static async updateStatus(temporalId, status, reviewedBy, reviewNotes = null) {
    const query = `
      UPDATE project_approvals
      SET 
        status = $1,
        reviewed_by = $2,
        review_notes = $3,
        reviewed_at = CURRENT_TIMESTAMP
      WHERE temporal_id = $4
      RETURNING *
    `;

    const result = await db.query(query, [status, reviewedBy, reviewNotes, temporalId]);
    return result.rows[0];
  }

  static async updateRealProjectId(temporalId, realProjectId) {
    const query = `
      UPDATE project_approvals
      SET real_project_id = $1
      WHERE temporal_id = $2
      RETURNING *
    `;

    const result = await db.query(query, [realProjectId, temporalId]);
    return result.rows[0];
  }

  static async getHistory(organizationId, limit = 50) {
    const query = `
      SELECT 
        temporal_id,
        temporal_project_id,
        project_data,
        status,
        reviewed_at,
        reviewed_by,
        review_notes,
        created_at,
        real_project_id
      FROM project_approvals
      WHERE organization_id = $1
        AND status IN ('approved', 'rejected')
      ORDER BY reviewed_at DESC
      LIMIT $2
    `;
    
    const result = await db.query(query, [organizationId, limit]);
    return result.rows;
  }

  static async exists(temporalProjectId) {
    const query = `
      SELECT temporal_id
      FROM project_approvals
      WHERE temporal_project_id = $1
    `;

    const result = await db.query(query, [temporalProjectId]);
    return result.rows.length > 0;
  }

  static async searchProjects(organizationId, searchTerm) {
    const query = `
      SELECT *
      FROM project_approvals
      WHERE organization_id = $1
        AND (
          project_data->>'name' ILIKE $2 OR
          project_data->>'description' ILIKE $2 OR
          project_data->>'location' ILIKE $2
        )
      ORDER BY created_at DESC
    `;
    
    const result = await db.query(query, [organizationId, `%${searchTerm}%`]);
    return result.rows;
  }
}

module.exports = ProjectApproval;
