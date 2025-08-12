const { getAllDevices, getDeviceById } = require('../services/getDevice');

// GET /devices
const getAllDevicesHandler = async (req, res) => {
  try {
    const devices = await getAllDevices();
    res.status(200).json(devices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /devices/:id
const getDeviceByIdHandler = async (req, res) => {
  try {
    const device = await getDeviceById(req.params.id);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    res.status(200).json(device);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllDevicesHandler,
  getDeviceByIdHandler
};
