export function Network({ dark = false }: { dark?: boolean }) {
  return (
    <svg viewBox="0 0 620 560" fill="none" aria-hidden="true">
      <path
        d="M70 225L190 125L300 265L430 145L540 275L440 405L290 425L150 365L70 225ZM300 265L290 425M300 265L440 405"
        stroke={dark ? '#fef7f0' : '#1a1917'}
        strokeOpacity={dark ? '.16' : '.3'}
        strokeWidth="2"
      />
      {[
        [70, 225],
        [190, 125],
        [300, 265],
        [430, 145],
        [540, 275],
        [440, 405],
        [290, 425],
        [150, 365],
      ].map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i % 3 === 0 ? 9 : 6}
          fill={i % 2 === 0 ? '#C2623F' : dark ? '#8C867B' : '#842A14'}
        />
      ))}
    </svg>
  );
}
