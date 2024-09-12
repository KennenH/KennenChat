import './index.scss';
import logo from '@/assets/gpt.svg';

const SideBarHeader: React.FC = () => {
  return (
    <>
      <div className='side-bar-header-container'>
        <div>
          <h3 className='side-bar-header-title'>KChat</h3>
          <p className='side-bar-header-text'>Welcome to KChat. []~(￣▽￣)~*</p>
        </div>
        <img
          alt='KChat'
          className='side-bar-header-icon'
          src={logo} 
        />
      </div>
    </>
  );
};

export default SideBarHeader;