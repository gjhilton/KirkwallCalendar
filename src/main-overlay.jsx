import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { useState, useEffect, useMemo } from 'react'
import { csv } from 'd3-fetch'
import './index.css'
import DayOfYearOverlay from './components/DayOfYearOverlay'

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

  // Process meetings data into day-of-year frequency counts
  const dayOfYearCounts = useMemo(() => {
    if (!meetingsData.length) return new Map();

    let validDates = 0;
    let skippedRows = 0;
    const counts = new Map();

    // Helper function to get day of year (1-366)
    const getDayOfYear = (date) => {
      const start = new Date(date.getFullYear(), 0, 0);
      const diff = date - start;
      const oneDay = 1000 * 60 * 60 * 24;
      return Math.floor(diff / oneDay);
    };

    meetingsData.forEach((row) => {
      const dateStr = row.Date?.trim();

      // Skip empty or incomplete dates
      if (!dateStr || dateStr.includes('?')) {
        skippedRows++;
        return;
      }

      // Parse DD/MM/YYYY format
      try {
        // Fix common malformations like "02/061671"
        const cleanedDate = dateStr.replace(/(\d{2})\/(\d{2})(\d{4})/, '$1/$2/$3');

        // Handle abbreviated years like "12/26/70" → assume 1670s
        let dateComponents;
        if (/^\d{2}\/\d{2}\/\d{2}$/.test(cleanedDate)) {
          const [day, month, year] = cleanedDate.split('/');
          const fullYear = `16${year}`; // Assume 1600s for 2-digit years
          dateComponents = [day, month, fullYear];
        } else {
          dateComponents = cleanedDate.split('/');
        }

        const [day, month, year] = dateComponents;

        // Create date object (month is 0-indexed in JS)
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

        // Validate the date is valid
        if (isNaN(date.getTime())) {
          skippedRows++;
          return;
        }

        // Get day of year (1-366)
        const dayOfYear = getDayOfYear(date);

        // Increment count for this day of year
        counts.set(dayOfYear, (counts.get(dayOfYear) || 0) + 1);

        validDates++;
      } catch (e) {
        console.warn('Failed to parse date:', dateStr, e);
        skippedRows++;
      }
    });

    console.log(`Processed ${validDates} valid dates, skipped ${skippedRows} rows`);
    console.log('Unique days of year with data:', counts.size);
    console.log('Max occurrences for a single day:', Math.max(...counts.values()));

    return counts;
  }, [meetingsData]);

  if (isLoading) {
    return <div className="App">Loading meetings data...</div>;
  }

  if (error) {
    return <div className="App">Error loading data: {error}</div>;
  }

  if (dayOfYearCounts.size === 0) {
    return <div className="App">No valid meeting dates found in data.</div>;
  }

  return (
    <div className="App">
      <DayOfYearOverlay dayOfYearCounts={dayOfYearCounts} />
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
