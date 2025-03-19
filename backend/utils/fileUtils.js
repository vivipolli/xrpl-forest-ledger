const fs = require("fs");

/**
 * Deletes a file from the filesystem
 * @param {string} filePath - Path to the file to delete
 */
function cleanupFile(filePath) {
  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error(`Error cleaning up file ${filePath}:`, error);
  }
}

module.exports = {
  cleanupFile,
};
