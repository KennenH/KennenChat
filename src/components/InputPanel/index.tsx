import { Button } from 'antd';
import './index.scss';
import { useRef, useState } from 'react';

interface IInputPanelProps {
  handleClickSendMessage: Function,
}

const InputPanel: React.FC<IInputPanelProps> = (props: IInputPanelProps) => {

  const {
    handleClickSendMessage,
  } = props;

  /**
   * text area 输入内容
   */
  const [inputText, setInputText] = useState('');

  /**
   * 输入区域输入改变
   */
  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(event.target.value);
  }

  /**
   * 点击发送按钮
   */
  const handleClickSend = () => {
    // 交给外部处理文本输入内容
    handleClickSendMessage(inputText);
    // 清空文本
    setInputText('');
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
            onInput={handleInput}
          >
            {inputText}
          </textarea>
          <Button
            className='input-panel-send-button'
            onClick={handleClickSend}
          >
            发送
          </Button>
        </label>
      </div>
    </>
  );
};

export default InputPanel;