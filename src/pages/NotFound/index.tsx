import './index.scss';
import logo from '@/assets/gpt.svg';

const NotFound = () => {
  return (
    <>
      <div className='not-found-container'>
        <img
          alt='not-found'
          className='not-found' 
          src={logo}
          />
      </div>
    </>
  );
};

export default NotFound;