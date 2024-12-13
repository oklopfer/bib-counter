import React from 'react';
import Analyzer from './components/Analyzer';
import './output.css';

function App() {
  return (
    <div className="app">
      <h1 className="mt-8 mx-auto text-center">Biblical Word Count Analyzer</h1>
      <Analyzer />
    </div>
  );
}

export default App;
