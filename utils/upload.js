export const upload = async (newTab, outputPath) => {
  console.log('in upload');
  await newTab.waitForSelector('input[type=file]');
  const elementHandle = await newTab.$('input[type=file]');
  await elementHandle.uploadFile(outputPath);
  await newTab.waitForSelector('.css-1z070dx');
  try {
    await newTab.waitForSelector('.css-y1m958', {
      timeout: 2000,
    });
  } catch (error) {
    console.log(error.name);
    if (error.name === 'TimeoutError') {
      await upload(newTab, outputPath);
    } else {
      console.error('An error occurred while waiting for the selector:', error);
    }
  }
};
