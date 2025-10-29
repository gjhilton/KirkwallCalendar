import { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';

// Constants
const DEFAULT_CELL_COLOR = '#fff';
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

    // Add month label - show full month abbreviation
    const monthLabel = monthFormatter(monthStartDate);
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
 * represents a day of the year (1-366) with opacity based on occurrence frequency.
 * The visualization automatically fills the available viewport width.
 *
 * @param {Object} props - Component props
 * @param {Map<number, number>} props.dayOfYearCounts - Map of day-of-year (1-366) to occurrence count
 * @param {number} props.rowHeight - Height of the row in pixels
 * @param {number} props.cellSpacing - Horizontal spacing between day cells in pixels
 * @param {number} props.opacityPerOccurrence - Opacity increment per occurrence (default 0.15)
 * @param {Object} props.chartMargin - Margin configuration {top, right, bottom, left}
 */
const DayOfYearOverlay = ({
  dayOfYearCounts = new Map(),
  rowHeight = 80,
  cellSpacing = 0,
  opacityPerOccurrence = 0.05,
  chartMargin = { top: 40, right: 20, bottom: 20, left: 80 }
}) => {
  console.log('=== DayOfYearOverlay FUNCTION START ===');
  console.log('Props received:', {
    dayOfYearCountsSize: dayOfYearCounts?.size,
    dayOfYearCountsType: typeof dayOfYearCounts,
    rowHeight,
    cellSpacing,
    opacityPerOccurrence
  });

  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  // Measure container width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        console.log('Updating container width:', width);
        setContainerWidth(width);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Memoize layout calculations
  const layoutDimensions = useMemo(() => {
    console.log('Calculating layout dimensions, containerWidth:', containerWidth);
    const daysInYear = 366; // Include leap day
    const svgWidth = containerWidth;
    const svgHeight = rowHeight + chartMargin.top + chartMargin.bottom;

    // Calculate cell width to fill the available width
    const availableWidth = svgWidth - chartMargin.left - chartMargin.right;
    const dayCellWidth = (availableWidth - (daysInYear - 1) * cellSpacing) / daysInYear;

    console.log('Layout calculated:', { dayCellWidth, svgWidth, svgHeight, availableWidth });

    return {
      dayCellWidth,
      svgWidth,
      svgHeight,
      daysInYear
    };
  }, [containerWidth, cellSpacing, rowHeight, chartMargin]);

  // Memoize color calculations
  const cellColors = useMemo(() => {
    try {
      console.log('Calculating cellColors for', dayOfYearCounts.size, 'unique days');
      const colors = new Map();

      // Safety check: only calculate max if we have data
      const countsArray = Array.from(dayOfYearCounts.values());
      const maxCount = countsArray.length > 0 ? Math.max(...countsArray) : 0;
      console.log('Max count in cellColors:', maxCount);

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

    console.log('DayOfYearOverlay: Max count for any day:', maxCount, '| Total unique days:', dayOfYearCounts.size);
    console.log('cellColors calculation complete, returning', colors.size, 'colors');
    return colors;
    } catch (error) {
      console.error('ERROR in cellColors calculation:', error);
      console.error('Stack trace:', error.stack);
      // Return default colors on error
      const colors = new Map();
      for (let dayOfYear = 1; dayOfYear <= 366; dayOfYear++) {
        colors.set(dayOfYear, DEFAULT_CELL_COLOR);
      }
      return colors;
    }
  }, [dayOfYearCounts, opacityPerOccurrence]);

  useEffect(() => {
    try {
      if (!svgRef.current) {
        console.log('No SVG ref, skipping render');
        return;
      }

      const { dayCellWidth, svgWidth, svgHeight, daysInYear } = layoutDimensions;

      console.log('Starting render with dimensions:', { dayCellWidth, svgWidth, svgHeight, daysInYear });

      // Clear previous content
      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();

    // Set SVG dimensions
    svg
      .attr('width', svgWidth)
      .attr('height', svgHeight);
    console.log('SVG dimensions set');

    // Create main group with margins
    const mainGroup = svg.append('g')
      .attr('transform', `translate(${chartMargin.left},${chartMargin.top})`);
    console.log('Main group created');

    // Draw month axis (markers and labels)
    drawMonthAxis(mainGroup, dayCellWidth, rowHeight);
    console.log('Month axis drawn');

    // Create row group
    const rowGroup = mainGroup.append('g')
      .attr('class', 'day-row');

    // Add row label
    /*
    rowGroup.append('text')
      .attr('x', -10)
      .attr('y', rowHeight / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('All Years');
      */

    // Draw cells for each day of year (1-366)
    console.log(`Drawing ${daysInYear} cells...`);
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
    console.log('All cells drawn');

    // Add summary statistics
    console.log('Creating stats...');
    const statsGroup = svg.append('g')
      .attr('transform', `translate(${chartMargin.left}, ${chartMargin.top + rowHeight + 30})`);

    const totalDaysWithData = dayOfYearCounts.size;
    const totalOccurrences = Array.from(dayOfYearCounts.values()).reduce((sum, count) => sum + count, 0);
    // Safety check for max calculation
    const countsForMax = Array.from(dayOfYearCounts.values());
    const maxOccurrences = countsForMax.length > 0 ? Math.max(...countsForMax) : 0;

    console.log('Stats calculated:', { totalDaysWithData, totalOccurrences, maxOccurrences });

    statsGroup.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .style('font-size', '12px')
      .text(`Total occurrences: ${totalOccurrences} | Unique days: ${totalDaysWithData}/366 | Max occurrences for a single day: ${maxOccurrences}`);

    console.log('Render complete!');

    } catch (error) {
      console.error('ERROR in DayOfYearOverlay rendering:', error);
      console.error('Stack trace:', error.stack);
    }
  }, [dayOfYearCounts, rowHeight, cellSpacing, layoutDimensions, cellColors, chartMargin]);

  console.log('DayOfYearOverlay rendering, data size:', dayOfYearCounts.size);

  return (
    <div ref={containerRef} style={{ width: '100%', padding: '20px' }}>
       {/*<h2 style={{ marginBottom: '10px' }}>Day of Year Frequency Overlay</h2>
     <p style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
        Each cell represents a day of the year. Opacity increases with frequency (15% per occurrence).
      </p>*/}
      <svg ref={svgRef} aria-label="Day of year frequency visualization" />
    </div>
  );
};

export default DayOfYearOverlay;
