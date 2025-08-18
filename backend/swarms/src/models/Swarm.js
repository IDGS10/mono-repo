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
        tableName: 'device_swarms', // Tabla device_swarms
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

  // Class methods
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
}

export default Swarm