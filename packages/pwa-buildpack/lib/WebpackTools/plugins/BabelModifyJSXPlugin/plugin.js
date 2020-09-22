const { inspect } = require('util');
const JSXDecoratorTemplate = require('./JSXDecoratorTemplate');
const RequestedOperation = require('./RequestedOperation');

function BabelModifyJsxPlugin(babel) {
    const methods = {
        replaceJSXElement(operation, path) {
            const replacerTemplate = JSXDecoratorTemplate.for(
                operation.params.replacement
            );
            path.replaceWith(replacerTemplate.render(path.node));
        }
    };

    const runOperation = (operation, path) => {
        if (methods.hasOwnProperty(operation.method)) {
            return methods[operation.method](operation, path);
        }
        throw new Error(
            `Invalid operation ${inspect(operation)}: operation name "${
                operation.method
            }" unrecognized`
        );
    };
    return {
        visitor: {
            Program: {
                enter(_, state) {
                    const { opts, filename } = this;
                    const requests = opts.requestsByFile[filename];
                    const operations = requests.map(
                        request => new RequestedOperation(babel, request)
                    );

                    state.modifyingJSX = {
                        active: new Set(),
                        operations
                    };
                }
            },
            JSXOpeningElement: {
                enter(path, { modifyingJSX }) {
                    const elementName = path.get('name').getSource();
                    for (const operation of modifyingJSX.operations) {
                        if (operation.matchesElementName(elementName)) {
                            modifyingJSX.active.add(operation);
                        }
                    }
                },
                exit(path, { modifyingJSX }) {
                    for (const operation of modifyingJSX.active) {
                        if (operation.isMatch) {
                            // use path.parentPath because the matching we do
                            // uses the openingElement, but the operation should
                            // use the JSX element itself
                            runOperation(operation, path.parentPath);
                        }
                        operation.reset();
                    }
                    modifyingJSX.active.clear();
                }
            },
            JSXAttribute(path, { modifyingJSX }) {
                for (const operation of modifyingJSX.active) {
                    try {
                        operation.addAttributeMatch(path);
                    } catch (e) {
                        // mismatch is a shortcut to disqualification
                        operation.reset();
                        modifyingJSX.active.delete(operation);
                    }
                }
            }
        }
    };
}

module.exports = BabelModifyJsxPlugin;
