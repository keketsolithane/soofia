import React, { useState, useEffect } from 'react';
import { format, getWeek } from 'date-fns';

const TimeDisplay = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const timeCards = [
    { title: 'Current Year', value: format(currentTime, 'yyyy') },
    { title: 'Current Month', value: format(currentTime, 'MMMM') },
    { title: 'Current Week', value: `Week ${getWeek(currentTime)}` },
    { title: 'Today', value: format(currentTime, 'EEEE') },
    { title: 'Date', value: format(currentTime, 'MMM dd, yyyy') },
  ];

  return (
    <div className="time-display">
      {timeCards.map((card, index) => (
        <div key={index} className="time-card">
          <h3>{card.title}</h3>
          <p>{card.value}</p>
        </div>
      ))}
    </div>
  );
};

export default TimeDisplay;