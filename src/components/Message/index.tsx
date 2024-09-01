import './index.scss';
import user from '@/assets/user.svg';
import gpt from '@/assets/gpt_solid.svg';
import { IChatMessage, Sender } from '../ChatCard';
import { formatDate } from '@/utils/utils';
import classNames from 'classnames';
import { useEffect, useRef } from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import { Flex, Spin } from 'antd';
import globalStore from '@/store/globalStore';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

interface IMessageProps {
  message: IChatMessage,
  isShowLoading: boolean,
  onSizeChanged?: (offsetHeight: number) => void,
  styles?: {},
}

const Message: React.FC<IMessageProps> = (
  props: IMessageProps
) => {

  const { 
    message, 
    isShowLoading,
    onSizeChanged,
    styles,
  } = props;

  const isMe = message.sender === Sender.USER;

  /**
   * 根据发送者调整对应的样式
   */
  const toggleClzBasedOnSender = (className: string) => {
    return (classNames(className, { '--me': isMe }));
  };

  const ref = useRef<HTMLDivElement>(null);

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
      .replace(/```(\w*)\s*([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      // 未封闭代码块, ``` 之后的所有文字都视为代码 
      .replace(/```(\w*)\s*([\s\S]*)/g, '<pre><code>$2</code></pre>')
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

  // 组件挂载时监听 item 尺寸变化事件
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        if (ref.current) {
          onSizeChanged && onSizeChanged(ref.current.offsetHeight);
        }
        
        // 代码高亮
        hljs.highlightAll();
      });
    }); 
    ref.current && resizeObserver.observe(ref.current);

    // 卸载时取消监听
    return () => {
      resizeObserver 
      && ref.current 
      && resizeObserver.unobserve(ref.current);
    };
  }, []);

  useEffect(() => {

  }, [globalStore.isParseMarkdown]);

  return (
    <>
      <div
        ref={ref} 
        className={toggleClzBasedOnSender('message-wrapper-container')}
        style={styles}
      >
        <div className={toggleClzBasedOnSender('message-container')}>
          <div className={toggleClzBasedOnSender('message-header')}>
            <img 
              className={toggleClzBasedOnSender('message-header-avatar')}
              src={
                message.sender === Sender.ASSISTANT ?
                  gpt : user
              }
            />
            <div className='message-header-actions-container'>

            </div>
          </div>
            <div className={toggleClzBasedOnSender('message-item')}>
              {
                isShowLoading
                ? <Spin indicator={<LoadingOutlined spin />} /> 
                : 
                  globalStore.isParseMarkdown
                  ? <div
                      className='message-content'
                      dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }}
                    />
                  : <div 
                      className='message-content'
                    >
                      {message.content}
                    </div>
              }
              </div>
          <div className='message-date'>
            {formatDate(message.time)}
          </div>
        </div>
      </div>
    </>
  );
};

export default Message;