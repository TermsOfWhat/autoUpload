/**
 * this function will automatically scroll through the page
 * @param {page} page :puppeteer page
 */

 export const autoScroll = async (page, options = {}) => {
  const { scrollDistance = 3000, intervalDuration = 100, timeout = 30000 } = options;
  await page.evaluate(async ({ scrollDistance, intervalDuration, timeout }) => {
    await new Promise((resolve, reject) => {
      const startTime = performance.now();
      let totalHeight = 0;
      
      const scroll = () => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, scrollDistance);
        totalHeight += scrollDistance;
        
        if (totalHeight >= scrollHeight - window.innerHeight) {
          resolve();
          return;
        }

        if (performance.now() - startTime > timeout) {
          reject(new Error('Auto scroll timed out'));
          return;
        }

        requestAnimationFrame(scroll);
      };

      scroll();
    });
  }, { scrollDistance, intervalDuration, timeout }).catch(error => {
    console.error('Auto scroll failed:', error);
  });
};
