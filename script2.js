function fauxTerm(config) {
  
  var term = config.el || document.getElementById('term');
  var termBuffer = config.initialMessage || '';
  var lineBuffer = config.initialLine || '';
  var cwd = config.cwd || "~/";
  var tags = config.tags || ['red', 'blue', 'white', 'bold'];
  var processCommand = config.cmd || false;
  var maxBufferLength = config.maxBufferLength || 8192;
  var commandHistory = [];
  var currentCommandIndex = -1;
  var maxCommandHistory = config.maxCommandHistory || 100;
  var autoFocus = config.autoFocus || false;
  var coreCmds = {
    "clear": clear
  };
    
  var fauxInput = document.createElement('textarea');
  fauxInput.className = "faux-input";
  document.body.appendChild(fauxInput);

  if ( autoFocus ) {
    fauxInput.focus();
  }
  
  
  function getLeader() {
    return cwd + "> ";
  }
  
  function renderBuffer() {
    renderMsg(termBuffer)
  }
  function renderTerm(c) {
    renderMsg(termBuffer + c + getLeader() + lineBuffer)
  }
  function renderMsg(msg) {
    var bell = '<span class="bell"></span>';
    term.innerHTML = msg;
    term.innerHTML += bell;
    term.scrollTop = term.scrollHeight;
  }
    
  function writeToBuffer(str) {
    termBuffer += str;
      
    //Stop the buffer getting massive.
    if ( termBuffer.length > maxBufferLength ) {
      var diff = termBuffer.length - maxBufferLength;
      termBuffer = termBuffer.substr(diff);
    }
    
  }
    
  function renderStdOut(str) {
    // Replaces supported tags with the span class equivalent.
    var i = 0, max = tags.length;
    for ( i; i<max; i++ ) {
      console.log(tags[i]);
      var start = new RegExp('{' + tags[i] + '}', 'g');
      var end = new RegExp('{/' + tags[i] + '}', 'g');
      str = str.replace(start, '<span class="' + tags[i] + '">');
      str = str.replace(end, '</span>');
    }
    return str;
  }
  function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
  }  

  // This function prints a text string one character at a time with a constant delay between characters.
  function typeStdOut(str) {
    var index = 0;
    var newLineCharacter="\n"
    var timePerLetter=150
    var printNextLetter = function() {
      if (index < str.length) {
        var CHAR = str[index];

        switch(CHAR) {
          case newLineCharacter:
            stdout = renderStdOut("<br>");
            break;
          default:
            stdout = renderStdOut("{red}{bold}" + CHAR + "{/bold}{/red}");
            break;
        } 
;
        index++;
        
        writeToBuffer(stdout);
        renderBuffer();
        setTimeout(printNextLetter, timePerLetter);
      } else {
        //stdout="\n" + "[pNL]" + getLeader() + lineBuffer
        //lineBuffer=""
        //writeToBuffer(stdout);
        //renderBuffer();
        writeToBuffer("\n");
        renderTerm("");
      }
    }
  
    printNextLetter();
    
    
  }

  function clear(argv, argc) {
    termBuffer = "";
    return "";
  }
    
  function isCoreCommand(line) {
    if ( coreCmds.hasOwnProperty(line) ) {
      return true;
    }
    return false;
  }
    
  function coreCommand(argv, argc) {
      
    var cmd = argv[0];
    return coreCmds[cmd](argv, argc);
      
  }
  

  // New line processing code so we can leave the original unchanged.
  async function processLine() {

    //Dispatch command
    var stdout, line = lineBuffer, argv = line.split(" "), argc = argv.length;
      
    var cmd = argv[0];
    
    // trick to replicate the exact line so we can appear to go to the next
    lineBuffer += "\n";
    writeToBuffer(getLeader() + lineBuffer );
    lineBuffer = "";

    //lineBuffer += "\n";
    //writeToBuffer( lineBuffer );
    //renderTerm()

    await typeStdOut("One letter at a time?");
    addLineToHistory(line);

    //renderTerm();
  }

    
  function addLineToHistory(line) {
    commandHistory.unshift( line );
    currentCommandIndex = -1;
    if ( commandHistory.length > maxCommandHistory ) {
      console.log('reducing command history size');
      console.log(commandHistory.length);
      var diff = commandHistory.length - maxCommandHistory;
      commandHistory.splice(commandHistory.length -1, diff);
      console.log(commandHistory.length);
    }
  }
    
  function isInputKey(keyCode) {
    var inputKeyMap = [32,190,192,189,187,220,221,219,222,186,188,191];
    if ( inputKeyMap.indexOf(keyCode) > -1 ) {
      return true;
    }
    return false;
  }
    
  function toggleCommandHistory(direction) {
      
    var max = commandHistory.length -1;
    var newIndex = currentCommandIndex + direction;
      
    if ( newIndex < -1 ) newIndex = -1;
    if ( newIndex >= commandHistory.length) newIndex = commandHistory.length -1;
      
    if ( newIndex !== currentCommandIndex ) {
      currentCommandIndex = newIndex;
    }
      
    if ( newIndex > -1 ) {
      //Change line to something from history.
      lineBuffer = commandHistory[newIndex];
    } else {
      //Blank line...
      lineBuffer = "";
    }
      
      
  }
 
  async function acceptInput(e) {
    e.preventDefault();
      
    fauxInput.value = "";
      
    if ( e.keyCode >= 48 && e.keyCode <= 90 || isInputKey(e.keyCode) ) {
      if (! e.ctrlKey ) {
        //Character input
        lineBuffer += e.key;
        renderTerm("");
      } else {
        //Hot key input? I.e Ctrl+C
      }
    } else if ( e.keyCode === 13 ) {
      if (await processLine()){
      lineBuffer += "\n";
      writeToBuffer(getLeader() + lineBuffer );
      renderBuffer();
      lineBuffer = "";
      //renderTerm();
      }
    } else if ( e.keyCode === 9 ) {
      lineBuffer += "\t";
      renderTerm("");
    } else if ( e.keyCode === 38 ) {
      toggleCommandHistory(1);
    } else if ( e.keyCode === 40 ) {
      toggleCommandHistory(-1);
    }
    else if ( e.key === "Backspace" ) {
      lineBuffer = lineBuffer.substr(0, lineBuffer.length -1);
      renderTerm("");
    }
  
    //renderTerm();
  }
  
  term.addEventListener('click', function(e){
    fauxInput.focus();
    term.classList.add('term-focus');
  });
  fauxInput.addEventListener('keydown', acceptInput);
  fauxInput.addEventListener('blur', function(e){
    term.classList.remove('term-focus');
  });
  renderTerm("");
    
}
  
  
  
  
  var myTerm = new fauxTerm({
    el: document.getElementById("term"),
    cwd: "222:",
    initialMessage: "222 - DO NOT ENTER!\n",
    tags: ['red','blue','white', 'bold'],
    maxBufferLength: 8192,
    maxCommandHistory: 500,
    autoFocus: true,
    cmd: function(argv, argc) {
      console.log(argv);
      return false;
    }
  });
  