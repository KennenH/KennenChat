import './index.scss';

interface IMarkdownParserProps {
  content: string,
}

const MarkdownParser: React.FC<IMarkdownParserProps> = (props: IMarkdownParserProps) => {

  const {
    content,
  } = props;

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
    content = escapeHtml(content);

    // 粗体 (**text**)
    content = content.replace(/(\*\*)(.*?)\1/g, '<strong>$2</strong>');

    // 代码块 (```)
    content = content.replace(/```([\s\S]*?)```/g, '\n<pre><code>$1</code></pre>\n');

    // 内联代码/标签 (`text`)
    content = content.replace(/`([^`]+)`/g, '<code>$1</code>');

    // 标题 (h1-h6) #
    for (let i = 6; i >= 1; i--) {
      let header = '#'.repeat(i);
      let regex = new RegExp(`^${header} (.*?)$`, 'gm');
      content = content.replace(regex, `<h${i}>$1</h${i}>`);
    }

    // 有序列表 (1. item)
    content = content.replace(/^\d+\.\s+(.*?)(\n|$)/gm, '<oli>$1</oli>\n');
    content = content.replace(/(<oli>.*<\/oli>)+/gs, '<ol>\n$1\n</ol>\n');

    // 无序列表 (-, *, + item)
    content = content.replace(/^[\-\*\+]\s+(.*?)(\n|$)/gm, '<uli>$1</uli>\n');
    content = content.replace(/(<uli>.*<\/uli>)+/gs, '<ul>\n$1\n</ul>\n');

    // 统一替换占位符
    content = content.replace(/<uli>(.*[\s]*)<\/uli>/gm, '<li>$1</li>');
    content = content.replace(/<oli>(.*[\s]*)<\/oli>/gm, '<li>$1</li>');

    return content;
  }

  return (
    <>
      {parseMarkdown(content)}
    </>
  );
};

export default MarkdownParser;