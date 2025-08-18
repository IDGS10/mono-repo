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
            is: /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/i, // Formato MAC address
          },
        },
        firmwareVersion: {
          type: DataTypes.STRING(50),
          allowNull: true,
          field: 'firmware_version',
        },
        lastIpAddress: {
          type: DataTypes.INET,
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
      },
      {
        sequelize,
        modelName: 'Device',
        tableName: 'esp32_devices', // Tabla esp32_devices
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
  }

  // Instance methods
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

  // Static methods
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

  // Método para heartbeat (mantener dispositivo vivo)
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