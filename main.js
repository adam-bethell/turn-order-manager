const { app, dialog, ipcMain, Menu, BrowserWindow } = require('electron')
const fs = require("fs");

const template = [
    {
        label: 'File',
        submenu: [
            {
                label: "Save",
                accelerator: "Ctrl+S",
                click: save_file
            },
            { 
                label: "Open", 
                accelerator: "Ctrl+O",
                click: open_file 
            },
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
        },
        icon: "logo_initial.png"
    })

    win.maximize()
    win.loadFile('index.html')
    win.webContents.openDevTools()
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
let current_file_json = null
function open_file(menuItem, browserWindow, event) {
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

}