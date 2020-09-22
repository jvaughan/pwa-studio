const TargetableESModule = require('./TargetableESModule');

/**
 * Presents a convenient API for consumers to add common transforms to React
 * components and the JSX in them, in a semantic way.
 */
class TargetableReactComponent extends TargetableESModule {
    /**
     * Replace a JSX element with different code.
     *
     * @param {string} jsx - A JSX element matching the one in the source code
     * to modify. Use a JSX opening element or a self-closing element, like
     * '<Route path="/">'.
     * @param {string} replacement - Replacement code as a string. Use the
     * placeholder '%%original%%' to insert the original element in the
     * resulting code.
     */
    replaceJSXElement(element, replacement) {
        return this._addJsxTransform('replaceJSXElement', element, {
            replacement
        });
    }

    /**
     * The AST manipulation methods in this class all depend on the
     * BabelModifyJsxPlugin. This is a convenience method for adding
     * that transform.
     *
     * @private
     * @param {string} method - The function of BabelESModuleUtilitiesPlugin to
     * use.
     * @param {string} element - jsx string matching the element
     * @param {object} params - Object of named parameters for that method.
     */
    _addJsxTransform(method, element, params) {
        return this.addTransform(
            'babel',
            '@magento/pwa-buildpack/lib/WebpackTools/plugins/BabelModifyJSXPlugin/index.js',
            { element, method, params }
        );
    }
}

module.exports = TargetableReactComponent;
