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

  const doc = $(document);
  let defaultText = `[user@git ~]$ `;
  let lastInput = defaultText;
  /** ====== define global values ===== */
  const formGotoLogin = $("#goto-login");

  /** actions page ids */
  const terminal = $("#terminal");
  const terminalConsole = $("#console");
  const consoleInput = $("#input");
  const consoleOutput = $("#output");


  /** ====== initial values =========== */
  consoleInput.val(defaultText);



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
      if( payload.userId) {
        defaultText = defaultText.replace("user", payload.userId);
      }
    } else {
      $("body").attr("unauthorized");
      location.href="../home/index.html"
    }
  }
  
  const setInputToDefault = () => {
    consoleInput.val( defaultText);
  } 

  /**
   * This method is used to resize the text area
   */
  const inputResize = ( rest = null) => { 
    const tag = consoleInput[0]; 
    if(tag && tag.style){
      tag.style.height = 'auto';
      tag.style.height = rest || tag.scrollHeight+'px';
      tag.style.minHeight = rest || tag.scrollHeight+'px';
    }
  }

  const scrollToBottom = () => {
    setTimeout( o => {terminal[0].scrollTop = terminal[0].scrollHeight;}, 0);
  }

  const enterMonitor = (event) => {
    scrollToBottom();
    if(event.which === 13) {
      const inputValue = consoleInput.val();
      onAction(inputValue); 
      setInputToDefault(); 
      event.preventDefault();
      inputResize('20px');
      }
  }

  terminalConsole.click( (event) => {
    consoleInput.focus();
  });

  consoleOutput.click( (event) => {
    event.stopPropagation();
  });

  const setOutPut = (output) => {
    const eachActions = `<p class="d-block w-100 m-0 p-0">${output}</p>`;
    consoleOutput.append( eachActions);
  }

  const doTheAction = ( command ) => {
    command = command.replace(defaultText.trim(), "");
    command = command.trim();
    if(command.length < 1 ) return;
    let output ="";
    switch( command){
      case "clear" : 
        consoleOutput.html("");
        break;
      default : 
        output = `git: ${command}: command not found`
    }
    setOutPut(output);
  }

  /**
   * Input filed enter action
   * @param {String} input
   */
  const onAction = (input) => {
    setOutPut(input);
    doTheAction(input.split('\n')[0]);
  }
  
  doc.on('change cut paste drop propertychange input', `#${consoleInput.attr("id")}`,  (event)=> {
    event.preventDefault();
    const inLast = lastInput.replace(defaultText, "");
    let currentInput = consoleInput.val();
    if( defaultText !== currentInput.substring(0, defaultText.length)) {
      if(currentInput.length < 1) {
        currentInput = defaultText;
      } else  {
        currentInput = defaultText+inLast;

      }
    }
    consoleInput.val( currentInput);
    window.setTimeout(inputResize, 0);
    scrollToBottom();
    lastInput = currentInput;
    if(event ) { 
      enterMonitor(event);
    }
  });

  consoleInput.keypress((event)=> {
    if(event ) { 
      enterMonitor(event);
    }
  });
 








 


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

