const { app, dialog, ipcMain, Menu, BrowserWindow } = require('electron');
const fs = require("fs");

const template = [
    {
        label: 'File',
        submenu: [
            {
                label: "New",
                accelerator: "Ctrl+N",
                click: new_file
            },
            { type: 'separator' },
            { 
                label: "Open", 
                accelerator: "Ctrl+O",
                click: open_file 
            },
            { type: 'separator' },
            {
                label: "Save",
                accelerator: "Ctrl+S",
                click: save_file
            },
            {
                label: "Save As",
                accelerator: "Ctrl+Shift+S",
                click: save_file_as
            },
            { type: 'separator' },
            { role: 'quit' },
        ]
    },
    {
        label: 'Edit',
        submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
        ]
    },
    {
        label: 'View',
        submenu: [
            { role: 'reload' },
            { role: 'forceReload' },
            { role: 'toggleDevTools' },
            { type: 'separator' },
            { role: 'resetZoom' },
            { role: 'zoomIn' },
            { role: 'zoomOut' },
            { type: 'separator' },
            { role: 'togglefullscreen' }
        ]
    },
    {
        label: 'Window',
        submenu: [
            { role: 'minimize' },
            { role: 'zoom' },  
        ]
    },
    {
        role: 'help',
        submenu: [
        ]
    }
]
  
const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

let win = null;
function createWindow () {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
        },
        icon: "logo_initial.png"
    })

    win.on('close', function(e) {
        let response = dialog.showMessageBoxSync(this, {
            type: 'question',
            buttons: ['Yes', 'No'],
            title: 'Confirm',
            message: 'Are you sure you want to quit?',
        })
        if (response == 1) {
            e.preventDefault();
        }
    });

    win.maximize()
    win.loadFile('index.html')
    //win.webContents.openDevTools()
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})


let current_file_path = null;
let current_file_json = {};
function open_file(menuItem, browserWindow, event) {
    dialog.showMessageBox(win, {
        type: "warning",
        buttons: ["OK", "Cancel"],
        defaultId: 0,
        title: "Open File",
        message: "You will lose any unsaved data.",
    }).then(result => {
        if (result.response == 1) {
            return;
        } 
        dialog.showOpenDialog(win, { 
            properties: ["openFile"],
            filters: [{name: "TOM Project (*.tomproj)", extensions: ["tomproj"]}], 
        }).then(result => {
            console.log(result.canceled)
            console.log(result.filePaths)

            if (!result.canceled) {
                current_file_path = result.filePaths[0];
                fs.readFile(current_file_path, null, function(err, data) {
                    let json = JSON.parse(data);
                    current_file_json = json
                    console.log(current_file_json);
                    win.webContents.send("open_file", current_file_json);
                });
            }
        }).catch(err => {
            console.log(err)
        });
    }).catch(err => {
        console.log(err)
    });
}

function save_file(menuItem, browserWindow, event) {
    if (current_file_path == null) {
        save_file_as(menuItem, browserWindow, event);
    }
    else {
        win.webContents.send("save_file", current_file_json);
        ipcMain.on("json_updated", function(event, json) {
            let data = JSON.stringify(json);
            fs.writeFile(current_file_path, data, function() {
                console.log("File written");
            });
        });
    }
}

function save_file_as (menuItem, browserWindow, event) {
    dialog.showSaveDialog(win, {
        filters: [{name: "TOM Project (*.tomproj)", extensions: ["tomproj"]}], 
    }).then(result => {
        console.log(result.canceled)
        console.log(result.filePath)
        if (!result.canceled) {
            current_file_path = result.filePath;
            win.webContents.send("save_file", current_file_json);
            ipcMain.on("json_updated", function(event, json) {
                let data = JSON.stringify(json);
                fs.writeFile(current_file_path, data, function() {
                    console.log("File written");
                });
            });
        }
    }).catch(err => {
        console.log(err)
    });
}

function new_file (menuItem, browserWindow, event) {
    dialog.showMessageBox(win, {
        type: "warning",
        buttons: ["OK", "Cancel"],
        defaultId: 0,
        title: "New File",
        message: "You will lose any unsaved data.",
    }).then(result => {
        if (result.response == 0) {
            current_file_path = null;
            current_file_json = {};
            win.webContents.send("open_file", current_file_json);
        }
    }).catch(err => {
        console.log(err)
    });
}