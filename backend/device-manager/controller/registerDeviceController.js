const { registerDevice } = require('../services/registerDevice');

const registerDeviceHandler = async (req, res) => {
  try {
    const newDevice = await registerDevice(req.body);
    res.status(201).json({ message: 'Device registered successfully', device: newDevice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { registerDeviceHandler };
