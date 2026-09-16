const objectId = (value, helpers) => {
  if (typeof value !== 'string' || !value.match(/^[0-9a-fA-F]{24}$/)) {
    return helpers.message('"{{#label}}" phải là một MongoDB ObjectId hợp lệ (24 ký tự hex)');
  }
  return value;
};

const password = (value, helpers) => {
  if (value.length < 6) {
    return helpers.message('Mật khẩu phải có ít nhất 6 ký tự');
  }
  return value;
};

module.exports = {
  objectId,
  password
};
