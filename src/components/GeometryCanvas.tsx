"use client";

import React, { useState, useRef, useEffect } from 'react';

interface Point {
  x: number;
  y: number;
  label: string;
  type?: string;
}

interface Line {
  start: Point;
  end: Point;
}

interface Circle {
  point1: Point;  // center
  point2: Point;  // radius reference point
}

interface LabelState {
  letter: string;
  number: number;
}

const GeometryCanvas: React.FC = () => {
  const [tool, setTool] = useState('line');
  const [points, setPoints] = useState<Point[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [selectedPoints, setSelectedPoints] = useState<Point[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [labelState, setLabelState] = useState<LabelState>({ letter: 'A', number: 0 });

  const getNextLabelAndState = (currentState: LabelState): [string, LabelState] => {
    const label = currentState.number === 0 
      ? currentState.letter 
      : `${currentState.letter}${currentState.number}`;

    const nextState = { ...currentState };
    if (nextState.letter === 'Z') {
      nextState.letter = 'A';
      nextState.number += 1;
    } else {
      nextState.letter = String.fromCharCode(nextState.letter.charCodeAt(0) + 1);
    }

    return [label, nextState];
  };

  const getNextLabel = (): string => {
    const [label, nextState] = getNextLabelAndState(labelState);
    setLabelState(nextState);
    return label;
  };

  const resetLabels = () => {
    setLabelState({ letter: 'A', number: 0 });
  };
  
  const handleClear = () => {
    setPoints([]);
    setLines([]);
    setCircles([]);
    setSelectedPoints([]);
    resetLabels();
  };

  const findNearbyPoint = (x, y, radius = 10) => {
    return points.find(point => {
      const distance = Math.sqrt(
        Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)
      );
      return distance < radius;
    });
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw lines
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    lines.forEach(line => {
      ctx.beginPath();
      ctx.moveTo(line.start.x, line.start.y);
      ctx.lineTo(line.end.x, line.end.y);
      ctx.stroke();
    });

    // Draw circles
    circles.forEach(circle => {
      ctx.beginPath();
      const radius = Math.sqrt(
        Math.pow(circle.point2.x - circle.point1.x, 2) +
        Math.pow(circle.point2.y - circle.point1.y, 2)
      );
      ctx.arc(circle.point1.x, circle.point1.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    });

    // Draw points
    points.forEach(point => {
      ctx.beginPath();
      ctx.fillStyle = selectedPoints.includes(point) ? '#0000ff' : '#ff0000';
      ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw label
      ctx.fillStyle = '#000';
      ctx.font = '14px sans-serif';
      ctx.fillText(point.label, point.x + 8, point.y - 8);
    });
  };

  useEffect(() => {
    drawCanvas();
  }, [points, lines, circles, selectedPoints]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const nearbyPoint = findNearbyPoint(x, y);

    const findLineCircleIntersections = (circle, line) => {
    const r = Math.sqrt(
      Math.pow(circle.point2.x - circle.point1.x, 2) +
      Math.pow(circle.point2.y - circle.point1.y, 2)
    );
    
    // Translate circle to origin for simpler math
    const h = circle.point1.x;
    const k = circle.point1.y;
    
    // Get line equation in parametric form
    const x1 = line.start.x - h;
    const y1 = line.start.y - k;
    const x2 = line.end.x - h;
    const y2 = line.end.y - k;
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    
    // Quadratic equation coefficients
    const a = dx * dx + dy * dy;
    const b = 2 * (x1 * dx + y1 * dy);
    const c = x1 * x1 + y1 * y1 - r * r;
    
    // Solve quadratic equation
    const discriminant = b * b - 4 * a * c;
    
    if (discriminant < 0) {
      return []; // No intersections
    }
    
    const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
    const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);
    
    const intersections = [];
    
    // Check if intersections lie on the line segment
    [t1, t2].forEach(t => {
      if (t >= 0 && t <= 1) {
        intersections.push({
          x: line.start.x + t * dx,
          y: line.start.y + t * dy
        });
      }
    });
    
    return intersections;
  };

  const findLineIntersection = (line1, line2) => {
    const x1 = line1.start.x;
    const y1 = line1.start.y;
    const x2 = line1.end.x;
    const y2 = line1.end.y;
    const x3 = line2.start.x;
    const y3 = line2.start.y;
    const x4 = line2.end.x;
    const y4 = line2.end.y;

    const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    
    // Check if lines are parallel
    if (Math.abs(denominator) < 0.0001) {
      return null;
    }
    
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;
    
    // Check if intersection is within both line segments
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x: x1 + t * (x2 - x1),
        y: y1 + t * (y2 - y1)
      };
    }
    
    return null;
  };

  const findCircleIntersections = (circle1, circle2) => {
    const x1 = circle1.point1.x;
    const y1 = circle1.point1.y;
    const x2 = circle2.point1.x;
    const y2 = circle2.point1.y;
    
    const r1 = Math.sqrt(
      Math.pow(circle1.point2.x - circle1.point1.x, 2) +
      Math.pow(circle1.point2.y - circle1.point1.y, 2)
    );
    const r2 = Math.sqrt(
      Math.pow(circle2.point2.x - circle2.point1.x, 2) +
      Math.pow(circle2.point2.y - circle2.point1.y, 2)
    );

    const d = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    
    // Check if circles are too far apart or too close together
    if (d > r1 + r2 || d < Math.abs(r1 - r2) || (d === 0 && r1 === r2)) {
      return [];
    }

    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const h = Math.sqrt(r1 * r1 - a * a);
    
    const x3 = x1 + (a * (x2 - x1)) / d;
    const y3 = y1 + (a * (y2 - y1)) / d;
    
    const offsetX = (h * (y2 - y1)) / d;
    const offsetY = (h * (x2 - x1)) / d;

    return [
      {
        x: x3 + offsetX,
        y: y3 - offsetY
      },
      {
        x: x3 - offsetX,
        y: y3 + offsetY
      }
    ];
  };

  const pointExists = (x, y, tolerance = 0.1) => {
    return points.some(point => 
      Math.abs(point.x - x) < tolerance && 
      Math.abs(point.y - y) < tolerance
    );
  };

  const circleExists = (center, point2) => {
    const newRadius = Math.sqrt(
      Math.pow(point2.x - center.x, 2) +
      Math.pow(point2.y - center.y, 2)
    );
    
    return circles.some(circle => {
      const existingRadius = Math.sqrt(
        Math.pow(circle.point2.x - circle.point1.x, 2) +
        Math.pow(circle.point2.y - circle.point1.y, 2)
      );
      return circle.point1 === center && Math.abs(existingRadius - newRadius) < 0.1;
    });
  };

  const lineExists = (point1, point2) => {
    return lines.some(line => 
      (line.start === point1 && line.end === point2) ||
      (line.start === point2 && line.end === point1)
    );
  };

    switch (tool) {
      case 'line':
        if (selectedPoints.length === 0) {
          if (nearbyPoint) {
            setSelectedPoints([nearbyPoint]);
          } else {
            let currentLabelState = { ...labelState };
            const [label, nextState] = getNextLabelAndState(currentLabelState);
            const newPoint = { x, y, label };
            setPoints([...points, newPoint]);
            setSelectedPoints([newPoint]);
            setLabelState(nextState);
          }
        } else {
          const startPoint = selectedPoints[0];
          let newPoints: Point[] = [];
          let newLine: Line;
          let currentLabelState = { ...labelState };
          
          if (nearbyPoint && nearbyPoint !== startPoint) {
            newLine = { start: startPoint, end: nearbyPoint };
          } else {
            const [label, nextState] = getNextLabelAndState(currentLabelState);
            currentLabelState = nextState;
            const newEndPoint = { 
              x, 
              y, 
              label
            };
            newPoints.push(newEndPoint);
            newLine = { start: startPoint, end: newEndPoint };
          }

          if (!lineExists(newLine.start, newLine.end)) {
            // Find all potential intersections first
            const allIntersections: {x: number, y: number, type: string}[] = [];
            
            // Collect line-line intersections
            lines.forEach(existingLine => {
              const intersection = findLineIntersection(newLine, existingLine);
              if (intersection && !pointExists(intersection.x, intersection.y)) {
                allIntersections.push({
                  x: intersection.x,
                  y: intersection.y,
                  type: 'line-line'
                });
              }
            });

            // Collect line-circle intersections
            circles.forEach(circle => {
              const intersections = findLineCircleIntersections(circle, newLine);
              intersections.forEach(intersection => {
                if (!pointExists(intersection.x, intersection.y)) {
                  allIntersections.push({
                    x: intersection.x,
                    y: intersection.y,
                    type: 'line-circle'
                  });
                }
              });
            });

            // Sort intersections from left to right, top to bottom
            allIntersections.sort((a, b) => a.x - b.x || a.y - b.y);

            // Assign labels to sorted intersections
            allIntersections.forEach(intersection => {
              const [label, nextState] = getNextLabelAndState(currentLabelState);
              currentLabelState = nextState;
              newPoints.push({
                x: intersection.x,
                y: intersection.y,
                label,
                type: intersection.type
              });
            });

            setPoints(prevPoints => [...prevPoints, ...newPoints]);
            setLines([...lines, newLine]);
            setLabelState(currentLabelState);
          }
          setSelectedPoints([]);
        }
        break;

      case 'extend':
        if (selectedPoints.length === 0) {
          if (nearbyPoint) {
            setSelectedPoints([nearbyPoint]);
          }
        } else if (selectedPoints.length === 1) {
          if (nearbyPoint && nearbyPoint !== selectedPoints[0]) {
            setSelectedPoints([...selectedPoints, nearbyPoint]);
          }
        } else if (selectedPoints.length === 2) {
          // Calculate direction from first point to second point
          const direction = {
            x: selectedPoints[0].x - selectedPoints[1].x,
            y: selectedPoints[0].y - selectedPoints[1].y,
          };
          const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
          const unitDirection = {
            x: direction.x / length,
            y: direction.y / length,
          };
          
          const clickDistance = Math.sqrt(
            Math.pow(x - selectedPoints[1].x, 2) +
            Math.pow(y - selectedPoints[1].y, 2)
          );
          
          let currentLabelState = { ...labelState };
          const [label, nextState] = getNextLabelAndState(currentLabelState);
          currentLabelState = nextState;

          const newEndPoint = {
            x: selectedPoints[1].x - unitDirection.x * clickDistance,
            y: selectedPoints[1].y - unitDirection.y * clickDistance,
            label
          };
          
          const newLine = { 
            start: selectedPoints[1], 
            end: newEndPoint 
          };

          // Find all potential intersections
          const allIntersections: {x: number, y: number, type: string}[] = [];
          
          // Collect line-line intersections
          lines.forEach(existingLine => {
            const intersection = findLineIntersection(newLine, existingLine);
            if (intersection && !pointExists(intersection.x, intersection.y)) {
              allIntersections.push({
                x: intersection.x,
                y: intersection.y,
                type: 'line-line'
              });
            }
          });

          // Collect line-circle intersections
          circles.forEach(circle => {
            const intersections = findLineCircleIntersections(circle, newLine);
            intersections.forEach(intersection => {
              if (!pointExists(intersection.x, intersection.y)) {
                allIntersections.push({
                  x: intersection.x,
                  y: intersection.y,
                  type: 'line-circle'
                });
              }
            });
          });

          // Sort intersections from left to right, top to bottom
          allIntersections.sort((a, b) => a.x - b.x || a.y - b.y);

          // Filter intersections to only include those along the extension
          const filteredIntersections = allIntersections.filter(intersection => {
            // Calculate dot product to ensure intersection is in the direction of extension
            const vectorToIntersection = {
              x: intersection.x - selectedPoints[1].x,
              y: intersection.y - selectedPoints[1].y
            };
            const dotProduct = -unitDirection.x * vectorToIntersection.x - unitDirection.y * vectorToIntersection.y;
            return dotProduct > 0 && dotProduct <= clickDistance;
          });

          // Create new points for valid intersections
          const newPoints = filteredIntersections.map(intersection => {
            const [label, nextState] = getNextLabelAndState(currentLabelState);
            currentLabelState = nextState;
            return {
              x: intersection.x,
              y: intersection.y,
              label,
              type: intersection.type
            };
          });

          // Add the end point and all intersection points
          setPoints(prevPoints => [...prevPoints, newEndPoint, ...newPoints]);
          setLines(prevLines => [...prevLines, newLine]);
          setLabelState(currentLabelState);
          setSelectedPoints([]);
        }
      break;

      case 'circle':
        if (selectedPoints.length === 0) {
          if (nearbyPoint) {
            setSelectedPoints([nearbyPoint]);
          }
        } else if (selectedPoints.length === 1) {
          if (nearbyPoint && nearbyPoint !== selectedPoints[0]) {
            if (!circleExists(selectedPoints[0], nearbyPoint)) {
              const newCircle = {
                point1: selectedPoints[0],
                point2: nearbyPoint
              };
              
              let newPoints: Point[] = [];
              let currentLabelState = { ...labelState };
              
              // Collect all intersections first
              const allIntersections: {x: number, y: number, type: string}[] = [];
              
              circles.forEach(existingCircle => {
                const intersections = findCircleIntersections(newCircle, existingCircle);
                intersections.forEach(intersection => {
                  if (!pointExists(intersection.x, intersection.y)) {
                    allIntersections.push({
                      x: intersection.x,
                      y: intersection.y,
                      type: 'circle-circle'
                    });
                  }
                });
              });

              lines.forEach(line => {
                const intersections = findLineCircleIntersections(newCircle, line);
                intersections.forEach(intersection => {
                  if (!pointExists(intersection.x, intersection.y)) {
                    allIntersections.push({
                      x: intersection.x,
                      y: intersection.y,
                      type: 'line-circle'
                    });
                  }
                });
              });

              // Sort intersections from left to right, top to bottom
              allIntersections.sort((a, b) => a.x - b.x || a.y - b.y);

              // Assign labels to sorted intersections
              allIntersections.forEach(intersection => {
                const [label, nextState] = getNextLabelAndState(currentLabelState);
                currentLabelState = nextState;
                newPoints.push({
                  x: intersection.x,
                  y: intersection.y,
                  label,
                  type: intersection.type
                });
              });

              setPoints(prevPoints => [...prevPoints, ...newPoints]);
              setCircles([...circles, newCircle]);
              setLabelState(currentLabelState);
            }
            setSelectedPoints([]);
          }
        }
        break;
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex gap-4">
        <select 
          value={tool} 
          onChange={(e) => {
            setTool(e.target.value);
            setSelectedPoints([]);
          }}
          className="border rounded p-2"
        >
          <option value="line">Create Line</option>
          <option value="extend">Extend Line</option>
          <option value="circle">Create Circle</option>
        </select>
        <button 
          onClick={handleClear}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear Canvas
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border border-gray-300"
        onClick={handleCanvasClick}
      />
    </div>
  );
};

export default GeometryCanvas;