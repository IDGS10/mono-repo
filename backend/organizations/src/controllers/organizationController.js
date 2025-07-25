const Organization = require('../models/Organization');
const OrganizationType = require('../models/OrganizationType');
const organizationService = require('../services/organizationService');

class OrganizationController {
  static async getDashboard(req, res, next) {
    try {
      const userId = req.user.id;
  
      const organization = await Organization.findByOwnerId(userId);
      
      if (!organization) {
        return res.json({
          hasOrganization: false,
          message: 'No tienes una organización asignada',
          canCreate: req.user.role === 'propietario'
        });
      }
      const dashboardData = await organizationService.getDashboardData(organization.id_organization);
      
      res.json({
        hasOrganization: true,
        organization: dashboardData
      });
    } catch (error) {
      next(error);
    }
  }
  static async getTypes(req, res, next) {
    try {
      const types = await OrganizationType.getAll();
      res.json(types);
    } catch (error) {
      next(error);
    }
  }
  static async create(req, res, next) {
    try {
      const userId = req.user.id;
      const existingOrg = await Organization.findByOwnerId(userId);
      if (existingOrg) {
        return res.status(409).json({
          error: 'Ya tienes una organización asignada'
        });
      }
      const emailExists = await Organization.checkEmailExists(req.validatedData.organization_email);
      if (emailExists) {
        return res.status(409).json({
          error: 'El email institucional ya está registrado'
        });
      }
      const organizationData = {
        ...req.validatedData,
        owner_id: userId,
        created_by_id: userId
      };

      const organization = await Organization.create(organizationData);
      res.status(201).json({
        message: 'Organización creada exitosamente',
        organization
      });
    } catch (error) {
      next(error);
    }
  }
  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      
      const organization = await Organization.findById(id);
      if (!organization) {
        return res.status(404).json({
          error: 'Organización no encontrada'
        });
      }

      res.json(organization);
    } catch (error) {
      next(error);
    }
  }
  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      if (req.validatedData.organization_email) {
        const emailExists = await Organization.checkEmailExists(
          req.validatedData.organization_email,
          id
        );
        if (emailExists) {
          return res.status(409).json({
            error: 'El email institucional ya está registrado'
          });
        }
      }

      const organization = await Organization.update(id, req.validatedData, userId);
      
      if (!organization) {
        return res.status(404).json({
          error: 'Organización no encontrada'
        });
      }

      res.json({
        message: 'Organización actualizada exitosamente',
        organization
      });
    } catch (error) {
      next(error);
    }
  }
  static async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const userId = req.user.id;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          error: 'El campo isActive debe ser true o false'
        });
      }

      const organization = await Organization.updateStatus(id, isActive, userId);
      
      if (!organization) {
        return res.status(404).json({
          error: 'Organización no encontrada'
        });
      }

      res.json({
        message: `Organización ${isActive ? 'activada' : 'desactivada'} exitosamente`,
        organization
      });
    } catch (error) {
      next(error);
    }
  }
  static async getActiveOrganizations(req, res, next) {
    try {
      const query = `
        SELECT 
          o.id_organization,
          o.organization_uuid,
          o.name,
          ot.name as organization_type
        FROM organizations o
        INNER JOIN organization_types ot ON o.organization_type_id = ot.id_type
        WHERE o.isActive = true
        ORDER BY o.name ASC
      `;
      
      const db = require('../config/database');
      const result = await db.query(query);
      
      res.json({
        organizations: result.rows.map(org => ({
          id_organization: org.id_organization,
          organization_uuid: org.organization_uuid,
          name: org.name,
          organization_type: org.organization_type
        }))
      });
    } catch (error) {
      next(error);
    }
  }
  static async getBasicInfo(req, res, next) {
    try {
      const { id } = req.params;
      
      const organization = await Organization.findById(id);
      if (!organization) {
        return res.status(404).json({
          error: 'Organización no encontrada'
        });
      }
      res.json({
        id_organization: organization.id_organization,
        organization_uuid: organization.organization_uuid,
        name: organization.name,
        organization_type: organization.organization_type_name,
        isActive: organization.isActive
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OrganizationController;