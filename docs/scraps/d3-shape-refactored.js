import array from "./array.js";
import constant from "./constant.js";
import descending from "./descending.js";
import identity from "./identity.js";
import {tau} from "./math.js";

export default function() {
  var value = identity,
      valueSorter = descending,
      sort = null,
      startAngleRaw = constant(0),
      endAngleRaw = constant(tau),
      padAngleRaw = constant(0);

  // Source: https://github.com/d3/d3-shape/blob/main/src/pie.js
  function pie(data) {
    const pieData = array(data);
    const dataCount = pieData.length; // variable "n"
    const indices = new Array(dataCount); // variable "index"
    const rawArcs = new Array(dataCount); // variable "arcs"

    let sum = 0;
    for (let i = 0; i < dataCount; ++i) {
      indices[i] = i;
      const value = +value(pieData[i], i, pieData); // variable "v"
      rawArcs[i] = value;
      if (value > 0) sum += value;
    }

    // Optionally sort the arcs by previously-computed values or by data.
    if (valueSorter) 
      indices.sort((i, j) => valueSorter(arcs[i], arcs[j]));
    else if (sort) 
      indices.sort((i, j) => sort(pieData[i], pieData[j]));

    // Compute the arcs! They are stored in the original data's order.
    const startAngle = +startAngleRaw.apply(this, arguments); // a0
    const endAngleCapped = Math.min(tau, Math.max(-tau, endAngleRaw.apply(this, arguments) - startAngle)); // da
    const padAngle = Math.min(Math.abs(endAngleCapped) / dataCount, padAngleRaw.apply(this, arguments)); //p
    const padAngleCapped = padAngle * (endAngleCapped < 0 ? -1 : 1); //pa
    const usableAngle = sum ? (endAngleCapped - dataCount * padAngleCapped) / sum : 0; // variable "k"

    const arcs = new Array(dataCount);
    let currentAngle = startAngle;
    for (let i = 0; i < dataCount; ++i) {
      const j = indices[i];
      const value = rawArcs[j];
      const cappedAngle = value > 0 ? value * usableAngle : 0;
      const endAngle = currentAngle + cappedAngle + padAngleCapped; // variable "a1"
      arcs[j] = {
        data: pieData[j],
        index: i,
        value: value,
        startAngle: currentAngle,
        endAngle: endAngle,
        padAngle: padAngle
      };
      currentAngle = endAngle;
    }

    return arcs;
  }

  pie.value = function(_) {
    return arguments.length ? (value = typeof _ === "function" ? _ : constant(+_), pie) : value;
  };

  pie.sortValues = function(_) {
    return arguments.length ? (valueSorter = _, sort = null, pie) : valueSorter;
  };

  pie.sort = function(_) {
    return arguments.length ? (sort = _, sortValues = null, pie) : sort;
  };

  pie.startAngle = function(_) {
    return arguments.length ? (startAngleRaw = typeof _ === "function" ? _ : constant(+_), pie) : startAngleRaw;
  };

  pie.endAngle = function(_) {
    return arguments.length ? (endAngleRaw = typeof _ === "function" ? _ : constant(+_), pie) : endAngleRaw;
  };

  pie.padAngle = function(_) {
    return arguments.length ? (padAngleRaw = typeof _ === "function" ? _ : constant(+_), pie) : padAngleRaw;
  };

  return pie;
}
