import { query } from '../config/database.js'

export default class Project {
  constructor(data = {}) {
    this.id_project = data.id_project || null // Auto-increment, se asigna en BD
    this.name = data.name
    this.description = data.description
    this.location = data.location
    this.status = data.status || 'pending_approval'
    this.modified_by = data.modified_by
    this.created_by = data.created_by
    this.id_org = data.id_org
    this.owner_id = data.owner_id
    this.created_at = data.created_at
    this.updated_at = data.updated_at
  }

  // POLÍTICA DE SEGURIDAD: NO SELECT * - Campos específicos solamente
  static getSelectFields() {
    return `id_project, name, description, location, status, 
            modified_by, created_by, id_org, owner_id, 
            created_at, updated_at`
  }

  // La tabla ya existe, pero verificamos que tenga la estructura correcta
  static async verifyTable() {
    const checkTableQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      ORDER BY ordinal_position;
    `
    
    try {
      const result = await query(checkTableQuery)
      console.log('✅ Projects table structure:', result.rows)
      return result.rows
    } catch (error) {
      console.error('❌ Error checking projects table:', error)
      throw error
    }
  }

  // Save project to database (INSERT)
  async save() {
    const insertQuery = `
      INSERT INTO projects (
        name, description, location, status, 
        modified_by, created_by, id_org, owner_id,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING ${Project.getSelectFields()}
    `
    
    const now = new Date()
    const values = [
      this.name,
      this.description,
      this.location,
      this.status || 'pending_approval',
      this.modified_by || this.created_by,
      this.created_by,
      this.id_org,
      this.owner_id,
      now, // created_at
      now  // updated_at
    ]
    
    try {
      const result = await query(insertQuery, values)
      const savedProject = new Project(result.rows[0])
      console.log('✅ Project saved with ID:', savedProject.id_project)
      return savedProject
    } catch (error) {
      console.error('❌ Error saving project:', error)
      throw error
    }
  }

  // POLÍTICA DE SEGURIDAD: Paginación obligatoria - NO SELECT *
  static async findAll(ownerId = null, idOrg = null, page = 1, limit = 10) {
    // Validar parámetros de paginación
    const pageNum = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10)) // Máximo 100 registros
    const offset = (pageNum - 1) * limitNum

    let findQuery = `SELECT ${Project.getSelectFields()} FROM projects`
    let countQuery = `SELECT COUNT(*) as total FROM projects`
    let values = []
    let conditions = []
    let paramCount = 1
    
    if (ownerId) {
      conditions.push(`owner_id = $${paramCount}`)
      values.push(ownerId)
      paramCount++
    }
    
    if (idOrg) {
      conditions.push(`id_org = $${paramCount}`)
      values.push(idOrg)
      paramCount++
    }
    
    const whereClause = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : ''
    findQuery += whereClause
    countQuery += whereClause
    
    // Agregar paginación
    findQuery += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`
    const queryValues = [...values, limitNum, offset]
    
    try {
      // Ejecutar ambas consultas
      const [dataResult, countResult] = await Promise.all([
        query(findQuery, queryValues),
        query(countQuery, values)
      ])
      
      const projects = dataResult.rows.map(row => new Project(row))
      const total = parseInt(countResult.rows[0].total)
      const totalPages = Math.ceil(total / limitNum)
      
      console.log(`✅ Found ${projects.length} projects (page ${pageNum}/${totalPages})`)
      
      return {
        projects,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: total,
          itemsPerPage: limitNum,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      }
    } catch (error) {
      console.error('❌ Error finding projects:', error)
      throw error
    }
  }

  // POLÍTICA DE SEGURIDAD: NO SELECT * - Campos específicos
  static async findById(id) {
    const findQuery = `SELECT ${Project.getSelectFields()} FROM projects WHERE id_project = $1`
    
    try {
      const result = await query(findQuery, [id])
      if (result.rows.length === 0) {
        return null
      }
      return new Project(result.rows[0])
    } catch (error) {
      console.error('❌ Error finding project by ID:', error)
      throw error
    }
  }

  // Update project
  async update(updates) {
    const allowedFields = ['name', 'description', 'location', 'status', 'modified_by', 'id_org', 'owner_id']
    const updateFields = []
    const values = []
    let paramCount = 1

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && updates[key] !== undefined) {
        updateFields.push(`${key} = $${paramCount}`)
        values.push(updates[key])
        paramCount++
      }
    })

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update')
    }

    // Always update the updated_at timestamp
    updateFields.push(`updated_at = $${paramCount}`)
    values.push(new Date())
    paramCount++
    
    values.push(this.id_project)

    const updateQuery = `
      UPDATE projects 
      SET ${updateFields.join(', ')}
      WHERE id_project = $${paramCount}
      RETURNING ${Project.getSelectFields()}
    `

    try {
      const result = await query(updateQuery, values)
      if (result.rows.length === 0) {
        throw new Error('Project not found')
      }
      
      // Update current instance
      const updatedData = result.rows[0]
      Object.keys(updatedData).forEach(key => {
        this[key] = updatedData[key]
      })
      
      return this
    } catch (error) {
      console.error('❌ Error updating project:', error)
      throw error
    }
  }

  // Delete project
  static async delete(id) {
    const deleteQuery = `DELETE FROM projects WHERE id_project = $1 RETURNING ${Project.getSelectFields()}`
    
    try {
      const result = await query(deleteQuery, [id])
      if (result.rows.length === 0) {
        throw new Error('Project not found')
      }
      return new Project(result.rows[0])
    } catch (error) {
      console.error('❌ Error deleting project:', error)
      throw error
    }
  }

  // POLÍTICA DE SEGURIDAD: Paginación obligatoria en findByStatus
  static async findByStatus(status, ownerId = null, idOrg = null, page = 1, limit = 10) {
    const pageNum = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10))
    const offset = (pageNum - 1) * limitNum

    let findQuery = `SELECT ${Project.getSelectFields()} FROM projects WHERE status = $1`
    let countQuery = `SELECT COUNT(*) as total FROM projects WHERE status = $1`
    let values = [status]
    let paramCount = 2
    
    if (ownerId) {
      findQuery += ` AND owner_id = $${paramCount}`
      countQuery += ` AND owner_id = $${paramCount}`
      values.push(ownerId)
      paramCount++
    }
    
    if (idOrg) {
      findQuery += ` AND id_org = $${paramCount}`
      countQuery += ` AND id_org = $${paramCount}`
      values.push(idOrg)
      paramCount++
    }
    
    findQuery += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`
    const queryValues = [...values, limitNum, offset]
    
    try {
      const [dataResult, countResult] = await Promise.all([
        query(findQuery, queryValues),
        query(countQuery, values)
      ])
      
      const projects = dataResult.rows.map(row => new Project(row))
      const total = parseInt(countResult.rows[0].total)
      const totalPages = Math.ceil(total / limitNum)
      
      return {
        projects,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: total,
          itemsPerPage: limitNum,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      }
    } catch (error) {
      console.error('❌ Error finding projects by status:', error)
      throw error
    }
  }

  // Get project statistics - CAMPOS ESPECÍFICOS, NO SELECT *
  static async getStats(ownerId = null, idOrg = null) {
    let statsQuery = `
      SELECT 
        status,
        COUNT(*) as count
      FROM projects
    `
    let values = []
    let conditions = []
    let paramCount = 1
    
    if (ownerId) {
      conditions.push(`owner_id = $${paramCount}`)
      values.push(ownerId)
      paramCount++
    }
    
    if (idOrg) {
      conditions.push(`id_org = $${paramCount}`)
      values.push(idOrg)
      paramCount++
    }
    
    if (conditions.length > 0) {
      statsQuery += ' WHERE ' + conditions.join(' AND ')
    }
    
    statsQuery += ' GROUP BY status'
    
    try {
      const result = await query(statsQuery, values)
      
      // Convert to object format
      const stats = {
        total: 0,
        pending_approval: 0,
        approved: 0,
        rejected: 0,
        completed: 0
      }
      
      result.rows.forEach(row => {
        const count = parseInt(row.count)
        stats[row.status] = count
        stats.total += count
      })
      
      return stats
    } catch (error) {
      console.error('❌ Error getting project stats:', error)
      throw error
    }
  }

  // Convert to JSON (excluding sensitive fields if needed)
  toJSON() {
    return {
      id: this.id_project, // Para compatibilidad con frontend
      id_project: this.id_project,
      name: this.name,
      description: this.description,
      location: this.location,
      status: this.status,
      modified_by: this.modified_by,
      created_by: this.created_by,
      id_org: this.id_org,
      owner_id: this.owner_id,
      createdAt: this.created_at, // Para compatibilidad con frontend
      updatedAt: this.updated_at, // Para compatibilidad con frontend
      created_at: this.created_at,
      updated_at: this.updated_at
    }
  }

  // Static method to create from frontend data
  static fromFrontendData(data, userId, orgId = null) {
    return new Project({
      name: data.name,
      description: data.description,
      location: data.location,
      status: 'pending_approval',
      created_by: userId,
      modified_by: userId,
      owner_id: userId,
      id_org: orgId
    })
  }
}