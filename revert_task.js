const fs = require('fs');
const glob = require('glob');

function revertTaskAssignee() {
    const files = [
        'lib/validation/task.ts',
        'components/project/TaskTab.tsx',
        'components/project/WorkReportTab.tsx',
        'app/api/projects/[id]/tasks/route.ts',
        'app/api/tasks/[taskId]/route.ts',
        'app/api/projects/[id]/tasks/report/route.ts',
        'app/api/dashboard/work-summary/route.ts',
        'app/api/dev/seed-sample-tasks/route.ts'
    ];

    for (const file of files) {
        if (!fs.existsSync(file)) continue;
        let content = fs.readFileSync(file, 'utf8');

        // General regex for id -> string
        content = content.replace(/assignedToId\s*:/g, 'assignedTo:');
        content = content.replace(/assignedToId\s*\??\s*=/g, 'assignedTo =');
        content = content.replace(/assignedToId\s*\?/g, 'assignedTo?');
        content = content.replace(/assignedToId/g, 'assignedTo');
        
        // Remove 'assignee: { name: string } | null;' or similar from UI types
        content = content.replace(/\s*assignee\??\s*:\s*\{\s*name\s*:\s*string\s*\}\s*\|\s*null\s*;/g, '');
        content = content.replace(/\s*assignee\??\s*:\s*\{\s*select\s*:\s*\{\s*name\s*:\s*boolean\s*\}\s*\};/g, ''); // in prisma selects
        content = content.replace(/\s*assignee\s*:\s*\{\s*select\s*:\s*\{\s*name\s*:\s*true\s*\}\s*\}\s*,/g, '');

        // Revert 'task.assignee?.name ??'
        content = content.replace(/task\.assignee\?\.name \?\? null/g, "task.assignedTo ?? null");
        content = content.replace(/task\.assignee\?\.name \?\? ''/g, "task.assignedTo ?? ''");
        content = content.replace(/task\.assignee\?\.name \|\| ''/g, "task.assignedTo || ''");
        content = content.replace(/task\.assignee\?\.name/g, "task.assignedTo");
        
        content = content.replace(/task\.assignee \? \(/g, "task.assignedTo ? (");
        content = content.replace(/task\.assignee && \(/g, "task.assignedTo && (");
        
        // In WorkReportTab: assignee?.name || 'Chưa phân công'
        content = content.replace(/task\.assignee\?\.name \|\| 'Chưa phân công'/g, "task.assignedTo || 'Chưa phân công'");

        fs.writeFileSync(file, content);
    }
    console.log('Revert script done');
}

revertTaskAssignee();
