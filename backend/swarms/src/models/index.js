import sequelize from '../config/database.js'
import Swarm from './Swarm.js'
import Device from './Device.js'

// Initialization
const models = {
  Swarm: Swarm.init(sequelize),
  Device: Device.init(sequelize),
}

// Associations
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models)
  }
})

// Exports
export { sequelize }
export default models