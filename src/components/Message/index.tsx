import './index.scss';
import me from '@/assets/user.svg';
import logo from '@/assets/gpt_solid.svg';
import { IChatMessage, Sender } from '../ChatCard';
import { formatDate } from '@/utils/utils';
import classNames from 'classnames';

interface IMessageProps {
  message: IChatMessage,
}

const Message: React.FC<IMessageProps> = (
  props: IMessageProps
) => {
  const { 
    message, 
  } = props;

  const isMe = message.sender === Sender.ME;

  const toggleClzBasedOnSender = (className: string) => {
    return (classNames(className, { '--me': isMe }));
  };

  return (
    <>
      <div className={toggleClzBasedOnSender('message-wrapper-container')}>
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