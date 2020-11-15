$(()=> {
  /**
   * Sending dat out from content
   * @param {String} key
   * @param {Any} payload
   * @param {String} dir
   */
  const responseHandler = (key, payload = null, callback, dir = "TOP") => {
    if(chrome && chrome.app && typeof chrome.app.isInstalled!=='undefined'){
      chrome.runtime.sendMessage({ key, payload, dir }, callback);
    }
  }
  /** ================================= HEADER ENDS ========================================================= */
  /** ================================= CONTENT BODY STARTS ================================================= */

  /** sending show page  */
  responseHandler("SHOW_PAGE", null, null, "TOE");


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
    console.log(payload);
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
   * This function send a message to client script
   */
  const pageReadyStatus = () => { 
    const payload =  window.location;
    responseHandler("PAGE_READY", payload);
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

  /**
   * This function is sued to open profile
   * @param {Object} payload 
   */
  const openProfilePage = (payload, response) => {
    const currentUrl = window.location.href;
    if(payload ) {
      const { username } = payload;
      const profileUrl = `${window.location.protocol}//${ window.location.host}/${username}` ;
      if(currentUrl.indexOf(profileUrl) === 0) {
        if( typeof response === "function" ) {
          response( true, currentUrl);
        }
      } else  {
        response( false, currentUrl);
        window.location.href = profileUrl;
      }
    }
  }

  /**
   * This function is sued to open followers
   * @param {Object} payload 
   */
  const openFollowersPage = (payload, response) => {
    const currentUrl = window.location.href;
    if(payload ) {
      const { username } = payload;
      const profileUrl = `${window.location.protocol}//${ window.location.host}/${username}?tab=followers` ;
      if(currentUrl.indexOf(profileUrl) === 0) {
        if( typeof response === "function" ) {
          response( true, currentUrl);
        }
      } else  {
        response( false, currentUrl);
        window.location.href = profileUrl;
      }
    }
  }


  const listFollowersFromCurrentTab = () => {
    const body = $("body");
    const followersList = [];
    let hasNextPage = false;
    if (body.length > 0) {
        const applicationMain = body.find("main#js-pjax-container");
        if (applicationMain.length > 0) {
            const applicationContainer = applicationMain.find(".container-xl");
            if (applicationContainer.length > 0 && applicationContainer.children()) {
              const followerContainers = applicationContainer.find(".d-table");
                if (followerContainers.length > 0  ) { 
                  followerContainers.each(function() {
                        const followerItem = $(this);
                        if (followerItem.length > 0) {
                            if (followerItem.hasClass("d-table")) {
                                let follower = {};
                                try {
                                    const userImage = followerItem.find("img")[0];
                                    if (userImage) {
                                        follower.image = $(userImage).attr("src") || undefined;
                                    }
                                } catch (err) {}
                                try {
                                    const userName = followerItem.find("a[data-hovercard-type='user']>span")[0];

                                    if (userName) {
                                        follower.name = $(userName).text() || undefined;
                                    }
                                } catch (err) {}
                                try {
                                    const userUsername = followerItem.find("a[data-hovercard-type='user']>span")[1];

                                    if (userUsername) {
                                        follower.username = $(userUsername).text() || undefined;
                                    }
                                } catch (err) {}
                                try {
                                    const myStatus = followerItem.find("form:not([hidden='hidden']) input[type='submit']")[0];
                                    if (myStatus) {
                                        const statusValue = `${$(myStatus).val()}`.toLowerCase().trim();
                                        follower.status = statusValue === "unfollow";
                                    }
                                } catch (err) {}
                                if(follower.username){
                                  followersList.push(follower);
                                }
                            }  
                          }
                    }); 
 
                }
            }

            
            const pageAction = applicationContainer.find(".paginate-container .pagination a");
            console.warn(pageAction);
            if (pageAction) {
                const nextPage = pageAction[pageAction.length - 1];
                if (nextPage) {
                  const nextStepText = `${$(nextPage).text()}`.toLowerCase().trim();
                  if(nextStepText === "next"){ 
                    hasNextPage = $(nextPage).attr("href") || undefined;
                  }
                }
              }
        }
    }

    return { 
      data: followersList,
      hasMore : hasNextPage
    } 
  }

  const startsListing = (key) => { 
    let responseData = { 
      data: [],
      hasMore : false
    } ;
    let success = false;
    try {
      responseData = listFollowersFromCurrentTab();
      console.log({responseData});
      success = true;
    } catch (error) {
      
    }
   
    responseHandler(key, { success, data:responseData.data, hasMore: responseData.hasMore  }, () => {
     console.log(responseData.hasMore);
     if(responseData.hasMore)
      window.location.href = responseData.hasMore;
    } );
  }

  /**
   * This function is sued to list followers
   * @param {Object} payload 
   */
  const listFollowers =  (payload, response, key) => {
    const currentUrl = window.location.href;
    if(payload ) {
        if( typeof response === "function" ) {
          response( true, currentUrl);
          startsListing(key);
        } 
    }
  }

  
  


  /** ================================= CONTENT BODY END ================================================= */
  /** ================================= FOOTER STARTS ==================================================== */
  /** initial functions */
  try {
    authenticate();
    pageReadyStatus();

  } catch (error) { }


  const requestHandler = ( key, payload, response) => {
    console.log(key, payload, response);
    switch( key) {
      case "AUTHENTICATION" : 
        authenticate();
        break;
      case "GOTO_PROFILE": 
        openProfilePage(payload, response);
        break;
      case "GOTO_FOLLOWERS": 
        openFollowersPage(payload, response);
        break;
      case "LIST_FOLLOWERS": 
        listFollowers(payload, response, key);
        break;
        
        
      default: 
        console.log("no valid key match >>>");
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