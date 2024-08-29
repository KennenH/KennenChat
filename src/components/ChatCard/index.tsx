import './index.scss';
import _ from 'lodash';
import { formatDate } from '@/utils/utils';
import classNames from 'classnames';
import { CloseCircleOutlined } from '@ant-design/icons';
import { MouseEventHandler } from 'react';

export enum Sender {
  USER = 0,
  ASSISTANT = 1,
}

export const Role = {
  [Sender.USER]: "user",
  [Sender.ASSISTANT]: "assistant",  
} as const;

export interface IChatMessage {
  content: string,
  sender: Sender,
  time: Date,
  fingerprint: string,
}

export interface IChatCardProps {
  /**
   * 唯一标识一个 chatCard 的 id
   */
  id: string,
  title: string,
  messageList: IChatMessage[],

  isSelected?: boolean,
  isDragging?: boolean,
  
  handleClickDelete?: MouseEventHandler,
  handleClickCard?: MouseEventHandler,
}

const ChatCard: React.FC<IChatCardProps> = ({
  id,
  title,
  messageList,

  isSelected,
  isDragging,
  handleClickDelete,
  handleClickCard,
}: IChatCardProps) => {
  
  const len = messageList?.length ?? 1;

  const handleClickDeleteButton = (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    event.stopPropagation();
    handleClickDelete && handleClickDelete(event);
  }

  return (
    <div 
      className={classNames('chat-card-container', { '--selected': isSelected })}
      onClick={handleClickCard}
    >
      <div className='chat-card-title'>
        {title}
      </div>
      <div className='chat-card-info'>
        <p>
          {len - 1} 条对话
        </p>
        <p>
          {
            messageList 
            && formatDate(messageList[len - 1].time)
          }
        </p>
      </div>
      <CloseCircleOutlined 
        className='chat-card-delete' 
        onClick={handleClickDeleteButton}
      />
    </div>
  );
};

export default ChatCard;