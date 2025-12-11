import * as path from 'path';
import * as fs from 'fs';

// Simple .env file parser
function parseEnvFile(filePath: string): Record<string, string> {
  const env: Record<string, string> = {};
  if (!fs.existsSync(filePath)) {
    return env;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    // Parse KEY=VALUE format
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  }

  return env;
}

// Load .env file if it exists
const envPath = path.join(__dirname, '../../.env');
const envFile = parseEnvFile(envPath);

// Merge with process.env (process.env takes precedence)
const allEnv = { ...envFile, ...process.env };

if (!fs.existsSync(envPath)) {
  console.log('⚠️  No .env file found at:', envPath);
  console.log('   Create a .env file based on .env.example\n');
}

console.log('📋 Environment Variables:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`PORT: ${allEnv.PORT || 'not set (default: 3000)'}`);
console.log(
  `MONGODB_URI: ${allEnv.MONGODB_URI || 'not set (default: mongodb://localhost:27017/electronics-buy)'}`,
);
console.log(
  `FRONTEND_URL: ${allEnv.FRONTEND_URL || 'not set (default: http://localhost:5173)'}`,
);

// Show ADMIN_TOKEN value (masked for security)
const adminToken = allEnv.ADMIN_TOKEN;
if (adminToken) {
  const masked = adminToken.length > 4 ? '***' + adminToken.slice(-4) : '***';
  console.log(`ADMIN_TOKEN: ${masked} (length: ${adminToken.length})`);
} else {
  console.log(`ADMIN_TOKEN: ❌ NOT SET (required for admin routes)`);
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (!adminToken) {
  console.log('⚠️  WARNING: ADMIN_TOKEN is not set!');
  console.log('   Admin routes will reject all requests.');
  console.log('   Set ADMIN_TOKEN in your .env file.\n');
} else {
  console.log('✅ ADMIN_TOKEN is set');
  console.log(`   Full value: ${adminToken}`);
}
