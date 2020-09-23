const delimiters = ['%%', '%%'];
const delimit = str => delimiters[0] + str + delimiters[1];
const rootIdent = 'original';
const rootPlaceholder = delimit(rootIdent);
const placeholderRE = new RegExp(delimit('(.+)'), 'gm');

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
    findIn
};
