const { inspect } = require('util');
// const JSXDecoratorTemplate = require('./JSXDecoratorTemplate');
const JSXSnippetParser = require('./JSXSnippetParser');
const RequestedOperation = require('./RequestedOperation');

// simulate Babel NodePath-like dot lookup without expensively creating a path
const dotLookup = (obj, dotPath) => {
    let result = obj;
    const segments = dotPath.split('.');
    for (const segment of segments) {
        result = result[segment];
    }
    return result;
};

function BabelModifyJsxPlugin(babel) {
    const { types: t } = babel;
    const parser = new JSXSnippetParser(babel);

    const parseJSXParam = params =>
        parser.parseElement(parser.normalizeElement(params.jsx));

    const methods = {
        append(params, path) {
            path.pushContainer('children', [parseJSXParam(params)]);
        },
        insertAfter(params, path) {
            path.insertAfter(parseJSXParam(params));
        },
        insertBefore(params, path) {
            path.insertBefore(parseJSXParam(params));
        },
        prepend(params, path) {
            path.unshiftContainer('children', [parseJSXParam(params)]);
        },
        remove(_, path) {
            path.remove();
        },
        removeProps({ props }, path) {
            const toRemove = new Set(props);
            path.get('openingElement.attributes').forEach(
                propPath =>
                    toRemove.has(propPath.node.name.name) && propPath.remove()
            );
        },
        replace(params, path) {
            const replacement = parseJSXParam(params);
            const { targetPath, replacementPath } = params;

            const replacementNode = replacementPath
                ? dotLookup(replacement, replacementPath)
                : replacementAST;

            const finalPath = targetPath ? path.get(targetPath) : path;

            finalPath.replaceWith(replacementNode);
        },
        setProps({ props }, path) {
            const remainingToSet = new Map(Object.entries(props));
            const openingElement = path.get('openingElement');
            openingElement.get('attributes').forEach(propPath => {
                const { name } = propPath.node.name;
                const valuePath = propPath.get('value');
                if (remainingToSet.has(name)) {
                    const newValue = remainingToSet.get(name);
                    if (newValue === true) {
                        valuePath.remove(); // true just means present
                    } else {
                        valuePath.replaceWithSourceString(newValue);
                    }
                    remainingToSet.delete(name);
                }
            });
            // create remaining props that weren't present and therefore deleted
            const newProps = parser.parseAttributes(remainingToSet.entries());
            if (newProps.length > 0) {
                openingElement.node.attributes.push(...newProps);
            }
        },
        surround(params, path) {
            const wrapperAST = parseJSXParam(params);
            wrapperAST.children = [path.node];
            path.replaceWith(wrapperAST);
        }
    };

    const runOperation = (operation, path) => {
        if (methods.hasOwnProperty(operation.method)) {
            return methods[operation.method](operation.params, path, operation);
        }
        throw new Error(
            `Invalid operation ${inspect(operation)}: operation name "${
                operation.method
            }" unrecognized`
        );
    };

    const drainOperationsQueue = (operations, callback) => {
        for (const operation of operations) {
            if (callback(operation)) {
                operation.reset();
                operations.delete(operation);
            }
        }
    };

    // TODO: winnow doc
    const runOnAttributeMatch = (operations, openingElementPath) => {
        for (const attrPath of openingElementPath.get('attributes')) {
            if (operations.size === 0) {
                break;
            }
            // drain on explicit mismatch
            drainOperationsQueue(
                operations,
                operation => operation.addAttributeMatch(attrPath) === false
            );
        }
        // drain on success
        drainOperationsQueue(operations, operation => {
            if (operation.isMatch) {
                runOperation(operation, openingElementPath.parentPath);
                return true;
            }
        });
    };

    return {
        visitor: {
            Program: {
                enter(_, state) {
                    const { opts, filename } = this;
                    const requests = opts.requestsByFile[filename];
                    const operations = requests.map(
                        request => new RequestedOperation(request, parser)
                    );

                    state.modifyingJSX = {
                        active: new Set(),
                        operations
                    };
                }
            },
            JSXOpeningElement: {
                enter(path, { modifyingJSX }) {
                    for (const operation of modifyingJSX.operations) {
                        if (operation.shouldTry(path)) {
                            modifyingJSX.active.add(operation);
                        }
                    }
                    runOnAttributeMatch(modifyingJSX.active, path);

                    for (const operation of modifyingJSX.active) {
                        if (operation.isMatch) {
                            runOperation(operation, path.parentPath);
                            modifyingJSX.active.remove(operation);
                        }
                    }
                },

                // Attributes may have changed since entering this element
                // and new operations may qualify.
                exit(path, { modifyingJSX }) {
                    filterOnAttributeMatch(modifyingJSX.active, path);
                    for (const operation of modifyingJSX.active) {
                        if (operation.isMatch) {
                            runOperation(operation, path.parentPath);
                        }
                        operation.reset();
                    }
                    modifyingJSX.active.clear();
                }
            }
        }
    };
}

module.exports = BabelModifyJsxPlugin;
