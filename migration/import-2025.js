// Migration script to import 2025 data into Supabase
// Run this in Node.js: node migration/import-2025.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase config
const supabaseUrl = 'https://rzxvstdhltaebwtfnojc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6eHZzdGRobHRhZWJ3dGZub2pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NjcxODAsImV4cCI6MjA4MzM0MzE4MH0.4NFQeEQxMbA2gCP2EG1WWpG6ssK0uXtXs1SZwMgNfo0';

const supabase = createClient(supabaseUrl, supabaseKey);

// Path to 2025 data file (update this if needed)
const dataFilePath = process.argv[2] || path.join(process.env.APPDATA, 'ina-ai-chart', 'ina-ai-chart-db.json');

async function migrateData() {
    console.log('Reading data from:', dataFilePath);

    // Read the JSON file
    let data;
    try {
        const rawData = fs.readFileSync(dataFilePath, 'utf8');
        data = JSON.parse(rawData);
    } catch (error) {
        console.error('Error reading file:', error.message);
        process.exit(1);
    }

    console.log(`Found ${data.clients?.length || 0} clients and ${data.projects?.length || 0} projects`);

    // Import clients
    if (data.clients && data.clients.length > 0) {
        console.log('Importing clients...');

        for (const client of data.clients) {
            const { error } = await supabase
                .from('clients')
                .insert({
                    id: client.id,
                    name: client.name,
                    org: client.org,
                    created_at: client.createdAt || new Date().toISOString(),
                    updated_at: client.updatedAt || null,
                    created_by: client.createdBy || null
                });

            if (error) {
                console.error(`Error inserting client ${client.name}:`, error.message);
            } else {
                console.log(`  ✓ ${client.name}`);
            }
        }
    }

    // Import projects
    if (data.projects && data.projects.length > 0) {
        console.log('Importing projects...');

        for (const project of data.projects) {
            const { error } = await supabase
                .from('projects')
                .insert({
                    id: project.id,
                    name: project.name,
                    location: project.location || null,
                    quotation_number: project.quotationNumber || null,
                    quotation_price: project.quotationPrice || 0,
                    due_date: project.dueDate || null,
                    pic: project.pic || null,
                    tender_status: project.tenderStatus || 'In progress',
                    milestones: project.milestones || [],
                    org: project.org,
                    client_id: project.clientId || null,
                    created_at: project.createdAt || new Date().toISOString(),
                    updated_at: project.updatedAt || null,
                    created_by: project.createdBy || null
                });

            if (error) {
                console.error(`Error inserting project ${project.name}:`, error.message);
            } else {
                console.log(`  ✓ ${project.name}`);
            }
        }
    }

    console.log('\nMigration complete!');
}

migrateData().catch(console.error);
