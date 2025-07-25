import { DataTypes, Model } from 'sequelize'

class Swarm extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING(100),
          allowNull: false,
          validate: {
            notEmpty: true,
            len: [1, 100],
          },
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        maxDevices: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: 'max_devices',
          validate: {
            min: 1,
            max: 1000,
          },
        },
        requesterId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'requester_id',
        },
        clusterManagerId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'cluster_manager_id',
        },
        status: {
          type: DataTypes.ENUM(
            'requested',
            'assigned',
            'active',
            'paused',
            'completed',
            'rejected'
          ),
          defaultValue: 'requested',
          allowNull: false,
        },
        assignedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'assigned_at',
        },
        activatedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'activated_at',
        },
        completedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'completed_at',
        },
        lastActivity: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'last_activity',
        },
      },
      {
        sequelize,
        modelName: 'Swarm',
        tableName: 'swarms',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        underscored: true,
      }
    )
  }

  static associate(models) {
    this.hasMany(models.SwarmDevice, {
      foreignKey: 'swarmId',
      as: 'devices',
      onDelete: 'CASCADE',
    })
  }

  // Instance methods
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
    await this.save()
    return this
  }

  async reject() {
    this.status = 'rejected'
    await this.save()
    return this
  }

  async updateActivity() {
    this.lastActivity = new Date()
    await this.save()
    return this
  }

  // Class methods
  static async findByStatus(status) {
    return await this.findAll({
      where: { status },
      include: [
        {
          model: this.sequelize.models.SwarmDevice,
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
          model: this.sequelize.models.SwarmDevice,
          as: 'devices',
        },
      ],
    })
  }
}

export default Swarm
