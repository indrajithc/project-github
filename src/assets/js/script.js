/**
 * Function used to read content from file
 * @param {String} file
 */
window.readFile = ( file ) =>new Promise( (resolve,reject) => {
  chrome.runtime.getPackageDirectoryEntry(function(root) {
    const relativePath =  `./src/${file}`;
    root.getFile(relativePath, {}, function(fileEntry) {
      fileEntry.file(function(file) {
        var reader = new FileReader();
        reader.onloadend = function(e) {
          resolve( this.result);
        };
        reader.readAsText(file);
      }, reject);
    }, reject);
  }); 
});

/**
 * Used to get extension relative path
 * @param {String} file
 */
window.getURL = ( file ) => chrome.runtime.getURL(`/src/${file}`);

/**
 * Method use to access local storage
 */
window.storageSet = ( data, callback) => chrome.storage.local.set(data, callback);
window.storageGet = ( data, callback) => chrome.storage.local.get(data, callback);

/**
 * Method use to access sync storage
 */
window.syncStorageSet = ( data, callback) => chrome.storage.sync.set(data, callback);
window.syncStorageGet = ( data, callback) => chrome.storage.sync.get(data, callback);
