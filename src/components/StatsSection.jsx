import React, { useEffect, useState, useRef } from "react";

const stats = [
  { value: "99.2%", label: "Accuracy Rate" },
  { value: "500+", label: "Verified Doctors" },
  { value: "1M+", label: "Verifications" },
  { value: "24/7", label: "Available" },
];

const AnimatedCounter = ({ value }) => {
  const numMatch = value.match(/[\d.]+/);
  const endNum = numMatch ? parseFloat(numMatch[0]) : 0;
  const isFloat = numMatch && numMatch[0].includes('.');

  // Find the index where the number matched to extract exactly what comes before and after
  const matchIndex = numMatch ? value.indexOf(numMatch[0]) : -1;
  const prefix = matchIndex > 0 ? value.substring(0, matchIndex) : '';
  const suffix = matchIndex !== -1 ? value.substring(matchIndex + numMatch[0].length) : '';

  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let startTimestamp = null;
    const duration = 2000;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easing = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(endNum * easing);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(endNum);
      }
    };
    window.requestAnimationFrame(step);
  }, [isVisible, endNum]);

  const displayCount = isFloat ? count.toFixed(1) : Math.floor(count);

  if (!numMatch) return <span>{value}</span>;

  return (
    <span ref={ref}>
      {prefix}{displayCount}{suffix}
    </span>
  );
};

const StatsSection = () => {
  return (
    <section className="bg-background py-12 sm:py-16">
      <div className="mx-auto w-[90%]">
        <div className="grid grid-cols-2 gap-x-10 gap-y-8 sm:grid-cols-4 sm:gap-x-12">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold tracking-tight text-sky-600 sm:text-4xl">
                <AnimatedCounter value={stat.value} />
              </p>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
