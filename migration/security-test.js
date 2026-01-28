// Security Test for Supabase RLS
// This script simulates an attacker who found the anon key

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rzxvstdhltaebwtfnojc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6eHZzdGRobHRhZWJ3dGZub2pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NjcxODAsImV4cCI6MjA4MzM0MzE4MH0.4NFQeEQxMbA2gCP2EG1WWpG6ssK0uXtXs1SZwMgNfo0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSecurity() {
    console.log('='.repeat(60));
    console.log('🔒 SUPABASE RLS SECURITY TEST');
    console.log('='.repeat(60));
    console.log('\nSimulating attacker with only anon key (no auth)...\n');

    // Test 1: Try to READ clients
    console.log('TEST 1: Read clients (SELECT)');
    const { data: clients, error: readError } = await supabase
        .from('clients')
        .select('*')
        .limit(5);

    if (readError) {
        console.log('  ❌ BLOCKED:', readError.message);
    } else if (clients && clients.length > 0) {
        console.log(`  ⚠️  ALLOWED: Can read ${clients.length} clients`);
    } else {
        console.log('  ✅ Protected: No data returned (empty or RLS blocked)');
    }

    // Test 2: Try to INSERT a fake client
    console.log('\nTEST 2: Insert fake client (INSERT)');
    const { error: insertError } = await supabase
        .from('clients')
        .insert({
            name: 'HACKER_TEST_CLIENT',
            org: 'HACKED'
        });

    if (insertError) {
        console.log('  ✅ BLOCKED:', insertError.message);
    } else {
        console.log('  ❌ VULNERABLE: Insert succeeded!');
        // Clean up
        await supabase.from('clients').delete().eq('name', 'HACKER_TEST_CLIENT');
    }

    // Test 3: Try to UPDATE
    console.log('\nTEST 3: Update existing client (UPDATE)');
    const { error: updateError } = await supabase
        .from('clients')
        .update({ name: 'HACKED_NAME' })
        .eq('org', 'AI')
        .limit(1);

    if (updateError) {
        console.log('  ✅ BLOCKED:', updateError.message);
    } else {
        console.log('  ⚠️  Update command executed (check if data changed)');
    }

    // Test 4: Try to DELETE
    console.log('\nTEST 4: Delete all clients (DELETE)');
    const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // This would delete all

    if (deleteError) {
        console.log('  ✅ BLOCKED:', deleteError.message);
    } else {
        console.log('  ⚠️  Delete command executed (check if data still exists)');
    }

    // Test 5: Verify data still intact
    console.log('\nTEST 5: Verify data integrity');
    const { data: verifyClients, count } = await supabase
        .from('clients')
        .select('*', { count: 'exact' });

    console.log(`  📊 Clients in database: ${count || verifyClients?.length || 0}`);

    console.log('\n' + '='.repeat(60));
    console.log('🔒 SECURITY TEST COMPLETE');
    console.log('='.repeat(60));
    console.log('\nNote: If any operation shows ALLOWED/VULNERABLE,');
    console.log('you may need to tighten your RLS policies.');
}

testSecurity().catch(console.error);
