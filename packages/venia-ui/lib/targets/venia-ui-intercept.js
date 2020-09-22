/**
 * @module VeniaUI/Targets
 */
const RichContentRendererList = require('./RichContentRendererList');
const {
    TargetableReactComponent
} = require('@magento/pwa-buildpack/lib/WebpackTools/transform');

/**
 * TODO: This code intercepts the Webpack module for a specific file in this
 * package. That will be a common enough pattern that it should be turned into
 * a utility function.
 */

module.exports = targets => {
    const builtins = targets.of('@magento/pwa-buildpack');

    builtins.specialFeatures.tap(featuresByModule => {
        featuresByModule['@magento/venia-ui'] = {
            cssModules: true,
            esModules: true,
            graphqlQueries: true,
            rootComponents: true,
            upward: true
        };
    });

    /**
     * Implementation of our 'richContentRenderers' target. This will gather
     * RichContentRenderer declarations { importPath, componentName } from all
     * interceptors, and then tap `builtins.transformModules` to inject a
     * module transform into the build which is configured to generate an array
     * of modules to be imported and then exported.
     */
    new RichContentRendererList(builtins.transformModules).useTarget(
        targets.own.richContentRenderers
    );

    // Dogfood our own richContentRenderer hook to insert the fallback renderer.
    targets.own.richContentRenderers.tap(rendererInjector =>
        rendererInjector.add({
            componentName: 'PlainHtmlRenderer',
            importPath: './plainHtmlRenderer'
        })
    );

    const babelTemplate = require('@babel/template');
    /**
     * Implementation of our `routes` target. When Buildpack runs
     * `transformModules`, this interceptor will provide a nice API to
     * consumers of `routes`: instead of specifying the transform file
     * and the path to the routes component, you can just push route
     * requests into a neat little array.
     */
    builtins.transformModules.tap(addTransform => {
        addTransform({
            type: 'babel',
            fileToTransform:
                '@magento/venia-ui/lib/components/Routes/routes.js',
            transformModule:
                '@magento/venia-ui/lib/targets/BabelRouteInjectionPlugin',
            options: {
                routes: targets.own.routes.call([])
            }
        });
        const MainComponent = new TargetableReactComponent(
            '@magento/venia-ui/lib/components/Main/main.js',
            builtins.transformModules
        );
        MainComponent.replaceJSXElement(
            '<main className={rootClass}>',
            `<main id="BLORPS" className={rootClass}>{{ORIGINAL.children}}</main>`
        );
        addTransform.addModule(MainComponent);
    });

    // The paths below are relative to packages/venia-ui/lib/components/Routes/routes.js.
    targets.own.routes.tap(routes => [
        ...routes,
        {
            name: 'AddressBook',
            pattern: '/address-book',
            exact: true,
            path: '../AddressBookPage'
        },
        {
            name: 'Cart',
            pattern: '/cart',
            exact: true,
            path: '../CartPage'
        },
        {
            name: 'CheckoutPage',
            pattern: '/checkout',
            exact: true,
            path: '../CheckoutPage'
        },
        {
            name: 'CommunicationsPage',
            pattern: '/communications',
            exact: true,
            path: '../CommunicationsPage'
        },
        {
            name: 'CreateAccountPage',
            pattern: '/create-account',
            exact: true,
            path: '../CreateAccountPage'
        },
        {
            name: 'OrderHistory',
            pattern: '/order-history',
            exact: true,
            path: '../OrderHistoryPage'
        },
        {
            /**
             * This path is configured in the forgot password
             * email template in the admin panel.
             */
            name: 'Reset Password',
            pattern: '/customer/account/createPassword',
            exact: true,
            path: '../MyAccount/ResetPassword'
        },
        {
            name: 'Search',
            pattern: '/search.html',
            exact: true,
            path: '../../RootComponents/Search'
        },
        {
            name: 'WishlistPage',
            pattern: '/wishlist',
            exact: true,
            path: '../WishlistPage'
        }
    ]);
};
