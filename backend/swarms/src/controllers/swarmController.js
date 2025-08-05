import models from '../models/index.js'
import { SECURITY_URL } from '../config/environment.js'
import { successResponse, errorResponse } from '../utils/responses.js'
import logger from '../utils/logger.js'
import axios from 'axios'

const { Swarm, SwarmDevice } = models

// Middleware to validate token and attach user info to req
export const validateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authorization token is required', 401)
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    const response = await axios.get(`${SECURITY_URL}/api/user/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.data.success) {
      return response.data.user
    } else {
      return errorResponse('incorrect token.', 400)
    }
  } catch (error) {
    logger.error('Error fetching user info:', error.message)
    throw new Error('Invalid or expired token')
  }
}

// @desc    Create new swarm
// @route   POST /swarms
// @access  Private (requires Bearer token)
export const createSwarm = async (req, res, next) => {
  try {
    const { name, description, maxDevices, projectId } = req.body

    // Extract token from Authorization header
    const token = extractTokenFromHeaders(req)
    if (!token) {
      return errorResponse(res, 'Authorization token is required', 401)
    }

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

    // Get user information from token
    let userInfo
    try {
      userInfo = await getUserInfo(token)
    } catch (error) {
      return errorResponse(
        res,
        `Invalid or expired token. Error: ${error}`,
        401
      )
    }

    // Extract userId from userInfo (using the actual response structure)
    const requesterId = userInfo.id

    if (!requesterId) {
      return errorResponse(res, 'Could not extract user ID from token', 400)
    }

    // Create swarm
    const swarm = await Swarm.create({
      name,
      description,
      maxDevices,
      requesterId,
      projectId,
      status: 'requested',
    })

    logger.info(`New swarm created: ${swarm.id} by user: ${requesterId}`)

    return successResponse(
      res,
      {
        swarm,
      },
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
// @access  Public
export const getSwarms = async (req, res, next) => {
  try {
    const { status, requesterId, clusterManagerId, projectId } = req.query

    // Build filters
    const where = {}
    if (status) where.status = status
    if (requesterId) where.requesterId = requesterId
    if (clusterManagerId) where.clusterManagerId = clusterManagerId
    if (projectId) where.projectId = projectId

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
    })
  } catch (error) {
    logger.error('Error getting swarms:', error)
    next(error)
  }
}

// @desc    Get swarm by ID
// @route   GET /swarms/:id
// @access  Public
export const getSwarm = async (req, res, next) => {
  try {
    const { id } = req.params

    const swarm = await Swarm.findByPk(id, {
      include: [
        {
          model: SwarmDevice,
          as: 'devices',
        },
      ],
    })

    if (!swarm) {
      return errorResponse(res, 'Swarm not found', 404)
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
    const { id } = req.params
    const { name, description, maxDevices } = req.body

    // Extract token from Authorization header
    const token = extractTokenFromHeaders(req)
    if (!token) {
      return errorResponse(res, 'Authorization token is required', 401)
    }

    // Verify token and get user info
    let userInfo
    try {
      userInfo = await getUserInfo(token)
    } catch (error) {
      return errorResponse(
        res,
        `Invalid or expired token. Error: ${error.message || 'An error occurred'}`,
        401
      )
    }

    const swarm = await Swarm.findByPk(id)

    if (!swarm) {
      return errorResponse(res, 'Swarm not found', 404)
    }

    // Check if user is the owner of the swarm (using actual response structure)
    const userId = userInfo.id
    if (swarm.requesterId !== userId) {
      return errorResponse(
        res,
        'You are not authorized to update this swarm',
        403
      )
    }

    // Only allow updating certain fields based on status
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

    logger.info(`Swarm updated: ${id} by user: ${userId}`)

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
    const { id } = req.params

    // Extract token from Authorization header
    const token = extractTokenFromHeaders(req)
    if (!token) {
      return errorResponse(res, 'Authorization token is required', 401)
    }

    // Verify token and get user info
    let userInfo
    try {
      userInfo = await getUserInfo(token)
    } catch (error) {
      return errorResponse(
        res,
        `Invalid or expired token. Error: ${error}`,
        401
      )
    }

    const swarm = await Swarm.findByPk(id)

    if (!swarm) {
      return errorResponse(res, 'Swarm not found', 404)
    }

    // Check if user is the owner of the swarm (using actual response structure)
    const userId = userInfo.id
    if (swarm.requesterId !== userId) {
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

    logger.info(`Swarm deleted: ${id} by user: ${userId}`)

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
    const { id } = req.params
    const { clusterManagerId } = req.body

    // Extract token from Authorization header
    const token = extractTokenFromHeaders(req)
    if (!token) {
      return errorResponse(res, 'Authorization token is required', 401)
    }

    if (!clusterManagerId) {
      return errorResponse(res, 'clusterManagerId is required', 400)
    }

    // Verify token (for admin/cluster manager permissions)
    try {
      await getUserInfo(token)
    } catch (error) {
      return errorResponse(
        res,
        `Invalid or expired token. Error: ${error.message}`,
        401
      )
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

    logger.info(`Swarm ${id} assigned to cluster manager: ${clusterManagerId}`)

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
    const { id } = req.params

    // Extract token from Authorization header
    const token = extractTokenFromHeaders(req)
    if (!token) {
      return errorResponse(res, 'Authorization token is required', 401)
    }

    // Verify token
    try {
      await getUserInfo(token)
    } catch (error) {
      return errorResponse(
        res,
        `Invalid or expired token. Error: ${error}`,
        401
      )
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

    logger.info(`Swarm activated: ${id}`)

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
    const { id } = req.params

    // Extract token from Authorization header
    const token = extractTokenFromHeaders(req)
    if (!token) {
      return errorResponse(res, 'Authorization token is required', 401)
    }

    // Verify token
    try {
      await getUserInfo(token)
    } catch (error) {
      return errorResponse(
        res,
        `Invalid or expired token. Error: ${error}`,
        401
      )
    }

    const swarm = await Swarm.findByPk(id)

    if (!swarm) {
      return errorResponse(res, 'Swarm not found', 404)
    }

    if (swarm.status !== 'active') {
      return errorResponse(res, 'Only active swarms can be paused', 400)
    }

    await swarm.pause()

    logger.info(`Swarm paused: ${id}`)

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
    const { id } = req.params

    // Extract token from Authorization header
    const token = extractTokenFromHeaders(req)
    if (!token) {
      return errorResponse(res, 'Authorization token is required', 401)
    }

    // Verify token
    try {
      await getUserInfo(token)
    } catch (error) {
      return errorResponse(
        res,
        `Invalid or expired token. Error: ${error.message}`,
        401
      )
    }

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

    logger.info(`Swarm completed: ${id}`)

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
    const { id } = req.params

    // Extract token from Authorization header
    const token = extractTokenFromHeaders(req)
    if (!token) {
      return errorResponse(res, 'Authorization token is required', 401)
    }

    // Verify token
    try {
      await getUserInfo(token)
    } catch (error) {
      return errorResponse(
        res,
        `Invalid or expired token. Error: ${error.message || 'Unknown error'}`,
        401
      )
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

    logger.info(`Swarm rejected: ${id}`)

    return successResponse(res, { swarm }, 'Swarm rejected')
  } catch (error) {
    logger.error('Error rejecting swarm:', error)
    next(error)
  }
}

// @desc    Get swarm devices
// @route   GET /swarms/:id/devices
// @access  Public
export const getSwarmDevices = async (req, res, next) => {
  try {
    const { id } = req.params

    const swarm = await Swarm.findByPk(id)

    if (!swarm) {
      return errorResponse(res, 'Swarm not found', 404)
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
    const { id } = req.params
    const { deviceId, role = 'sensor' } = req.body

    // Extract token from Authorization header
    const token = extractTokenFromHeaders(req)
    if (!token) {
      return errorResponse(res, 'Authorization token is required', 401)
    }

    if (!deviceId) {
      return errorResponse(res, 'deviceId is required', 400)
    }

    // Get user information from token
    let userInfo
    try {
      userInfo = await getUserInfo(token)
    } catch (error) {
      return errorResponse(
        res,
        `Invalid or expired token. Error: ${error.message}`,
        401
      )
    }

    const assignedBy = userInfo.id

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

    // Create assignment
    const swarmDevice = await SwarmDevice.create({
      swarmId: id,
      deviceId,
      role,
      assignedBy,
    })

    logger.info(`Device ${deviceId} added to swarm ${id} by user ${assignedBy}`)

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
    const { id, deviceId } = req.params

    // Extract token from Authorization header
    const token = extractTokenFromHeaders(req)
    if (!token) {
      return errorResponse(res, 'Authorization token is required', 401)
    }

    // Verify token
    try {
      await getUserInfo(token)
    } catch (error) {
      return errorResponse(
        res,
        `Invalid or expired token. Error: ${error.message}`,
        401
      )
    }

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

    logger.info(`Device ${deviceId} removed from swarm ${id}`)

    return successResponse(res, null, 'Device removed from swarm successfully')
  } catch (error) {
    logger.error('Error removing device from swarm:', error)
    next(error)
  }
}

// @desc    Get swarm statistics
// @route   GET /swarms/:id/stats
// @access  Public
export const getSwarmStats = async (req, res, next) => {
  try {
    const { id } = req.params

    const swarm = await Swarm.findByPk(id)

    if (!swarm) {
      return errorResponse(res, 'Swarm not found', 404)
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