"use client"

import Image from "next/image";
import { list } from "postcss";
import { useState, useEffect, useRef } from 'react';

let scroll = "_"
let section = "_"
let distance = "_"

function date_to_mars(date: Date): [number, number, number, number, number] {
  /*
  We are going to use a proposed Martian Calendar that is extremely accurate.
  A year changes between 668 and 669 days. A "Leap Year" occurs every odd
  year, every year divisible by ten but not divisible by 100. Accepts the date object in js.
  */
  let year = 0;
  let hours = (date.getTime() + 62135596800000) / 3600000

  while (hours >= 16497.4731) {
      year += 1;
      if ((year % 2 !== 0 || year % 10 === 0) && year % 100 !== 0) {
          hours -= 16497.4731;
      } else {
          hours -= 16472.8132;
      }
  }
  const day = Math.floor(hours / 24.6599);
  hours -= day * 24.6599;
  let leftovers = hours % 1;
  hours -= leftovers;
  const minutes = Math.floor(leftovers * 60);
  leftovers -= minutes / 60;
  const seconds = leftovers * 3600;

  return [year + 1, day + 1, Math.floor(hours), minutes, Math.round(seconds / 3)];
}


function Diagram() {
  // State for scales, section, positioning, etc.
  const [rScalePower, setRScalePower] = useState(3);
  const [dScalePower, setDScalePower] = useState(4);
  const [section, setSection] = useState(0);
  const [positioning, setPositioning] = useState([
    // Initial celestial data for demo
    { radius: 100, orbRadius: 200, xOffset: 50, symbol: '☉', color: 'yellow', fontColor: 'black', fontSize: 1 },
    { radius: 50, orbRadius: 100, xOffset: 150, symbol: '⚪', color: 'blue', fontColor: 'white', fontSize: 1 },
  ]);

  const [maxDist, setMaxDist] = useState(0);
  const [outputText, setOutputText] = useState('Scroll: _<br>Section: _<br>Distance: _ km');

  const ODBoxRef = useRef(null);
  const rDispRef = useRef(null);
  const dDispRef = useRef(null);
  const cropContRef = useRef(null);
  const rightSignRef = useRef(null);
  const leftSignRef = useRef(null);

  // Constants
  const MaxRScale = 4;
  const MaxDScale = 7;
  const rightThres = 10 ** 5;
  const leftThres = 100;
  const increment = rightThres / 2;
  const offset = 400;

  // Function to handle scrolling
  const handleScroll = () => {
    const ODBox = ODBoxRef.current;
    const dist = Math.floor((ODBox.scrollLeft + section * increment * -1 - 400) * 10 ** dScalePower);

    setOutputText(`Scroll: ${ODBox.scrollLeft}<br>Section: ${section}<br>Distance: ${dist} km`);

    if (ODBox.scrollLeft > rightThres) {
      ODBox.scrollLeft = increment;
      setSection(section - 1);
    }

    if (ODBox.scrollLeft < leftThres && section !== 0) {
      ODBox.scrollLeft = increment + leftThres;
      setSection(section + 1);
    }
  };

  // Functions to update scales
  const rScaleSub = () => {
    if (rScalePower < MaxRScale) {
      setRScalePower(rScalePower + 1);
    }
  };

  const rScaleAdd = () => {
    if (rScalePower > 0) {
      setRScalePower(rScalePower - 1);
    }
  };

  const dScaleSub = () => {
    if (dScalePower < MaxDScale) {
      setDScalePower(dScalePower + 1);
    }
  };

  const dScaleAdd = () => {
    if (dScalePower > 0) {
      setDScalePower(dScalePower - 1);
    }
  };

  // Rendering Celestials and Orbitals
  const renderCelestials = () => {
    const rScale = 10 ** rScalePower;
    const dScale = 10 ** dScalePower;

    return positioning.map((pos, i) => {
      const { radius, orbRadius, xOffset, symbol, color, fontColor, fontSize } = pos;

      const scaledRadius = radius / rScale;
      const scaledOrbRadius = orbRadius / dScale;
      const scaledXOffset = xOffset / dScale;

      const x = scaledOrbRadius + scaledXOffset + offset + section * increment;
      const y = 200; // Fixed Y position

      return (
        <div key={i} style={{ position: 'absolute', left: `${x}px`, top: `${y - scaledRadius}px` }}>
          {/* Orbital */}
          <div
            style={{
              position: 'absolute',
              width: `${scaledOrbRadius * 2}px`,
              height: `${scaledOrbRadius * 2}px`,
              borderRadius: '50%',
              border: '2px solid gray',
              left: `${x - scaledOrbRadius}px`,
              top: `${y - scaledOrbRadius}px`,
            }}
          ></div>
          {/* Celestial */}
          <div
            style={{
              backgroundColor: color,
              width: `${scaledRadius * 2}px`,
              height: `${scaledRadius * 2}px`,
              borderRadius: '50%',
              textAlign: 'center',
              lineHeight: `${scaledRadius * 2}px`,
              color: fontColor,
              fontSize: `${scaledRadius * fontSize}px`,
            }}
          >
            {symbol}
          </div>
        </div>
      );
    });
  };

  return (
    <>
      <h2 className="text-2xl mb-5">Orbit Diagram Selector</h2>
      <div ref={ODBoxRef} className="ODBox" style={{ overflowX: 'scroll', position: 'relative', height: '500px', background: '#eee' }}>
        <div ref={cropContRef} style={{ position: 'absolute', width: '10000px', height: '100%' }}>{renderCelestials()}</div>
      </div>
      <div id="output" dangerouslySetInnerHTML={{ __html: outputText }} className="log"></div>
      <p ref={rDispRef}>Radius px = km / {10 ** rScalePower}</p>
      <div className="navigation">
        <button type="button" onClick={rScaleAdd} className="nav">+</button>
        <button type="button" onClick={rScaleSub} className="nav">-</button>
      </div>
      <p ref={dDispRef}>Distance px = km / {10 ** dScalePower}</p>
      <div className="navigation">
        <button type="button" onClick={dScaleAdd} className="nav">+</button>
        <button type="button" onClick={dScaleSub} className="nav">-</button>
      </div>
      <div id="scrollNavBar" className="navigation"></div>
    </>
  );
}

function Converter() {
  const [marsTime, setMarsTime] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());

  const printPlanetTime = (date: [number, number, number, number, number]) => {
    /*
      Prints a date in human readable format.
      date should be a tuple formatted like the following:
      (year, day, hours, minutes, seconds)
    */
    const year = date[0];
    const day = date[1];
    const hours = String(date[2]).padStart(2, '0');
    const minutes = String(date[3]).padStart(2, '0');
    const seconds = String(date[4]).padStart(2, '0');
  
    const out = `Year ${year}, day ${day}, ${hours}:${minutes}:${seconds}`;
    console.log(out);
    setMarsTime(out);
  }
  

  const handleCalculate = () => {
    const marsDate = date_to_mars(currentDate);
    printPlanetTime(marsDate);
  }

  const handleNowClick = () => {
    setCurrentDate(new Date());
  }

  return <>
    <label htmlFor="time">Time: </label>
    <input type="text" id="name" name="time" className="bg-gray-200 ml-1" value={currentDate.toLocaleString()} readOnly/>
    <button className="dfBtn ml-2" onClick={handleNowClick}>Now</button>
    <br />
    <button className="dfBtn" onClick={handleCalculate}>Calculate</button>
    <br />
    <h1>Mars time:</h1>
    <br />
    <p id="calcOut">{marsTime}</p>
  </>
}

export default function Home() {
  return (
    <div className="ml-20 mr-20 mt-5">
      <h1 className="text-3xl mb-5 text-center">
        Cosmic Calendars - Celestial Time Translator
      </h1>
      <h2 className="text-xl bg-gray-200 bg-opacity-90 p-2 rounded-xl mb-5">
        Status: <span className="bg-green-300 rounded-xl p-1">Awaiting Input</span>
      </h2>
      <Diagram />
      <Converter />
    </div>
  );
}
