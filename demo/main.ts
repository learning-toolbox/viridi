import { router } from 'viridi';

router.onRouteChange((fullPage, pages) => {
  console.log(fullPage, pages);
});
