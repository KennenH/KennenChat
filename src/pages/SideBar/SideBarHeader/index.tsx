import './index.scss';
import logo from '@/assets/gpt.svg';

const SideBarHeader: React.FC = () => {
    return (
        <>
            <div className='side-bar-header-container'>
                <div>
                    <h3 className='side-bar-header-title'>KennenChat</h3>
                    <p className='side-bar-header-text'>Build your own AI assistant.</p>
                </div>
                <img
                    className='side-bar-header-icon'
                    src={logo} 
                />
            </div>
        </>
    );
};

export default SideBarHeader;