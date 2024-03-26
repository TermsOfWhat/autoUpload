export const getShorts = async (page) => {
  return await page.$$eval('#video-title', (titles) => titles.map((title) => title.href));
};
