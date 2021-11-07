function fauxTerm(config) {
  
  var term = config.el || document.getElementById('term');
  var termBuffer = config.initialMessage || '';
  var lineBuffer = config.initialLine || '';
  var prompt = config.prompt || "@>";

  // TO BE EVALUATED
  var tags = config.tags || ['red', 'blue', 'white', 'bold'];
  var processCommand = config.cmd || false;
  var maxBufferLength = config.maxBufferLength || 8192;
  var commandHistory = [];
  var currentCommandIndex = -1;
  var autoFocus = config.autoFocus || true;
  

  // OLD STUFF
  //var cwd = config.cwd || "~/";
  //var coreCmds = {"clear": clear};
  //var maxCommandHistory = config.maxCommandHistory || 100;

  var fauxInput = document.createElement('textarea');
    fauxInput.className = "faux-input";
    document.body.appendChild(fauxInput);

  if ( autoFocus ) {
    fauxInput.focus();
  }

  function getLeader() {
    return prompt;
  }

/***************************************************************/
  // RENDER FUNCTIONS
  function renderMsg(msg) {
    // This is the root render function for block text.
    var bell = '<span class="bell"></span>';
    term.innerHTML = msg;
    term.innerHTML += bell;
    term.scrollTop = term.scrollHeight;
  }
  function renderBuffer() {
    renderMsg(termBuffer)
  }
  function renderTerm() {
    renderMsg(termBuffer + getLeader() + lineBuffer)
  }
/***************************************************************/


/***************************************************************/
  function translateTags(str) {
    // This is the root render function for typed text.
    // Replaces supported tags with the span class equivalent.
    var i = 0, max = tags.length;
    for ( i; i<max; i++ ) {
      var start = new RegExp('{' + tags[i] + '}', 'g');
      var end = new RegExp('{/' + tags[i] + '}', 'g');
      str = str.replace(start, '<span class="' + tags[i] + '">');
      str = str.replace(end, '</span>');
    }
    return str;
  }

  function addToBuffer(str) {
    termBuffer += str;
      
    //Stop the buffer getting massive.
    if ( termBuffer.length > maxBufferLength ) {
      var diff = termBuffer.length - maxBufferLength;
      termBuffer = termBuffer.substr(diff);
    }
  }


  // This function prints a text string one character at a time with a constant delay between characters.
  function typeMsg(str) {
    var index = 0;
    var newLineCharacter="\n"
    var timePerLetter=150
    var printNextLetter = function() {
      if (index < str.length) {
        var CHAR = str[index];

        // Translate any known tags in the message.
        switch(CHAR) {
          case newLineCharacter:
            stdout = translateTags("<br>");
            break;
          default:
            stdout = translateTags("{red}{bold}" + CHAR + "{/bold}{/red}");
            break;
        } 
      
        index++;

        addToBuffer(stdout);
        renderBuffer();
        setTimeout(printNextLetter, timePerLetter);
      } else {
        addToBuffer("\n");
        renderTerm("");
      }
    }

    printNextLetter();
  }

  // New line processing code so we can leave the original unchanged.
  async function processLine() {

    //Dispatch command
    var stdout, line = lineBuffer, argv = line.split(" "), argc = argv.length;
    var cmd = argv[0];
    
    // trick to replicate the exact line so we can appear to go to the next
    addToBuffer(getLeader() + lineBuffer + "\n");
    lineBuffer = "";


    await typeMsg("One letter at a time?");

  }

/***************************************************************/
// Process input lines.
  function isInputKey(keyCode) {
    var inputKeyMap = [32,190,192,189,187,220,221,219,222,186,188,191];
    if ( inputKeyMap.indexOf(keyCode) > -1 ) {
      return true;
    }
    return false;
  }

  async function acceptInput(e) {
    e.preventDefault();
      
    fauxInput.value = "";
      
    if ( e.keyCode >= 48 && e.keyCode <= 90 || isInputKey(e.keyCode) ) {
      if (! e.ctrlKey ) {
        //Character input
        lineBuffer += e.key;
        console.log("Render from acceptInput for key in range")
        renderTerm("");
      } else {
        //Hot key input? I.e Ctrl+C
      }
    } else if ( e.keyCode === 13 ) {
      if (await processLine()){
      lineBuffer += "\n";
      addToBuffer(getLeader() + lineBuffer );
      renderBuffer();
      lineBuffer = "";
      //renderTerm();
      }
    } else if ( e.keyCode === 9 ) {
      lineBuffer += "\t";
      renderTerm("");
    } else if ( e.key === "Backspace" ) {
      lineBuffer = lineBuffer.substr(0, lineBuffer.length -1);
      renderTerm("");
    }
  
  }
  /***************************************************************/

  /***************************************************************/
  // Get it going!
  term.addEventListener('click', function(e){
    fauxInput.focus();
    term.classList.add('term-focus');
  });
  fauxInput.addEventListener('keydown', acceptInput);
  fauxInput.addEventListener('blur', function(e){
    term.classList.remove('term-focus');
  });

  console.log("Render from event listener.")
  renderTerm("");
}


/***************************************************************/
// Create the terminal. 
var myTerm = new fauxTerm({
  el: document.getElementById("term"),
  cwd: "333:",
  initialMessage: "333 - DO NOT ENTER!\n",
  tags: ['red','blue','white', 'bold'],
  maxBufferLength: 8192,
  autoFocus: true,
  cmd: function(argv, argc) {
    console.log(argv);
    return false;
  }
});