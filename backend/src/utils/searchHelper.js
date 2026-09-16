/**
 * Escapes regex special characters in a string
 * @param {string} str 
 * @returns {string}
 */
function escapeRegex(str) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Builds a regex pattern that matches both accented and unaccented Vietnamese letters.
 * If the input already contains accents, it preserves them.
 * If the input is unaccented, it maps each vowel and 'd' to its accented variations.
 * @param {string} searchTerm 
 * @returns {RegExp}
 */
function buildVietnameseRegex(searchTerm) {
  if (!searchTerm || typeof searchTerm !== 'string') return new RegExp('', 'i');
  
  const trimmed = searchTerm.trim();
  if (!trimmed) return new RegExp('', 'i');

  const charMap = {
    'a': '[aàáảãạăằắẳẵặâầấẩẫậ]',
    'A': '[AÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬaàáảãạăằắẳẵặâầấẩẫậ]',
    'e': '[eèéẻẽẹêềếểễệ]',
    'E': '[EÈÉẺẼẸÊỀẾỂỄỆeèéẻẽẹêềếểễệ]',
    'i': '[iìíỉĩị]',
    'I': '[IÌÍỈĨỊiìíỉĩị]',
    'o': '[oòóỏõọôồốổỗộơờớởỡợ]',
    'O': '[OÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢoòóỏõọôồốổỗộơờớởỡợ]',
    'u': '[uùúủũụưừứửữự]',
    'U': '[UÙÚỦŨỤƯỪỨỬỮỰuùúủũụưừứửữự]',
    'y': '[yỳýỷỹỵ]',
    'Y': '[YỲÝỶỸỴyỳýỷỹỵ]',
    'd': '[dđ]',
    'D': '[DĐdđ]'
  };

  let pattern = '';
  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];
    if (charMap[char]) {
      pattern += charMap[char];
    } else {
      pattern += escapeRegex(char);
    }
  }

  return new RegExp(pattern, 'i');
}

/**
 * Creates MongoDB query conditions for matching a localized field (string or { vi, en })
 * @param {string} fieldName - e.g. 'title' or 'name'
 * @param {string} searchTerm 
 * @returns {Array<Object>}
 */
function buildLocalizedSearchConditions(fieldName, searchTerm) {
  const regex = buildVietnameseRegex(searchTerm);
  return [
    { [`${fieldName}.vi`]: regex },
    { [`${fieldName}.en`]: regex },
    { [fieldName]: regex }
  ];
}

module.exports = {
  escapeRegex,
  buildVietnameseRegex,
  buildLocalizedSearchConditions
};
