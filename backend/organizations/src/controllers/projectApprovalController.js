const db = require('../config/database'); 

class ProjectApprovalController {
  
  static async getAll(req, res) {
    try {
      const { status } = req.query;
      
      let query = 'SELECT * FROM project_approvals';
      const params = [];
      
      if (status) {
        query += ' WHERE status = $1';
        params.push(status);
      }
      
      query += ' ORDER BY created_at DESC';
      
      const result = await db.query(query, params);
      
      res.json({
        success: true,
        approvals: result.rows,
        total: result.rows.length
      });
      
    } catch (error) {
      console.error('Error al obtener project approvals:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
  
  static async getById(req, res) {
    try {
      const { id: temporalId } = req.params;
      
      const result = await db.query(
        'SELECT * FROM project_approvals WHERE temporal_id = $1',
        [temporalId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Project approval no encontrado'
        });
      }
      
      res.json({
        success: true,
        approval: result.rows[0]
      });
      
    } catch (error) {
      console.error('Error al obtener project approval:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
  
  static async approve(req, res) {
    try {
      const { id: temporalId } = req.params;
      const { review_notes } = req.body;
      const reviewedBy = req.user.id;
      
      const existingResult = await db.query(
        'SELECT status FROM project_approvals WHERE temporal_id = $1',
        [temporalId]
      );
      
      if (existingResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Project approval no encontrado'
        });
      }
      
      if (existingResult.rows[0].status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: 'Solo se pueden aprobar proyectos pendientes'
        });
      }
      
      const updateResult = await db.query(`
        UPDATE project_approvals 
        SET status = 'approved',
            reviewed_by = $1,
            review_notes = $2,
            reviewed_at = NOW()
        WHERE temporal_id = $3
      `, [reviewedBy, review_notes || '', temporalId]);
      
      res.json({
        success: true,
        message: 'Proyecto aprobado exitosamente'
      });
      
    } catch (error) {
      console.error('Error al aprobar proyecto:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
  
  static async reject(req, res) {
    try {
      const { id: temporalId } = req.params;
      const { review_notes } = req.body;
      const reviewedBy = req.user.id;
      
      if (!review_notes || review_notes.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Las notas de revisión son obligatorias al rechazar'
        });
      }
      
      const existingResult = await db.query(
        'SELECT status FROM project_approvals WHERE temporal_id = $1',
        [temporalId]
      );
      
      if (existingResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Project approval no encontrado'
        });
      }
      
      if (existingResult.rows[0].status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: 'Solo se pueden rechazar proyectos pendientes'
        });
      }
      
      const updateResult = await db.query(`
        UPDATE project_approvals 
        SET status = 'rejected',
            reviewed_by = $1,
            review_notes = $2,
            reviewed_at = NOW()
        WHERE temporal_id = $3
      `, [reviewedBy, review_notes, temporalId]);
      
      res.json({
        success: true,
        message: 'Proyecto rechazado'
      });
      
    } catch (error) {
      console.error('Error al rechazar proyecto:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
}

module.exports = ProjectApprovalController;