const { execSync } = require('child_process');
try {
    execSync('git add -A', { encoding: 'utf-8' });
    const result = execSync('git commit -m "refactor: remove OutsourcingStaff and cleanup dead code"', { encoding: 'utf-8', timeout: 15000 });
    console.log(result);
} catch(e) {
    console.log(e.stdout || '');
    console.error(e.stderr || e.message);
}
