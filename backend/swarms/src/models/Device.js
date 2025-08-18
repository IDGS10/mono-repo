import { DataTypes, Model } from 'sequelize'

class Device extends Model {
  static init(sequelize) {
    return super.init(
      {
        deviceId: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
          allowNull: false,
          field: 'device_id',
        },
        swarmId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'swarm_id',
          references: {
            model: 'device_swarms',
            key: 'swarm_id',
          },
        },
        deviceName: {
          type: DataTypes.STRING(100),
          allowNull: true,
          field: 'device_name',
        },
        macAddress: {
          type: DataTypes.STRING(17),
          allowNull: true,
          field: 'mac_address',
          validate: {
            is: /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/i,
          },
        },
        firmwareVersion: {
          type: DataTypes.STRING(50),
          allowNull: true,
          field: 'firmware_version',
        },
        lastIpAddress: {
          // Cambiado de INET a STRING(50) para coincidir con tu tabla
          type: DataTypes.STRING(50),
          allowNull: true,
          field: 'last_ip_address',
        },
        deviceType: {
          type: DataTypes.STRING(50),
          defaultValue: 'ESP32',
          allowNull: true,
          field: 'device_type',
        },
        location: {
          type: DataTypes.STRING(200),
          allowNull: true,
        },
        installationDate: {
          type: 'TIMESTAMP WITH TIME ZONE',
          defaultValue: DataTypes.NOW,
          allowNull: true,
          field: 'installation_date',
        },
        lastSeen: {
          type: 'TIMESTAMP WITH TIME ZONE',
          defaultValue: DataTypes.NOW,
          allowNull: true,
          field: 'last_seen',
        },
        isOnline: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: true,
          field: 'is_online',
        },
        batteryLevel: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: true,
          field: 'battery_level',
          validate: {
            min: 0,
            max: 100,
          },
        },
        // CAMPOS FALTANTES QUE TIENES EN TU TABLA:
        role: {
          type: DataTypes.STRING(50),
          allowNull: true,
          defaultValue: 'sensor',
        },
        assignedAt: {
          type: DataTypes.DATE, // timestamp without time zone
          defaultValue: DataTypes.NOW,
          allowNull: true,
          field: 'assigned_at',
        },
        assignedBy: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: 'assigned_by',
          // Podrías agregar una referencia si tienes una tabla de usuarios
          // references: {
          //   model: 'users',
          //   key: 'id',
          // },
        },
        removedAt: {
          type: DataTypes.DATE, // timestamp without time zone
          allowNull: true,
          field: 'removed_at',
        },
        status: {
          type: DataTypes.STRING(20),
          defaultValue: 'assigned',
          allowNull: true,
          validate: {
            isIn: [['assigned', 'unassigned', 'maintenance', 'inactive']], // Ajusta según tus estados
          },
        },
      },
      {
        sequelize,
        modelName: 'Device',
        tableName: 'esp32_devices',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        underscored: true,
      }
    )
  }

  static associate(models) {
    this.belongsTo(models.Swarm, {
      foreignKey: 'swarmId',
      as: 'swarm',
      onDelete: 'SET NULL',
    })
    
    // Si tienes una tabla de usuarios, podrías agregar:
    // this.belongsTo(models.User, {
    //   foreignKey: 'assignedBy',
    //   as: 'assignedByUser',
    //   onDelete: 'SET NULL',
    // })
  }

  // Métodos de instancia existentes
  async setOnline() {
    this.isOnline = true
    this.lastSeen = new Date()
    await this.save()
    return this
  }

  async setOffline() {
    this.isOnline = false
    await this.save()
    return this
  }

  async updateBatteryLevel(level) {
    this.batteryLevel = level
    await this.save()
    return this
  }

  async updateLastSeen() {
    this.lastSeen = new Date()
    await this.save()
    return this
  }

  async assignToSwarm(swarmId) {
    this.swarmId = swarmId
    await this.save()
    return this
  }

  async removeFromSwarm() {
    this.swarmId = null
    await this.save()
    return this
  }

  // NUEVOS MÉTODOS PARA LOS CAMPOS AGREGADOS:
  async assignDevice(assignedBy, role = 'sensor') {
    this.status = 'assigned'
    this.assignedBy = assignedBy
    this.assignedAt = new Date()
    this.role = role
    this.removedAt = null
    await this.save()
    return this
  }

  async removeDevice() {
    this.status = 'unassigned'
    this.removedAt = new Date()
    await this.save()
    return this
  }

  async setMaintenance() {
    this.status = 'maintenance'
    await this.save()
    return this
  }

  async setActive() {
    this.status = 'assigned'
    await this.save()
    return this
  }

  // Métodos estáticos existentes
  static async findOnline() {
    return await this.findAll({
      where: { isOnline: true },
    })
  }

  static async findBySwarm(swarmId) {
    return await this.findAll({
      where: { swarmId },
      include: [
        {
          model: this.sequelize.models.Swarm,
          as: 'swarm',
        },
      ],
    })
  }

  static async findByDeviceType(deviceType) {
    return await this.findAll({
      where: { deviceType },
    })
  }

  static async findLowBattery(threshold = 20) {
    return await this.findAll({
      where: {
        batteryLevel: {
          [this.sequelize.Sequelize.Op.lt]: threshold,
        },
      },
    })
  }

  static async findOfflineDevices(hoursThreshold = 24) {
    const thresholdDate = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000)
    return await this.findAll({
      where: {
        [this.sequelize.Sequelize.Op.or]: [
          { isOnline: false },
          {
            lastSeen: {
              [this.sequelize.Sequelize.Op.lt]: thresholdDate,
            },
          },
        ],
      },
    })
  }

  // NUEVOS MÉTODOS ESTÁTICOS PARA LOS CAMPOS AGREGADOS:
  static async findByStatus(status) {
    return await this.findAll({
      where: { status },
    })
  }

  static async findByRole(role) {
    return await this.findAll({
      where: { role },
    })
  }

  static async findAssignedBy(userId) {
    return await this.findAll({
      where: { assignedBy: userId },
    })
  }

  static async findRemovedDevices() {
    return await this.findAll({
      where: {
        removedAt: {
          [this.sequelize.Sequelize.Op.ne]: null,
        },
      },
    })
  }

  // Método para heartbeat actualizado
  async heartbeat(batteryLevel = null, ipAddress = null) {
    this.isOnline = true
    this.lastSeen = new Date()
    
    if (batteryLevel !== null) {
      this.batteryLevel = batteryLevel
    }
    
    if (ipAddress !== null) {
      this.lastIpAddress = ipAddress
    }
    
    await this.save()
    return this
  }
}

export default Device