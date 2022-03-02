const catchDelayCancelError = async (originalMethod) => {
  let result;

  try {
    result = await originalMethod();
  } catch (err) {
    if (err.message !== 'Timeout cancelled') {
      throw err;
    }
  }

  return result;
};

module.exports = catchDelayCancelError;
