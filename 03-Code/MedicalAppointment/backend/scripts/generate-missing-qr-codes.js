#!/usr/bin/env node
/**
 * Script to generate QR codes for all existing prescriptions that don't have one
 * Run with: node scripts/generate-missing-qr-codes.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { supabase } = require('../shared/config/database.config');
const qrCodeService = require('../external-api/services/qrCode.service');

async function generateMissingQRCodes() {
  console.log('🔍 Searching for prescriptions without QR codes...\n');

  try {
    // Get all prescriptions
    const { data: prescriptions, error: prescError } = await supabase
      .from('prescriptions')
      .select(`
        id,
        diagnosis,
        created_at,
        prescription_qr_codes (id)
      `)
      .order('created_at', { ascending: false });

    if (prescError) {
      console.error('❌ Error fetching prescriptions:', prescError.message);
      process.exit(1);
    }

    console.log(`📋 Found ${prescriptions.length} total prescriptions\n`);

    // Filter prescriptions without QR codes
    const prescriptionsWithoutQR = prescriptions.filter(
      p => !p.prescription_qr_codes || p.prescription_qr_codes.length === 0
    );

    console.log(`🔧 ${prescriptionsWithoutQR.length} prescriptions need QR codes\n`);

    if (prescriptionsWithoutQR.length === 0) {
      console.log('✅ All prescriptions already have QR codes!');
      process.exit(0);
    }

    let generated = 0;
    let errors = 0;

    for (const prescription of prescriptionsWithoutQR) {
      try {
        console.log(`⏳ Generating QR for prescription ${prescription.id}...`);
        await qrCodeService.generatePrescriptionQR(prescription.id);
        generated++;
        console.log(`   ✅ Done`);
      } catch (error) {
        errors++;
        console.log(`   ❌ Failed: ${error.message}`);
      }
    }

    console.log('\n============================================');
    console.log('📊 SUMMARY');
    console.log('============================================');
    console.log(`✅ QR codes generated: ${generated}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📋 Total processed: ${prescriptionsWithoutQR.length}`);
    console.log('============================================\n');

  } catch (error) {
    console.error('❌ Script error:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

generateMissingQRCodes();
