import sequelize from '../config/database.js'
import Swarm from './Swarm.js'
import SwarmDevice from './SwarmDevice.js'

// Initialization
const models = {
  Swarm: Swarm.init(sequelize),
  SwarmDevice: SwarmDevice.init(sequelize),
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
