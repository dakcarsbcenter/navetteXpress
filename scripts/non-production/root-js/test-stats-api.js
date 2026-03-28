// Test script pour l'API des statistiques

const testStatsAPI = async () => {
  try {
    console.log('🧪 Test de l\'API des statistiques...\n');
    
    // Test pour différentes périodes
    const periods = ['week', 'month', 'year'];
    
    for (const period of periods) {
      console.log(`📊 Test période: ${period}`);
      
      const response = await fetch(`http://localhost:3000/api/driver/stats?period=${period}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log(`Status: ${response.status}`);
      
      if (data.success) {
        console.log(`✅ Statistiques pour ${period}:`);
        console.log(`- Total courses: ${data.data.totalRides}`);
        console.log(`- Revenus totaux: ${data.data.totalEarnings} FCFA`);
        console.log(`- Note moyenne: ${data.data.averageRating}/5`);
        console.log(`- Courses complétées: ${data.data.completedRides}`);
      } else {
        console.log(`❌ Erreur: ${data.message}`);
      }
      console.log('---');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
};

// Exécuter le test
testStatsAPI();