
/**
 * 转移字符防止 xss 攻击
 */
const escapeHtml = (content: string) => {
  return content.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
}

/**
 * 将对应的符号转换为对应的样式
 */
const parseMarkdown = (content: string) => {
  // 转义
  content = escapeHtml(content)
    // 粗体 (**text**)
    .replace(/(\*\*)(.*?)\1/g, '<strong>$2</strong>')
    // 封闭代码块，中间必须还要加一个 \s，否则第一行的换行符不会被去掉
    .replace(/^```(\w*)\s*([\s\S]*?)```/gm, '<pre><code>$2</code></pre>')
    // 未封闭代码块, ``` 之后的所有文字都视为代码 
    .replace(/^```(\w*)\s*([\s\S]*)/gm, '<pre><code>$2</code></pre>')
    // 内联代码/标签 (`text`)
    .replace(/`([^`]+)`/g, '<code class=\'message-markdown-inline-code\'>$1</code>')
    // 有序列表 (1. )
    .replace(/^\d+\.\s+(.*?)(\n|$)/gm, '<oli>$1</oli>')
    .replace(/(<oli>.*?<\/oli>\n?)+/g, '<ol class=\'message-markdown-ol\'>$&</ol>')
    // 无序列表 (-, *, + )
    .replace(/^[\-\*\+]\s+(.*?)(\n|$)/gm, '<uli>$1</uli>')
    .replace(/(<uli>.*?<\/uli>\n?)+/g, '<ul class=\'message-markdown-ul\'>$&</ul>');

  // 标题 (h1-h6) #
  for (let i = 6; i >= 1; i--) {
    let header = '#'.repeat(i);
    let regex = new RegExp(`^${header} (.*?)$\n`, 'gm');
    content = content.replace(regex, `<h${i} class=\'message-markdown-h${i}\'>$1</h${i}>`);
  }

    // 统一替换占位符
  content = content
    .replace(/<uli>([\s\S]*?)<\/uli>/gm, '<li>$1</li>')
    .replace(/<oli>([\s\S]*?)<\/oli>/gm, '<li>$1</li>');

  return content;
}

export {
  parseMarkdown,
  escapeHtml,
}