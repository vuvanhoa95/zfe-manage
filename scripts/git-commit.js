const { execSync } = require('child_process');
try {
    console.log(execSync('git rm --cached prisma/prisma/dev-CIC-PC.db', { encoding: 'utf-8' }));
} catch(e) {
    console.log('Already removed or not tracked:', e.stderr || '');
}
try {
    execSync('git add -A', { encoding: 'utf-8' });
    console.log(execSync('git commit -m "fix: remove db files and simplify vercel config"', { encoding: 'utf-8', timeout: 15000 }));
} catch(e) {
    console.log(e.stdout || '');
    console.error(e.stderr || e.message);
}
