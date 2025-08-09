// src/pages/Home.js
import React from "react";

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 px-4">
      {/* Logo */}
      <img
        src="/Logo.png" // from public folder
        alt="BiSol Logo"
        className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover shadow-lg mb-6"
      />

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-bold text-blue-800 mb-2 text-center">
        Welcome to BiSol Dashboard
      </h1>

      {/* Subtitle */}
      <p className="text-base sm:text-lg text-blue-700 text-center max-w-md">
        This is the main dashboard after loading.
      </p>
    </div>
  );
};

export default Home;
