const { execSync } = require('child_process');
try {
    execSync('git add -A', { encoding: 'utf-8' });
    const result = execSync('git commit -m "fix: remove remaining prisma.outsourcingStaff references (staff-options + seed)"', { encoding: 'utf-8', timeout: 15000 });
    console.log(result);
    const push = execSync('git push origin main', { encoding: 'utf-8', timeout: 30000 });
    console.log(push);
} catch(e) {
    console.log(e.stdout || '');
    console.error(e.stderr || e.message);
}
