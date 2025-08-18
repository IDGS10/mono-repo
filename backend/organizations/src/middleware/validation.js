const Joi = require('joi');

const organizationSchema = Joi.object({
  name: Joi.string().min(3).max(255).required()
    .messages({
      'string.min': 'El nombre debe tener al menos 3 caracteres',
      'string.max': 'El nombre no debe exceder 255 caracteres',
      'any.required': 'El nombre es requerido'
    }),
    
  description: Joi.string().max(1000).allow(''),
  
  organization_type_id: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'El tipo de organización debe ser un número',
      'any.required': 'El tipo de organización es requerido'
    }),
    
  organization_email: Joi.string().email().max(255).required()
    .messages({
      'string.email': 'El email debe tener un formato válido',
      'any.required': 'El email institucional es requerido'
    }),
    
  phone_number: Joi.string().pattern(/^[\+]?[0-9\-\(\)\s]+$/).max(20).allow(''),
  
  logo_url: Joi.string().uri().max(500).allow('')
});

const invitationSchema = Joi.object({
  organization_id: Joi.number().required(),
  invited_name: Joi.string().min(2).required(),
  invited_email: Joi.string().email().required(),
  invited_role: Joi.string().valid('Propietario', 'Manager', 'Project manager', 'Organization', 'Cluster manager').required()
});

const validateOrganization = (req, res, next) => {
  const { error, value } = organizationSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      error: 'Datos inválidos',
      details: error.details.map(detail => detail.message)
    });
  }
  
  req.validatedData = value;
  next();
};

const validateInvitation = (req, res, next) => {
  const { error, value } = invitationSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      error: 'Datos inválidos de invitación',
      details: error.details.map(detail => detail.message)
    });
  }
  
  req.validatedData = value;
  next();
};

module.exports = {
  validateOrganization,
  validateInvitation
};