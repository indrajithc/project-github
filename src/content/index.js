$(()=> {
  /**
   * Sending dat out from content
   * @param {String} key
   * @param {Any} payload
   * @param {String} dir
   */
  const responseHandler = (key, payload = null, dir = "TOP") => {
    if(chrome && chrome.app && typeof chrome.app.isInstalled!=='undefined'){
      chrome.runtime.sendMessage({ key, payload, dir });
    }
  }
  /** ================================= HEADER ENDS ========================================================= */
  /** ================================= CONTENT BODY STARTS ================================================= */

  /** sending show page  */
  responseHandler("SHOW_PAGE", null, "TOE");


  /** This method is used to check user authentication 
   * @returns {Boolean}
  */
  const checkAuthentication = () => {
    let validUser = null;
    try {
      const loginUserImage = $("header.Header div.Header-item details>summary>img");
      if(loginUserImage && loginUserImage.length) {
        if( loginUserImage.hasClass("avatar")) {
          if( loginUserImage.attr("alt") && loginUserImage.attr("src")) {
            validUser = {
              success : true,
              userId: loginUserImage.attr("alt").replace("@", ""),
              image: loginUserImage.attr("src"),
            }
          }
        }
      }
    } catch (error) {
      
    }
    if( !Boolean(validUser))
    validUser = false;
    return validUser;
  }

  /**
   * This function is used to authenticate and send message
   */
  const authenticate = () => {
    const authenticatedData = checkAuthentication(); 
    let payload = { success : false , data: null};
    if( authenticatedData) {
      payload = authenticatedData;
    }
    responseHandler("AUTHENTICATION", payload );
  }



  /** ================================= CONTENT BODY END ================================================= */
  /** ================================= FOOTER STARTS ==================================================== */
  /** initial functions */
  try {
    authenticate();

  } catch (error) { }


  const requestHandler = ( key, payload, response) => {
    switch( key) {
      case "AUTHENTICATION" : 
      authenticate();
      break;
      default: 
      console.log("no valid key match");
    } 
  }

  /**
   * Catching all request into content page
   */
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if( request && request.dir && request.key && request.dir === "TOC") {
      requestHandler(request.key, request.payload, sendResponse );      
      }
  }); 
})