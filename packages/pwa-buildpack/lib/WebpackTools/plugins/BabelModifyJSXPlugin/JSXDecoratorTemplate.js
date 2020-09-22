const babelTemplate = require('@babel/template');
const JSXPlaceholder = require('./JSXPlaceholder');
const instanceCache = new Map();

class JSXDecoratorTemplate {
    static for(templateString) {
        let template = instanceCache.get(templateString);
        if (!template) {
            template = new JSXDecoratorTemplate(templateString);
            instanceCache.set(templateString, template);
        }
        return template;
    }
    constructor(templateString) {
        this._originalString = templateString;

        this._propsByPlaceholder = new Map();
        this._placeholderSet = new Set();
        for (const [placeholder, prop] of JSXPlaceholder.findIn(
            templateString
        )) {
            this._propsByPlaceholder.set(placeholder, prop);
            this._placeholderSet.add(placeholder);
        }
        this._template = babelTemplate.expression(templateString, {
            syntacticPlaceholders: false,
            placeholderPattern: false,
            placeholderWhitelist: this._placeholderSet,
            plugins: ['jsx']
        });
        this._renderCache = new WeakMap();
    }
    render(original) {
        let rendered = this._renderCache.get(original);
        if (!rendered) {
            const context = {};
            for (const [
                placeholder,
                prop
            ] of this._propsByPlaceholder.entries()) {
                context[placeholder] =
                    placeholder === JSXPlaceholder.forRoot
                        ? original
                        : original[prop];
            }
            rendered = this._template(context);
            this._renderCache.set(original, rendered);
        }
        return rendered;
    }
}

module.exports = JSXDecoratorTemplate;
