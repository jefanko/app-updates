const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Konfigurasi Firebase Anda (dari file firebase.js sebelumnya)
const firebaseConfig = {
    apiKey: "AIzaSyD_oyYQ6ROmfWwV00hx4hHeAx_LdUdbPU8",
    authDomain: "ai-gantt-chart-app.firebaseapp.com",
    projectId: "ai-gantt-chart-app",
    storageBucket: "ai-gantt-chart-app.firebasestorage.app",
    messagingSenderId: "289096435322",
    appId: "1:289096435322:web:b4a01b3a51108348721dc3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fetchData() {
    console.log('🚀 Mulai mengambil data dari Firebase...');

    const data = {
        users: [
            {
                id: 'user-1',
                email: 'admin@local.app',
                password: 'admin123',
                name: 'Administrator'
            }
        ],
        clients: [],
        projects: [],
        currentUser: null
    };

    try {
        // 1. Fetch Clients
        console.log('📦 Mengambil Clients...');
        const clientsSnapshot = await getDocs(collection(db, "clients"));
        clientsSnapshot.forEach((doc) => {
            data.clients.push({
                id: doc.id,
                ...doc.data(),
                // Convert Timestamp to ISO string if needed
                createdAt: doc.data().createdAt?.toDate?.().toISOString() || new Date().toISOString()
            });
        });
        console.log(`✅ Berhasil mengambil ${data.clients.length} clients.`);

        // 2. Fetch Projects
        console.log('📦 Mengambil Projects...');
        const projectsSnapshot = await getDocs(collection(db, "projects"));
        projectsSnapshot.forEach((doc) => {
            const projectData = doc.data();

            // Sanitize project name (fix corrupt data issue we saw earlier)
            let name = projectData.name;
            if (typeof name !== 'string') {
                if (typeof name === 'object') {
                    name = "Untitled Project (Restored)";
                } else {
                    name = String(name || "Untitled Project");
                }
            }

            data.projects.push({
                id: doc.id,
                ...projectData,
                name: name,
                createdAt: projectData.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
                dueDate: projectData.dueDate || null,
                // Ensure milestones exist
                milestones: projectData.milestones || []
            });
        });
        console.log(`✅ Berhasil mengambil ${data.projects.length} projects.`);

        // 3. Save to file
        const outputPath = path.join(__dirname, 'firebase-export.json');
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

        console.log('\n🎉 SUKSES! Data berhasil disimpan ke:');
        console.log(outputPath);
        console.log('\nLangkah selanjutnya:');
        console.log('1. Buka Aplikasi Electron');
        console.log('2. Login');
        console.log('3. Buka Menu "Settings/Backup" (akan segera dibuat)');
        console.log('4. Import file json ini.');

    } catch (error) {
        console.error('❌ Error mengambil data:', error);
    }
}

fetchData();
