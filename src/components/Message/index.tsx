import './index.scss';
import user from '@/assets/user.svg';
import gpt from '@/assets/gpt_solid.svg';
import { IChatMessage, Sender } from '../ChatCard';
import { formatDate } from '@/utils/utils';
import classNames from 'classnames';
import { useEffect, useRef } from 'react';
import { throttle } from 'lodash';
import { LoadingOutlined } from '@ant-design/icons';
import { Flex, Spin } from 'antd';

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

  // 组件挂载时监听 item 尺寸变化事件
  useEffect(() => {
    const resizeCallback = throttle(() => {
      requestAnimationFrame(() => {
        if (ref.current) {
          onSizeChanged && onSizeChanged(ref.current.offsetHeight);
        }
      });
    }, 500, { leading: true, trailing: true});

    const resizeObserver = new ResizeObserver(resizeCallback); 
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
                : <div className='message-content'>
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