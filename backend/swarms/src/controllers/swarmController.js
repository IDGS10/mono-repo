import models from '../models/index.js'
import { successResponse, errorResponse } from '../utils/responses.js'
import logger from '../utils/logger.js'

const { Swarm, SwarmDevice } = models

// @desc    Create new swarm
// @route   POST /swarms
// @access  Private (requires Bearer token)
export const createSwarm = async (req, res, next) => {
  try {
    const { userId, email, rol } = req.user
    const { name, description, maxDevices, projectId } = req.body

    logger.info(`User ${email} (${rol}) creating swarm: ${name}`)

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

    const swarm = await Swarm.create({
      name,
      description,
      maxDevices,
      requesterId: userId,
      projectId,
      status: 'requested',
    })

    logger.info(`New swarm created: ${swarm.id} by user: ${userId}`)

    return successResponse(
      res,
      { swarm },
      'Swarm created successfully',
      201
    )
  } catch (error) {
    logger.error('Error creating swarm:', error)
    next(error)
  }
}

// @desc    Get all swarms
// @route   GET /swarms
// @access  Private (requires Bearer token)
export const getSwarms = async (req, res, next) => {
  try {
    const { userId, rol } = req.user
    const { status, requesterId, clusterManagerId, projectId } = req.query

    // Build filters
    const where = {}
    if (status) where.status = status
    if (requesterId) where.requesterId = requesterId
    if (clusterManagerId) where.clusterManagerId = clusterManagerId
    if (projectId) where.projectId = projectId

    // Apply role-based filters
    if (rol === 'User') {
      where.requesterId = userId
    }

    const swarms = await Swarm.findAll({
      where,
      include: [
        {
          model: SwarmDevice,
          as: 'devices',
          attributes: ['deviceId', 'role', 'status'],
        },
      ],
      order: [['created_at', 'DESC']],
    })

    return successResponse(res, {
      swarms,
      count: swarms.length,
      userContext: { userId, rol }
    })
  } catch (error) {
    logger.error('Error getting swarms:', error)
    next(error)
  }
}

// @desc    Get swarm by ID
// @route   GET /swarms/:id
// @access  Private (requires Bearer token)
export const getSwarm = async (req, res, next) => {
  try {
    const { userId, rol } = req.user
    const { id } = req.params

    // Check access permissions
    let whereClause = { id }
    if (rol !== 'Owner') {
      whereClause.requesterId = userId
    }

    const swarm = await Swarm.findOne({
      where: whereClause,
      include: [
        {
          model: SwarmDevice,
          as: 'devices',
        },
      ],
    })

    if (!swarm) {
      return errorResponse(res, 'Swarm not found or access denied', 404)
    }

    return successResponse(res, { swarm })
  } catch (error) {
    logger.error('Error getting swarm:', error)
    next(error)
  }
}

// @desc    Update swarm
// @route   PUT /swarms/:id
// @access  Private (requires Bearer token)
export const updateSwarm = async (req, res, next) => {
  try {
    const { userId, email, rol } = req.user
    const { id } = req.params
    const { name, description, maxDevices } = req.body

    const swarm = await Swarm.findByPk(id)

    if (!swarm) {
      return errorResponse(res, 'Swarm not found', 404)
    }

    // Check ownership or permissions
    if (rol !== 'Owner' && swarm.requesterId !== userId) {
      return errorResponse(
        res,
        'You are not authorized to update this swarm',
        403
      )
    }

    // Build allowed updates
    const allowedUpdates = {}
    if (name) allowedUpdates.name = name
    if (description) allowedUpdates.description = description

    // Only allow changing maxDevices if not active
    if (maxDevices && swarm.status !== 'active') {
      if (maxDevices < 1 || maxDevices > 1000) {
        return errorResponse(res, 'maxDevices must be between 1 and 1000', 400)
      }
      allowedUpdates.maxDevices = maxDevices
    }

    await swarm.update(allowedUpdates)

    logger.info(`Swarm updated: ${id} by user: ${userId} (${email})`)

    return successResponse(res, { swarm }, 'Swarm updated successfully')
  } catch (error) {
    logger.error('Error updating swarm:', error)
    next(error)
  }
}

// @desc    Delete swarm
// @route   DELETE /swarms/:id
// @access  Private (requires Bearer token)
export const deleteSwarm = async (req, res, next) => {
  try {
    const { userId, email, rol } = req.user
    const { id } = req.params

    const swarm = await Swarm.findByPk(id)

    if (!swarm) {
      return errorResponse(res, 'Swarm not found', 404)
    }

    // Check ownership or permissions
    if (rol !== 'Owner' && swarm.requesterId !== userId) {
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

    await swarm.destroy()

    logger.info(`Swarm deleted: ${id} by user: ${userId} (${email})`)

    return successResponse(res, null, 'Swarm deleted successfully')
  } catch (error) {
    logger.error('Error deleting swarm:', error)
    next(error)
  }
}

// @desc    Assign swarm to cluster manager
// @route   POST /swarms/:id/assign
// @access  Private (requires Bearer token)
export const assignSwarm = async (req, res, next) => {
  try {
    const { userId, email, rol } = req.user
    const { id } = req.params
    const { clusterManagerId } = req.body

    if (!clusterManagerId) {
      return errorResponse(res, 'clusterManagerId is required', 400)
    }

    // Check permissions
    if (rol === 'User') {
      return errorResponse(res, 'Insufficient permissions to assign swarms', 403)
    }

    const swarm = await Swarm.findByPk(id)

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

    logger.info(`Swarm ${id} assigned to cluster manager: ${clusterManagerId} by ${email}`)

    return successResponse(res, { swarm }, 'Swarm assigned successfully')
  } catch (error) {
    logger.error('Error assigning swarm:', error)
    next(error)
  }
}

// @desc    Activate swarm
// @route   POST /swarms/:id/activate
// @access  Private (requires Bearer token)
export const activateSwarm = async (req, res, next) => {
  try {
    const { userId, email, rol } = req.user
    const { id } = req.params

    // Check permissions
    if (rol === 'User') {
      return errorResponse(res, 'Insufficient permissions to activate swarms', 403)
    }

    const swarm = await Swarm.findByPk(id)

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
    const { userId, email, rol } = req.user
    const { id } = req.params

    const swarm = await Swarm.findByPk(id)

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
    const { userId, email, rol } = req.user
    const { id } = req.params

    const swarm = await Swarm.findByPk(id)

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
    const { userId, email, rol } = req.user
    const { id } = req.params

    // Check permissions
    if (rol === 'User') {
      return errorResponse(res, 'Insufficient permissions to reject swarms', 403)
    }

    const swarm = await Swarm.findByPk(id)

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
    const { userId, rol } = req.user
    const { id } = req.params

    // Check access permissions
    let whereClause = { id }
    if (rol !== 'Owner') {
      whereClause.requesterId = userId
    }

    const swarm = await Swarm.findOne({ where: whereClause })

    if (!swarm) {
      return errorResponse(res, 'Swarm not found or access denied', 404)
    }

    const devices = await SwarmDevice.findActiveBySwarm(id)

    return successResponse(res, {
      swarm: { id: swarm.id, name: swarm.name },
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
    const { userId, email, rol } = req.user
    const { id } = req.params
    const { deviceId, role = 'sensor' } = req.body

    if (!deviceId) {
      return errorResponse(res, 'deviceId is required', 400)
    }

    const swarm = await Swarm.findByPk(id)

    if (!swarm) {
      return errorResponse(res, 'Swarm not found', 404)
    }

    // Check device limit
    const currentDeviceCount = await SwarmDevice.countDevicesInSwarm(id)

    if (currentDeviceCount >= swarm.maxDevices) {
      return errorResponse(
        res,
        `Swarm has reached its limit of ${swarm.maxDevices} devices`,
        400
      )
    }

    // Check if device is already assigned
    const existingAssignment = await SwarmDevice.findOne({
      where: { swarmId: id, deviceId },
    })

    if (existingAssignment && existingAssignment.status !== 'removed') {
      return errorResponse(res, 'Device is already assigned to this swarm', 400)
    }

    const swarmDevice = await SwarmDevice.create({
      swarmId: id,
      deviceId,
      role,
      assignedBy: userId,
    })

    logger.info(`Device ${deviceId} added to swarm ${id} by user ${userId} (${email})`)

    return successResponse(
      res,
      { swarmDevice },
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
    const { userId, email, rol } = req.user
    const { id, deviceId } = req.params

    const swarmDevice = await SwarmDevice.findOne({
      where: { swarmId: id, deviceId },
    })

    if (!swarmDevice) {
      return errorResponse(res, 'Device not found in this swarm', 404)
    }

    if (swarmDevice.status === 'removed') {
      return errorResponse(res, 'Device has already been removed', 400)
    }

    await swarmDevice.remove()

    logger.info(`Device ${deviceId} removed from swarm ${id} by ${email}`)

    return successResponse(res, null, 'Device removed from swarm successfully')
  } catch (error) {
    logger.error('Error removing device from swarm:', error)
    next(error)
  }
}

// @desc    Get swarm statistics
// @route   GET /swarms/:id/stats
// @access  Private (requires Bearer token)
export const getSwarmStats = async (req, res, next) => {
  try {
    const { userId, rol } = req.user
    const { id } = req.params

    // Check access permissions
    let whereClause = { id }
    if (rol !== 'Owner') {
      whereClause.requesterId = userId
    }

    const swarm = await Swarm.findOne({ where: whereClause })

    if (!swarm) {
      return errorResponse(res, 'Swarm not found or access denied', 404)
    }

    const devices = await SwarmDevice.findAll({
      where: { swarmId: id },
    })

    const stats = {
      totalDevices: devices.length,
      activeDevices: devices.filter((d) => d.status === 'active').length,
      assignedDevices: devices.filter((d) => d.status === 'assigned').length,
      inactiveDevices: devices.filter((d) => d.status === 'inactive').length,
      removedDevices: devices.filter((d) => d.status === 'removed').length,
      devicesByRole: devices.reduce((acc, device) => {
        acc[device.role] = (acc[device.role] || 0) + 1
        return acc
      }, {}),
      utilizationPercentage: Math.round(
        (devices.filter((d) => d.status !== 'removed').length /
          swarm.maxDevices) *
          100
      ),
    }

    return successResponse(res, {
      swarm: {
        id: swarm.id,
        name: swarm.name,
        status: swarm.status,
        maxDevices: swarm.maxDevices,
      },
      stats,
    })
  } catch (error) {
    logger.error('Error getting swarm statistics:', error)
    next(error)
  }
}