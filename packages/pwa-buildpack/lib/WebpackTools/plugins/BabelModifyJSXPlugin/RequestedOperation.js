const parserConfig = {
    plugins: ['syntax-jsx']
};
const nonSelfClosing = /([^\/]\s*)>$/;

class RequestedOperation {
    get isMatch() {
        return this._unmatchedAttributes.size === 0;
    }
    constructor(babel, request) {
        this.request = request;
        this.method = request.options.method;
        this.params = request.options.params;

        this._babel = babel;
        this._matcherSource = request.options.element;
        const matcher = (this._matcher = this._getMatcherNode());
        this._matcherName = this._getSource(matcher.openingElement.name);
        this._attributeMap = new Map();
        for (const { name, value } of matcher.openingElement.attributes) {
            this._attributeMap.set(name.name, this._getSource(value));
        }
        this.reset();
    }
    _getMatcherNode() {
        const parsed = this._babel.parseSync(
            // Parser fails if we run it on just an opening element, so we
            // make it a self-closing one if necessary, just for parsing.
            this._matcherSource.replace(nonSelfClosing, '$1/>'),
            parserConfig
        );
        let jsxNode;
        try {
            jsxNode = parsed.program.body[0].expression;
            this._babel.types.assertJSXElement(jsxNode);
        } catch (e) {
            throw new Error(
                `Error in request from "${
                    this.request.requestor
                }": Provided "element" is not a valid JSX Element: ${
                    this._matcherSource
                }`
            );
        }
        return jsxNode;
    }
    _getSource(node) {
        return this._matcherSource.slice(node.start, node.end);
    }
    matchesElementName(elementName) {
        return elementName === this._matcherName;
    }
    addAttributeMatch(path) {
        const attributeName = path.node.name.name;
        const expected = this._unmatchedAttributes.get(attributeName);
        if (!expected) {
            return; // neither a match nor a rejection
        }
        const actual = path.get('value').getSource();
        if (expected === actual) {
            this._unmatchedAttributes.delete(attributeName);
        } else {
            throw new Error(
                `Mismatched attribute:\nExpected: ${expected}\nActual: ${actual}`
            );
        }
    }
    reset() {
        this._unmatchedAttributes = new Map(this._attributeMap);
    }
}

module.exports = RequestedOperation;
