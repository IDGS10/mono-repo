import { DataTypes, Model } from 'sequelize'

class Swarm extends Model {
  static init(sequelize) {
    return super.init(
      {
        swarmId: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
          allowNull: false,
          field: 'swarm_id',
        },
        swarmName: {
          type: DataTypes.STRING(100),
          allowNull: true,
          field: 'swarm_name',
          validate: {
            len: [1, 100],
          },
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        maxDevices: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: 'max_devices',
          validate: {
            min: 1,
            max: 1000,
          },
        },
        requesterId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: 'requester_id',
        },
        projectId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: 'project_id',
        },
        clusterManagerId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: 'cluster_manager_id',
        },
        status: {
          type: DataTypes.STRING(20),
          defaultValue: 'requested',
          allowNull: true,
          validate: {
            isIn: [['requested', 'assigned', 'active', 'paused', 'completed', 'rejected']],
          },
        },
        // NUEVO CAMPO: MACs solicitadas
        requestedMacs: {
          type: DataTypes.JSONB,
          allowNull: true,
          field: 'requested_macs',
          validate: {
            isValidMacsArray(value) {
              if (value !== null && value !== undefined) {
                if (!Array.isArray(value)) {
                  throw new Error('requestedMacs must be an array')
                }
                
                // Validar cada MAC address en el array
                const macRegex = /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/i
                for (const macEntry of value) {
                  if (typeof macEntry === 'string') {
                    // Si es solo un string (MAC), validarlo
                    if (!macRegex.test(macEntry)) {
                      throw new Error(`Invalid MAC address format: ${macEntry}`)
                    }
                  } else if (typeof macEntry === 'object' && macEntry !== null) {
                    // Si es un objeto con MAC y metadata
                    if (!macEntry.mac || !macRegex.test(macEntry.mac)) {
                      throw new Error(`Invalid MAC address format in object: ${macEntry.mac}`)
                    }
                  } else {
                    throw new Error('Each MAC entry must be a string or object')
                  }
                }
              }
            }
          }
        },
        assignedAt: {
          type: 'TIMESTAMP WITHOUT TIME ZONE',
          allowNull: true,
          field: 'assigned_at',
        },
        activatedAt: {
          type: 'TIMESTAMP WITHOUT TIME ZONE',
          allowNull: true,
          field: 'activated_at',
        },
        completedAt: {
          type: 'TIMESTAMP WITHOUT TIME ZONE',
          allowNull: true,
          field: 'completed_at',
        },
        lastActivity: {
          type: 'TIMESTAMP WITHOUT TIME ZONE',
          allowNull: true,
          field: 'last_activity',
        },
        location: {
          type: DataTypes.STRING(200),
          allowNull: true,
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
          allowNull: true,
          field: 'is_active',
        },
      },
      {
        sequelize,
        modelName: 'Swarm',
        tableName: 'device_swarms',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        underscored: true,
      }
    )
  }

  static associate(models) {
    this.hasMany(models.Device, {
      foreignKey: 'swarmId',
      as: 'devices',
      onDelete: 'SET NULL',
    })
  }

  // Instance methods existentes
  async assignToClusterManager(clusterManagerId) {
    this.clusterManagerId = clusterManagerId
    this.status = 'assigned'
    this.assignedAt = new Date()
    await this.save()
    return this
  }

  async activate() {
    this.status = 'active'
    this.activatedAt = new Date()
    this.lastActivity = new Date()
    this.isActive = true
    await this.save()
    return this
  }

  async pause() {
    this.status = 'paused'
    await this.save()
    return this
  }

  async complete() {
    this.status = 'completed'
    this.completedAt = new Date()
    this.isActive = false
    await this.save()
    return this
  }

  async reject() {
    this.status = 'rejected'
    this.isActive = false
    await this.save()
    return this
  }

  async updateActivity() {
    this.lastActivity = new Date()
    await this.save()
    return this
  }

  // NUEVOS MÉTODOS para manejar MACs solicitadas
  async addRequestedMac(macAddress, deviceName = null, notes = null) {
    const currentMacs = this.requestedMacs || []
    
    // Verificar si la MAC ya existe
    const macExists = currentMacs.some(entry => {
      return typeof entry === 'string' ? entry === macAddress : entry.mac === macAddress
    })
    
    if (macExists) {
      throw new Error(`MAC address ${macAddress} already exists in requested MACs`)
    }
    
    const newEntry = deviceName || notes ? 
      { mac: macAddress, deviceName, notes, requestedAt: new Date() } : 
      macAddress
    
    this.requestedMacs = [...currentMacs, newEntry]
    await this.save()
    return this
  }

  async removeRequestedMac(macAddress) {
    if (!this.requestedMacs) return this
    
    this.requestedMacs = this.requestedMacs.filter(entry => {
      return typeof entry === 'string' ? entry !== macAddress : entry.mac !== macAddress
    })
    
    await this.save()
    return this
  }

  async updateRequestedMacs(macsArray) {
    this.requestedMacs = macsArray
    await this.save()
    return this
  }

  // Método para obtener las MACs en formato consistente
  getRequestedMacsFormatted() {
    if (!this.requestedMacs) return []
    
    return this.requestedMacs.map(entry => {
      if (typeof entry === 'string') {
        return {
          mac: entry,
          deviceName: null,
          notes: null,
          requestedAt: this.createdAt
        }
      }
      return {
        mac: entry.mac,
        deviceName: entry.deviceName || null,
        notes: entry.notes || null,
        requestedAt: entry.requestedAt || this.createdAt
      }
    })
  }

  // Método para intentar asignar dispositivos basado en las MACs solicitadas
  async tryAssignRequestedDevices() {
    if (!this.requestedMacs || this.requestedMacs.length === 0) {
      return { assigned: [], notFound: [], alreadyAssigned: [], unavailable: [] }
    }

    const results = {
      assigned: [],
      notFound: [],
      alreadyAssigned: [],
      unavailable: [] // Dispositivos que existen pero no están disponibles
    }

    // Obtener las MACs solicitadas
    const requestedMacs = this.requestedMacs.map(entry => 
      typeof entry === 'string' ? entry : entry.mac
    )

    // Buscar dispositivos por MAC
    const Device = this.sequelize.models.Device
    
    for (const macAddress of requestedMacs) {
      try {
        // CORREGIDO: Buscar dispositivo por MAC address
        const device = await Device.findOne({
          where: { macAddress: macAddress }
        })

        if (!device) {
          // El dispositivo con esta MAC no existe en la base de datos
          results.notFound.push({
            mac: macAddress,
            reason: 'Device not found in database'
          })
          continue
        }

        // CORREGIDO: Verificar si el dispositivo ya está asignado a otro swarm
        if (device.swarmId && device.swarmId !== this.swarmId) {
          results.alreadyAssigned.push({
            mac: macAddress,
            deviceId: device.deviceId,
            deviceName: device.deviceName,
            currentSwarmId: device.swarmId,
            reason: 'Already assigned to another swarm'
          })
          continue
        }

        // Si ya está asignado a este mismo swarm, skipear
        if (device.swarmId === this.swarmId) {
          results.assigned.push({
            mac: macAddress,
            deviceId: device.deviceId,
            deviceName: device.deviceName,
            reason: 'Already assigned to this swarm'
          })
          continue
        }

        // CORREGIDO: Verificar si el dispositivo está disponible (no asignado a ningún swarm)
        if (device.swarmId !== null) {
          results.unavailable.push({
            mac: macAddress,
            deviceId: device.deviceId,
            deviceName: device.deviceName,
            currentSwarmId: device.swarmId,
            reason: 'Device is not available'
          })
          continue
        }

        // Verificar si el swarm no está lleno
        const isFull = await this.isFull()
        if (isFull) {
          results.unavailable.push({
            mac: macAddress,
            deviceId: device.deviceId,
            deviceName: device.deviceName,
            reason: 'Swarm is full'
          })
          break // Detener si el swarm está lleno
        }

        // CORREGIDO: Asignar dispositivo disponible al swarm
        await device.assignToSwarm(this.swarmId)
        await device.update({
          role: 'sensor', // Rol por defecto
          status: 'assigned',
          assignedBy: this.clusterManagerId, // Asignado por el cluster manager
          assignedAt: new Date(),
          removedAt: null
        })

        results.assigned.push({
          mac: macAddress,
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          reason: 'Successfully assigned'
        })

      } catch (error) {
        console.error(`Error processing MAC ${macAddress}:`, error)
        results.notFound.push({
          mac: macAddress,
          reason: `Database error: ${error.message}`
        })
      }
    }

    return results
  }

  // Métodos existentes
  async getDeviceCount() {
    return await this.sequelize.models.Device.count({
      where: { swarmId: this.swarmId }
    })
  }

  async isFull() {
    if (!this.maxDevices) return false
    const deviceCount = await this.getDeviceCount()
    return deviceCount >= this.maxDevices
  }

  // Class methods existentes
  static async findByStatus(status) {
    return await this.findAll({
      where: { status },
      include: [
        {
          model: this.sequelize.models.Device,
          as: 'devices',
        },
      ],
    })
  }

  static async findByRequester(requesterId) {
    return await this.findAll({
      where: { requesterId },
      include: [
        {
          model: this.sequelize.models.Device,
          as: 'devices',
        },
      ],
    })
  }

  static async findByProject(projectId) {
    return await this.findAll({
      where: { projectId },
      include: [
        {
          model: this.sequelize.models.Device,
          as: 'devices',
        },
      ],
    })
  }

  static async findActive() {
    return await this.findAll({
      where: { isActive: true },
    })
  }

  static async findByClusterManager(clusterManagerId) {
    return await this.findAll({
      where: { clusterManagerId },
      include: [
        {
          model: this.sequelize.models.Device,
          as: 'devices',
        },
      ],
    })
  }

  // NUEVO: Método para buscar swarms que tienen MACs solicitadas específicas
  static async findByRequestedMac(macAddress) {
    return await this.findAll({
      where: {
        requestedMacs: {
          [this.sequelize.Sequelize.Op.contains]: [macAddress]
        }
      }
    })
  }
}

export default Swarm