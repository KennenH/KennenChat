import './index.scss';
import user from '@/assets/user.svg';
import gpt from '@/assets/gpt_solid.svg';
import { IChatMessage, Sender } from '../ChatCard';
import { formatDate } from '@/utils/utils';
import classNames from 'classnames';
import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import 'highlight.js/styles/atom-one-dark.css';
import { parseMarkdown } from '@/utils/markdown';
import hljs from 'highlight.js';
import globalStore from '@/store/globalStore';

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

  // 监听 item 尺寸变化事件
  useLayoutEffect(() => {
    const domRef = ref.current;
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        if (domRef) {
          onSizeChanged && onSizeChanged(domRef.offsetHeight);
        }
      });
    }); 
    domRef && resizeObserver.observe(domRef);

    // 卸载时取消监听
    return () => {
      resizeObserver 
      && domRef
      && resizeObserver.unobserve(domRef);
    };
  }, [onSizeChanged]);

  /**
   * 将解析好的 code 区域进行高亮
   */
  const highlightCodeInString = (htmlString: string) => {
    return htmlString.replace(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/g, (match, code) => {
      // hljs.highlightAuto 直接处理整个 <pre><code> 结构
      const highlightedCode = hljs.highlightAuto(code).value;
      return `<pre><code class="hljs language-nsis">${highlightedCode}</code></pre>`;
    });
  }

  /**
   * useMemo 防止重复解析相同内容
   */
  const parsedContent = useMemo(() => {
    let { content } = message;
    if (globalStore.isParseMarkdown) {
      content = highlightCodeInString(parseMarkdown(content));
    }
    return content;
  }, [message.content, message.fingerprint, message])

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
              alt='Avatar'
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
                      dangerouslySetInnerHTML={{ __html: parsedContent }}
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