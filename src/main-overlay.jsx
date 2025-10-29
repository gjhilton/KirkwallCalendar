import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { useState, useEffect, useMemo } from 'react'
import { csv } from 'd3-fetch'
import RangeSlider from 'react-range-slider-input'
import 'react-range-slider-input/dist/style.css'
import './index.css'
import DayOfYearOverlay from './components/DayOfYearOverlay'

function App() {
  const [meetingsData, setMeetingsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [minYear, setMinYear] = useState(null);
  const [maxYear, setMaxYear] = useState(null);

  // Calculate available year range from data
  const availableYearRange = useMemo(() => {
    if (!meetingsData.length) return { min: null, max: null };

    const years = [];
    meetingsData.forEach((row) => {
      const dateStr = row.Date?.trim();
      if (!dateStr || dateStr.includes('?')) return;

      try {
        const cleanedDate = dateStr.replace(/(\d{2})\/(\d{2})(\d{4})/, '$1/$2/$3');
        let dateComponents;
        if (/^\d{2}\/\d{2}\/\d{2}$/.test(cleanedDate)) {
          const [day, month, year] = cleanedDate.split('/');
          const fullYear = `16${year}`;
          dateComponents = [day, month, fullYear];
        } else {
          dateComponents = cleanedDate.split('/');
        }
        const [day, month, year] = dateComponents;
        const yearNum = parseInt(year);
        if (!isNaN(yearNum)) {
          years.push(yearNum);
        }
      } catch (e) {
        // Skip invalid dates
      }
    });

    if (years.length === 0) return { min: null, max: null };
    return { min: Math.min(...years), max: Math.max(...years) };
  }, [meetingsData]);

  // Initialize year range when data loads
  useEffect(() => {
    if (availableYearRange.min !== null && minYear === null) {
      setMinYear(availableYearRange.min);
      setMaxYear(availableYearRange.max);
    }
  }, [availableYearRange, minYear]);

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
    if (!meetingsData.length || minYear === null || maxYear === null) return new Map();

    let validDates = 0;
    let skippedRows = 0;
    let filteredByYear = 0;
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
        const yearNum = parseInt(year);

        // Filter by year range
        if (yearNum < minYear || yearNum > maxYear) {
          filteredByYear++;
          return;
        }

        // Create date object (month is 0-indexed in JS)
        const date = new Date(yearNum, parseInt(month) - 1, parseInt(day));

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

    console.log(`Processed ${validDates} valid dates, skipped ${skippedRows} rows, filtered ${filteredByYear} by year range`);
    console.log('Unique days of year with data:', counts.size);
    console.log('Max occurrences for a single day:', Math.max(...counts.values()));

    return counts;
  }, [meetingsData, minYear, maxYear]);

  if (isLoading) {
    return <div className="App">Loading meetings data...</div>;
  }

  if (error) {
    return <div className="App">Error loading data: {error}</div>;
  }

  if (dayOfYearCounts.size === 0 && minYear !== null) {
    return <div className="App">No valid meeting dates found in selected year range.</div>;
  }

  return (
    <div className="App">
      {availableYearRange.min !== null && (
        <div style={{
          padding: '20px',
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #ddd'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap',
            marginBottom: '15px'
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
              Year Range:
            </div>
            <div style={{ color: '#333', fontSize: '14px' }}>
              {minYear} - {maxYear}
            </div>
            <button
              onClick={() => {
                setMinYear(availableYearRange.min);
                setMaxYear(availableYearRange.max);
              }}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Reset
            </button>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            <div style={{ fontSize: '12px', color: '#666', minWidth: '40px' }}>
              {availableYearRange.min}
            </div>
            <div style={{ flex: 1, maxWidth: '600px' }}>
              <RangeSlider
                min={availableYearRange.min}
                max={availableYearRange.max}
                value={[minYear || availableYearRange.min, maxYear || availableYearRange.max]}
                onInput={(values) => {
                  setMinYear(values[0]);
                  setMaxYear(values[1]);
                }}
              />
            </div>
            <div style={{ fontSize: '12px', color: '#666', minWidth: '40px', textAlign: 'right' }}>
              {availableYearRange.max}
            </div>
          </div>
        </div>
      )}
      <DayOfYearOverlay dayOfYearCounts={dayOfYearCounts} />
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
