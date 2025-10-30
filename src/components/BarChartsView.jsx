import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';

/**
 * BarChartsView component - Displays three bar charts:
 * 1. Meeting counts by year (all years from first to last in data)
 * 2. Meeting counts by month (12 months)
 * 3. Meeting counts by day of year (1-366)
 */
const BarChartsView = ({ meetingsData = [] }) => {
  const yearChartRef = useRef(null);
  const monthChartRef = useRef(null);
  const dayChartRef = useRef(null);

  // Process data and calculate counts
  const chartData = useMemo(() => {
    const yearCounts = new Map();
    const monthCounts = new Map();
    const dayOfYearCounts = new Map();

    let minYear = Infinity;
    let maxYear = -Infinity;

    // Initialize month counts (1-12)
    for (let i = 1; i <= 12; i++) {
      monthCounts.set(i, 0);
    }

    // Initialize day of year counts (1-366)
    for (let i = 1; i <= 366; i++) {
      dayOfYearCounts.set(i, 0);
    }

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
        return;
      }

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
        const monthNum = parseInt(month);
        const dayNum = parseInt(day);

        // Create date object (month is 0-indexed in JS)
        const date = new Date(yearNum, monthNum - 1, dayNum);

        // Validate the date is valid
        if (isNaN(date.getTime())) {
          return;
        }

        // Track min and max years
        if (yearNum < minYear) minYear = yearNum;
        if (yearNum > maxYear) maxYear = yearNum;

        // Count by year
        yearCounts.set(yearNum, (yearCounts.get(yearNum) || 0) + 1);

        // Count by month
        monthCounts.set(monthNum, (monthCounts.get(monthNum) || 0) + 1);

        // Count by day of year
        const dayOfYear = getDayOfYear(date);
        dayOfYearCounts.set(dayOfYear, (dayOfYearCounts.get(dayOfYear) || 0) + 1);

      } catch (e) {
        console.warn('Failed to parse date:', dateStr, e);
      }
    });

    // Create array of all years from min to max (including years with 0 counts)
    const allYears = [];
    if (minYear !== Infinity && maxYear !== -Infinity) {
      for (let year = minYear; year <= maxYear; year++) {
        allYears.push({
          year: year,
          count: yearCounts.get(year) || 0
        });
      }
    }

    // Convert month counts to array
    const monthData = Array.from(monthCounts.entries()).map(([month, count]) => ({
      month: month,
      count: count
    }));

    // Convert day of year counts to array
    const dayData = Array.from(dayOfYearCounts.entries()).map(([day, count]) => ({
      day: day,
      count: count
    }));

    console.log('Processed data:', {
      years: allYears.length,
      yearRange: `${minYear}-${maxYear}`,
      totalMeetings: meetingsData.length
    });

    return {
      yearData: allYears,
      monthData: monthData,
      dayData: dayData
    };
  }, [meetingsData]);

  // Draw bar chart for years
  useEffect(() => {
    if (!yearChartRef.current || chartData.yearData.length === 0) return;

    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const width = 850 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Clear previous content
    const svg = d3.select(yearChartRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const x = d3.scaleBand()
      .domain(chartData.yearData.map(d => d.year))
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(chartData.yearData, d => d.count) || 0])
      .nice()
      .range([height, 0]);

    // Add x-axis
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .style('color', '#000');

    // Show every 10th year label to avoid crowding
    xAxis.selectAll('text')
      .filter((d, i) => i % 10 !== 0)
      .remove();

    xAxis.selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    xAxis.selectAll('line, path')
      .style('stroke', '#000');

    xAxis.selectAll('text')
      .style('fill', '#000');

    // Add y-axis
    const yAxis = g.append('g')
      .call(d3.axisLeft(y).ticks(10))
      .style('color', '#000');

    yAxis.selectAll('line, path')
      .style('stroke', '#000');

    yAxis.selectAll('text')
      .style('fill', '#000');

    // Add x-axis label
    svg.append('text')
      .attr('transform', `translate(${width / 2 + margin.left}, ${height + margin.top + 50})`)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Year');

    // Add y-axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 15)
      .attr('x', -(height / 2 + margin.top))
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Meeting Count');

    // Add title
    svg.append('text')
      .attr('x', width / 2 + margin.left)
      .attr('y', margin.top / 2)
      .style('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Meetings by Year');

    // Add bars
    g.selectAll('.bar')
      .data(chartData.yearData)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.year))
      .attr('y', d => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.count))
      .attr('fill', '#4a90e2')
      .style('cursor', 'pointer')
      .append('title')
      .text(d => `Year: ${d.year}\nMeetings: ${d.count}`);

  }, [chartData.yearData]);

  // Draw bar chart for months
  useEffect(() => {
    if (!monthChartRef.current || chartData.monthData.length === 0) return;

    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const width = 850 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(monthChartRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Month names
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Create scales
    const x = d3.scaleBand()
      .domain(chartData.monthData.map(d => monthNames[d.month - 1]))
      .range([0, width])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(chartData.monthData, d => d.count) || 0])
      .nice()
      .range([height, 0]);

    // Add x-axis
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .style('color', '#000');

    xAxis.selectAll('line, path')
      .style('stroke', '#000');

    xAxis.selectAll('text')
      .style('text-anchor', 'middle')
      .style('fill', '#000');

    // Add y-axis
    const yAxis = g.append('g')
      .call(d3.axisLeft(y).ticks(10))
      .style('color', '#000');

    yAxis.selectAll('line, path')
      .style('stroke', '#000');

    yAxis.selectAll('text')
      .style('fill', '#000');

    // Add x-axis label
    svg.append('text')
      .attr('transform', `translate(${width / 2 + margin.left}, ${height + margin.top + 40})`)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Month');

    // Add y-axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 15)
      .attr('x', -(height / 2 + margin.top))
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Meeting Count');

    // Add title
    svg.append('text')
      .attr('x', width / 2 + margin.left)
      .attr('y', margin.top / 2)
      .style('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Meetings by Month');

    // Add bars
    g.selectAll('.bar')
      .data(chartData.monthData)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(monthNames[d.month - 1]))
      .attr('y', d => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.count))
      .attr('fill', '#4a90e2')
      .style('cursor', 'pointer')
      .append('title')
      .text(d => `Month: ${monthNames[d.month - 1]}\nMeetings: ${d.count}`);

  }, [chartData.monthData]);

  // Draw bar chart for day of year
  useEffect(() => {
    if (!dayChartRef.current || chartData.dayData.length === 0) return;

    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const width = 850 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(dayChartRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const x = d3.scaleLinear()
      .domain([1, 366])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(chartData.dayData, d => d.count) || 0])
      .nice()
      .range([height, 0]);

    // Add x-axis
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(12))
      .style('color', '#000');

    xAxis.selectAll('line, path')
      .style('stroke', '#000');

    xAxis.selectAll('text')
      .style('fill', '#000');

    // Add y-axis
    const yAxis = g.append('g')
      .call(d3.axisLeft(y).ticks(10))
      .style('color', '#000');

    yAxis.selectAll('line, path')
      .style('stroke', '#000');

    yAxis.selectAll('text')
      .style('fill', '#000');

    // Add x-axis label
    svg.append('text')
      .attr('transform', `translate(${width / 2 + margin.left}, ${height + margin.top + 40})`)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Day of Year');

    // Add y-axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 15)
      .attr('x', -(height / 2 + margin.top))
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Meeting Count');

    // Add title
    svg.append('text')
      .attr('x', width / 2 + margin.left)
      .attr('y', margin.top / 2)
      .style('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Meetings by Day of Year');

    // Calculate bar width
    const barWidth = width / 366;

    // Add bars
    g.selectAll('.bar')
      .data(chartData.dayData)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.day) - barWidth / 2)
      .attr('y', d => y(d.count))
      .attr('width', barWidth)
      .attr('height', d => height - y(d.count))
      .attr('fill', '#4a90e2')
      .style('cursor', 'pointer')
      .append('title')
      .text(d => `Day: ${d.day}\nMeetings: ${d.count}`);

  }, [chartData.dayData]);

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '40px' }}>Meeting Statistics</h1>

      <div style={{ marginBottom: '60px' }}>
        <svg ref={yearChartRef} />
      </div>

      <div style={{ marginBottom: '60px' }}>
        <svg ref={monthChartRef} />
      </div>

      <div style={{ marginBottom: '60px' }}>
        <svg ref={dayChartRef} />
      </div>
    </div>
  );
};

export default BarChartsView;
