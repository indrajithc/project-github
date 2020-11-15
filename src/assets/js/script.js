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

/**
 * Process queue 
 */
window.Queue = class QueueList {

  Task = null;

  constructor( ) {
     this.Task = class Task {
       id = null;
       payload = {};
       startedAt = null;
       lastUpdated = null;
       checkOnPageReady = false;

      constructor( queueId ) {
        this.id = queueId; 
        this.startedAt = new Date(); 
        this.lastUpdated = new Date(); 
      }

      poperyUpdated = () => {
        this.lastUpdated = new Date();
      }
      setPayload = queuePayload =>{
        this.payload = queuePayload;
        this.poperyUpdated();
      }; 

      getPayload = () => this.payload;
      getStartedAt = () => this.startedAt;
      getLastUpdate = () => this.lastUpdated;
      getTimeFromStart = () => {
        return Math.abs(new Date() - this.startedAt);
      }

      getTimeFromLastUpdate = () => {
        return Math.abs(new Date() - this.lastUpdated);
      }

    }
  }
   uuid (){ 
    return '_' + Math.random().toString(36).substr(2, 9);
  };

  list =[];

  newTask = (payload) => {
    const id = this.uuid()
    const newItem = new this.Task ( id ); 
    this.list.push(newItem);
    return id;
  }

  clear = () => this.list = [];
  
  /**
   * This method is used to get queue data
   * @param {Object} payload
   */
  get = (queueId ) => {
    let selectedTask = this.list.filter( each => queueId === each.id)[0];
    return selectedTask || null;
  }

  /**
   * This method is used to add anew queue into the list
   * @param {Object} payload
   */
  add = (payload) => {
    return this.newTask( Object.keys(payload).length > 0 ? payload : {});
  }

  /**
   * This method is used to get queue data
   * @param {Object} payload
   */
  remove = (queueId ) => {
    this.list = this.list.filter( each => queueId !== each.id);
  }

 }