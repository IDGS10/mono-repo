const { updateDevice } = require('../services/updateService');

const updateDeviceHandler = async (req, res) => {
  const id = req.params.id;
  const data = req.body;

  try {
    const updated = await updateDevice(id, data);
    res.status(200).json({ message: 'Device updated', device: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { updateDeviceHandler };
