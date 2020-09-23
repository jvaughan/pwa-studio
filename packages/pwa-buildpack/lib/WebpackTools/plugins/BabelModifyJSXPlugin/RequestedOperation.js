class RequestedOperation {
    get isMatch() {
        return this._unmatchedAttributes.size === 0;
    }
    constructor(request, parser) {
        this.request = request;
        this.method = request.options.method;
        this.params = request.options.params;
        this._seen = new WeakSet();

        this._parser = parser;
        this._matcherSource = this._parser.normalizeElement(
            request.options.element
        );
        const matcher = (this._matcher = this._parser.parseElement(
            this._matcherSource
        ));
        this._matcherName = this._getSource(matcher.openingElement.name);
        this._attributeMap = new Map();
        for (const { name, value } of matcher.openingElement.attributes) {
            this._attributeMap.set(
                this._getSource(name),
                this._getSource(value)
            );
        }
        this.reset();
    }

    _getSource(node) {
        return this._matcherSource.slice(node.start, node.end);
    }
    shouldTry(path) {
        if (this._seen.has(path.node)) {
            return false;
        }
        this._seen.add(path.node);
        return (
            path.get('name').getSource() === this._matcherName &&
            path.node.attributes.length >= this._attributeMap.size
        );
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
            return false; // explicitly a rejection
        }
    }
    reset() {
        this._unmatchedAttributes = new Map(this._attributeMap);
    }
}

module.exports = RequestedOperation;
