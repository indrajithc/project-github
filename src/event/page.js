console.log("background script");
/**
 * Sending dat out from content
 * @param {String} key
 * @param {Any} payload
 * @param {String} dir
 */
const responseHandler = (key, payload = null, dir = "TOC") => {
  chrome.runtime.sendMessage({ key, payload, dir });
}
/** ================================= HEADER ENDS ========================================================= */
/** ================================= CONTENT BODY STARTS ================================================= */

/**
 * This function is used to show popup page
 */
const showPopup = () => {
  chrome.tabs.query(
    {
      active: true,
      currentWindow: true,
    },
    function (tabs) {
      if( tabs && tabs[0]){
        chrome.pageAction.show(tabs[0].id);
      }
    },
  );
} 


/** ================================= CONTENT BODY END ================================================= */
/** ================================= FOOTER STARTS ==================================================== */
const requestHandler = ( key, payload, response) => {
  switch( key) {
    case "SHOW_PAGE" : 
    showPopup();
    break; 
    break;
    default: 
    console.log("no valid key match");
  } 
}

/**
 * Catching all request into content page
 */
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if( request && request.dir && request.key && request.dir === "TOE") {
    requestHandler(request.key, request.payload, sendResponse );      
    }
});




