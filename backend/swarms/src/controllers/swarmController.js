import models from '../models/index.js'
import { successResponse, errorResponse } from '../utils/responses.js'
import logger from '../utils/logger.js'

const { Swarm, Device } = models

// @desc    Create new swarm (ACTUALIZADO para manejar MACs solicitadas)
// @route   POST /swarms
// @access  Private (requires Bearer token)
export const createSwarm = async (req, res, next) => {
  try {
    const { userId, email, role } = req.user
    const { 
      name, 
      description, 
      maxDevices, 
      projectId, 
      location,
      requestedMacs  // NUEVO: Array de MACs solicitadas
    } = req.body

    logger.info(`User ${email} (${role}) creating swarm: ${name}`)

    // Basic validations
    if (!name || !maxDevices || !projectId) {
      return errorResponse(
        res,
        'Name, maxDevices and projectId are required',
        400
      )
    }

    if (maxDevices < 1 || maxDevices > 1000) {
      return errorResponse(res, 'maxDevices must be between 1 and 1000', 400)
    }

    // NUEVO: Validar MACs si se proporcionan
    if (requestedMacs) {
      if (!Array.isArray(requestedMacs)) {
        return errorResponse(res, 'requestedMacs must be an array', 400)
      }

      if (requestedMacs.length > maxDevices) {
        return errorResponse(
          res, 
          `Cannot request more MACs (${requestedMacs.length}) than maxDevices (${maxDevices})`, 
          400
        )
      }

      // Validar formato de MACs
      const macRegex = /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/i
      for (const macEntry of requestedMacs) {
        const macAddress = typeof macEntry === 'string' ? macEntry : macEntry.mac
        if (!macAddress || !macRegex.test(macAddress)) {
          return errorResponse(
            res, 
            `Invalid MAC address format: ${macAddress}`, 
            400
          )
        }
      }

      // Verificar MACs duplicadas en la solicitud
      const macs = requestedMacs.map(entry => 
        typeof entry === 'string' ? entry : entry.mac
      )
      const uniqueMacs = new Set(macs)
      if (uniqueMacs.size !== macs.length) {
        return errorResponse(res, 'Duplicate MAC addresses in request', 400)
      }
    }

    const swarmData = {
      swarmName: name,
      description,
      maxDevices,
      requesterId: userId,
      projectId,
      location,
      status: 'requested',
    }

    // NUEVO: Agregar MACs solicitadas si se proporcionan
    if (requestedMacs && requestedMacs.length > 0) {
      // Formatear las MACs con metadata adicional
      swarmData.requestedMacs = requestedMacs.map(entry => {
        if (typeof entry === 'string') {
          return entry
        } else {
          return {
            mac: entry.mac,
            deviceName: entry.deviceName || null,
            notes: entry.notes || null,
            requestedAt: new Date()
          }
        }
      })
    }

    const swarm = await Swarm.create(swarmData)

    logger.info(`New swarm created: ${swarm.swarmId} by user: ${userId}${
      requestedMacs ? ` with ${requestedMacs.length} requested MACs` : ''
    }`)

    return successResponse(
      res,
      { 
        swarm,
        requestedMacsCount: requestedMacs ? requestedMacs.length : 0
      },
      'Swarm created successfully',
      201
    )
  } catch (error) {
    logger.error('Error creating swarm:', error)
    next(error)
  }
}

// @desc    Get all swarms (ACTUALIZADO para incluir requested MACs en respuesta)
// @route   GET /swarms
// @access  Private (requires Bearer token)
export const getSwarms = async (req, res, next) => {
  try {
    const { userId, role } = req.user
    const { status, requesterId, clusterManagerId, projectId, location, includeMacs } = req.query

    // Build filters
    const where = {}
    if (status) where.status = status
    if (requesterId) where.requesterId = requesterId
    if (clusterManagerId) where.clusterManagerId = clusterManagerId
    if (projectId) where.projectId = projectId
    if (location) where.location = { [models.Sequelize.Op.iLike]: `%${location}%` }

    // Apply role-based filters
    if (role !== 'Organization' && role !== 'Cluster manager') {
      where.requesterId = userId
    }

    // NUEVO: Determinar atributos basado en si se solicitan las MACs
    const attributes = [
      'swarmId', 'swarmName', 'description', 'maxDevices', 
      'requesterId', 'projectId', 'clusterManagerId', 'status',
      'assignedAt', 'activatedAt', 'completedAt', 'lastActivity',
      'location', 'isActive'
    ]

    // Solo incluir requestedMacs si se solicita explícitamente o si el usuario es admin
    if (includeMacs === 'true' || role === 'Organization' || role === 'Cluster manager') {
      attributes.push('requestedMacs')
    }

    const swarms = await Swarm.findAll({
      where,
      attributes,
      include: [
        {
          model: Device,
          as: 'devices',
          attributes: [
            'deviceId', 
            'deviceName', 
            'deviceType', 
            'isOnline', 
            'batteryLevel',
            'role',
            'status',
            'assignedAt',
            'macAddress',
            'firmwareVersion'
          ],
        },
      ],
      order: [['created_at', 'DESC']],
    })

    // NUEVO: Agregar estadísticas de MACs solicitadas
    const swarmsWithMacStats = swarms.map(swarm => {
      const swarmData = swarm.toJSON()
      
      if (swarmData.requestedMacs) {
        swarmData.requestedMacsCount = swarmData.requestedMacs.length
        swarmData.requestedMacsFormatted = swarm.getRequestedMacsFormatted()
      }
      
      return swarmData
    })

    return successResponse(res, {
      swarms: swarmsWithMacStats,
      count: swarms.length,
      userContext: { userId, role }
    })
  } catch (error) {
    logger.error('Error getting swarms:', error)
    next(error)
  }
}

// @desc    Get swarm by ID (ACTUALIZADO para incluir MACs solicitadas)
// @route   GET /swarms/:id
// @access  Private (requires Bearer token)
export const getSwarm = async (req, res, next) => {
  try {
    const { userId, role } = req.user
    const { id } = req.params

    // Check access permissions
    let whereClause = { swarmId: id }
    if (role !== 'Organization' && role !== 'Cluster manager') {
      whereClause.requesterId = userId
    }

    const swarm = await Swarm.findOne({
      where: whereClause,
      include: [
        {
          model: Device,
          as: 'devices',
          attributes: [
            'deviceId',
            'deviceName',
            'deviceType',
            'macAddress',
            'firmwareVersion',
            'lastIpAddress',
            'location',
            'isOnline',
            'batteryLevel',
            'role',
            'status',
            'assignedAt',
            'assignedBy',
            'removedAt',
            'installationDate',
            'lastSeen'
          ],
        },
      ],
    })

    if (!swarm) {
      return errorResponse(res, 'Swarm not found or access denied', 404)
    }

    // NUEVO: Agregar información formateada de MACs solicitadas
    const swarmData = swarm.toJSON()
    if (swarmData.requestedMacs) {
      swarmData.requestedMacsFormatted = swarm.getRequestedMacsFormatted()
      swarmData.requestedMacsCount = swarmData.requestedMacs.length
    }

    return successResponse(res, { swarm: swarmData })
  } catch (error) {
    logger.error('Error getting swarm:', error)
    next(error)
  }
}

// @desc    Update swarm (ACTUALIZADO para manejar MACs solicitadas)
// @route   PUT /swarms/:id
// @access  Private (requires Bearer token)
export const updateSwarm = async (req, res, next) => {
  try {
    const { userId, email, role } = req.user
    const { id } = req.params
    const { 
      name, 
      description, 
      maxDevices, 
      location, 
      requestedMacs  // NUEVO: Permitir actualizar MACs solicitadas
    } = req.body

    const swarm = await Swarm.findOne({ where: { swarmId: id } })

    if (!swarm) {
      return errorResponse(res, 'Swarm not found', 404)
    }

    // Check ownership or permissions
    if (role !== 'Organization' && role !== 'Cluster manager' && swarm.requesterId !== userId) {
      return errorResponse(
        res,
        'You are not authorized to update this swarm',
        403
      )
    }

    // Build allowed updates
    const allowedUpdates = {}
    if (name) allowedUpdates.swarmName = name
    if (description) allowedUpdates.description = description
    if (location) allowedUpdates.location = location

    // Only allow changing maxDevices if not active
    if (maxDevices && swarm.status !== 'active') {
      if (maxDevices < 1 || maxDevices > 1000) {
        return errorResponse(res, 'maxDevices must be between 1 and 1000', 400)
      }
      allowedUpdates.maxDevices = maxDevices
    }

    // NUEVO: Manejar actualización de MACs solicitadas
    if (requestedMacs !== undefined && swarm.status === 'requested') {
      // Solo permitir actualizar MACs si el swarm aún no ha sido asignado
      if (requestedMacs === null) {
        allowedUpdates.requestedMacs = null
      } else if (Array.isArray(requestedMacs)) {
        // Validar MACs
        const macRegex = /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/i
        for (const macEntry of requestedMacs) {
          const macAddress = typeof macEntry === 'string' ? macEntry : macEntry.mac
          if (!macAddress || !macRegex.test(macAddress)) {
            return errorResponse(
              res, 
              `Invalid MAC address format: ${macAddress}`, 
              400
            )
          }
        }

        // Verificar que no exceda maxDevices
        const finalMaxDevices = maxDevices || swarm.maxDevices
        if (requestedMacs.length > finalMaxDevices) {
          return errorResponse(
            res, 
            `Cannot request more MACs (${requestedMacs.length}) than maxDevices (${finalMaxDevices})`, 
            400
          )
        }

        allowedUpdates.requestedMacs = requestedMacs.map(entry => {
          if (typeof entry === 'string') {
            return entry
          } else {
            return {
              mac: entry.mac,
              deviceName: entry.deviceName || null,
              notes: entry.notes || null,
              requestedAt: new Date()
            }
          }
        })
      }
    } else if (requestedMacs !== undefined && swarm.status !== 'requested') {
      return errorResponse(
        res, 
        'Cannot update requested MACs after swarm has been processed', 
        400
      )
    }

    await swarm.update(allowedUpdates)

    logger.info(`Swarm updated: ${id} by user: ${userId} (${email})`)

    return successResponse(res, { swarm }, 'Swarm updated successfully')
  } catch (error) {
    logger.error('Error updating swarm:', error)
    next(error)
  }
}

// @desc    Assign swarm to cluster manager (ACTUALIZADO para manejar asignación automática)
// @route   POST /swarms/:id/assign
// @access  Private (requires Bearer token)
export const assignSwarm = async (req, res, next) => {
  try {
    const { userId, email, role } = req.user
    const { id } = req.params
    const { clusterManagerId, autoAssignDevices = true } = req.body

    if (!clusterManagerId) {
      return errorResponse(res, 'clusterManagerId is required', 400)
    }

    // Check permissions
    if (role === 'Project manager') {
      return errorResponse(res, 'Insufficient permissions to assign swarms', 403)
    }

    const swarm = await Swarm.findOne({ where: { swarmId: id } })

    if (!swarm) {
      return errorResponse(res, 'Swarm not found', 404)
    }

    if (swarm.status !== 'requested') {
      return errorResponse(
        res,
        'Only swarms with "requested" status can be assigned',
        400
      )
    }

    await swarm.assignToClusterManager(clusterManagerId)

    let assignmentResults = null

    // NUEVO: Intentar asignar dispositivos automáticamente basado en las MACs solicitadas
    if (autoAssignDevices && swarm.requestedMacs && swarm.requestedMacs.length > 0) {
      try {
        assignmentResults = await swarm.tryAssignRequestedDevices()
        
        logger.info(`Auto-assignment results for swarm ${id}:`, {
          assigned: assignmentResults.assigned.length,
          notFound: assignmentResults.notFound.length,
          alreadyAssigned: assignmentResults.alreadyAssigned.length,
          unavailable: assignmentResults.unavailable.length
        })

        // Log detalles para debugging
        if (assignmentResults.notFound.length > 0) {
          logger.warn(`Devices not found for swarm ${id}:`, assignmentResults.notFound)
        }
        if (assignmentResults.alreadyAssigned.length > 0) {
          logger.warn(`Devices already assigned for swarm ${id}:`, assignmentResults.alreadyAssigned)
        }
        if (assignmentResults.unavailable.length > 0) {
          logger.warn(`Devices unavailable for swarm ${id}:`, assignmentResults.unavailable)
        }

      } catch (assignmentError) {
        logger.error(`Error during auto-assignment for swarm ${id}:`, assignmentError)
        // No fallar la asignación del swarm por errores en la asignación automática
        assignmentResults = {
          assigned: [],
          notFound: [],
          alreadyAssigned: [],
          unavailable: [],
          error: assignmentError.message
        }
      }
    }

    logger.info(`Swarm ${id} assigned to cluster manager: ${clusterManagerId} by ${email}`)

    return successResponse(res, { 
      swarm,
      autoAssignmentResults: assignmentResults
    }, 'Swarm assigned successfully')
  } catch (error) {
    logger.error('Error assigning swarm:', error)
    next(error)
  }
}

// NUEVO: Endpoint para intentar asignar dispositivos manualmente basado en MACs
// @desc    Try to assign devices based on requested MACs
// @route   POST /swarms/:id/assign-requested-devices
// @access  Private (requires Bearer token)
export const assignRequestedDevices = async (req, res, next) => {
  try {
    const { userId, email, role } = req.user
    const { id } = req.params

    // Check permissions
    if (role === 'Project manager') {
      return errorResponse(res, 'Insufficient permissions to assign devices', 403)
    }

    const swarm = await Swarm.findOne({ where: { swarmId: id } })

    if (!swarm) {
      return errorResponse(res, 'Swarm not found', 404)
    }

    if (!['assigned', 'active'].includes(swarm.status)) {
      return errorResponse(
        res,
        'Swarm must be assigned or active to assign devices',
        400
      )
    }

    if (!swarm.requestedMacs || swarm.requestedMacs.length === 0) {
      return errorResponse(res, 'No requested MACs found for this swarm', 400)
    }

    const results = await swarm.tryAssignRequestedDevices()

    logger.info(`Manual device assignment for swarm ${id} by ${email}:`, results)

    return successResponse(res, {
      swarm: {
        swarmId: swarm.swarmId,
        swarmName: swarm.swarmName,
        status: swarm.status
      },
      assignmentResults: results
    }, 'Device assignment completed')

  } catch (error) {
    logger.error('Error assigning requested devices:', error)
    next(error)
  }
}

// NUEVO: Endpoint para obtener el estado de las MACs solicitadas
// @desc    Get status of requested MACs
// @route   GET /swarms/:id/requested-macs-status
// @access  Private (requires Bearer token)
export const getRequestedMacsStatus = async (req, res, next) => {
  try {
    const { userId, role } = req.user
    const { id } = req.params

    const swarm = await Swarm.findOne({ where: { swarmId: id } })

    if (!swarm) {
      return errorResponse(res, 'Swarm not found', 404)
    }

    // Verificar permisos
    if (role !== 'Organization' && role !== 'Cluster manager' && swarm.requesterId !== userId) {
      return errorResponse(res, 'Access denied', 403)
    }

    if (!swarm.requestedMacs || swarm.requestedMacs.length === 0) {
      return successResponse(res, {
        swarm: {
          swarmId: swarm.swarmId,
          swarmName: swarm.swarmName,
          status: swarm.status
        },
        requestedMacs: [],
        macsStatus: {
          total: 0,
          assigned: 0,
          available: 0,
          notFound: 0,
          assignedElsewhere: 0
        }
      })
    }

    // Obtener las MACs solicitadas y verificar su estado
    const requestedMacsFormatted = swarm.getRequestedMacsFormatted()
    const macsStatus = {
      total: requestedMacsFormatted.length,
      assigned: 0,
      available: 0,
      notFound: 0,
      assignedElsewhere: 0
    }

    const macsDetails = []

    for (const macEntry of requestedMacsFormatted) {
      const device = await Device.findOne({
        where: { macAddress: macEntry.mac }
      })

      if (!device) {
        // El dispositivo con esta MAC no existe en la base de datos
        macsStatus.notFound++
        macsDetails.push({
          ...macEntry,
          status: 'not_found',
          deviceId: null,
          deviceName: null,
          currentSwarmId: null,
          reason: 'Device not found in database'
        })
      } else if (device.swarmId === swarm.swarmId) {
        // Ya está asignado a este swarm
        macsStatus.assigned++
        macsDetails.push({
          ...macEntry,
          status: 'assigned_to_this_swarm',
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          currentSwarmId: device.swarmId,
          deviceStatus: device.status,
          isOnline: device.isOnline,
          batteryLevel: device.batteryLevel
        })
      } else if (device.swarmId && device.swarmId !== swarm.swarmId) {
        // Está asignado a otro swarm
        macsStatus.assignedElsewhere++
        macsDetails.push({
          ...macEntry,
          status: 'assigned_elsewhere',
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          currentSwarmId: device.swarmId,
          reason: 'Already assigned to another swarm'
        })
      } else {
        // Dispositivo disponible (no asignado a ningún swarm)
        macsStatus.available++
        macsDetails.push({
          ...macEntry,
          status: 'available',
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          currentSwarmId: null,
          deviceStatus: device.status,
          isOnline: device.isOnline,
          batteryLevel: device.batteryLevel
        })
      }
    }

    return successResponse(res, {
      swarm: {
        swarmId: swarm.swarmId,
        swarmName: swarm.swarmName,
        status: swarm.status
      },
      requestedMacs: macsDetails,
      macsStatus
    })

  } catch (error) {
    logger.error('Error getting requested MACs status:', error)
    next(error)
  }
}

// Métodos existentes continuados...

// @desc    Activate swarm
// @route   POST /swarms/:id/activate
// @access  Private (requires Bearer token)
export const activateSwarm = async (req, res, next) => {
  try {
    const { userId, email, role } = req.user
    const { id } = req.params

    // Check permissions
    if (role === 'Project manager') {
      return errorResponse(res, 'Insufficient permissions to activate swarms', 403)
    }

    const swarm = await Swarm.findOne({ where: { swarmId: id } })

    if (!swarm) {
      return errorResponse(res, 'Swarm not found', 404)
    }

    if (swarm.status !== 'assigned') {
      return errorResponse(
        res,
        'Only swarms with "assigned" status can be activated',
        400
      )
    }

    await swarm.activate()

    logger.info(`Swarm activated: ${id} by ${email}`)

    return successResponse(res, { swarm }, 'Swarm activated successfully')
  } catch (error) {
    logger.error('Error activating swarm:', error)
    next(error)
  }
}

// @desc    Pause swarm
// @route   POST /swarms/:id/pause
// @access  Private (requires Bearer token)
export const pauseSwarm = async (req, res, next) => {
  try {
    const { userId, email, role } = req.user
    const { id } = req.params

    const swarm = await Swarm.findOne({ where: { swarmId: id } })

    if (!swarm) {
      return errorResponse(res, 'Swarm not found', 404)
    }

    if (swarm.status !== 'active') {
      return errorResponse(res, 'Only active swarms can be paused', 400)
    }

    await swarm.pause()

    logger.info(`Swarm paused: ${id} by ${email}`)

    return successResponse(res, { swarm }, 'Swarm paused successfully')
  } catch (error) {
    logger.error('Error pausing swarm:', error)
    next(error)
  }
}

// @desc    Complete swarm
// @route   POST /swarms/:id/complete
// @access  Private (requires Bearer token)
export const completeSwarm = async (req, res, next) => {
  try {
    const { userId, email, role } = req.user
    const { id } = req.params

    const swarm = await Swarm.findOne({ where: { swarmId: id } })

    if (!swarm) {
      return errorResponse(res, 'Swarm not found', 404)
    }

    if (!['active', 'paused'].includes(swarm.status)) {
      return errorResponse(
        res,
        'Only active or paused swarms can be completed',
        400
      )
    }

    await swarm.complete()

    logger.info(`Swarm completed: ${id} by ${email}`)

    return successResponse(res, { swarm }, 'Swarm completed successfully')
  } catch (error) {
    logger.error('Error completing swarm:', error)
    next(error)
  }
}

// @desc    Reject swarm
// @route   POST /swarms/:id/reject
// @access  Private (requires Bearer token)
export const rejectSwarm = async (req, res, next) => {
  try {
    const { userId, email, role } = req.user
    const { id } = req.params

    // Check permissions
    if (role === 'Project manager') {
      return errorResponse(res, 'Insufficient permissions to reject swarms', 403)
    }

    const swarm = await Swarm.findOne({ where: { swarmId: id } })

    if (!swarm) {
      return errorResponse(res, 'Swarm not found', 404)
    }

    if (swarm.status !== 'requested') {
      return errorResponse(
        res,
        'Only swarms with "requested" status can be rejected',
        400
      )
    }

    await swarm.reject()

    logger.info(`Swarm rejected: ${id} by ${email}`)

    return successResponse(res, { swarm }, 'Swarm rejected')
  } catch (error) {
    logger.error('Error rejecting swarm:', error)
    next(error)
  }
}

// @desc    Get swarm devices
// @route   GET /swarms/:id/devices
// @access  Private (requires Bearer token)
export const getSwarmDevices = async (req, res, next) => {
  try {
    const { userId, role } = req.user
    const { id } = req.params

    // Check access permissions
    const swarm = await Swarm.findOne({ 
      where: { swarmId: id }
    })

    if (!swarm) {
      return errorResponse(res, 'Swarm not found', 404)
    }

    // Verificar permisos después de encontrar el swarm
    if (role !== 'Organization' && role !== 'Cluster manager' && swarm.requesterId !== userId) {
      return errorResponse(res, 'Access denied', 403)
    }

    // Buscar dispositivos usando el método del modelo
    const devices = await Device.findBySwarm(id)

    return successResponse(res, {
      swarm: { 
        swarmId: swarm.swarmId, 
        swarmName: swarm.swarmName,
        status: swarm.status 
      },
      devices,
      count: devices.length,
    })
  } catch (error) {
    logger.error('Error getting swarm devices:', error)
    next(error)
  }
}

// @desc    Add device to swarm
// @route   POST /swarms/:id/devices
// @access  Private (requires Bearer token)
export const addDeviceToSwarm = async (req, res, next) => {
  try {
    const { userId, email, role } = req.user
    const { id } = req.params
    const { deviceId, macAddress, deviceRole = 'sensor' } = req.body // CORRECCIÓN: Agregar opción de búsqueda por MAC

    // NUEVO: Permitir búsqueda por deviceId o macAddress
    if (!deviceId && !macAddress) {
      return errorResponse(res, 'deviceId or macAddress is required', 400)
    }

    const swarm = await Swarm.findOne({ where: { swarmId: id } })

    if (!swarm) {
      return errorResponse(res, 'Swarm not found', 404)
    }

    // NUEVO: Buscar dispositivo por ID o MAC
    let device
    if (deviceId) {
      device = await Device.findOne({ where: { deviceId } })
    } else {
      device = await Device.findOne({ where: { macAddress } })
    }

    if (!device) {
      return errorResponse(res, `Device not found${macAddress ? ` with MAC: ${macAddress}` : ''}`, 404)
    }

    // Check if device is already assigned to another swarm
    if (device.swarmId) {
      return errorResponse(res, 'Device is already assigned to another swarm', 400)
    }

    // Usar el método del modelo actualizado para verificar si está lleno
    const isFull = await swarm.isFull()
    if (isFull) {
      return errorResponse(
        res,
        `Swarm has reached its limit of ${swarm.maxDevices} devices`,
        400
      )
    }

    // Usar el método del modelo actualizado
    await device.assignToSwarm(id)
    
    // Actualizar también los nuevos campos
    await device.update({
      role: deviceRole,
      status: 'assigned',
      assignedBy: userId,
      assignedAt: new Date(),
      removedAt: null
    })

    logger.info(`Device ${device.deviceId} (MAC: ${device.macAddress}) added to swarm ${id} by user ${userId} (${email})`)

    return successResponse(
      res,
      { device },
      'Device added to swarm successfully',
      201
    )
  } catch (error) {
    logger.error('Error adding device to swarm:', error)
    next(error)
  }
}

// @desc    Remove device from swarm
// @route   DELETE /swarms/:id/devices/:deviceId
// @access  Private (requires Bearer token)
export const removeDeviceFromSwarm = async (req, res, next) => {
  try {
    const { userId, email, role } = req.user
    const { id, deviceId } = req.params

    const device = await Device.findOne({
      where: { swarmId: id, deviceId },
    })

    if (!device) {
      return errorResponse(res, 'Device not found in this swarm', 404)
    }

    // Usar el método del modelo actualizado
    await device.removeFromSwarm()
    
    // Actualizar también los nuevos campos
    await device.update({
      status: 'unassigned',
      removedAt: new Date()
    })

    logger.info(`Device ${deviceId} removed from swarm ${id} by ${email}`)

    return successResponse(res, null, 'Device removed from swarm successfully')
  } catch (error) {
    logger.error('Error removing device from swarm:', error)
    next(error)
  }
}

// @desc    Get swarm statistics (ACTUALIZADO con estadísticas de MACs)
// @route   GET /swarms/:id/stats
// @access  Private (requires Bearer token)
export const getSwarmStats = async (req, res, next) => {
  try {
    const { userId, role } = req.user
    const { id } = req.params

    // Verificar permisos correctamente
    const swarm = await Swarm.findOne({ where: { swarmId: id } })

    if (!swarm) {
      return errorResponse(res, 'Swarm not found', 404)
    }

    // Verificar permisos después de encontrar el swarm
    if (role !== 'Organization' && role !== 'Cluster manager' && swarm.requesterId !== userId) {
      return errorResponse(res, 'Access denied', 403)
    }

    const devices = await Device.findAll({
      where: { swarmId: id },
    })

    // Estadísticas mejoradas con los nuevos campos
    const stats = {
      totalDevices: devices.length,
      onlineDevices: devices.filter((d) => d.isOnline).length,
      offlineDevices: devices.filter((d) => !d.isOnline).length,
      devicesByType: devices.reduce((acc, device) => {
        acc[device.deviceType] = (acc[device.deviceType] || 0) + 1
        return acc
      }, {}),
      devicesByRole: devices.reduce((acc, device) => {
        acc[device.role || 'sensor'] = (acc[device.role || 'sensor'] || 0) + 1
        return acc
      }, {}),
      devicesByStatus: devices.reduce((acc, device) => {
        acc[device.status || 'assigned'] = (acc[device.status || 'assigned'] || 0) + 1
        return acc
      }, {}),
      averageBatteryLevel: devices.length > 0 
        ? Math.round(devices.reduce((sum, d) => sum + (d.batteryLevel || 0), 0) / devices.length)
        : 0,
      lowBatteryDevices: devices.filter((d) => d.batteryLevel && d.batteryLevel < 20).length,
      utilizationPercentage: Math.round((devices.length / swarm.maxDevices) * 100),
      recentlyAssigned: devices.filter((d) => {
        if (!d.assignedAt) return false
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        return new Date(d.assignedAt) > dayAgo
      }).length,
    }

    // NUEVO: Estadísticas de MACs solicitadas
    const macsStats = {
      totalRequested: 0,
      assignedFromRequested: 0,
      pendingAssignment: 0,
      notFound: 0
    }

    if (swarm.requestedMacs && swarm.requestedMacs.length > 0) {
      macsStats.totalRequested = swarm.requestedMacs.length
      
      for (const macEntry of swarm.requestedMacs) {
        const macAddress = typeof macEntry === 'string' ? macEntry : macEntry.mac
        const device = devices.find(d => d.macAddress === macAddress)
        
        if (device) {
          macsStats.assignedFromRequested++
        } else {
          // Verificar si el dispositivo existe pero no está asignado
          const existingDevice = await Device.findOne({ where: { macAddress } })
          if (existingDevice) {
            macsStats.pendingAssignment++
          } else {
            macsStats.notFound++
          }
        }
      }
    }

    return successResponse(res, {
      swarm: {
        swarmId: swarm.swarmId,
        swarmName: swarm.swarmName,
        status: swarm.status,
        maxDevices: swarm.maxDevices,
      },
      stats,
      macsStats
    })
  } catch (error) {
    logger.error('Error getting swarm statistics:', error)
    next(error)
  }
}

// @desc    Delete swarm
// @route   DELETE /swarms/:id
// @access  Private (requires Bearer token)
export const deleteSwarm = async (req, res, next) => {
  try {
    const { userId, email, role } = req.user
    const { id } = req.params

    const swarm = await Swarm.findOne({ where: { swarmId: id } })

    if (!swarm) {
      return errorResponse(res, 'Swarm not found', 404)
    }

    // Check ownership or permissions
    if (role !== 'Organization' && role !== 'Cluster manager' && swarm.requesterId !== userId) {
      return errorResponse(
        res,
        'You are not authorized to delete this swarm',
        403
      )
    }

    // Only allow deletion if not active
    if (swarm.status === 'active') {
      return errorResponse(res, 'Cannot delete an active swarm', 400)
    }

    // Remove devices from swarm first y marcar como removidos
    const devicesInSwarm = await Device.findAll({ where: { swarmId: id } })
    
    for (const device of devicesInSwarm) {
      await device.removeFromSwarm() // Usa el método del modelo
      // También marcar como removido en el nuevo esquema
      await device.update({
        removedAt: new Date(),
        status: 'unassigned'
      })
    }

    await swarm.destroy()

    logger.info(`Swarm deleted: ${id} by user: ${userId} (${email})`)

    return successResponse(res, null, 'Swarm deleted successfully')
  } catch (error) {
    logger.error('Error deleting swarm:', error)
    next(error)
  }
}