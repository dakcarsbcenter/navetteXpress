const { db } = require('./src/db.ts')
const { users } = require('./src/schema.ts')

async function checkUsers() {
  try {
    console.log('🔍 Vérification des utilisateurs dans la base de données...')
    
    const allUsers = await db.select().from(users)
    
    console.log(`📊 Total d'utilisateurs: ${allUsers.length}`)
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}, Email: ${user.email}, Rôle: ${user.role}, Nom: ${user.name}`)
    })
    
    const drivers = allUsers.filter(user => user.role === 'driver')
    console.log(`🚗 Nombre de chauffeurs: ${drivers.length}`)
    
    if (drivers.length > 0) {
      console.log('🚗 Chauffeurs:')
      drivers.forEach((driver, index) => {
        console.log(`  ${index + 1}. ID: ${driver.id}, Email: ${driver.email}, Nom: ${driver.name}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

checkUsers().then(() => {
  console.log('✅ Vérification terminée')
  process.exit(0)
}).catch(console.error)