$(() => {
  console.log("popup ready");/**
  * Sending dat out from content
  * @param {String} key
  * @param {Any} payload
  * @param {String} dir
  */
  const responseHandler = (key, payload = null, callback = null, dir = "TOC", runtime = false) => {
    if (runtime) {
      try {
        chrome.runtime.sendMessage({ key, payload, dir }, callback);
      } catch (error) { }
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { key, payload, dir }, callback);
      });
    }
  }

  const doc = $(document);
  const readFile = window.readFile || null;
  const Queue = new window.Queue();
  const storageSet = window.storageSet;
  const storageGet = window.storageGet;


  let defaultText = `[user@git ~]$ `;
  const defaultTextRegx = new RegExp("\[[a-zA-Z0-9 ._-]+@[a-zA-Z0-9 ._-]+\\~\\]\\$");
  let lastInput = defaultText;
  const localHistory = [];
  let currentHistoryIndex = 0;
  const authorization = {};
  const isProgress = { active: false, infinite: true, message: "", progress: 100, payload: {} };
  const localFollowersList = [];
  const rootUrl = `https://github.com`;
  const localFollowingList = [];

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
    if (status) {
      $("body").attr("isLoading");
    } else {
      $("body").removeAttr("isLoading");
    }
  }
  /**
   * This function is used to authenticate
   * @param {Object} payload 
   */
  const authenticate = (payload) => {
    if (payload && payload.success) {
      $("body").removeAttr("unauthorized");
      if (payload.userId) {
        defaultText = defaultText.replace("user", payload.userId);
        authorization.username = payload.userId;
        setInputToDefault();
      }
    } else {
      $("body").attr("unauthorized");
      location.href = "../home/index.html"
    }
  }

  /**
   * This function is used to set input to default
   */
  const setInputToDefault = () => {
    consoleInput.val(defaultText);
  }

  /**
   * This function is used to clear progress
   */
  const clearProgress = () => {
    consoleInput.prop("readonly", false);
    window.clearInterval(isProgress.interval);
    isProgress.active = false;
    isProgress.interval = null;
    isProgress.payload = null;
    isProgress.message = null;
    isProgress.loadingAmin = null;
    consoleInput.removeAttr("loading");
    setInputToDefault();
  }

  /**
   * This method is used to show progress
   */
  const showProgress = () => {
    isProgress.interval = setInterval(() => {
      const hasAttr = consoleInput.attr('loading');
      if (typeof hasAttr !== typeof undefined && hasAttr !== false) {
        consoleInput.prop("readonly", false);
      } else {
        consoleInput.prop("readonly", true);
        consoleInput.attr("loading", true);
      }
      if (isProgress.infinite) {
        const loadingAnimArr = ["\\", "|", "/", "-", "\\", "|", "/", "-"];
        let c = isProgress.loadingAmin || 0;
        c = c >= (loadingAnimArr.length) ? 0 : c;
        const progressText = `${defaultText} ${loadingAnimArr[c]} \t ${isProgress.message || ""}`
        consoleInput.val(progressText);
        isProgress.loadingAmin = c + 1;
      } else {
        const inputDiv = consoleInput[0];
        if (inputDiv) {
          let progress = Math.min(100, isProgress.progress) / 100;
          let totalLetters = (inputDiv.offsetWidth - (defaultText.length * 8)) / 10;
          totalLetters = parseInt(totalLetters);
          let loading = "";
          for (let k = 0; k <= totalLetters; k++) {
            if (k <= Math.floor(totalLetters * progress))
              loading = `${loading}█`;
            else
              loading = `${loading}▁`;
          }
          consoleInput.val(`${defaultText}${loading}\t${Math.floor(progress * 100)}%`);
        }
      }
    }, 100);
  }

  /**
   * This function is used to show loading on console
   * @param {Boolean} active 
   * @param {Object} payload 
   * @param {Boolean} infinite 
   * @param {Number} progress 
   */
  const setLoading = (active, payload = null, message = null, progress = 0, infinite = true) => {
    isProgress.active = active;
    isProgress.infinite = infinite;
    isProgress.progress = progress;
    isProgress.payload = payload;
    isProgress.message = message;
    if (isProgress.interval) {
      if (!active) {
        clearProgress();
      }
    } else {
      if (active && !isProgress.interval) {
        showProgress();
      }
    }
  }
  setLoading.active = (active) => {
    isProgress.active = active;
    if (!active) {
      clearProgress();
    }
  }
  setLoading.progress = (progress) => {
    isProgress.progress = progress;
  }
  setLoading.message = (message) => {
    isProgress.message = message;
  }

  const consoleLoading = () => {

  }

  /**
   * This method is used to resize the text area
   */
  const inputResize = (rest = null) => {
    const tag = consoleInput[0];
    if (tag && tag.style) {
      tag.style.height = 'auto';
      tag.style.height = rest || tag.scrollHeight + 'px';
      tag.style.minHeight = rest || tag.scrollHeight + 'px';
    }
  }

  /**
   * This function runs in all events both enter and key press
   */
  const allEventMonitor = () => {
    currentHistoryIndex = 0;
  }

  /**
   * This function is used to scroll to bottom 
   */
  const scrollToBottom = () => {
    setTimeout(o => { terminal[0].scrollTop = terminal[0].scrollHeight; }, 0);
  }

  /**
   * This function monitors enter key event
   * @param {Event} event 
   */
  const enterMonitor = (event) => {
    scrollToBottom();
    if (event.which === 13) {
      const inputValue = consoleInput.val();
      onAction(inputValue);
      setInputToDefault();
      event.preventDefault();
      inputResize('20px');
    }
    allEventMonitor();
  }

  terminalConsole.click((event) => {
    consoleInput.focus();
  });

  consoleOutput.click((event) => {
    event.stopPropagation();
  });

  /**
   * This function used to output to console
   * @param {String/Element} output 
   */
  const setOutPut = (output) => {
    const eachActions = `<p class="d-block w-100 m-0 p-0" style="white-space: pre-wrap;">${output}</p>`;
    consoleOutput.append(eachActions);
    scrollToBottom();
  }

  /**
   * This function used for showing help
   */
  const showHelp = () => {
    readFile("resource/help.json").then((response, error) => {
      if (error) {
        setOutPut("resource file missing");
      } else {
        const parsedJson = JSON.parse(response);
        let helpOnScreen = '<table><tbody>';
        Object.keys(parsedJson).map(key => {
          helpOnScreen = `${helpOnScreen}
           <tr>
           <td>${key}</td><td>${parsedJson[key]}</td>
           </tr>`
        });
        helpOnScreen = `${helpOnScreen}</tbody></table>`;
        setOutPut(helpOnScreen);
      }
    });
  }

  /**
   * This function used to clear history
   */
  const clearHistory = () => {
    storageSet({ history: [] }, () => {
      setOutPut("history cleared.");
    });
  }

  /**
   * This function used to set history
   * @param {String} command 
   */
  const setHistory = (command) => {
    localHistory.push(command);
    storageGet(['history'], (response) => {
      let updatedHistory = [];
      if (Array.isArray(response.history)) {
        updatedHistory = response.history;
      }
      updatedHistory.push(command);
      storageSet({ history: updatedHistory }, () => {
        // console.log("history updated"); 
      });

    })
  }

  /**
   * This function used to show console history
   */
  const showHistory = () => {
    storageGet(['history'], (response) => {
      const history = response.history
      if (Array.isArray(history)) {
        for (let o = 0; o < history.length; o++) {
          setOutPut(`<span class="pl-1 d-flex">
            <span style="min-width: 2rem;" class="pr-2 text-right">${(o + 1)}</span>
            <span class="d-block">${history[o]}</span>
          </span>
          `);
        }
      }
    });
  }

  /**
   * This function is used to show prev or next command form history
   * @param {Number} direction 
   */
  const showHistoryInInput = (direction) => {
    currentHistoryIndex += direction;
    if (currentHistoryIndex <= localHistory.length) {
      const selectedHistory = localHistory[localHistory.length - currentHistoryIndex];
      if (selectedHistory)
        consoleInput.val(`${defaultText}${selectedHistory}`);
    }
  }

  /**
   * This function is used to open profile 
   */
  const goToProfile = (message) => new Promise((resolve) => {
    {
      setLoading(true, {
        key: "PAGE_READY",
        callback: resolve,
        callbackKey: "GOTO_PROFILE"
      }, message || "loading page ...");
      try {
        responseHandler("GOTO_PROFILE", {
          username: authorization.username
        }, o => {
          if (o) {
            clearProgress();
            setOutPut("Already in profile");
            resolve(o);
          }
        });
      } catch (error) {
        console.error(error);
      }
    }
  });

  const gotoFollowers = (message) => new Promise((resolve) => {
    {
      setLoading(true, {
        key: "PAGE_READY",
        callback: resolve,
        callbackKey: "GOTO_FOLLOWERS"
      }, message || "loading followers list ...");
      try {
        responseHandler("GOTO_FOLLOWERS", {
          username: authorization.username
        }, o => {
          if (o) {
            clearProgress();
            setOutPut("Already in followers");
            resolve(o);
          }
        });
      } catch (error) {
        console.error(error);
      }
    }
  });


  const gotoFollowing = (message) => new Promise((resolve) => {
    {
      setLoading(true, {
        key: "PAGE_READY",
        callback: resolve,
        callbackKey: "GOTO_FOLLOWING"
      }, message || "loading following users list ...");
      try {
        responseHandler("GOTO_FOLLOWING", {
          username: authorization.username
        }, o => {
          if (o) {
            clearProgress();
            setOutPut("Already in following users");
            resolve(o);
          }
        });
      } catch (error) {
        console.error(error);
      }
    }
  });

  /**
   * This function is used to run profile commands
   * @param {String} command 
   */
  const profileActions = async (command) => {
    const spitCommand = command.split(" ");
    const loadProfileResponse = await goToProfile();
    if (!loadProfileResponse) {
      setOutPut("Something went wrong.");
      return;
    }
    if (command.indexOf("followers") > -1) {
      followersActions();
    }

    console.log(command);
  }

  const startListing = (message) => new Promise((resolve) => {
    const responseManger = (o) => {
      if (o) {
        setLoading(true, null, message || "listing followers ...");
        resolve(o);
      }
    }
    try {
      responseHandler("LIST_FOLLOWERS", {
        username: authorization.username
      }, responseManger);
    } catch (error) {
      console.error(error);
      resolve(false);
    }
  });


  const startListingFollowing = (message) => new Promise((resolve) => {
    const responseManger = (o) => {
      if (o) {
        setLoading(true, null, message || "listing followers ...");
        resolve(o);
      }
    }
    try {
      responseHandler("LIST_FOLLOWING", {
        username: authorization.username
      }, responseManger);
    } catch (error) {
      console.error(error);
      resolve(false);
    }
  });


  /**
   * This function is used to show followers 
   */
  const showFollowers = () => {
    if (Array.isArray(localFollowersList)) {
      const currentCount = localFollowersList.length;
      if (currentCount > 0) {
        const users = [];
        const localList = localFollowersList.reverse();
        for (let o = 0; o < localList.length; o++) {
          const current = localList[o];
          const userImage = current ? current.image : null;
          const userUsername = current ? current.username : null
          const userName = (current && current.name) || userUsername;
          const hasFollowing = !!(current && current.status);
          users.push(`<span class="pl-1 pb-1 d-flex">
          <div class="media w-100 mr-1">`+ (userImage ?
              `<img src="${userImage}" width="33px" height="33px" class="align-self-start mr-1" alt="${userName}"> ` : "") +
            `<div class="media-body d-flex flex-column"> 
              <span class="pr-1 d-flex w-100 font-weight-bold">${userName} 
              `+ (hasFollowing ? (
              `<span class="text-success">
                <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-check2" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
              </svg>
              </span>`
            ) : "") + `
              <span class="mt-auto ml-auto badge small badge-pill badge-light">${o + 1}</span>
              </span>
              <small><a href="${rootUrl}/${userUsername}" target="_blank">${userUsername}</a></small>
            </div>
          </div> 
          </span>
          `);
        }
        setOutPut(users.join(""));
      } else {
        setOutPut(`Sorry you don't have any followers, or update followers list by running query 'followers list'`);
      }
    }
  }

  /**
   * This function is used to list followers
   */
  const listFollowers = async () => {
    const listResponse = await startListing();
    console.log(listResponse);
  };

  /**
   * This function is used to list followers
   */
  const listFollowing = async () => {
    const listResponse = await startListingFollowing();
    console.log(listResponse);
  };

  const listingFollowers = (payload, response) => {
    if (payload && payload.success) {
      const { data, hasMore } = payload;
      console.log(data);
      if (Array.isArray(data)) {
        data.forEach(each => {
          localFollowersList.push(each);
        });
      }
      const currentCount = localFollowersList.length;
      if (hasMore) {

        if (response) {
          response(true);
        }

        const callback = () => {
          console.log("called callback");
          try {
            responseHandler("LIST_FOLLOWERS", {
              username: authorization.username
            });
          } catch (error) {
            console.error(error);
            resolve(false);
          }
        }

        setLoading(true, {
          key: "PAGE_READY",
          callback,
          callbackKey: "LIST_FOLLOWERS",
        }, `loading from ${currentCount + 1} user ...`);

      } else {
        setLoading();
        setOutPut(`found ${currentCount} followers`);
      }

    }
  }


  const listingFollowings = (payload, response) => {
    if (payload && payload.success) {
      const { data, hasMore } = payload;
      console.log(data);
      if (Array.isArray(data)) {
        data.forEach(each => {
          localFollowingList.push(each);
        });
      }
      const currentCount = localFollowingList.length;
      if (hasMore) {

        if (response) {
          response(true);
        }

        const callback = () => {
          console.log("called callback");
          try {
            responseHandler("LIST_FOLLOWING", {
              username: authorization.username
            });
          } catch (error) {
            console.error(error);
            resolve(false);
          }
        }

        setLoading(true, {
          key: "PAGE_READY",
          callback,
          callbackKey: "LIST_FOLLOWING",
        }, `loading from ${currentCount + 1} user ...`);

      } else {
        setLoading();
        setOutPut(`found ${currentCount} following users`);
      }

    }
  }


  /**
   * This function is used to run followers commands
   * @param {String} command 
   */
  const followersActions = async (command) => {
    const spitCommand = command.split(" ");
    const loadFollowersResponse = await gotoFollowers();
    if (!loadFollowersResponse) {
      setOutPut("Something went wrong.");
      return;
    }

    if (command.indexOf(" list") > -1 || command.indexOf(" -l") > -1) {
      const listFollowersResponse = await listFollowers();
      console.log(listFollowersResponse);
    }

    if (command.indexOf("show") > -1 || command.indexOf(" -s") > -1) {
      showFollowers();
    }

    console.log(loadFollowersResponse);
  }



  /**
   * This function is used to run following commands
   * @param {String} command 
   */
  const followingActions = async (command) => {
    const spitCommand = command.split(" ");
    const loadFollowersResponse = await gotoFollowing();
    if (!loadFollowersResponse) {
      setOutPut("Something went wrong.");
      return;
    }

    if (command.indexOf(" list") > -1 || command.indexOf(" -l") > -1) {
      const listFollowingResponse = await listFollowing();
      console.log(listFollowingResponse);
    }

    // if (command.indexOf("show") > -1 || command.indexOf(" -s") > -1) {
    //   showFollowers();
    // }

    console.log(loadFollowersResponse);
  }

  const doTheAction = (command) => {
    command = command.replace(defaultTextRegx, "");
    command = command.trim();
    command = command.replace(/\s\s+/g, ' ');
    if (command.length < 1) return;
    setHistory(command);
    let output = "";
    switch (command) {
      case "clear":
        consoleOutput.html("");
        break;
      case "help":
        showHelp();
        break;
      case "history":
        showHistory();
        break;
      case "history -c":
      case "history --clear":
        clearHistory();
        break;
      case String(command.match(/^profile*/) && command):
        profileActions(command);
        break;
      case String(command.match(/^followers*/) && command):
        followersActions(command);
        break;
      case String(command.match(/^following*/) && command):
        followingActions(command);
        break;
      default:
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

  doc.on('change cut paste drop propertychange input', `#${consoleInput.attr("id")}`, (event) => {
    event.preventDefault();
    const inLast = lastInput.replace(defaultText, "");
    let currentInput = consoleInput.val();
    if (currentInput.substring(0, defaultText.length).match(defaultText)) {
      if (currentInput.length < 1) {
        currentInput = defaultText;
      } else {
        currentInput = defaultText + inLast;
      }
    } else if (currentInput.length <= defaultText.length) {
      currentInput = defaultText;
    }

    allEventMonitor();
    consoleInput.val(currentInput);
    window.setTimeout(inputResize, 0);
    scrollToBottom();
    lastInput = currentInput;
    if (event) {
      enterMonitor(event);
    }
  });

  $(document).on('keydown', function (e) {
    // You may replace `c` with whatever key you want
    if ((e.metaKey || e.ctrlKey) && (String.fromCharCode(e.which).toLowerCase() === 'c')) {
      let currentInput = consoleInput.val();
      setOutPut(currentInput);
      clearProgress();
    }
  });
  consoleInput.keypress((event) => {
    if (event && !isProgress.active) {
      enterMonitor(event);
    }
  });

  consoleInput.keydown((event) => {
    if (event && !isProgress.active) {
      if (event.which === 37 || event.which === 40) {
        showHistoryInInput(-1);
        event.preventDefault();
      } else if (event.which === 38 || event.which === 39) {
        showHistoryInInput(+1);
        event.preventDefault();
      }
    }
  });















  const contentScriptReady = (payload, payloadKey) => {
    console.warn(payload);
    if (isProgress.active && isProgress.payload) {
      if (isProgress.payload.key === payloadKey) {
        if (isProgress.payload.callback && isProgress.payload.callbackKey) {
          switch (isProgress.payload.callbackKey) {
            case "GOTO_PROFILE":
              responseHandler(isProgress.payload.callbackKey, {
                username: authorization.username
              }, o => {
                if (o) {
                  setOutPut("Profile is ready");
                  isProgress.payload.callback(true);
                  clearProgress();
                }
              });
              break;
            case "GOTO_FOLLOWERS":
              responseHandler(isProgress.payload.callbackKey, {
                username: authorization.username
              }, o => {
                if (o) {
                  setOutPut("followers is ready");
                  isProgress.payload.callback(true);
                  clearProgress();
                }
              });
              break;

            case "GOTO_FOLLOWING":
              responseHandler(isProgress.payload.callbackKey, {
                username: authorization.username
              }, o => {
                if (o) {
                  setOutPut("following users is ready");
                  isProgress.payload.callback(true);
                  clearProgress();
                }
              });
              break;
            case "LIST_FOLLOWERS":
              isProgress.payload.callback(true);
              break;
            case "LIST_FOLLOWING":
              isProgress.payload.callback(true);
              break;



          }
        }
      }
    }
  }

  /**============================================================================================================================= */
  const requestHandler = (key, payload, response) => {
    switch (key) {
      case "AUTHENTICATION":
        authenticate(payload);
        break;
      case "PAGE_READY":
        contentScriptReady(payload, key);
        break;
      case "LIST_FOLLOWERS":
        listingFollowers(payload, response);
        break;
      case "LIST_FOLLOWING":
        listingFollowings(payload, response);
      default:
        console.log("no valid key match");
    }
  }

  const init = () => {
    /**
     * Catching all request into content page
     */
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
      console.log("in P", request);
      if (request && request.dir && request.key && request.dir === "TOP") {
        requestHandler(request.key, request.payload, sendResponse);
      }
    });

    $("body").removeAttr("isLoading");
    responseHandler("AUTHENTICATION");
  };

  init();
});

