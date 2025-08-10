const express = require('express');
const router = express.Router();
const { updateDeviceHandler } = require('../controller/updateDeviceController');
const {registerDeviceHandler} = require('../controller/registerDeviceController')
const {getAllDevicesHandler} = require('../controller/getDeviceController')
const {getDeviceByIdHandler} = require('../controller/getDeviceController');

router.put('/devices/:id', updateDeviceHandler);
router.post('/devices', registerDeviceHandler);
router.get('/devices', getAllDevicesHandler);
router.get('/devices/:id', getDeviceByIdHandler);

module.exports = router;
