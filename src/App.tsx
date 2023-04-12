import React, { useEffect } from 'react'
import logo from './logo.svg'
import styles from './App.module.css'
import { setupMidi } from 'midi/devices'



function App() {
  
  useEffect(() => {
    // console.log('setup')
    setupMidi()
  }, [])
  
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <img src={logo} className={styles.logo} alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className={styles.link}
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
