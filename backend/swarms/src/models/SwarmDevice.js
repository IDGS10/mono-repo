import { DataTypes, Model } from 'sequelize'

class SwarmDevice extends Model {
  static init(sequelize) {
    return super.init(
      {
        swarmId: {
          type: DataTypes.UUID,
          primaryKey: true,
          allowNull: false,
          field: 'swarm_id',
          references: {
            model: 'swarms',
            key: 'id',
          },
        },
        deviceId: {
          type: DataTypes.UUID,
          primaryKey: true,
          allowNull: false,
          field: 'device_id',
        },
        role: {
          type: DataTypes.STRING(50),
          defaultValue: 'sensor',
          allowNull: false,
          validate: {
            isIn: [['sensor', 'actuator', 'coordinator', 'gateway']],
          },
        },
        assignedBy: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'assigned_by',
        },
        removedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'removed_at',
        },
        status: {
          type: DataTypes.ENUM('assigned', 'active', 'inactive', 'removed'),
          defaultValue: 'assigned',
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: 'SwarmDevice',
        tableName: 'swarm_devices',
        timestamps: true,
        createdAt: 'assigned_at',
        updatedAt: false,
        underscored: true,
      }
    )
  }

  static associate(models) {
    this.belongsTo(models.Swarm, {
      foreignKey: 'swarmId',
      as: 'swarm',
      onDelete: 'CASCADE',
    })
  }

  // Instance methods
  async activate() {
    this.status = 'active'
    await this.save()
    return this
  }

  async deactivate() {
    this.status = 'inactive'
    await this.save()
    return this
  }

  async remove() {
    this.status = 'removed'
    this.removedAt = new Date()
    await this.save()
    return this
  }

  // Static methods
  static async findActiveBySwarm(swarmId) {
    return await this.findAll({
      where: {
        swarmId,
        status: ['assigned', 'active'],
      },
    })
  }

  static async countDevicesInSwarm(swarmId) {
    return await this.count({
      where: {
        swarmId,
        status: ['assigned', 'active'],
      },
    })
  }
}

export default SwarmDevice
