const db = require('../config/database');

class Organization {
  static async create(data) {
    const {
      name,
      description,
      organization_type_id,
      organization_email,
      phone_number,
      logo_url,
      owner_id,
      created_by_id
    } = data;

    const query = `
      INSERT INTO organizations (
        name, description, organization_type_id, organization_email,
        phone_number, logo_url, owner_id, created_by_id, modified_by_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
      RETURNING *
    `;

    const values = [
      name, description, organization_type_id, organization_email,
      phone_number, logo_url, owner_id, created_by_id
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT 
        o.*,
        ot.name as organization_type_name,
        ot.description as type_description
      FROM organizations o
      INNER JOIN organization_types ot ON o.organization_type_id = ot.id_type
      WHERE o.id_organization = $1
    `;
    
    const result = await db.query(query, [id]);
    const org = result.rows[0];
    
    if (org) {
      org.isActive = org.isactive;
    }
    
    return org;
  }

  static async findByOwnerId(ownerId) {
    const query = `
      SELECT 
        o.*,
        ot.name as organization_type_name
      FROM organizations o
      INNER JOIN organization_types ot ON o.organization_type_id = ot.id_type
      WHERE o.owner_id = $1 AND o.isActive = true
    `;
    
    const result = await db.query(query, [ownerId]);
    return result.rows[0];
  }

  static async update(id, data, modifiedById) {
    const fields = [];
    const values = [];
    let valueIndex = 1;

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${valueIndex}`);
        values.push(data[key]);
        valueIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    fields.push(`modified_by_id = $${valueIndex}`);
    values.push(modifiedById);
    valueIndex++;

    fields.push(`update_at = CURRENT_TIMESTAMP`);

    values.push(id);

    const query = `
      UPDATE organizations 
      SET ${fields.join(', ')}
      WHERE id_organization = $${valueIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async updateStatus(id, isActive, modifiedById) {
    const query = `
      UPDATE organizations 
      SET isActive = $1, modified_by_id = $2, update_at = CURRENT_TIMESTAMP
      WHERE id_organization = $3
      RETURNING *
    `;

    const result = await db.query(query, [isActive, modifiedById, id]);
    return result.rows[0];
  }

  static async checkEmailExists(email, excludeId = null) {
    let query = 'SELECT id_organization FROM organizations WHERE organization_email = $1';
    const values = [email];

    if (excludeId) {
      query += ' AND id_organization != $2';
      values.push(excludeId);
    }

    const result = await db.query(query, values);
    return result.rows.length > 0;
  }
}

module.exports = Organization;