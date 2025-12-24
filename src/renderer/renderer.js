const { marked } = require('marked');

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
    default:
      break;
  }
}

if (window.mdEditorAPI && window.mdEditorAPI.onMenuCommand) {
  window.mdEditorAPI.onMenuCommand((channel) => {
    handleMenuCommand(channel);
  });
}

// Initial render
renderMarkdown('');


