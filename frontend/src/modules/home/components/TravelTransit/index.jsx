import React from 'react';
import { FaPlane, FaTrain, FaBus, FaHotel } from "react-icons/fa";

export const travelTransitData = [
  { label: "Flight Booking", icon: <FaPlane />, path: "/travel-transit/flight-booking" },
  { label: "Train Booking", icon: <FaTrain />, path: "/travel-transit/train-booking" },
  { label: "Bus Booking", icon: <FaBus />, path: "/travel-transit/bus-booking" },
  { label: "Hotel Booking", icon: <FaHotel />, path: "/travel-transit/hotel-booking" }
];
