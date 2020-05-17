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
  const readFile = window.readFile || null;
  const storageSet = window.storageSet;
  const storageGet = window.storageGet;


  let defaultText = `[user@git ~]$ `;
  const defaultTextRegx = new RegExp("\[[a-zA-Z0-9 ._-]+@[a-zA-Z0-9 ._-]+\\~\\]\\$");
  let lastInput = defaultText;
  const localHistory = [];
  let currentHistoryIndex = 0;

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
        setInputToDefault();
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

  const allEventMonitor = ()=> {
    currentHistoryIndex = 0;
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
      allEventMonitor();
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
    scrollToBottom();
  }

  const showHelp = () => {
    readFile("resource/help.json").then( (response, error) => {
      if(error) {
        setOutPut("resource file missing");
      } else  {
        const parsedJson = JSON.parse( response);
        let helpOnScreen = '<table><tbody>';
        Object.keys(parsedJson).map( key => {
           helpOnScreen = `${helpOnScreen}
           <tr>
           <td>${key}</td><td>${parsedJson[key]}</td>
           </tr>`
        });
        helpOnScreen=`${helpOnScreen}</tbody></table>`;
        setOutPut(helpOnScreen);
      } 
    });
  }

  const clearHistory = (  ) => {       
      storageSet( { history : [] },()=> {
        setOutPut("history cleared.");
    }); 
}

  const setHistory = ( command ) => {
    localHistory.push(command);
     storageGet(['history'], (response)=> {
       let updatedHistory = [];
       if( Array.isArray(response.history)) {
        updatedHistory= response.history;
      }
      updatedHistory.push(command); 
      storageSet( { history : updatedHistory },()=> {
        // console.log("history updated"); 
    });

  })
}

  const showHistory  = () => {
    storageGet(['history'], (response)=> {
      const history = response.history
      if( Array.isArray(history)) {
        for( let o =0 ; o<history.length ; o++) {
          setOutPut(`<span class="pl-1 d-flex">
            <span style="min-width: 2rem;" class="pr-2 text-right">${(o+1)}</span>
            <span class="d-block">${history[o]}</span>
          </span>
          `);
        }
      }
    });
  }

  const showHistoryInInput = ( direction)=> {
    currentHistoryIndex += direction;
    if( currentHistoryIndex <= localHistory.length){
      const selectedHistory = localHistory[ localHistory.length - currentHistoryIndex ];
      if(selectedHistory)
        consoleInput.val(`${defaultText}${selectedHistory}`);
    }
  }


  const doTheAction = ( command ) => {
    command = command.replace(defaultTextRegx, "");
    command = command.trim();
    command = command.replace(/\s\s+/g, ' ');
    if(command.length < 1 ) return;
    setHistory(command);
    let output ="";
    switch( command){
      case "clear" : 
        consoleOutput.html("");
        case "help" : 
          showHelp();
        break;
        case "history" : 
        showHistory();
        break;
        case "history -c":
        case "history --clear":
          clearHistory();
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
    if(currentInput.substring(0, defaultText.length).match(defaultText)) {
      if(currentInput.length < 1) {
        currentInput = defaultText;
      } else  {
        currentInput = defaultText+inLast;
      }
    }else  if(currentInput.length <= defaultText.length)  {
      currentInput = defaultText;
    }
    
    allEventMonitor();
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

  consoleInput.keydown((event)=> {
    if(event ) { 
       if( event.which === 37 || event.which === 40) {
          showHistoryInInput( -1);
          event.preventDefault();
       } else if( event.which === 38 || event.which === 39)  {
          showHistoryInInput( +1);
          event.preventDefault();
       }
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

