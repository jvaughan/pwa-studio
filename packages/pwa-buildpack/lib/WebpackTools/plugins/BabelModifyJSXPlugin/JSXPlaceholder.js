const delimiters = ['{{', '}}'];
const delimit = str => delimiters[0] + str + delimiters[1];
const rootIdent = 'ORIGINAL';
const rootPlaceholder = delimit(rootIdent);
const forProperty = prop => delimit(rootIdent + '.' + prop);

const escapedDelimiters = delimiters.map(d => '\\' + d.split('').join('\\'));
const placeholderRE = new RegExp(
    `${escapedDelimiters[0]}${rootIdent}\\.(\\S*)\\s*${escapedDelimiters[1]}`,
    'gm'
);
function* findIn(templateString) {
    let match;
    if (templateString.includes(rootPlaceholder)) {
        yield [rootPlaceholder, 'ROOT'];
    }
    while ((match = placeholderRE.exec(templateString))) {
        yield match;
    }
}

module.exports = {
    forRoot: rootPlaceholder,
    forProperty,
    findIn
};
