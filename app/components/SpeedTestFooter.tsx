import React from "react";

export function SpeedTestFooter() {
  return (
    <div className="py-4 text-center text-xs text-[#7d7777] font-medium leading-relaxed dark:text-gray-500">
      <a
        href="https://openspeedtest.com?ref=Self-Hosted&Run"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#717171] hover:text-[#14b0fe] transition-colors dark:text-[#a0a0a0] dark:hover:text-[#56c4fb]"
      >
        SpeedTest by OpenSpeedTest™
      </a>{" "}
      is a Free and{" "}
      <a
        href="https://github.com/openspeedtest/Speed-Test"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#717171] hover:text-[#14b0fe] transition-colors dark:text-[#a0a0a0] dark:hover:text-[#56c4fb]"
      >
        Open-Source HTML5 Network Speed Test
      </a>{" "}
      Software.
      <p className="text-[10px] mt-1 text-gray-400 dark:text-gray-600">
        &copy; Copyright 2013-2024 OpenSpeedTest™ All Rights Reserved.
      </p>
    </div>
  );
}
