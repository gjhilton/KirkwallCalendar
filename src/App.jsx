import { useState, useEffect, useMemo } from 'react'
import { csv } from 'd3-fetch'
import './App.css'
import YearCalendar from './components/YearCalendar'

function App() {
  const [meetingsData, setMeetingsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load CSV data on component mount
  useEffect(() => {
    csv('/meetings.csv')
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

  // Parse and process meetings data into eventsByYear format
  const eventsByYear = useMemo(() => {
    if (!meetingsData.length) return {};

    let validDates = 0;
    let skippedRows = 0;
    const dateSet = new Set(); // For deduplication
    const events = {};

    meetingsData.forEach((row) => {
      const dateStr = row.Date?.trim();

      // Skip empty or incomplete dates
      if (!dateStr || dateStr.includes('?')) {
        skippedRows++;
        return;
      }

      // Parse DD/MM/YYYY format
      let parsedDate;
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

        // Format as YYYY-MM-DD
        const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

        // Deduplicate - only add unique dates
        if (dateSet.has(isoDate)) {
          return;
        }
        dateSet.add(isoDate);

        // Add to events by year
        const yearNum = parseInt(year);
        if (!events[yearNum]) {
          events[yearNum] = [];
        }

        events[yearNum].push({
          date: isoDate,
          color: '#ff0000'
        });

        validDates++;
      } catch (e) {
        console.warn('Failed to parse date:', dateStr, e);
        skippedRows++;
      }
    });

    console.log(`Processed ${validDates} valid dates, skipped ${skippedRows} rows`);
    console.log('Years with data:', Object.keys(events).sort());

    return events;
  }, [meetingsData]);

  if (isLoading) {
    return <div className="App">Loading meetings data...</div>;
  }

  if (error) {
    return <div className="App">Error loading data: {error}</div>;
  }

  if (Object.keys(eventsByYear).length === 0) {
    return <div className="App">No valid meeting dates found in data.</div>;
  }

  return (
    <div className="App">
      <YearCalendar
        eventsByYear={eventsByYear}
        dayCellWidth={2}
        yearRowHeight={20}
        cellSpacing={0}
        rowSpacing={2}
      />
    </div>
  )
}

export default App
