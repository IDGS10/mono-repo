// ===================================================================
// ARCHIVO: backend/projects/services/swarmService.js
// ===================================================================

import fetch from 'node-fetch'

const SWARMS_API_URL = process.env.SWARMS_API_URL 
const DEVICES_API_URL = process.env.DEVICES_API_URL

// Obtener token JWT del request
const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization
  return authHeader && authHeader.startsWith('Bearer ') ? authHeader : null
}

// Llamada genérica a APIs externas
const callExternalAPI = async (endpoint, options = {}, token = null) => {
  const url = `${endpoint}`
  
  const config = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': token })
    },
    ...options
  }

  console.log(`🔗 Calling External API: ${config.method} ${url}`)
  
  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`External API error: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    console.log(`✅ External API response: ${response.status}`)
    return data
    
  } catch (error) {
    console.error(`❌ External API call failed:`, error.message)
    throw error
  }
}

// Solicitar swarm completo (obtiene devices y crea swarm)
export const requestCompleteSwarm = async (projectId, swarmData, req) => {
  try {
    const token = getTokenFromRequest(req)
    
    // 1. Obtener dispositivos disponibles desde la API de Devices (puerto 5057)
    console.log('🔍 Step 1: Getting available devices from Devices API...')
    const devicesResponse = await callExternalAPI(`${DEVICES_API_URL}/api/devices`, {
      method: 'GET'
    }, token)
    
    console.log('🔍 Raw devices response:', devicesResponse)
    
    // El response puede ser un array directo o estar dentro de un objeto
    let allDevices = []
    if (Array.isArray(devicesResponse)) {
      allDevices = devicesResponse
    } else if (devicesResponse.data && Array.isArray(devicesResponse.data)) {
      allDevices = devicesResponse.data
    } else if (devicesResponse.devices && Array.isArray(devicesResponse.devices)) {
      allDevices = devicesResponse.devices
    } else {
      console.warn('⚠️ Unexpected devices response format:', devicesResponse)
      allDevices = []
    }
    
    // Filtrar solo dispositivos disponibles (status: "Active" y no asignados)
    const availableDevices = allDevices.filter(device => 
      device.status === 'Active' && !device.swarm_id
    )
    
    console.log(`✅ Found ${availableDevices.length} available devices out of ${allDevices.length} total`)
    
    // 2. Seleccionar dispositivos automáticamente si se solicita
    let selectedDevices = []
    if (swarmData.autoSelectDevices && availableDevices.length > 0) {
      const deviceCount = Math.min(swarmData.deviceCount, availableDevices.length)
      selectedDevices = availableDevices
        .slice(0, deviceCount)
        .map(device => device.mac_address) // Usar mac_address del response
      
      console.log(`✅ Auto-selected ${selectedDevices.length} devices:`, selectedDevices)
    }
    
    // 3. Crear el swarm en la API de Swarms (puerto 5052)
    console.log('🔍 Step 2: Creating swarm in Swarms API...')
    const swarmPayload = {
      name: swarmData.swarmName,
      description: swarmData.description || '',
      maxDevices: parseInt(swarmData.deviceCount) || 10,
      projectId: parseInt(projectId),
      requesterId: req.user?.userId || 1,
      location: swarmData.location || null
    }

    const swarmResponse = await callExternalAPI(`${SWARMS_API_URL}/api/swarms`, {
      method: 'POST',
      body: JSON.stringify(swarmPayload)
    }, token)

    const swarmId = swarmResponse.data?.swarm?.swarmId || swarmResponse.swarmId
    console.log(`✅ Swarm created with ID: ${swarmId}`)

    // 4. Asignar dispositivos al swarm si fueron seleccionados
    let assignmentResult = null
    let assignedDevices = []
    
    if (selectedDevices.length > 0 && swarmId) {
      console.log('🔍 Step 3: Assigning devices to swarm...')
      try {
        // Asignar cada dispositivo individualmente o en lote
        const assignmentPayload = {
          swarmId: swarmId,
          devices: selectedDevices.map(macAddress => ({
            macAddress: macAddress,
            action: 'assign'
          }))
        }

        assignmentResult = await callExternalAPI(`${SWARMS_API_URL}/api/swarms/${swarmId}/devices`, {
          method: 'POST',
          body: JSON.stringify(assignmentPayload)
        }, token)
        
        assignedDevices = availableDevices.filter(device => 
          selectedDevices.includes(device.mac_address)
        )
        
        console.log(`✅ Assigned ${selectedDevices.length} devices to swarm ${swarmId}`)
      } catch (assignError) {
        console.warn('⚠️ Device assignment failed, but swarm was created:', assignError.message)
        // El swarm se creó exitosamente, solo falló la asignación
      }
    }

    return {
      swarm: swarmResponse.data?.swarm || swarmResponse,
      devices: assignedDevices,
      selectedDevicesCount: selectedDevices.length,
      availableDevicesCount: availableDevices.length,
      totalDevicesCount: allDevices.length
    }

  } catch (error) {
    console.error('❌ Error creating complete swarm:', error.message)
    throw new Error(`Failed to create swarm: ${error.message}`)
  }
}

// Obtener swarms de un proyecto
export const getProjectSwarmsFromAPI = async (projectId, req) => {
  try {
    const token = getTokenFromRequest(req)
    
    console.log(`🔍 Getting swarms for project ${projectId}`)
    const response = await callExternalAPI(`${SWARMS_API_URL}/api/swarms?projectId=${projectId}`, {
      method: 'GET'
    }, token)

    return response.data?.swarms || response.swarms || response || []

  } catch (error) {
    console.error('❌ Error getting project swarms:', error.message)
    return []
  }
}

// Obtener dispositivos disponibles desde la API de Devices (puerto 5057)
export const getAvailableDevicesFromAPI = async (req) => {
  try {
    const token = getTokenFromRequest(req)
    
    console.log('🔍 Getting all devices from Devices API...')
    const response = await callExternalAPI(`${DEVICES_API_URL}/api/devices`, {
      method: 'GET'
    }, token)

    console.log('🔍 Raw devices response for analysis:', response)

    // El response puede ser un array directo o estar dentro de un objeto
    let allDevices = []
    if (Array.isArray(response)) {
      allDevices = response
    } else if (response.data && Array.isArray(response.data)) {
      allDevices = response.data
    } else if (response.devices && Array.isArray(response.devices)) {
      allDevices = response.devices
    } else {
      console.warn('⚠️ Unexpected devices response format:', response)
      allDevices = []
    }
    
    // Filtrar dispositivos disponibles (Active y sin swarm asignado)
    const availableDevices = allDevices.filter(device => 
      device.status === 'Active' && !device.swarm_id
    )

    console.log(`✅ Found ${availableDevices.length} available devices from ${allDevices.length} total`)
    
    return {
      availableDevices,
      allDevices,
      summary: {
        total: allDevices.length,
        available: availableDevices.length,
        assigned: allDevices.filter(d => d.swarm_id).length,
        offline: allDevices.filter(d => d.status !== 'Active').length
      }
    }

  } catch (error) {
    console.error('❌ Error getting devices from Devices API:', error.message)
    return {
      availableDevices: [],
      allDevices: [],
      summary: { total: 0, available: 0, assigned: 0, offline: 0 }
    }
  }
}