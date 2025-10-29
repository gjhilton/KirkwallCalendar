import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';

// Constants
const DEFAULT_CELL_COLOR = '#eee';
const MONTH_LINE_COLOR = '#000';
const MONTH_LABEL_COLOR = '#000';
const AXIS_OFFSET = -20;

// Helper function to get day of year from a date
const getDayOfYear = (date) => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};

// Helper function to create a date from day of year (using 2024 as reference - a leap year)
const dateFromDayOfYear = (dayOfYear) => {
  const date = new Date(2024, 0, dayOfYear);
  return date;
};

// Format day of year as readable date string (e.g., "Jan 15")
const formatDayOfYear = (dayOfYear) => {
  const date = dateFromDayOfYear(dayOfYear);
  return d3.timeFormat('%b %d')(date);
};

// Draw the month axis with markers and labels
const drawMonthAxis = (svgGroup, dayCellWidth, rowHeight) => {
  // Use 2024 as reference year (leap year)
  const referenceYear = 2024;
  const monthBoundaries = d3.timeMonths(
    new Date(referenceYear, 0, 1),
    new Date(referenceYear, 11, 31)
  );

  const axisGroup = svgGroup.append('g')
    .attr('class', 'axis-group')
    .attr('transform', `translate(0,${AXIS_OFFSET})`);

  const monthFormatter = d3.timeFormat('%b');

  monthBoundaries.forEach((monthStartDate) => {
    const dayOfYearIndex = getDayOfYear(monthStartDate);

    // Add vertical gridline for month boundary
    axisGroup.append('line')
      .attr('x1', dayOfYearIndex * dayCellWidth)
      .attr('x2', dayOfYearIndex * dayCellWidth)
      .attr('y1', 15)
      .attr('y2', rowHeight + 5)
      .attr('stroke', MONTH_LINE_COLOR)
      .attr('stroke-width', 1);

    // Add month label - show first letter in uppercase for all months
    const monthLabel = monthFormatter(monthStartDate).charAt(0).toUpperCase();
    axisGroup.append('text')
      .attr('x', dayOfYearIndex * dayCellWidth + 5)
      .attr('y', 12)
      .style('font-size', '10px')
      .style('fill', MONTH_LABEL_COLOR)
      .style('font-weight', 'bold')
      .text(monthLabel);
  });
};

/**
 * DayOfYearOverlay component - Displays a single row visualization where each cell
 * represents a day of the year (1-366) with opacity based on occurrence frequency
 *
 * @param {Object} props - Component props
 * @param {Map<number, number>} props.dayOfYearCounts - Map of day-of-year (1-366) to occurrence count
 * @param {number} props.dayCellWidth - Width of each day cell in pixels
 * @param {number} props.rowHeight - Height of the row in pixels
 * @param {number} props.cellSpacing - Horizontal spacing between day cells in pixels
 * @param {number} props.opacityPerOccurrence - Opacity increment per occurrence (default 0.15)
 * @param {Object} props.chartMargin - Margin configuration {top, right, bottom, left}
 */
const DayOfYearOverlay = ({
  dayOfYearCounts = new Map(),
  dayCellWidth = 2,
  rowHeight = 40,
  cellSpacing = 0,
  opacityPerOccurrence = 0.15,
  chartMargin = { top: 40, right: 20, bottom: 20, left: 80 }
}) => {
  const svgRef = useRef(null);

  // Memoize layout calculations
  const layoutDimensions = useMemo(() => {
    const totalCellWidth = dayCellWidth + cellSpacing;
    const daysInYear = 366; // Include leap day
    const totalWidth = daysInYear * totalCellWidth + chartMargin.left + chartMargin.right;
    const totalHeight = rowHeight + chartMargin.top + chartMargin.bottom;

    return {
      dayCellWidth: totalCellWidth,
      svgWidth: totalWidth,
      svgHeight: totalHeight,
      daysInYear
    };
  }, [dayCellWidth, cellSpacing, rowHeight, chartMargin]);

  // Memoize color calculations
  const cellColors = useMemo(() => {
    const colors = new Map();
    const maxCount = Math.max(...dayOfYearCounts.values(), 0);

    // For each day of year (1-366), calculate the color
    for (let dayOfYear = 1; dayOfYear <= 366; dayOfYear++) {
      const count = dayOfYearCounts.get(dayOfYear) || 0;

      if (count > 0) {
        // Calculate opacity: each occurrence adds opacityPerOccurrence
        const opacity = Math.min(count * opacityPerOccurrence, 1.0);
        colors.set(dayOfYear, `rgba(255, 0, 0, ${opacity})`);
      } else {
        colors.set(dayOfYear, DEFAULT_CELL_COLOR);
      }
    }

    console.log('Max count for any day:', maxCount);
    return colors;
  }, [dayOfYearCounts, opacityPerOccurrence]);

  useEffect(() => {
    if (!svgRef.current) return;

    const { dayCellWidth, svgWidth, svgHeight, daysInYear } = layoutDimensions;

    // Clear previous content
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Set SVG dimensions
    svg
      .attr('width', svgWidth)
      .attr('height', svgHeight);

    // Create main group with margins
    const mainGroup = svg.append('g')
      .attr('transform', `translate(${chartMargin.left},${chartMargin.top})`);

    // Draw month axis (markers and labels)
    drawMonthAxis(mainGroup, dayCellWidth, rowHeight);

    // Create row group
    const rowGroup = mainGroup.append('g')
      .attr('class', 'day-row');

    // Add row label
    rowGroup.append('text')
      .attr('x', -10)
      .attr('y', rowHeight / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('All Years');

    // Draw cells for each day of year (1-366)
    for (let dayOfYear = 1; dayOfYear <= daysInYear; dayOfYear++) {
      const cellColor = cellColors.get(dayOfYear);
      const count = dayOfYearCounts.get(dayOfYear) || 0;
      const dateLabel = formatDayOfYear(dayOfYear);

      rowGroup.append('rect')
        .attr('x', (dayOfYear - 1) * dayCellWidth)
        .attr('y', 0)
        .attr('width', dayCellWidth)
        .attr('height', rowHeight)
        .attr('fill', cellColor)
        .style('cursor', count > 0 ? 'pointer' : 'default')
        .append('title')
        .text(`${dateLabel} (Day ${dayOfYear})${count > 0 ? `\nOccurrences: ${count}` : '\nNo occurrences'}`);
    }

    // Add summary statistics
    const statsGroup = svg.append('g')
      .attr('transform', `translate(${chartMargin.left}, ${chartMargin.top + rowHeight + 30})`);

    const totalDaysWithData = dayOfYearCounts.size;
    const totalOccurrences = Array.from(dayOfYearCounts.values()).reduce((sum, count) => sum + count, 0);
    const maxOccurrences = Math.max(...dayOfYearCounts.values(), 0);

    statsGroup.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .style('font-size', '12px')
      .text(`Total occurrences: ${totalOccurrences} | Unique days: ${totalDaysWithData}/366 | Max occurrences for a single day: ${maxOccurrences}`);

  }, [dayOfYearCounts, dayCellWidth, rowHeight, cellSpacing, layoutDimensions, cellColors, chartMargin]);

  return (
    <div style={{ overflowX: 'auto', padding: '20px' }}>
      <h2 style={{ marginBottom: '10px' }}>Day of Year Frequency Overlay</h2>
      <p style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
        Each cell represents a day of the year. Opacity increases with frequency (15% per occurrence).
      </p>
      <svg ref={svgRef} aria-label="Day of year frequency visualization" />
    </div>
  );
};

export default DayOfYearOverlay;
