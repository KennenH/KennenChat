import './index.scss';
import me from '@/assets/user.svg';
import logo from '@/assets/gpt_solid.svg';
import { IChatMessage, Sender } from '../ChatCard';
import { formatDate } from '@/utils/utils';
import classNames from 'classnames';
import { useEffect, useRef } from 'react';
import { throttle } from 'lodash';

interface IMessageProps {
  message: IChatMessage,
  onSizeChanged?: (offsetHeight: number) => void,
  styles?: {},
}

const Message: React.FC<IMessageProps> = (
  props: IMessageProps
) => {

  const { 
    message, 
    onSizeChanged,
    styles,
  } = props;

  const isMe = message.sender === Sender.ME;

  /**
   * 根据发送者调整对应的样式
   */
  const toggleClzBasedOnSender = (className: string) => {
    return (classNames(className, { '--me': isMe }));
  };

  const ref = useRef<HTMLDivElement>(null);

  // 组件挂载时监听 item 尺寸变化事件
  useEffect(() => {
    const throttledResizeCallback = throttle(() => {
      if (ref.current) {
        console.log(`kennen message 高度变化 ${ref.current.offsetHeight}`);
        onSizeChanged && onSizeChanged(ref.current.offsetHeight);
      }
    }, 1000, { leading: false, trailing: true });

    const resizeObserver = new ResizeObserver(throttledResizeCallback); 
    ref.current && resizeObserver.observe(ref.current);

    // 卸载时取消监听
    return () => {
      resizeObserver 
      && ref.current 
      && resizeObserver.unobserve(ref.current);
    };
  }, []);

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
                message.sender === Sender.NOT_ME ?
                  logo : me
              }
            />
            <div className='message-header-actions-container'>

            </div>
          </div>
          <div className={toggleClzBasedOnSender('message-item')}>
            <div className='message-content'>
              {message.content}
            </div>
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