const jwt = require('jsonwebtoken');
const config = require('../config/config');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    
    req.user = user;
    next();
  });
};

const checkOwnerRole = (req, res, next) => {
  if (req.user.role !== 'propietario') {
    return res.status(403).json({ 
      error: 'Solo los propietarios pueden realizar esta acción' 
    });
  }
  next();
};

const checkOrganizationAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const db = require('../config/database');
    const result = await db.query(
      'SELECT id_organization FROM organizations WHERE id_organization = $1 AND owner_id = $2',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(403).json({ 
        error: 'No tienes acceso a esta organización' 
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticateToken,
  checkOwnerRole,
  checkOrganizationAccess
};