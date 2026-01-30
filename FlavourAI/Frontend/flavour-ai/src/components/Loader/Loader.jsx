import React from 'react';
import './loader.css';

const Loader = ({ fullScreen = true }) => {
  return (
    <div className={fullScreen ? 'flavour-loader flavour-loader--fullscreen' : 'flavour-loader'} aria-hidden={!fullScreen}>
      <div className="loader-center">
        <div className="loader-logo">Flavour</div>
        <div className="loader-dots" aria-hidden>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
};

export default Loader;
