const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  createAppMenu();
}

function createAppMenu() {
  const template = [
    {
      label: '文件(F)',
      submenu: [
        { label: '新建', accelerator: 'Ctrl+N', click: () => sendToRenderer('file-new') },
        { label: '打开...', accelerator: 'Ctrl+O', click: () => sendToRenderer('file-open') },
        { type: 'separator' },
        { label: '保存', accelerator: 'Ctrl+S', click: () => sendToRenderer('file-save') },
        { label: '另存为...', accelerator: 'Ctrl+Shift+S', click: () => sendToRenderer('file-save-as') },
        { type: 'separator' },
        { role: 'quit', label: '关闭' }
      ]
    },
    {
      label: '编辑(E)',
      submenu: [
      { role: 'undo', label: '撤销', accelerator: 'Ctrl+Z' },
      { role: 'redo', label: '重做', accelerator: 'Ctrl+Y' },
      { type: 'separator' },
      { role: 'cut', label: '剪切', accelerator: 'Ctrl+X' },
      { role: 'copy', label: '复制', accelerator: 'Ctrl+C' },
      { label: '拷贝图片', click: () => sendToRenderer('edit-copy-image') },
      { role: 'paste', label: '粘贴', accelerator: 'Ctrl+V' },
      { type: 'separator' },
      { label: '复制为纯文本', click: () => sendToRenderer('edit-copy-plain') },
      { label: '复制为 Markdown', accelerator: 'Ctrl+Shift+C', click: () => sendToRenderer('edit-copy-md') },
      { label: '复制为 HTML 代码', click: () => sendToRenderer('edit-copy-html') },
      { label: '复制内容并保留格式', click: () => sendToRenderer('edit-copy-rich') },
      { type: 'separator' },
      { label: '粘贴为纯文本', accelerator: 'Ctrl+Shift+V', click: () => sendToRenderer('edit-paste-plain') },
      { type: 'separator' },
      {
        label: '选择',
        submenu: [{ role: 'selectAll', label: '全选' }]
      },
      { label: '上移表行', accelerator: 'Alt+Up', click: () => sendToRenderer('edit-move-row-up') },
      { label: '下移表行', accelerator: 'Alt+Down', click: () => sendToRenderer('edit-move-row-down') },
      { type: 'separator' },
      { label: '删除', click: () => sendToRenderer('edit-delete') },
      {
        label: '删除范围',
        submenu: [
          { label: '删除本段', click: () => sendToRenderer('edit-delete-range-paragraph') },
          { label: '删除本行', click: () => sendToRenderer('edit-delete-range-line') }
        ]
      },
      { type: 'separator' },
      {
        label: '数学工具',
        submenu: [{ label: '公式块', click: () => sendToRenderer('edit-math-block') }]
      },
      { type: 'separator' },
      { label: '智能标点', type: 'checkbox', checked: false, click: () => sendToRenderer('edit-smart-punctuation') },
      {
        label: '换行符',
        submenu: [
          { label: '转换为 \\n', click: () => sendToRenderer('edit-newline-n') },
          { label: '转换为 \\r\\n', click: () => sendToRenderer('edit-newline-rn') }
        ]
      },
      { label: '空格与换行', click: () => sendToRenderer('edit-spaces-newlines') },
      { label: '拼写检查...', click: () => sendToRenderer('edit-spellcheck') },
      { type: 'separator' },
      {
        label: '查找和替换',
        submenu: [
          { label: '查找', accelerator: 'Ctrl+F', click: () => sendToRenderer('edit-find') },
          { label: '查找下一个', accelerator: 'F3', click: () => sendToRenderer('edit-find-next') },
          { label: '替换', accelerator: 'Ctrl+H', click: () => sendToRenderer('edit-replace') }
        ]
      },
      { label: '表情与符号', accelerator: 'Super+.', click: () => sendToRenderer('edit-emoji') }
      ]
    },
    {
      label: '段落(P)',
      submenu: [
        {
          label: '一级标题',
          accelerator: 'Ctrl+1',
          click: () => sendToRenderer('toggle-heading-1')
        },
        {
          label: '二级标题',
          accelerator: 'Ctrl+2',
          click: () => sendToRenderer('toggle-heading-2')
        },
        {
          label: '三级标题',
          accelerator: 'Ctrl+3',
          click: () => sendToRenderer('toggle-heading-3')
        },
        { type: 'separator' },
        {
          label: '段落',
          accelerator: 'Ctrl+0',
          click: () => sendToRenderer('toggle-paragraph')
        },
        { type: 'separator' },
        {
          label: '有序列表',
          accelerator: 'Ctrl+Shift+[',
          click: () => sendToRenderer('toggle-ol')
        },
        {
          label: '无序列表',
          accelerator: 'Ctrl+Shift+]',
          click: () => sendToRenderer('toggle-ul')
        },
        {
          label: '任务列表',
          accelerator: 'Ctrl+Shift+X',
          click: () => sendToRenderer('toggle-task-list')
        }
      ]
    },
    {
      label: '格式(O)',
      submenu: [
        { label: '加粗', accelerator: 'Ctrl+B', click: () => sendToRenderer('toggle-bold') },
        { label: '斜体', accelerator: 'Ctrl+I', click: () => sendToRenderer('toggle-italic') },
        { label: '下划线', accelerator: 'Ctrl+U', click: () => sendToRenderer('toggle-underline') },
        { type: 'separator' },
        {
          label: '代码',
          accelerator: 'Ctrl+Shift+`',
          click: () => sendToRenderer('toggle-inline-code')
        },
        {
          label: '代码块',
          accelerator: 'Ctrl+Shift+K',
          click: () => sendToRenderer('insert-code-block')
        }
      ]
    },
    {
      label: '视图(V)',
      submenu: [
        {
          label: '源代码模式',
          accelerator: 'Ctrl+/',
          click: () => sendToRenderer('toggle-source-mode')
        },
        {
          label: '实标尺寸',
          accelerator: 'Ctrl+Shift+9',
          click: () => sendToRenderer('reset-zoom')
        },
        { role: 'togglefullscreen', label: '切换全屏' },
        { type: 'separator' },
        { role: 'reload', label: '重新加载' },
        { role: 'toggleDevTools', label: '开发者工具' }
      ]
    },
    {
      label: '主题(T)',
      submenu: [
        { label: 'Github', type: 'radio', checked: true, click: () => sendToRenderer('theme-github') },
        { label: 'Night', type: 'radio', click: () => sendToRenderer('theme-night') }
      ]
    },
    {
      label: '帮助(H)',
      submenu: [
        { label: '更新日志', click: () => sendToRenderer('help-changelog') },
        { label: '隐私条款', click: () => sendToRenderer('help-privacy') },
        { label: '官方网站', click: () => sendToRenderer('help-website') },
      {
        label: '反馈',
        click: () => {
          shell.openExternal('https://github.com/HobartTimothy/md-edit/issues');
        }
      },
        { type: 'separator' },
        { label: '检查更新...', click: () => sendToRenderer('help-check-updates') },
        { label: '关于', click: () => sendToRenderer('help-about') }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function sendToRenderer(channel, payload) {
  if (mainWindow) {
    mainWindow.webContents.send(channel, payload);
  }
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});


