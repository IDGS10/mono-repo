class Banner {
  static showBanner() {
    const banner = `
  ╔══════════════════════════════════════════════════════════════╗
  ║                                                              ║
  ║    🏢 SISTEMA DE GESTIÓN DE ENJAMBRES                        ║
  ║                                                              ║
  ║    📋 API REST v1.0.0                                        ║
  ║    🔧 Node.js + Express + Sequelize + PostgreSQL             ║
  ║                                                              ║
  ╚══════════════════════════════════════════════════════════════╝
    `
    console.log(banner)
  }

  static showServerInfo(PORT, environment) {
    const baseUrl = `http://localhost:${PORT}`

    console.log('🚀 SERVIDOR INICIADO CORRECTAMENTE\n')

    console.log('📊 INFORMACIÓN DEL SERVIDOR:')
    console.log(`   🌍 Ambiente:    ${environment || 'development'}`)
    console.log(`   📡 Puerto:      ${PORT}`)
    console.log(`   🔗 URL Base:    ${baseUrl}`)

    console.log('📚 ENDPOINTS PRINCIPALES:')
    console.log(`   ❤️ Health Check:   ${baseUrl}/`)
    console.log(`   👪 Enjambres:      ${baseUrl}/swarms`)

    console.log('💡 COMANDOS ÚTILES:')
    console.log('   🔄 Reiniciar:     npm run dev')
    console.log('   🧪 Pruebas:      npm test')
    console.log('   🛑 Detener:      Ctrl + C\n')

    console.log('🎉 ¡Listo para usar! Abre tu navegador en:', baseUrl)
  }
}

export default Banner
