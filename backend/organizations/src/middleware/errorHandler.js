const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.code === '23505') {
    return res.status(409).json({
      error: 'Recurso duplicado',
      details: 'El email ya está registrado'
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      error: 'Referencia inválida',
      details: 'El tipo de organización no existe'
    });
  }

  if (err.code?.startsWith('42')) {
    return res.status(500).json({
      error: 'Error interno del servidor'
    });
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.message
    });
  }

  res.status(500).json({
    error: 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
};

module.exports = errorHandler;