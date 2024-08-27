import { Button } from 'antd';
import './index.scss';
import { useState } from 'react';
import exeCmd from './utils';
import messageStore from '@/store/MessageStore';

interface IInputPanelProps {
  handleClickSendMessage: Function,
  onTextAreaFocused: Function,
}

const InputPanel: React.FC<IInputPanelProps> = (props: IInputPanelProps) => {

  const {
    handleClickSendMessage,
    onTextAreaFocused,
  } = props;

  /**
   * text area 输入内容
   */
  const [inputText, setInputText] = useState('');

  /**
   * 输入区域输入改变
   */
  const onInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(event.target.value);
  }

  /**
   * 执行发送
   */
  const sendMessage = () => {
    if (inputText.length === 0) {
      return;
    }

    // 执行命令
    const executed = exeCmd(inputText);
    
    // 清空文本
    setInputText('');

    if (!executed) {
      // 交给外部处理文本输入内容
      handleClickSendMessage(inputText);
    }
  }

  /**
   * 监听快捷键按下
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault();
      // 换行
      setInputText(inputText + '\n');
    } else if (event.key === 'Enter') {
      event.preventDefault();
      // 发送
      sendMessage();
    }
  }

  return (
    <>
      <div className='input-panel-container'>
        <div className='input-panel-actions-container'>

        </div>
        <label
          className='input-panel-input-container'
          htmlFor='input-area'
        >
          <textarea
            id='input-area'
            className='input-panel-input-area'
            placeholder='Enter 发送，Shift + Enter 换行'
            onInput={onInputChange}
            value={inputText}
            onKeyDown={handleKeyDown}
            onFocus={() => onTextAreaFocused()}
            onClick={() => onTextAreaFocused()}
          />
          <Button
            className='input-panel-send-button'
            disabled={messageStore.isFetchingMsg}
            onClick={sendMessage}
          >
            发送
          </Button>
        </label>
      </div>
    </>
  );
};

export default InputPanel;