async function testUserPermissions() {
  try {
    console.log('🔍 Test de l\'API des permissions utilisateur...\n');
    
    // Simuler une requête vers l'API des permissions
    // Note: Ceci nécessiterait une authentification réelle
    const response = await fetch('http://localhost:3000/api/auth/permissions', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Simulation d'une session (dans un vrai test, il faudrait un cookie de session)
      }
    });
    
    console.log('📊 Status:', response.status);
    
    if (response.ok) {
      const data = await response.text();
      console.log('📄 Response:', data);
      
      try {
        const parsed = JSON.parse(data);
        console.log('\n🎯 Permissions parsed:');
        console.log('Role:', parsed.role);
        console.log('Permissions:', JSON.stringify(parsed.permissions, null, 2));
        
        if (parsed.permissions && parsed.permissions.vehicles) {
          console.log('\n🚗 Permissions véhicules trouvées:', parsed.permissions.vehicles);
        } else {
          console.log('\n❌ Aucune permission véhicules trouvée');
        }
      } catch (e) {
        console.log('⚠️  Réponse non-JSON');
      }
    } else {
      console.log('❌ Erreur API:', response.statusText);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testUserPermissions();