#!/usr/bin/env node

/**
 * MAKKO INTELLIGENCE - DEPLOYMENT VERIFICATION SCRIPT
 * Verifies TumaTaxi is ready for production deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🧠 MAKKO INTELLIGENCE - DEPLOYMENT VERIFICATION\n');

const checks = [
  {
    name: 'Next.js App Directory',
    check: () => fs.existsSync('./src/app') && fs.existsSync('./src/app/layout.tsx'),
    fix: 'Ensure src/app directory exists with layout.tsx'
  },
  {
    name: 'Package.json Build Script',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
      return pkg.scripts && pkg.scripts.build === 'next build';
    },
    fix: 'Add "build": "next build" to package.json scripts'
  },
  {
    name: 'Critical API Endpoints',
    check: () => {
      return fs.existsSync('./src/app/api/rides/accept/route.ts') &&
             fs.existsSync('./src/app/api/rides/decline/route.ts') &&
             fs.existsSync('./src/app/api/emergency/share-location/route.ts');
    },
    fix: 'Missing critical API endpoints'
  },
  {
    name: 'Prisma Schema',
    check: () => fs.existsSync('./prisma/schema.prisma'),
    fix: 'Prisma schema.prisma file missing'
  },
  {
    name: 'Environment Template',
    check: () => fs.existsSync('./.env.example'),
    fix: 'Environment template missing'
  },
  {
    name: 'Next.js Config',
    check: () => fs.existsSync('./next.config.js'),
    fix: 'Next.js configuration missing'
  },
  {
    name: 'TypeScript Config',
    check: () => fs.existsSync('./tsconfig.json'),
    fix: 'TypeScript configuration missing'
  },
  {
    name: 'Tailwind Config',
    check: () => fs.existsSync('./tailwind.config.js'),
    fix: 'Tailwind CSS configuration missing'
  }
];

let allPassed = true;

checks.forEach((check, index) => {
  const passed = check.check();
  const status = passed ? '✅' : '❌';
  const number = (index + 1).toString().padStart(2, '0');
  
  console.log(`${status} ${number}. ${check.name}`);
  
  if (!passed) {
    console.log(`   Fix: ${check.fix}`);
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('🎉 ALL CHECKS PASSED - READY FOR DEPLOYMENT!');
  console.log('\n🚀 DEPLOYMENT INSTRUCTIONS:');
  console.log('1. Go to Coolify Dashboard');
  console.log('2. Click "Deploy" or trigger new deployment');
  console.log('3. Monitor build logs for any issues');
  console.log('4. Verify deployment at your domain');
  console.log('\n💡 COOLIFY SETTINGS:');
  console.log('- Base Directory: / (root)');
  console.log('- Build Command: npm run build');
  console.log('- Start Command: npm start');
  console.log('- Port: 3000');
} else {
  console.log('❌ DEPLOYMENT NOT READY - Fix issues above');
  process.exit(1);
}

console.log('\n🧠 MAKKO INTELLIGENCE - Verification Complete');