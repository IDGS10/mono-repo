import { Router } from 'express'
import {
  createSwarm,
  getSwarms,
  getSwarm,
  updateSwarm,
  deleteSwarm,
  assignSwarm,
  activateSwarm,
  pauseSwarm,
  completeSwarm,
  rejectSwarm,
  getSwarmDevices,
  addDeviceToSwarm,
  removeDeviceFromSwarm,
  getSwarmStats,
} from '../controllers/swarmController.js'

const router = Router()

// Basic CRUD routes
router.post('/', createSwarm)
router.get('/', getSwarms)
router.get('/:id', getSwarm)
router.put('/:id', updateSwarm)
router.delete('/:id', deleteSwarm)

// State management routes
router.post('/:id/assign', assignSwarm)
router.post('/:id/activate', activateSwarm)
router.post('/:id/pause', pauseSwarm)
router.post('/:id/complete', completeSwarm)
router.post('/:id/reject', rejectSwarm)

// Device management routes
router.get('/:id/devices', getSwarmDevices)
router.post('/:id/devices', addDeviceToSwarm)
router.delete('/:id/devices/:deviceId', removeDeviceFromSwarm)

// Statistics routes
router.get('/:id/stats', getSwarmStats)

export default router