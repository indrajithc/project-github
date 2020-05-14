$(() => {
  console.log("popup ready");/**
  * Sending dat out from content
  * @param {String} key
  * @param {Any} payload
  * @param {String} dir
  */
 const responseHandler = (key, payload = null, dir = "TOC", runtime = false) => {
   if( runtime) {
    try {
      chrome.runtime.sendMessage({ key, payload, dir });
    } catch (error) { }
  } else  {
     chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
       chrome.tabs.sendMessage(tabs[0].id, { key, payload, dir });
     });
   }
  }  

  /** ====== define global values ===== */
  const formGotoLogin = $("#goto-login");

  /** actions page buttons */
  const listFollowers = $("#list-followers");




  /** ====== functions =========== */
  const showLoading = (status = true) => {
    if( status) {
      $("body").attr("isLoading");
    } else {
      $("body").removeAttr("isLoading");
    }
  }

  const authenticate = (  payload) => {
    console.log(payload);
    if(payload  && payload.success) {
      $("body").removeAttr("unauthorized");
      location.href="../terminal/index.html"
    } else {
      $("body").attr("unauthorized");
    }
  }
  
  const handleFormGotoLoginSubmit = (event) => {
    event.preventDefault();
    chrome.tabs.create({ url: "https://github.com/login" });
  }

  listFollowers.click(()=> {
    alert("go");
  });












  formGotoLogin.submit(handleFormGotoLoginSubmit);




   /**============================================================================================================================= */
   const requestHandler = ( key, payload, response) => {
    switch( key) { 
      case "AUTHENTICATION" : 
      authenticate(  payload);
      break;
      default: 
      console.log("no valid key match");
    } 
  } 

  const init = () => {  
    /**
     * Catching all request into content page
     */
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log( "in P",request);
  if( request && request.dir && request.key && request.dir === "TOP") {
        requestHandler(request.key, request.payload, sendResponse );      
        }
    });
 
    $("body").removeAttr("isLoading");
    responseHandler("AUTHENTICATION");
  };

  init();
});

