import { Button } from 'antd';
import './index.scss';

const SideBarFooter: React.FC = () => {
    return (
        <>
            <div className='side-bar-footer-container'>
                <div className='side-bar-footer-left'>
                    <Button className='side-bar-footer-actions'></Button>
                    <Button className='side-bar-footer-actions'></Button>
                </div>
                <Button className='side-bar-footer-actions'>新的聊天</Button>
            </div>
        </>
    );
};

export default SideBarFooter;