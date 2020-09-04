const path = require('path');
const { AsyncParallelHook } = require('tapable');
const HookInterceptorSet = require('../HookInterceptorSet');
const targetSerializer = require('../JestPeregrineTargetSerializer');

expect.addSnapshotSerializer(targetSerializer);

// Since fast-glob doesn't return in reliable order (it sacrifices that for
// speed), we sort the results so the snapshot stays deterministic. Don't
// need to do this in runtime!
const sortByFilename = (a, b) =>
    (a.fileToTransform > b.fileToTransform && 1) ||
    (b.fileToTransform > a.fileToTransform && -1) ||
    0;

describe('HookInterceptorSet for talons target API', () => {
    let talonInterceptors;
    const talonTarget = new AsyncParallelHook(['wrappers']);
    beforeAll(async () => {
        talonInterceptors = new HookInterceptorSet(
            path.resolve(__dirname, '../../talons/'),
            talonTarget
        );
        await talonInterceptors.populate();
    });
    test('exposes each talon under namespace hierarchy following directory structure', () => {
        expect(talonInterceptors).toMatchSnapshot();
    });

    test('stores a queue of transform requests for talon files', async () => {
        talonTarget.tap('unittests', talons => {
            talons.Accordion.useAccordion.wrapWith('metal');
            talons.AccountChip.useAccountChip.wrapWith('dust');
            talons.AccountMenu.useAccountMenuItems.wrapWith('drapes');
            talons.App.useApp.wrapWith('bunting');
            talons.AuthBar.useAuthBar.wrapWith('lace');
            talons.AuthModal.useAuthModal.wrapWith('muslin');
            talons.Breadcrumbs.useBreadcrumbs.wrapWith('egg');
            talons.CartPage.useCartPage.wrapWith('silk');
            talons.CartPage.GiftCards.useGiftCard.wrapWith('envelope');
            talons.CartPage.GiftCards.useGiftCards.wrapWith('ribbons');
        });

        await talonInterceptors.runAll();

        // flatten out the transforms
        const allTransforms = []
            .concat(...talonInterceptors.allModules.map(mod => mod.flush()))
            .sort(sortByFilename);
        expect(allTransforms).toMatchSnapshot();
    });
});

describe('HookInterceptorSet for hooks target API', () => {
    let hookInterceptors;
    const hookTarget = new AsyncParallelHook(['wrappers']);
    beforeAll(async () => {
        hookInterceptors = new HookInterceptorSet(
            path.resolve(__dirname, '../../hooks/'),
            hookTarget
        );
        // do not run populate this time, to test that .runAll will run it
    });
    test('stores a queue of transform requests for hook files', async () => {
        hookTarget.tapPromise('unittests', async hooks => {
            hooks.useAwaitQuery.wrapWith('frosting');
            hooks.useCarousel.wrapWith('wd-40');
            hooks.useDropdown.wrapWith('curtains');
            hooks.useEventListener.wrapWith('fanfare');
            hooks.usePagination.wrapWith('knickknacks');
            hooks.useResetForm.wrapWith('unsettery');
            hooks.useRestApi.wrapWith('en passant');
            hooks.useRestResponse.wrapWith('indolence');
            hooks.useScrollIntoView.wrapWith('physics');
            hooks.useScrollLock.wrapWith('crisis');
            hooks.useScrollTopOnChange.wrapWith('mutability');
            hooks.useSearchParam.wrapWith('optimism');
            hooks.useSort.wrapWith('intent');
            hooks.useWindowSize.wrapWith('disbelief');
        });

        await hookInterceptors.runAll();

        expect(hookInterceptors).toMatchSnapshot();

        // flatten out the transforms
        const allTransforms = []
            .concat(...hookInterceptors.allModules.map(mod => mod.flush()))
            .sort(sortByFilename);
        expect(allTransforms).toMatchSnapshot();
    });
});
