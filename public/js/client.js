window.onload = function () {
    let socket ;
    const documentId = new URL(window.location.href).pathname.split('/')[1] || 'test';
    
    const handle = document.getElementById('handle');
    const register = document.getElementById('register');
    const registerPage = document.getElementById('registerPage');
    
    const editor = document.getElementById('editor');
    const textarea = document.getElementById('textarea');
    // code editor styling
    var Codeeditor = CodeMirror.fromTextArea(document.getElementById("textarea"), {
                styleActiveLine: true,
                lineNumbers: true,
                matchBrackets: true,
                theme: 'cobalt',
                mode: "text/x-csrc",
            }); 
      var minLines = 14;
      var startingValue = '';
      for (var i = 0; i < minLines; i++) {
        startingValue += '\n';
      }
      // console.log(editor)
      Codeeditor.setValue(startingValue);

    let syncValue = Array();
    let keypressed = false;

    function addEditor(writer) {
        var ul = document.getElementById("editors");
        var li = document.createElement("li");
        li.appendChild(document.createTextNode(writer.name));
        li.className = "list-group-item";
        li.id = writer.id;
        ul.appendChild(li);
    }

    function removeElement(id) {
        var elem = document.getElementById(id);
        return elem.parentNode.removeChild(elem);
    }
    function applyLocalChanges() {
        if (keypressed) {
            let currentData = Codeeditor.getValue();
            // console.log(currentData);
            let input = Array.from(syncValue);
            let output = Array.from(currentData);
            let changes = getChanges(input, output);
            applyChanges(input, changes);
            if (output.join('') == input.join('')) {
                socket.emit('content_change', {
                    documentId: documentId,
                    changes: changes
                });
                syncValue = input;
            }
            keypressed = false;
        }
    }
    function setSocketEvents() {
        socket.on('content_change', (incomingChanges) => {
            let input = Array.from(syncValue);
            applyChanges(input, incomingChanges);
            syncValue = input;
            applyLocalChanges();

            // let ranges = editor.getSelection().getRanges();
            Codeeditor.setValue(syncValue.join(''))
            // editor.getSelection().selectRanges(ranges);
        });
        socket.on('register', (data) => {
            addEditor(data);
        });

        socket.on('user_left', (data) => {
            removeElement(data.id);
        });
        socket.on('members', (members) => {
            members.forEach(member => {
                addEditor(member);
            });
            socket.off('members');
        });
    }

    function registerUserListener() {
        handle.style.display = 'none';
        register.style.display = 'none';
        registerPage.style.display = 'none';


        const editorBlock = document.getElementById('editor-block');
        editorBlock.style.display = 'flex';
        syncValue = "";
        // socket = io();
        name=handle.value;
        user = handle.value;
        socket.emit('register', {
            handle: handle.value,
            documentId: documentId
        });
        setSocketEvents();
    }

    function getChanges(input, output) {
      return diffToChanges(diff(input, output), output);
    }
    
    function applyChanges(input, changes) {
      changes.forEach(change => {
        if (change.type == 'insert') {
                input.splice(change.index, 0, ...change.values);
            } else if (change.type == 'delete') {
                input.splice(change.index, change.howMany);
            }
        });
    }

    var timeout = setTimeout(null, 0);
    editor.addEventListener('keypress', () => {
        clearTimeout(timeout);
        keypressed = true;
        timeout = setTimeout(applyLocalChanges, 1000);
    });

    register.addEventListener('click', registerUserListener);

    
    socket = io('/')
}

function Share() {
  document.getElementById("share-modal").style.display = "block";
  document.getElementById("url").value = window.location.href;
}

function Close() {
  document.getElementById("share-modal").style.display = "none";
}

function CopyToClipboard() {
  var textBox = document.getElementById("url");
  textBox.select();
  textBox.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(textBox.value);
  Close();
  alert("Copied the URL. Please share it with the other users so they can access the page.");
  //   alert(textBox.value);
}