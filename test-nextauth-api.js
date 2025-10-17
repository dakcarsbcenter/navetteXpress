// Test direct de l'API NextAuth
async function testNextAuthAPI() {
  try {
    console.log('🧪 Test de l\'API NextAuth...\n');
    
    const credentials = {
      email: 'admin@navettehub.com',
      password: 'admin123'
    };
    
    console.log('📧 Email:', credentials.email);
    console.log('🔑 Password:', credentials.password);
    
    // Test de l'endpoint signin
    const response = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: credentials.email,
        password: credentials.password,
        redirect: 'false',
        json: 'true'
      })
    });
    
    console.log('\n📊 Réponse API:');
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers));
    
    const responseText = await response.text();
    console.log('Body:', responseText);
    
    try {
      const responseData = JSON.parse(responseText);
      console.log('Parsed JSON:', responseData);
    } catch (e) {
      console.log('⚠️  Réponse non-JSON');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testNextAuthAPI();