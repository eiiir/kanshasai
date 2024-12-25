import Firebase from './Firebase';
import React, { useState, useEffect } from 'react';

const App = () => {
  const [currentValue, setCurrentValue] = useState<string>('Loading...');
  const [lastUpdatedTimestamp, setLastUpdatedTimestamp] = useState<string>('Loading...');

  const fetchInitialValue = async () => {
    const initialValue = await Firebase.getCurrentValue();
    setCurrentValue(initialValue?.message ?? "No data found");
    setLastUpdatedTimestamp(initialValue?.time ?? 'No data found');
  }

  useEffect(() => {
    fetchInitialValue();
    Firebase.listenToUpdate((data) => {
      setCurrentValue(data?.message as string);
      setLastUpdatedTimestamp(data?.time as string);
    });
  }, []);

  const handleSubmit = (val: string) => {
    Firebase.updateValue(val);
  };

  return <div>
    <div>Hello, React with TypeScript and Webpack!</div>
    <VisualApp 
      currentValue={currentValue} 
      lastUpdatedTimestamp={lastUpdatedTimestamp} 
      onSubmit={handleSubmit} 
    />
  </div>;
};

interface VisualAppProps {
  currentValue: string;
  lastUpdatedTimestamp: string;
  onSubmit: (val: string) => void;
}

const VisualApp: React.FC<VisualAppProps> = ({ currentValue, lastUpdatedTimestamp, onSubmit }) => {
  return <div>
    <h1>Current Value: {currentValue}</h1>
    <h1>Last Updated: {lastUpdatedTimestamp}</h1>
    <input type="text" defaultValue={currentValue} value={currentValue} onChange={(e) => onSubmit(e.target.value)} />
  </div>;
}

export default App;
