const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'artifacts', 'renewal-radar', 'src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(srcDir);
let replacedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('—')) {
        content = content.replace(/—/g, '-');
        fs.writeFileSync(file, content, 'utf8');
        replacedCount++;
        console.log(`Replaced em-dashes in: ${file}`);
    }
});
console.log(`Replaced em-dashes in ${replacedCount} files.`);

// Rewrite not-found.tsx
const notFoundPath = path.join(srcDir, 'pages', 'not-found.tsx');
if (fs.existsSync(notFoundPath)) {
    let notFound = fs.readFileSync(notFoundPath, 'utf8');
    notFound = notFound.replace('Did you forget to add the page to the router?', "The page you're looking for doesn't exist.");
    fs.writeFileSync(notFoundPath, notFound, 'utf8');
    console.log('Rewrote not-found.tsx');
}

// Rewrite info-detail.tsx
const infoDetailPath = path.join(srcDir, 'pages', 'info-detail.tsx');
if (fs.existsSync(infoDetailPath)) {
    let info = fs.readFileSync(infoDetailPath, 'utf8');

    const replacements = [
        [
            `longDesc: "Contract cycles govern modern business, but unmonitored agreements represent massive unseen operational and financial liabilities. DueRadar parses critical notice windows, auto-renew clauses, and termination terms to put you ahead of vendor negotiations."`,
            `longDesc: "Missing a contract renewal can lock you into expensive terms or disrupt essential services. DueRadar tracks your notice windows and auto-renew dates so you can renegotiate or cancel on your own terms."`
        ],
        [
            `impact: "Unscheduled multi-year renewals, standard pricing escalations, and unmitigated service level degradation."`,
            `impact: "Unexpected renewals, price hikes, and being stuck with poor service."`
        ],
        [
            `mitigation: "Establish a strict T-90, T-60, and T-30 calendar cascade. Always auto-assign a fallback manager for contract renewals."`,
            `mitigation: "Set up reminders 30, 60, and 90 days out. Make sure every contract has an owner and a backup."`
        ],
        [
            `longDesc: "Maintaining legal operating status requires constant vigilance over local, state, and national business licenses. Missing a building, health, or environmental permit renewal can trigger immediate operational shutdowns or heavy regulatory penalties."`,
            `longDesc: "Missing a permit renewal can shut down your operations and lead to heavy fines. DueRadar tracks your local and state licenses so you stay compliant."`
        ],
        [
            `impact: "Immediate regulatory shutdowns, stop-work orders, municipal fines, and loss of business license."`,
            `impact: "Fines, stop-work orders, and temporary business closures."`
        ],
        [
            `mitigation: "Integrate permit tracking with county portal API schedules and enforce T-45 automated reminders."`,
            `mitigation: "Track expiration dates and set up automatic reminders 45 days in advance."`
        ],
        [
            `longDesc: "Insurance gaps represent absolute ruin scenarios for growing enterprises. General Liability, D&O, Professional Liability, and Workers' Comp must have continuously active binders with zero overlap or termination windows."`,
            `longDesc: "A lapse in insurance coverage leaves your business exposed. Stay on top of your policies to avoid costly coverage gaps."`
        ],
        [
            `impact: "Voided corporate claims, loss of operational credit lines, client breach of contract, and personal liability."`,
            `impact: "Denied claims, breached contracts, and personal liability."`
        ],
        [
            `mitigation: "Always negotiate renewal quotes at T-45. Keep certified electronic copies of policy declarations ready for instant client dispatch."`,
            `mitigation: "Start comparing renewal quotes 45 days early and keep your policy documents easily accessible."`
        ],
        [
            `longDesc: "Modern businesses operate under complex, overlapping regulatory standard overlays. Keeping SOC2, GDPR, ISO, and standard tax filings perfectly validated prevents massive reputational damage and compliance failures."`,
            `longDesc: "Keeping up with SOC2, GDPR, and tax filings is critical. Track your compliance deadlines to avoid reputational damage and fines."`
        ],
        [
            `impact: "Forfeiture of enterprise SaaS clients, massive data protection authority fines, and SEC audit escalations."`,
            `impact: "Lost clients, expensive fines, and stressful audits."`
        ],
        [
            `mitigation: "Link compliance obligations with continuous control monitoring systems and direct calendar escalations."`,
            `mitigation: "Assign clear ownership for each compliance task and track deadlines visibly."`
        ],
        [
            `longDesc: "A company runs on millions of daily operational cycles. SLA thresholds, vendor payments, technology subscriptions, and hardware maintenance dates keep the enterprise wheels greased and functional."`,
            `longDesc: "Your business runs on daily operational deadlines. DueRadar tracks vendor payments, subscriptions, and SLAs so nothing slips through the cracks."`
        ],
        [
            `impact: "Production SaaS downtime due to expired domain names or API tokens, vendor service suspension, and late fees."`,
            `impact: "Service downtime, late fees, and suspended accounts."`
        ],
        [
            `mitigation: "Consolidate domain registry and cloud subscription alerts into single notification dashboard with auto-escalation paths."`,
            `mitigation: "Keep all your critical operational dates in one centralized dashboard."`
        ],
        [
            `title: "Unowned Exposure & Vulnerabilities"`,
            `title: "Unassigned Risks"`
        ],
        [
            `longDesc: "The greatest risk is the one nobody is watching. DueRadar tracks unowned vulnerabilities, missing check-in cadences, expired domain systems, and orphaned escalations, forcing absolute enterprise accountability."`,
            `longDesc: "A deadline without an owner is a disaster waiting to happen. Find and assign orphaned deadlines before they become problems."`
        ],
        [
            `impact: "Catastrophic blindspots, lost legal options, and operational negligence."`,
            `impact: "Missed critical dates and lack of accountability."`
        ],
        [
            `mitigation: "Run weekly exposure audits. Automatically route any orphan deadlines to default corporate governance officers."`,
            `mitigation: "Review unassigned tasks weekly and assign them to the right team members."`
        ]
    ];

    replacements.forEach(([target, replacement]) => {
        if (!info.includes(target)) {
            console.log("Could not find target string: " + target.substring(0, 50));
        }
        info = info.replace(target, replacement);
    });

    fs.writeFileSync(infoDetailPath, info, 'utf8');
    console.log('Rewrote info-detail.tsx');
}
