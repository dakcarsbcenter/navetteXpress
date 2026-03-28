const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./src/components').concat(walk('./src/app'));
let count = 0;

const spinnerRegexes = [
    /<div className=\"animate-spin rounded-full [^\"]*\"\s+style=\{[^\}]*\}>\s*<\/div>/g,
    /<div className=\"animate-spin rounded-full [^\"]*\"\s*>\s*<\/div>/g,
    /<div className=\"w-12 h-12 border-2 border-[^\"]* border-t-transparent rounded-full animate-spin[^\"]*\">\s*<\/div>/g,
    /<div className=\"relative w-16 h-16\">[\s\S]*?<Zap size=\{16\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g,
    /<div className=\"w-12 h-12 border-4 border-[^\"]* border-t-transparent rounded-full animate-spin\" \/>/g,
    /<div className=\"animate-spin h-4 w-4 border-2 border-[^\"]* border-t-transparent rounded-full\" \/>/g,
    /<div className="flex items-center justify-center min-h-\[400px\]">\s*<div className="relative w-16 h-16">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/g
];

const replacementBlock = `<div className="flex flex-col items-center gap-4">\n  <div className="text-xl sm:text-2xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gold via-white to-gold animate-pulse"\n       style={{ backgroundImage: 'linear-gradient(to right, var(--color-gold), #ffffff, var(--color-gold))', textTransform: 'uppercase' }}>\n    Navette Xpress\n  </div>\n</div>`;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    spinnerRegexes.forEach((regex) => {
        content = content.replace(regex, replacementBlock);
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated loaders in: ' + file);
        count++;
    }
});

console.log('Total files updated with new loader: ' + count);
