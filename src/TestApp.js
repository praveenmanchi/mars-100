import React from 'react';

function TestApp() {
  return (
    <div style={{ 
      backgroundColor: '#222', 
      color: '#fff', 
      padding: '50px', 
      textAlign: 'center',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>Testing React App</h1>
      <p>If you can see this, React is working!</p>
      <p>Time: {new Date().toLocaleTimeString()}</p>
    </div>
  );
}

export default TestApp;