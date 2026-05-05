#!/usr/bin/env ts-node

/**
 * Security Check Script for RetainVault CRM
 * Run with: npx ts-node scripts/security-check.ts
 * 
 * Checks for common security issues in the codebase
 */

import * as fs from 'fs';
import * as path from 'path';

interface SecurityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  message: string;
  file?: string;
  line?: number;
  fix?: string;
}

const issues: SecurityIssue[] = [];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
};

function log(severity: string, message: string) {
  const colorMap: Record<string, string> = {
    critical: colors.red,
    high: colors.red,
    medium: colors.yellow,
    low: colors.blue,
    info: colors.green,
  };
  const color = colorMap[severity] || colors.reset;
  console.log(`${color}[${severity.toUpperCase()}]${colors.reset} ${message}`);
}

// Check 1: Environment variables
function checkEnvVariables() {
  log('info', 'Checking environment variables...');
  
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  // Check if .env exists
  if (!fs.existsSync(envPath)) {
    issues.push({
      severity: 'medium',
      category: 'Environment',
      message: '.env file not found - ensure environment variables are configured',
      fix: 'Copy .env.example to .env and fill in values',
    });
  }
  
  // Check if .env.example exists
  if (!fs.existsSync(envExamplePath)) {
    issues.push({
      severity: 'low',
      category: 'Environment',
      message: '.env.example not found - helpful for new developers',
      fix: 'Create .env.example with template values',
    });
  }
  
  // Check for exposed secrets in .env
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    
    lines.forEach((line, index) => {
      // Check for NEXT_PUBLIC_ on sensitive vars
      const sensitivePatterns = [
        'SECRET',
        'API_KEY',
        'PASSWORD',
        'TOKEN',
        'PRIVATE',
        'DATABASE_URL',
      ];
      
      if (line.startsWith('NEXT_PUBLIC_')) {
        const varName = line.split('=')[0];
        if (sensitivePatterns.some(p => varName.toUpperCase().includes(p))) {
          issues.push({
            severity: 'critical',
            category: 'Environment',
            message: `Sensitive variable ${varName} is exposed to client via NEXT_PUBLIC_ prefix`,
            file: '.env',
            line: index + 1,
            fix: `Remove NEXT_PUBLIC_ prefix from ${varName}`,
          });
        }
      }
      
      // Check for placeholder values
      const placeholderPatterns = [
        'xxx',
        'your_',
        'replace_',
        'placeholder',
        'changeme',
      ];
      
      const value = line.split('=')[1]?.trim();
      if (value && placeholderPatterns.some(p => value.toLowerCase().includes(p))) {
        issues.push({
          severity: 'medium',
          category: 'Environment',
          message: `Possible placeholder value detected in ${line.split('=')[0]}`,
          file: '.env',
          line: index + 1,
          fix: 'Replace placeholder with actual value',
        });
      }
    });
  }
}

// Check 2: Gitignore
function checkGitignore() {
  log('info', 'Checking .gitignore...');
  
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  
  if (!fs.existsSync(gitignorePath)) {
    issues.push({
      severity: 'critical',
      category: 'Git',
      message: '.gitignore not found - secrets may be committed to version control',
      fix: 'Create .gitignore with .env and other sensitive files',
    });
    return;
  }
  
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
  const requiredEntries = ['.env', 'node_modules', '.next', '*.pem', '*.key'];
  
  requiredEntries.forEach(entry => {
    if (!gitignoreContent.includes(entry)) {
      issues.push({
        severity: entry === '.env' ? 'critical' : 'high',
        category: 'Git',
        message: `.gitignore missing required entry: ${entry}`,
        fix: `Add ${entry} to .gitignore`,
      });
    }
  });
}

// Check 3: Dependency vulnerabilities
async function checkDependencies() {
  log('info', 'Checking for dependency vulnerabilities...');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    issues.push({
      severity: 'medium',
      category: 'Dependencies',
      message: 'package.json not found',
    });
    return;
  }
  
  // Check for known vulnerable packages (simplified check)
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const vulnerablePackages: Record<string, string> = {
    'event-stream': 'Known malicious package',
    'flatmap-stream': 'Known malicious package',
    'lodash': 'Update to latest version for prototype pollution fix',
  };
  
  Object.keys(deps).forEach(pkg => {
    if (vulnerablePackages[pkg]) {
      issues.push({
        severity: 'high',
        category: 'Dependencies',
        message: `Vulnerable package: ${pkg} - ${vulnerablePackages[pkg]}`,
        fix: 'Update or remove the package',
      });
    }
  });
}

// Check 4: Code patterns
function checkCodePatterns() {
  log('info', 'Checking for insecure code patterns...');
  
  const srcDir = path.join(process.cwd(), 'src');
  if (!fs.existsSync(srcDir)) return;
  
  const files = getAllFiles(srcDir, ['.ts', '.tsx', '.js', '.jsx']);
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    const relativePath = path.relative(process.cwd(), file);
    
    lines.forEach((line, index) => {
      // Check for hardcoded secrets
      const secretPatterns = [
        /api[_-]?key\s*=\s*['"][^'"]{20,}['"]/i,
        /secret\s*=\s*['"][^'"]{20,}['"]/i,
        /password\s*=\s*['"][^'"]+['"]/i,
        /token\s*=\s*['"][^'"]{20,}['"]/i,
      ];
      
      secretPatterns.forEach(pattern => {
        if (pattern.test(line) && !line.includes('process.env')) {
          issues.push({
            severity: 'critical',
            category: 'Code',
            message: 'Possible hardcoded secret detected',
            file: relativePath,
            line: index + 1,
            fix: 'Use environment variables instead',
          });
        }
      });
      
      // Check for SQL injection patterns
      if (line.includes('sql`') && line.includes('${') && !line.includes('sql.raw')) {
        // This is likely safe with Drizzle, but flag for review
        // Only flag if it looks like direct string interpolation
        if (line.includes('+') || line.match(/\$\{[^}]*\+/)) {
          issues.push({
            severity: 'high',
            category: 'Code',
            message: 'Possible SQL injection - review string concatenation in SQL',
            file: relativePath,
            line: index + 1,
            fix: 'Use parameterized queries',
          });
        }
      }
      
      // Check for dangerouslySetInnerHTML
      if (line.includes('dangerouslySetInnerHTML')) {
        issues.push({
          severity: 'medium',
          category: 'Code',
          message: 'dangerouslySetInnerHTML used - ensure content is sanitized',
          file: relativePath,
          line: index + 1,
          fix: 'Sanitize HTML before rendering',
        });
      }
      
      // Check for eval
      if (line.includes('eval(') && !line.trim().startsWith('//')) {
        issues.push({
          severity: 'high',
          category: 'Code',
          message: 'eval() used - security risk',
          file: relativePath,
          line: index + 1,
          fix: 'Avoid eval() - use safer alternatives',
        });
      }
    });
  });
}

// Check 5: Security files
function checkSecurityFiles() {
  log('info', 'Checking security configuration files...');
  
  const publicDir = path.join(process.cwd(), 'public');
  
  // Check for security.txt
  if (!fs.existsSync(path.join(publicDir, 'security.txt'))) {
    issues.push({
      severity: 'low',
      category: 'Security',
      message: 'security.txt not found - recommended for responsible disclosure',
      fix: 'Create public/security.txt with contact info',
    });
  }
  
  // Check for robots.txt
  if (!fs.existsSync(path.join(publicDir, 'robots.txt'))) {
    issues.push({
      severity: 'low',
      category: 'Security',
      message: 'robots.txt not found - helps protect sensitive routes',
      fix: 'Create public/robots.txt',
    });
  }
}

// Helper: Get all files with specific extensions
function getAllFiles(dir: string, extensions: string[]): string[] {
  const files: string[] = [];
  
  function traverse(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        if (!['node_modules', '.next', 'dist', 'build'].includes(entry.name)) {
          traverse(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  traverse(dir);
  return files;
}

// Main execution
async function main() {
  console.log('\n');
  console.log('========================================');
  console.log('  RetainVault Security Check');
  console.log('========================================\n');
  
  checkEnvVariables();
  checkGitignore();
  await checkDependencies();
  checkCodePatterns();
  checkSecurityFiles();
  
  // Print results
  console.log('\n');
  console.log('========================================');
  console.log('  Results');
  console.log('========================================\n');
  
  const critical = issues.filter(i => i.severity === 'critical');
  const high = issues.filter(i => i.severity === 'high');
  const medium = issues.filter(i => i.severity === 'medium');
  const low = issues.filter(i => i.severity === 'low');
  
  if (issues.length === 0) {
    log('info', 'No security issues found! Your codebase looks secure.');
  } else {
    [...critical, ...high, ...medium, ...low].forEach(issue => {
      let msg = `${issue.category}: ${issue.message}`;
      if (issue.file) {
        msg += ` (${issue.file}${issue.line ? `:${issue.line}` : ''})`;
      }
      log(issue.severity, msg);
      if (issue.fix) {
        console.log(`         Fix: ${issue.fix}`);
      }
    });
    
    console.log('\n');
    console.log('Summary:');
    console.log(`  Critical: ${critical.length}`);
    console.log(`  High: ${high.length}`);
    console.log(`  Medium: ${medium.length}`);
    console.log(`  Low: ${low.length}`);
    console.log(`  Total: ${issues.length}`);
    
    if (critical.length > 0) {
      console.log(`\n${colors.red}ACTION REQUIRED: Fix critical issues before deploying!${colors.reset}`);
      process.exit(1);
    }
  }
  
  console.log('\n');
}

main().catch(console.error);
