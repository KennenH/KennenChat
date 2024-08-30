import './index.scss';

interface IMarkdownParserProps {

}

const MarkdownParser: React.FC<IMarkdownParserProps> = (props: IMarkdownParserProps) => {
  const {} = props;

  /**
   * 转移字符防止 xss 攻击
   */
  const escapeHtml = (str: string) => {
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
  }

  /**
   * 将对应的符号转换为对应的样式
   */
  const parseMarkdown = (text: string) => {
    text = escapeHtml(text);

    // 粗体 (**text**)
    text = text.replace(/(\*\*)(.*?)\1/g, '<strong>$2</strong>');

    // 代码块 (```)
    text = text.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

    // 内联代码/标签 (`text`)
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

    // 标题 (h1-h6)，是几就写几个 #
    for (let i = 6; i >= 1; i--) {
        let header = '#'.repeat(i);
        let regex = new RegExp(`^${header} (.*?)$`, 'gm');
        text = text.replace(regex, `<h${i}>$1</h${i}>`);
    }

    // 有序列表 (1. )
    text = text.replace(/^\d+\. (.*?)(\n|$)/gm, '<ol><li>$1</li></ol>');

    // 无序列表 (- )
    text = text.replace(/^[\-] (.*?)(\n|$)/gm, '<ul><li>$1</li></ul>');

    return text;
  }

  const markdownText = `
  # Title
  ## Subtitle

  This is **bold** text.

  \`\`\`
  function hello() {
      console.log("Hello, world!");
  }
  \`\`\`

  1. First item
  2. Second item

  - Bullet 1
  - Bullet 2
  `;

  const html = parseMarkdown(markdownText);
  console.log(html);


  return (
    <>
    </>
  );
};

export default MarkdownParser;