"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TOTAL_SEATS = 80;
const SEATS_PER_ROW = 7;
const LAST_ROW_SEATS = 3;
const MAX_SEATS_PER_BOOKING = 7;

interface Booking {
  seatNumbers: number[];
  userId: string;
  timestamp: number;
}

export default function Home() {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [seatInput, setSeatInput] = useState("");
  const [bookedSeats, setBookedSeats] = useState<number[]>([]);
  const [suggestedSeats, setSuggestedSeats] = useState<number[]>([]);
  const [userId] = useState<string>(() => Math.random().toString(36).substring(7));

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = () => {
    const storedBookings = localStorage.getItem('trainBookings');
    if (storedBookings) {
      const bookings: Booking[] = JSON.parse(storedBookings);
      const allBookedSeats = bookings.flatMap(booking => booking.seatNumbers);
      setBookedSeats(allBookedSeats);
    }
  };

  const saveBooking = (seatNumbers: number[]) => {
    const storedBookings = localStorage.getItem('trainBookings');
    const bookings: Booking[] = storedBookings ? JSON.parse(storedBookings) : [];

    const newBooking: Booking = {
      seatNumbers,
      userId,
      timestamp: Date.now()
    };

    bookings.push(newBooking);
    localStorage.setItem('trainBookings', JSON.stringify(bookings));
  };

  const getRowNumber = (seatNumber: number) => Math.ceil(seatNumber / SEATS_PER_ROW);

  const findAvailableSeats = (numSeats: number): number[] => {
    for (let startSeat = 1; startSeat <= TOTAL_SEATS; startSeat++) {
      const row = getRowNumber(startSeat);
      const isLastRow = row === Math.ceil(TOTAL_SEATS / SEATS_PER_ROW);
      const rowSeats = isLastRow ? LAST_ROW_SEATS : SEATS_PER_ROW;
      const rowStartSeat = (row - 1) * SEATS_PER_ROW + 1;

      if (startSeat === rowStartSeat) {
        const availableSeats = [];
        for (let i = 0; i < numSeats && i < rowSeats; i++) {
          const seat = startSeat + i;
          if (!bookedSeats.includes(seat) && seat <= TOTAL_SEATS) {
            availableSeats.push(seat);
          }
        }
        if (availableSeats.length === numSeats) {
          return availableSeats;
        }
      }
    }

    const availableSeats = [];
    for (let seat = 1; seat <= TOTAL_SEATS && availableSeats.length < numSeats; seat++) {
      if (!bookedSeats.includes(seat)) {
        availableSeats.push(seat);
      }
    }
    return availableSeats.slice(0, numSeats);
  };

  const handleSeatInput = (value: string) => {
    const num = parseInt(value);
    if (!isNaN(num) && num > 0 && num <= MAX_SEATS_PER_BOOKING) {
      setSeatInput(value);
      const seats = findAvailableSeats(num);
      setSuggestedSeats(seats);
      setSelectedSeats(seats);
    } else {
      setSeatInput("");
      setSuggestedSeats([]);
      setSelectedSeats([]);
    }
  };

  const handleSeatClick = (seatNumber: number) => {
    if (bookedSeats.includes(seatNumber)) return;

    setSelectedSeats((prev) => {
      if (prev.includes(seatNumber)) {
        return prev.filter((seat) => seat !== seatNumber);
      }
      if (prev.length >= MAX_SEATS_PER_BOOKING) {
        alert(`Maximum ${MAX_SEATS_PER_BOOKING} seats allowed per booking`);
        return prev;
      }
      return [...prev, seatNumber];
    });
    setSuggestedSeats([]);
  };

  const handleBooking = () => {
    if (selectedSeats.length === 0) return;
    setShowSuccessModal(true);
    saveBooking(selectedSeats);
    setBookedSeats(prev => [...prev, ...selectedSeats]);
    setSelectedSeats([]);
    setSeatInput("");
    setSuggestedSeats([]);
  };

  const resetBooking = () => {
    setSelectedSeats([]);
    setSeatInput("");
    setSuggestedSeats([]);
  };

  const getSeatStyle = (seat: number) => {
    if (bookedSeats.includes(seat)) return "bg-red-500 text-white cursor-not-allowed";
    if (selectedSeats.includes(seat)) return "bg-primary text-primary-foreground";
    if (suggestedSeats.includes(seat)) return "bg-yellow-400 text-black";
    return "bg-secondary hover:bg-secondary/80";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 py-12">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Train Ticket Booking</h1>

        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left: Seat Grid */}
            <div className="flex-[2]">
              <div className="grid grid-cols-7 gap-2 mb-4">
                {Array.from({ length: TOTAL_SEATS }, (_, i) => i + 1).map((seat) => (
                  <button
                    key={seat}
                    onClick={() => handleSeatClick(seat)}
                    disabled={bookedSeats.includes(seat)}
                    className={`
                      p-2 rounded-md text-sm font-medium transition-colors
                      ${getSeatStyle(seat)}
                      ${getRowNumber(seat) === Math.ceil(TOTAL_SEATS / SEATS_PER_ROW) && seat > 77 ? 'hidden' : ''}
                    `}
                  >
                    {seat}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-sm font-medium">Book Seats (1-7):</span>
                {Array.from({ length: MAX_SEATS_PER_BOOKING }, (_, i) => i + 1).map((num) => (
                  <Button
                    key={num}
                    variant={selectedSeats.length === num ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSeatInput(num.toString())}
                  >
                    {num}
                  </Button>
                ))}
              </div>

              <div className="flex gap-2 mb-4">
                <Input
                  type="number"
                  value={seatInput}
                  onChange={(e) => handleSeatInput(e.target.value)}
                  min="1"
                  max={MAX_SEATS_PER_BOOKING}
                  placeholder="Number of seats"
                  className="flex-1"
                />
                <Button onClick={handleBooking} className="w-24">
                  Book
                </Button>
              </div>

              <Button variant="outline" onClick={resetBooking} className="w-full mb-4">
                Reset Selection
              </Button>

              <div className="flex flex-col gap-2">
                <div className="bg-yellow-200 px-4 py-2 rounded-md">
                  Selected Seats = {selectedSeats.length}
                </div>
                <div className="bg-green-200 px-4 py-2 rounded-md">
                  Available Seats = {TOTAL_SEATS - bookedSeats.length}
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-secondary rounded"></div>
              <span className="text-sm">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-primary rounded"></div>
              <span className="text-sm">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm">Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 rounded"></div>
              <span className="text-sm">Suggested</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl text-center w-80">
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h2 className="text-xl font-semibold mb-2">Booking Successful!</h2>
            <p className="text-sm text-gray-600 mb-4">
              Your seats have been booked successfully.
            </p>
            <Button onClick={() => setShowSuccessModal(false)} className="w-full">
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
