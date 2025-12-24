const { marked } = require('marked');
const { ipcRenderer } = require('electron');

const editor = document.getElementById('editor');
const preview = document.getElementById('preview');

function renderMarkdown(text) {
  const rawHtml = marked.parse(text || '');
  // For桌面本地应用，简单场景下可以直接使用 marked 的输出
  preview.innerHTML = rawHtml;
}

editor.addEventListener('input', () => {
  renderMarkdown(editor.value);
});

// Basic formatting helpers
function surroundSelection(before, after = before) {
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const value = editor.value;
  const selected = value.slice(start, end);
  const newText = before + selected + after;
  editor.value = value.slice(0, start) + newText + value.slice(end);
  editor.focus();
  editor.selectionStart = start + before.length;
  editor.selectionEnd = start + before.length + selected.length;
  renderMarkdown(editor.value);
}

function toggleLinePrefix(prefix) {
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const value = editor.value;
  const before = value.slice(0, start);
  const selected = value.slice(start, end);
  const after = value.slice(end);

  const lines = selected.split('\n').map((line) => {
    if (line.startsWith(prefix)) {
      return line.slice(prefix.length);
    }
    return prefix + line;
  });

  const newSelected = lines.join('\n');
  editor.value = before + newSelected + after;
  editor.focus();
  editor.selectionStart = start;
  editor.selectionEnd = start + newSelected.length;
  renderMarkdown(editor.value);
}

function handleMenuCommand(channel) {
  switch (channel) {
    case 'toggle-bold':
      surroundSelection('**', '**');
      break;
    case 'toggle-italic':
      surroundSelection('*', '*');
      break;
    case 'toggle-inline-code':
      surroundSelection('`', '`');
      break;
    case 'insert-code-block':
      surroundSelection('\n```language\n', '\n```\n');
      break;
    case 'toggle-heading-1':
      toggleLinePrefix('# ');
      break;
    case 'toggle-heading-2':
      toggleLinePrefix('## ');
      break;
    case 'toggle-heading-3':
      toggleLinePrefix('### ');
      break;
    case 'toggle-ol':
      toggleLinePrefix('1. ');
      break;
    case 'toggle-ul':
      toggleLinePrefix('- ');
      break;
    case 'toggle-task-list':
      toggleLinePrefix('- [ ] ');
      break;
    case 'theme-github':
      document.body.classList.remove('night-theme');
      document.body.classList.add('github-theme');
      break;
    case 'theme-night':
      document.body.classList.remove('github-theme');
      document.body.classList.add('night-theme');
      break;
    case 'help-whats-new':
      alert('“最新内容”功能待实现。');
      break;
    case 'help-quick-start':
      alert('“快速上手”功能待实现。');
      break;
    case 'help-markdown-ref':
      alert('“Markdown 参考手册”功能待实现。');
      break;
    case 'help-pandoc':
      alert('“安装并使用 Pandoc”功能待实现。');
      break;
    case 'help-custom-themes':
      alert('“自定义主题”功能待实现。');
      break;
    case 'help-images':
      alert('“在编辑器中使用图片”功能待实现。');
      break;
    case 'help-data-recovery':
      alert('“数据恢复与版本控制”功能待实现。');
      break;
    case 'help-more-resources':
      alert('“更多资源”功能待实现。');
      break;
    case 'help-log':
      alert('“日志”查看功能待实现。');
      break;
    case 'help-changelog':
      alert('“更新日志”功能待实现。');
      break;
    case 'help-privacy':
      alert('“隐私条款”功能待实现。');
      break;
    case 'help-website':
      alert('“官方网站”功能待实现。');
      break;
    case 'help-feedback':
      alert('“反馈”功能待实现。');
      break;
    case 'help-check-updates':
      alert('“检查更新”功能待实现。');
      break;
    case 'help-about':
      alert('md-edit\n一个简易的 Markdown 文本编辑器。');
      break;
    default:
      break;
  }
}

// 监听主进程发送的菜单命令
const channels = [
  'file-new',
  'file-open',
  'file-save',
  'file-save-as',
  'toggle-heading-1',
  'toggle-heading-2',
  'toggle-heading-3',
  'toggle-paragraph',
  'toggle-ol',
  'toggle-ul',
  'toggle-task-list',
  'toggle-bold',
  'toggle-italic',
  'toggle-underline',
  'toggle-inline-code',
  'insert-code-block',
  'toggle-source-mode',
  'reset-zoom',
  'theme-github',
  'theme-night',
  'help-whats-new',
  'help-quick-start',
  'help-markdown-ref',
  'help-pandoc',
  'help-custom-themes',
  'help-images',
  'help-data-recovery',
  'help-more-resources',
  'help-log',
  'help-changelog',
  'help-privacy',
  'help-website',
  'help-feedback',
  'help-check-updates',
  'help-about'
];

channels.forEach((ch) => {
  ipcRenderer.on(ch, () => handleMenuCommand(ch));
});

// Initial render
renderMarkdown('');


