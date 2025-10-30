import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { useState, useEffect } from 'react'
import { csv } from 'd3-fetch'
import './index.css'
import BarChartsView from './components/BarChartsView'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  const [meetingsData, setMeetingsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load CSV data on component mount
  useEffect(() => {
    const csvPath = `${import.meta.env.BASE_URL}meetings.csv`;
    csv(csvPath)
      .then((data) => {
        console.log('Loaded CSV data:', data.length, 'rows');
        setMeetingsData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Error loading CSV:', err);
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <div className="App">Loading meetings data...</div>;
  }

  if (error) {
    return <div className="App">Error loading data: {error}</div>;
  }

  return (
    <div className="App">
      <ErrorBoundary>
        <BarChartsView meetingsData={meetingsData} />
      </ErrorBoundary>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
