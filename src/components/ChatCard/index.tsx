import './index.scss';
import _ from 'lodash';
import { formatDate } from '@/utils/utils';
import classNames from 'classnames';
import { CloseCircleOutlined } from '@ant-design/icons';
import { MouseEventHandler } from 'react';

export enum Sender {
  ME = 0,
  NOT_ME = 1,
}

export interface ChatContent {
  content: string,
  sender: Sender,
  time: Date,
  fingerprint: string,
}

export interface IChatCardProps {
  title: string,
  conversasionList: ChatContent[],

  isSelected?: boolean,
  isDragging?: boolean,
  
  handleClickDelete?: MouseEventHandler,
  handleClickCard?: MouseEventHandler,
}

const ChatCard: React.FC<IChatCardProps> = ({
  title,
  conversasionList,

  isSelected,
  isDragging,
  handleClickDelete,
  handleClickCard,
}: IChatCardProps) => {
  
  const len = conversasionList?.length ?? 1;

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
            conversasionList 
            && formatDate(conversasionList[len - 1].time)
          }
        </p>
      </div>
      <CloseCircleOutlined 
        className='chat-card-delete' 
        onClick={handleClickDelete}
      />
    </div>
  );
};

export default ChatCard;