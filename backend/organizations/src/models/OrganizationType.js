const db = require('../config/database');

class OrganizationType {
  static async getAll() { // ORG TYPE
    const query = `
      SELECT id_type, name, description
      FROM organization_types
      WHERE status = true
      ORDER BY name ASC
    `;
    
    const result = await db.query(query);
    return result.rows;
  }

  static async findById(id) { //FIND ID ORG TYPE
    const query = `
      SELECT id_type, name, description, status
      FROM organization_types
      WHERE id_type = $1
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = OrganizationType;