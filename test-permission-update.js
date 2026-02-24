async function testPermissionUpdate() {
  try {
    console.log('🧪 Test de mise à jour de permission...\n');
    
    // Essayer d'ajouter une permission qui existe déjà pour déclencher l'erreur
    const response = await fetch('http://localhost:3000/api/admin/roles/3/permissions', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test' // Simulation de session
      },
      body: JSON.stringify({
        permissionId: 4, // reviews.manage
        action: 'add'
      })
    });
    
    console.log('📊 Status:', response.status);
    console.log('📋 Headers:', Object.fromEntries(response.headers));
    
    const responseText = await response.text();
    console.log('📄 Response:', responseText);
    
    if (response.status === 200) {
      console.log('✅ Succès ! La correction fonctionne.');
    } else if (response.status === 500) {
      console.log('❌ Erreur 500 - Le problème persiste');
    } else {
      console.log(`⚠️  Status inattendu: ${response.status}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testPermissionUpdate();