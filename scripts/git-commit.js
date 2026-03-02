const { execSync } = require('child_process');
try {
    execSync('git add -A', { encoding: 'utf-8' });
    console.log(execSync('git commit -m "fix: simplify vercel.json to fix deploy internal error"', { encoding: 'utf-8', timeout: 15000 }));
} catch(e) {
    console.log(e.stdout || '');
    console.error(e.stderr || e.message);
}
